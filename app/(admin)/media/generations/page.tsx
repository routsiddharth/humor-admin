import Link from "next/link";

import { Pager, pageParam, param } from "@/components/bits";
import { requireAdmin } from "@/lib/dal";
import { ago, fullName } from "@/lib/format";
import { listGenerations, PAGE_SIZE } from "@/lib/media";

export const metadata = { title: "Generation ledger · Humor Admin" };

const STATUSES = { all: "All", posted: "Posted", unposted: "Discarded" } as const;

export default async function GenerationsPage({ searchParams }: PageProps<"/media/generations">) {
  await requireAdmin();
  const sp = await searchParams;
  const s = param(sp.status, "all");
  const status = (s in STATUSES ? s : "all") as keyof typeof STATUSES;
  const page = pageParam(sp.page);
  const { rows, total } = await listGenerations({ page, status });

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Generation ledger</h1>
          <p>Every call to Gemini, including drafts nobody posted. Read-only: the ledger is the rate-limit record, so its rows are never edited.</p>
        </div>
        <div className="form-actions">
          <div className="tabs">
            <Link href="/media">Posts</Link>
            <Link href="/media/generations" aria-current="page">Generation ledger</Link>
          </div>
        </div>
      </div>

      <div className="toolbar">
        <div className="tabs">
          {Object.entries(STATUSES).map(([k, v]) => (
            <Link key={k} href={`/media/generations?status=${k}`} aria-current={status === k ? "page" : undefined}>{v}</Link>
          ))}
        </div>
      </div>

      <section className="card card--flush">
        <div className="table-wrap">
          <table>
            <thead><tr><th className="r">#</th><th>What Gemini wrote</th><th>Prompt</th><th>Model</th><th>Requested by</th><th>Status</th><th>When</th></tr></thead>
            <tbody>
              {rows.map((g) => (
                <tr key={g.id}>
                  <td className="r muted">{g.id}</td>
                  <td className="clip"><span className="joke"><span className="joke__setup">{g.setup}</span> <span className="joke__punch">{g.punchline}</span></span><div className="person__sub">{g.category}</div></td>
                  <td>{g.prompt ? `“${g.prompt}”` : <span className="muted">—</span>}</td>
                  <td className="mono muted" style={{ fontSize: 12 }}>{g.model}</td>
                  <td><Link href={`/users/${g.user_id}`}>{fullName(g.first_name, g.last_name)}</Link></td>
                  <td>{g.posted_id ? <Link className="badge badge--accent" href={`/media/${g.posted_id}`}>Posted #{g.posted_id}</Link> : <span className="badge">Discarded</span>}</td>
                  <td className="muted">{ago(g.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 ? <p className="empty">Nothing here.</p> : null}
        </div>
        <Pager page={page} pageSize={PAGE_SIZE} total={total} path="/media/generations" params={{ status }} />
      </section>
    </>
  );
}
