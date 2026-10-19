import { NextResponse, type NextRequest } from "next/server";

import { safeNext } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";

// Where Google sends the user back to, via Supabase. This origin must be in
// Supabase's Redirect URLs allow-list, or Supabase falls back to the Site URL —
// the public site — and the session lands there instead.
//
// No admin check here: this only turns the code into a session. Whether that
// session may see anything is decided by proxy.ts and lib/dal.ts on the next
// request, which sends a non-admin back to /login with an explanation.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const next = safeNext(searchParams.get("next"));

  // Behind Vercel's load balancer `origin` is the internal host.
  const forwardedHost = request.headers.get("x-forwarded-host");
  const base =
    process.env.NODE_ENV === "development" || !forwardedHost ? origin : `https://${forwardedHost}`;

  const toLogin = (message: string) =>
    NextResponse.redirect(`${base}/login?error=${encodeURIComponent(message)}`);

  const oauthError = searchParams.get("error_description") ?? searchParams.get("error");
  if (oauthError) return toLogin(oauthError);

  const code = searchParams.get("code");
  if (!code) return toLogin("No authorization code was returned by Google.");

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return toLogin(error.message);

  return NextResponse.redirect(`${base}${next}`);
}
