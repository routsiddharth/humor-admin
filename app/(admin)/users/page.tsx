import Link from "next/link";

import { Avatar, param } from "@/components/bits";
import { requireAdmin } from "@/lib/dal";
import { ago, date, fixed, fullName } from "@/lib/format";
import { listUsers, USER_SORTS, type UserSort } from "@/lib/users";

export const metadata = { title: "Users · Humor Admin" };

const SORT_LABELS: Record<UserSort, string> = {
  joined: "Newest", active: "Last sign-in", posts: "Most posts", ratings: "Most ratings", name: "Name",
};

export default async function UsersPage({ searchParams }: PageProps<"/users">) {
  await requireAdmin();
  const sp = await searchParams;
  const q = param(sp.q).trim().slice(0, 100);
  const sortParam = param(sp.sort, "joined");
  const sort = (sortParam in USER_SORTS ? sortParam : "joined") as UserSort;
  const users = await listUsers({ q, sort });

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Users</h1>
          <p>Every account that has signed in, with its profile and what it has done. Read-only — profiles belong to their owners.</p>
        </div>
      </div>

      <form className="toolbar" role="search">
        <input className="input grow" type="search" name="q" defaultValue={q} placeholder="Search name or email" aria-label="Search users" />
        <select className="select" name="sort" defaultValue={sort} aria-label="Sort">
          {Object.entries(SORT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <button className="btn">Apply</button>
      </form>

      <section className="card card--flush">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Person</th>
                <th>Joined</th>
                <th>Last sign-in</th>
                <th className="r">Posts</th>
                <th className="r">Ratings</th>
                <th className="r">Avg given</th>
                <th className="r">Showdown</th>
                <th className="r">Gemini</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <Link href={`/users/${u.id}`} className="person">
                      <Avatar first={u.first_name} last={u.last_name} path={u.avatar_path} />
                      <span className="person__text">
                        <span className="row-link">{u.first_name ? fullName(u.first_name, u.last_name) : <span className="muted">Not onboarded</span>}</span>
                        {u.is_superadmin ? <> <span className="badge badge--accent">superadmin</span></> : null}
                        <span className="person__sub" style={{ display: "block" }}>{u.email}</span>
                      </span>
                    </Link>
                  </td>
                  <td>{date(u.created_at)}</td>
                  <td>{ago(u.last_sign_in_at)}</td>
                  <td className="r">{u.posts}{u.ai_posts ? <span className="muted"> ({u.ai_posts} AI)</span> : null}</td>
                  <td className="r">{u.ratings}</td>
                  <td className="r">{u.avg_given ? `${fixed(u.avg_given)}★` : "—"}</td>
                  <td className="r">{u.votes}</td>
                  <td className="r">{u.generations}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 ? <p className="empty">No users match “{q}”.</p> : null}
        </div>
        <div className="pager"><span>{users.length} {users.length === 1 ? "person" : "people"}</span></div>
      </section>
    </>
  );
}
