import Link from "next/link";

import { JokeText, Pager, pageParam, param, SourceBadge } from "@/components/bits";
import { requireAdmin } from "@/lib/dal";
import { ago, fixed, fullName, num, pct } from "@/lib/format";
import { listMatches, listRatings, PAGE_SIZE, type MatchRow } from "@/lib/votes";

export const metadata = { title: "Votes · Humor Admin" };

export default async function VotesPage({ searchParams }: PageProps<"/votes">) {
  await requireAdmin();
  const sp = await searchParams;
  const tab = param(sp.tab) === "showdown" ? "showdown" : "ratings";

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Votes</h1>
          <p>
            Star ratings (1–5 per person per post) and Showdown picks (each blind head-to-head is an upvote for one
            joke and a downvote for the other). Read-only — votes belong to the people who cast them.
          </p>
        </div>
        <div className="tabs">
          <Link href="/votes" aria-current={tab === "ratings" ? "page" : undefined}>Star ratings</Link>
          <Link href="/votes?tab=showdown" aria-current={tab === "showdown" ? "page" : undefined}>Showdown votes</Link>
        </div>
      </div>
      {tab === "ratings" ? <Ratings sp={sp} /> : <Showdown sp={sp} />}
    </>
  );
}

type SP = Record<string, string | string[] | undefined>;

async function Ratings({ sp }: { sp: SP }) {
  const starsParam = Number(param(sp.stars, "0"));
  const stars = [1, 2, 3, 4, 5].includes(starsParam) ? starsParam : 0;
  const s = param(sp.source);
  const source = ["human", "ai", "meme"].includes(s) ? s : "";
  const page = pageParam(sp.page);
  const { rows, total, summary } = await listRatings({ stars, source, page });
  const maxStar = Math.max(1, ...summary.by_star);

  return (
    <>
      <div className="grid grid--wide-left" style={{ marginBottom: 16 }}>
        <div className="tiles">
          <div className="tile"><div className="tile__label">Ratings</div><div className="tile__value">{num(summary.total)}</div></div>
          <div className="tile"><div className="tile__label">Average</div><div className="tile__value">{fixed(summary.avg)}★</div></div>
          <div className="tile"><div className="tile__label">Raters</div><div className="tile__value">{num(summary.raters)}</div></div>
          <div className="tile"><div className="tile__label">Changed their mind</div><div className="tile__value">{pct(summary.changed, summary.total)}</div><div className="tile__meta">{summary.changed} re-rated</div></div>
        </div>
        <section className="card">
          <div className="card__title" style={{ marginBottom: 10 }}>All ratings by star</div>
          <div className="hbars">
            {summary.by_star.map((n, i) => (
              <Link key={i} href={`/votes?stars=${i + 1}`} className="hbar" style={{ gridTemplateColumns: "28px minmax(0,1fr) auto" }} data-tip={`${i + 1}★: ${n} (${pct(n, summary.total)})`}>
                <span className="hbar__label">{i + 1}★</span>
                <span className="hbar__track"><span className="hbar__seg" style={{ width: `${(n / maxStar) * 100}%`, minWidth: n ? 3 : 0, background: "var(--s-gen)", borderRadius: "0 4px 4px 0" }} /></span>
                <span className="hbar__val">{n}</span>
              </Link>
            ))}
          </div>
        </section>
      </div>

      <form className="toolbar">
        <input type="hidden" name="tab" value="ratings" />
        <select className="select" name="stars" defaultValue={String(stars)} aria-label="Stars">
          <option value="0">Any stars</option>
          {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n}★</option>)}
        </select>
        <select className="select" name="source" defaultValue={source} aria-label="Post type">
          <option value="">Any post</option>
          <option value="human">Human jokes</option>
          <option value="ai">AI jokes</option>
          <option value="meme">Memes</option>
        </select>
        <button className="btn">Filter</button>
      </form>

      <section className="card card--flush">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Rater</th><th>Stars</th><th>Post</th><th>Type</th><th>When</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={`${r.joke_id}-${r.user_id}`}>
                  <td><Link className="row-link" href={`/users/${r.user_id}`}>{fullName(r.first_name, r.last_name)}</Link></td>
                  <td><span className="stars__on">{"★".repeat(r.rating)}</span><span className="stars__off">{"★".repeat(5 - r.rating)}</span></td>
                  <td className="clip">
                    {r.source === "ai" ? <Link href={`/media/${r.joke_id}`}><JokeText setup={r.setup} kind={r.kind} /></Link> : <JokeText setup={r.setup} kind={r.kind} />}
                    <div className="person__sub">#{r.joke_id} · {r.category}</div>
                  </td>
                  <td><SourceBadge source={r.source} kind={r.kind} /></td>
                  <td className="muted">{ago(r.updated_at)}{r.updated_at !== r.created_at && new Date(r.updated_at).getTime() - new Date(r.created_at).getTime() > 1000 ? " · edited" : ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 ? <p className="empty">No ratings match.</p> : null}
        </div>
        <Pager page={page} pageSize={PAGE_SIZE} total={total} path="/votes"
          params={{ ...(stars && { stars: String(stars) }), ...(source && { source }) }} />
      </section>
    </>
  );
}

async function Showdown({ sp }: { sp: SP }) {
  const s = param(sp.status, "voted");
  const status = (["voted", "open", "all"].includes(s) ? s : "voted") as "voted" | "open" | "all";
  const page = pageParam(sp.page);
  const { rows, total, summary } = await listMatches({ status, page });

  return (
    <>
      <div className="tiles" style={{ marginBottom: 16 }}>
        <div className="tile"><div className="tile__label">Votes cast</div><div className="tile__value">{num(summary.voted)}</div><div className="tile__meta">of {num(summary.issued)} pairs shown</div></div>
        <div className="tile"><div className="tile__label">Skipped</div><div className="tile__value">{pct(summary.issued - summary.voted, summary.issued)}</div><div className="tile__meta">shown but never voted on</div></div>
        <div className="tile"><div className="tile__label">Voters</div><div className="tile__value">{num(summary.voters)}</div></div>
        <div className="tile"><div className="tile__label">Left-side bias</div><div className="tile__value">{pct(summary.left_wins, summary.voted)}</div><div className="tile__meta">50% would be fair</div></div>
        <div className="tile"><div className="tile__label">Median decision</div><div className="tile__value">{summary.median_secs != null ? `${Math.round(summary.median_secs)}s` : "—"}</div><div className="tile__meta">from pair shown to vote</div></div>
      </div>

      <div className="toolbar">
        <div className="tabs">
          {(["voted", "open", "all"] as const).map((k) => (
            <Link key={k} href={`/votes?tab=showdown&status=${k}`} aria-current={status === k ? "page" : undefined}>
              {k === "voted" ? "Voted" : k === "open" ? "Unvoted" : "All"}
            </Link>
          ))}
        </div>
      </div>

      <section className="card card--flush">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Voter</th><th>Upvoted</th><th>Downvoted</th><th>When</th></tr></thead>
            <tbody>
              {rows.map((m) => <MatchLine key={m.id} m={m} />)}
            </tbody>
          </table>
          {rows.length === 0 ? <p className="empty">No matches here.</p> : null}
        </div>
        <Pager page={page} pageSize={PAGE_SIZE} total={total} path="/votes" params={{ tab: "showdown", status }} />
      </section>
    </>
  );
}

function MatchLine({ m }: { m: MatchRow }) {
  const left = { id: m.left_id, setup: m.left_setup, source: m.left_source };
  const right = { id: m.right_id, setup: m.right_setup, source: m.right_source };
  const [up, down] = m.winner_id === m.right_id ? [right, left] : [left, right];
  const cell = (j: typeof left, mark: string) => (
    <td className="clip">
      <span aria-hidden="true" style={{ marginRight: 6 }}>{mark}</span>
      {j.source === "ai" ? <Link href={`/media/${j.id}`}>{j.setup}</Link> : j.setup}{" "}
      <SourceBadge source={j.source} />
    </td>
  );
  return (
    <tr>
      <td><Link className="row-link" href={`/users/${m.voter_id}`}>{fullName(m.first_name, m.last_name)}</Link></td>
      {m.winner_id ? cell(up, "▲") : cell(left, "·")}
      {m.winner_id ? cell(down, "▼") : cell(right, "·")}
      <td className="muted">{m.voted_at ? ago(m.voted_at) : `shown ${ago(m.created_at)}`}</td>
    </tr>
  );
}
