import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { isPublic } from "@/lib/routes";

// The login wall, at the door. Every path except /login and the OAuth callback
// needs a Google session whose profile has is_superadmin = true; anything else
// is sent to /login before a page, a Server Action or a route handler runs.
//
// This is the optimistic layer. requireAdmin()/assertAdmin() in lib/dal.ts
// repeat the check against the database as owner on every page and action, so
// a bug here fails closed rather than open.
//
// It also refreshes the auth cookies: Server Components cannot write them, so
// without this a session would expire mid-visit.
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // getUser(), not getSession(): only getUser() revalidates the token.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  if (isPublic(pathname)) return response;

  let allowed = false;
  if (user) {
    // profiles is publicly readable (0011), so the user's own client can read
    // the flag. Any error — including the column not existing yet — is a no.
    const { data, error } = await supabase
      .from("profiles")
      .select("is_superadmin")
      .eq("id", user.id)
      .maybeSingle();
    allowed = !error && data?.is_superadmin === true;
  }

  if (!allowed) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    if (pathname !== "/") url.searchParams.set("next", pathname);
    return redirectKeepingCookies(url, response);
  }

  return response;
}

// A bare NextResponse.redirect() would drop the refreshed session cookies that
// createServerClient just wrote onto `response`.
function redirectKeepingCookies(url: URL, carrying: NextResponse) {
  const redirect = NextResponse.redirect(url);
  for (const cookie of carrying.cookies.getAll()) redirect.cookies.set(cookie);
  return redirect;
}

export const config = {
  matcher: [
    // Everything except static build assets. Unlike the public site there are
    // no carve-outs for images: nothing here is served without a check.
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
