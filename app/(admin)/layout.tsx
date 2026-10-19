import { signOut } from "@/app/auth/actions";
import { Avatar } from "@/components/bits";
import { Nav } from "@/components/nav";
import { Tooltips } from "@/components/tooltips";
import { requireAdmin } from "@/lib/dal";
import { fullName } from "@/lib/format";

// The shell. It calls requireAdmin() to show who is signed in, but it is NOT
// the gate — layouts do not re-run on client navigation. Each page below calls
// requireAdmin() itself, every data function calls assertAdmin(), and
// proxy.ts checks before any of them.
export default async function AdminLayout({ children }: LayoutProps<"/">) {
  const admin = await requireAdmin();
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand__mark" aria-hidden="true">ha</span>
          <span>Humor Admin</span>
        </div>
        <Nav />
        <div className="whoami">
          <Avatar first={admin.first_name} last={admin.last_name} path={admin.avatar_path} />
          <div className="whoami__text">
            <div className="whoami__name">{fullName(admin.first_name, admin.last_name)}</div>
            <div className="whoami__email">{admin.email}</div>
          </div>
          <form action={signOut}>
            <button className="btn btn--sm" title="Sign out">Sign out</button>
          </form>
        </div>
      </aside>
      <main className="main">{children}</main>
      <Tooltips />
    </div>
  );
}
