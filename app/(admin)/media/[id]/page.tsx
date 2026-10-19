import Link from "next/link";
import { notFound } from "next/navigation";

import { SourceBadge, Stars } from "@/components/bits";
import { DeleteButton, EditForm } from "@/components/media-forms";
import { requireAdmin } from "@/lib/dal";
import { ago, dateTime, fullName } from "@/lib/format";
import { getAiJoke, listCategories } from "@/lib/media";

export const metadata = { title: "AI joke · Humor Admin" };

export default async function MediaItemPage({ params, searchParams }: PageProps<"/media/[id]">) {
  await requireAdmin();
  const { id: raw } = await params;
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const [data, categories, sp] = await Promise.all([getAiJoke(id), listCategories(), searchParams]);
  if (!data) notFound();
  const { joke: j, ratings, matches, generation } = data;

  return (
    <>
      <div className="crumbs"><Link href="/media">AI media</Link> / #{j.id}</div>
      <div className="page-head">
        <div>
          <h1>AI joke #{j.id}</h1>
          <p>Posted {dateTime(j.created_at)} by {j.author_id ? <Link href={`/users/${j.author_id}`} className="row-link">{fullName(j.first_name, j.last_name)}</Link> : "—"}</p>
        </div>
        <DeleteButton id={j.id} ratings={ratings.length} matches={matches.length} />
      </div>

      {sp.created ? <div className="notice">Published. It is live on the board now.</div> : null}

      <div className="grid grid--wide-left">
        <div className="stack">
          <section className="card">
            <div className="quote">
              <p>{j.setup}</p>
              <p>{j.punchline}</p>
            </div>
          </section>
          <section className="card">
            <div className="card__head"><div className="card__title">Edit</div></div>
            <EditForm
              id={j.id}
              categories={categories}
              initial={{ setup: j.setup, punchline: j.punchline, category: j.category, prompt: j.prompt ?? "", model: j.model }}
            />
          </section>
        </div>

        <div className="stack">
          <section className="card">
            <dl className="facts">
              <dt>Stars</dt><dd><Stars value={j.rating_avg} count={j.rating_count} /></dd>
              <dt>Showdown</dt><dd>{j.elo ? <>{Math.round(j.elo)} Elo · {j.wins}–{j.losses}</> : <span className="muted">unranked</span>}</dd>
              <dt>Model</dt><dd className="mono">{j.model}</dd>
              <dt>Ledger</dt><dd>{j.generation_id ? <>#{j.generation_id} · {dateTime(generation?.created_at)}</> : <span className="muted">none (hand-entered or cleared)</span>}</dd>
            </dl>
            {generation && (generation.candidates[0]?.setup !== j.setup || generation.candidates[0]?.punchline !== j.punchline) ? (
              <div style={{ marginTop: 14, fontSize: 13 }}>
                <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>Edited since generation. Gemini originally wrote:</div>
                <div className="joke"><span className="joke__setup">{generation.candidates[0]?.setup}</span> <span className="joke__punch">{generation.candidates[0]?.punchline}</span></div>
              </div>
            ) : null}
          </section>

          <section className="card card--flush">
            <div className="card__head" style={{ padding: "16px 16px 0" }}><div className="card__title">Star ratings ({ratings.length})</div></div>
            {ratings.length ? (
              <table>
                <tbody>
                  {ratings.map((r) => (
                    <tr key={r.user_id}>
                      <td><Link href={`/users/${r.user_id}`}>{fullName(r.first_name, r.last_name)}</Link></td>
                      <td><span className="stars__on">{"★".repeat(r.rating)}</span><span className="stars__off">{"★".repeat(5 - r.rating)}</span></td>
                      <td className="muted">{ago(r.updated_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <p className="empty">No ratings yet.</p>}
          </section>

          <section className="card card--flush">
            <div className="card__head" style={{ padding: "16px 16px 0" }}><div className="card__title">Showdown matches ({matches.length})</div></div>
            {matches.length ? (
              <table>
                <tbody>
                  {matches.map((m) => (
                    <tr key={m.id}>
                      <td><span className={`badge${m.won ? " badge--accent" : ""}`}>{m.won ? "Won" : "Lost"}</span></td>
                      <td className="clip">vs {m.opp_setup ?? "—"} <SourceBadge source={m.opp_source} /></td>
                      <td className="muted">{ago(m.voted_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <p className="empty">Never drawn in Showdown.</p>}
          </section>
        </div>
      </div>
    </>
  );
}
