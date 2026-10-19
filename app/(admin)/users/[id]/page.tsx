import Link from "next/link";
import { notFound } from "next/navigation";

import { Avatar, JokeText, SourceBadge, Stars } from "@/components/bits";
import { requireAdmin } from "@/lib/dal";
import { ago, dateTime, fixed, fullName } from "@/lib/format";
import { getUser } from "@/lib/users";

export const metadata = { title: "User · Humor Admin" };

export default async function UserPage({ params }: PageProps<"/users/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const data = await getUser(id);
  if (!data) notFound();
  const { user: u, posts, ratings, generations } = data;
  const posted = generations.filter((g) => g.posted_id).length;

  return (
    <>
      <div className="crumbs"><Link href="/users">Users</Link> /</div>
      <div className="page-head">
        <div className="person">
          <Avatar first={u.first_name} last={u.last_name} path={u.avatar_path} size="lg" />
          <div>
            <h1>{u.first_name ? fullName(u.first_name, u.last_name) : "Not onboarded"} {u.is_superadmin ? <span className="badge badge--accent">superadmin</span> : null}</h1>
            <p>{u.email}</p>
          </div>
        </div>
      </div>

      <div className="grid grid--wide-left">
        <div className="tiles">
          <div className="tile"><div className="tile__label">Posts</div><div className="tile__value">{u.posts}</div><div className="tile__meta">{u.ai_posts} AI-written</div></div>
          <div className="tile"><div className="tile__label">Ratings given</div><div className="tile__value">{u.ratings}</div><div className="tile__meta">{u.avg_given ? `${fixed(u.avg_given)}★ average` : "—"}</div></div>
          <div className="tile"><div className="tile__label">Showdown votes</div><div className="tile__value">{u.votes}</div></div>
          <div className="tile"><div className="tile__label">Gemini calls</div><div className="tile__value">{u.generations}</div><div className="tile__meta">{posted} posted</div></div>
        </div>
        <section className="card">
          <dl className="facts">
            <dt>User id</dt><dd className="mono">{u.id}</dd>
            <dt>Sign-in</dt><dd>{u.provider ?? "—"}</dd>
            <dt>Joined</dt><dd>{dateTime(u.created_at)}</dd>
            <dt>Last sign-in</dt><dd>{dateTime(u.last_sign_in_at)} <span className="muted">({ago(u.last_sign_in_at)})</span></dd>
          </dl>
        </section>
      </div>

      <h2 className="section-title">Posts</h2>
      <section className="card card--flush">
        {posts.length ? (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Post</th><th>Source</th><th>Category</th><th>Stars</th><th className="r">Elo</th><th>Posted</th></tr></thead>
              <tbody>
                {posts.map((p) => (
                  <tr key={p.id}>
                    <td className="clip">
                      {p.source === "ai"
                        ? <Link className="row-link" href={`/media/${p.id}`}><JokeText setup={p.setup} punchline={p.punchline} kind={p.kind} /></Link>
                        : <JokeText setup={p.setup} punchline={p.punchline} kind={p.kind} />}
                    </td>
                    <td><SourceBadge source={p.source} kind={p.kind} /></td>
                    <td>{p.category}</td>
                    <td><Stars value={p.rating_avg} count={p.rating_count} /></td>
                    <td className="r">{p.elo ? Math.round(p.elo) : "—"}</td>
                    <td>{ago(p.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="empty">No posts.</p>}
      </section>

      <div className="grid grid--2" style={{ marginTop: 16 }}>
        <section className="card card--flush">
          <div className="card__head" style={{ padding: "16px 16px 0" }}><div className="card__title">Ratings given</div></div>
          {ratings.length ? (
            <div className="table-wrap">
              <table>
                <tbody>
                  {ratings.map((r) => (
                    <tr key={r.joke_id}>
                      <td className="clip"><JokeText setup={r.setup} kind={r.kind} /></td>
                      <td><span className="stars__on">{"★".repeat(r.rating)}</span><span className="stars__off">{"★".repeat(5 - r.rating)}</span></td>
                      <td className="muted">{ago(r.updated_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p className="empty">No ratings.</p>}
        </section>
        <section className="card card--flush">
          <div className="card__head" style={{ padding: "16px 16px 0" }}><div className="card__title">Gemini generations</div></div>
          {generations.length ? (
            <div className="table-wrap">
              <table>
                <tbody>
                  {generations.map((g) => (
                    <tr key={g.id}>
                      <td>{g.prompt ? `“${g.prompt}”` : <span className="muted">no topic</span>}<div className="person__sub">{g.category} · {g.model}</div></td>
                      <td>{g.posted_id ? <Link className="badge" href={`/media/${g.posted_id}`}>posted</Link> : <span className="badge">discarded</span>}</td>
                      <td className="muted">{ago(g.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p className="empty">Never used Generate.</p>}
        </section>
      </div>
    </>
  );
}
