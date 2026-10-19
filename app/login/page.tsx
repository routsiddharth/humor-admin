import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { signOut } from "@/app/auth/actions";
import { GoogleButton } from "@/components/google-button";
import { getAdmin } from "@/lib/dal";
import { safeNext } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Sign in · Humor Admin" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const next = safeNext(params.next);
  const error = typeof params.error === "string" ? params.error : null;

  if (await getAdmin()) redirect(next);

  // Signed in, but not an admin: say so plainly instead of looping them
  // through Google again with the same account.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="login">
      <div className="login__card">
        <div className="brand brand--lg">
          <span className="brand__mark" aria-hidden="true">ha</span>
          <span>Humor Admin</span>
        </div>

        {user ? (
          <>
            <h1 className="login__title">No access</h1>
            <p className="login__copy">
              You are signed in as <strong>{user.email}</strong>, which is not a superadmin. Only
              profiles with <code>is_superadmin = true</code> can open this panel.
            </p>
            <form action={signOut}>
              <button className="btn btn--wide">Sign out and use another account</button>
            </form>
          </>
        ) : (
          <>
            <h1 className="login__title">Restricted area</h1>
            <p className="login__copy">
              Sign in with Google. Access is limited to superadmin accounts.
            </p>
            <GoogleButton next={next} />
          </>
        )}
        {error ? <p className="form-error">{error}</p> : null}
      </div>
    </main>
  );
}
