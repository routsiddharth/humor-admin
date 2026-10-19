import Link from "next/link";

import { CreateForm } from "@/components/media-forms";
import { requireAdmin } from "@/lib/dal";
import { listCategories } from "@/lib/media";

export const metadata = { title: "New AI joke · Humor Admin" };

export default async function NewMediaPage() {
  await requireAdmin();
  const categories = await listCategories();
  return (
    <>
      <div className="crumbs"><Link href="/media">AI media</Link> /</div>
      <div className="page-head">
        <div>
          <h1>New AI joke</h1>
          <p>
            Draft one with Gemini — the same prompt and model chain as the public Generate page, logged to the
            ledger — then edit and publish. Or fill the fields in by hand. It is posted under your name.
          </p>
        </div>
      </div>
      <section className="card" style={{ maxWidth: 720 }}>
        <CreateForm categories={categories} />
      </section>
    </>
  );
}
