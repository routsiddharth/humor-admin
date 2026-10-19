"use client";

import { useActionState, useState } from "react";

import {
  createAiJoke, deleteAiJoke, draftWithGemini, updateAiJoke,
  type DraftState, type FormState,
} from "@/app/(admin)/media/actions";
import { MAX_JOKE_CHARS, MAX_PROMPT_CHARS } from "@/lib/limits";

type Values = { setup: string; punchline: string; category: string; prompt: string; model: string };

function Fields({ values, set, categories }: { values: Values; set: (v: Partial<Values>) => void; categories: string[] }) {
  return (
    <>
      <div className="form-row">
        <label className="field">
          <span className="field__label">Category</span>
          <input className="input" name="category" list="categories" required maxLength={40}
            value={values.category} onChange={(e) => set({ category: e.target.value })} />
          <datalist id="categories">{categories.map((c) => <option key={c} value={c} />)}</datalist>
        </label>
        <label className="field">
          <span className="field__label">Model</span>
          <input className="input mono" name="model" required maxLength={80} placeholder="gemini-3.1-flash-lite"
            value={values.model} onChange={(e) => set({ model: e.target.value })} />
        </label>
      </div>
      <label className="field">
        <span className="field__label">Prompt <span className="muted">(optional)</span></span>
        <input className="input" name="prompt" maxLength={MAX_PROMPT_CHARS} placeholder="What the joke should be about"
          value={values.prompt} onChange={(e) => set({ prompt: e.target.value })} />
        <span className="field__hint">Shown on the card as what the model was asked for.</span>
      </label>
      <label className="field">
        <span className="field__label">Setup</span>
        <textarea className="textarea" name="setup" required maxLength={MAX_JOKE_CHARS}
          value={values.setup} onChange={(e) => set({ setup: e.target.value })} />
      </label>
      <label className="field">
        <span className="field__label">Punchline</span>
        <textarea className="textarea" name="punchline" required maxLength={MAX_JOKE_CHARS}
          value={values.punchline} onChange={(e) => set({ punchline: e.target.value })} />
      </label>
    </>
  );
}

export function CreateForm({ categories }: { categories: string[] }) {
  const [values, setValues] = useState<Values>({ setup: "", punchline: "", category: categories[0] ?? "", prompt: "", model: "" });
  const [generationId, setGenerationId] = useState<number | null>(null);
  const set = (v: Partial<Values>) => setValues((prev) => ({ ...prev, ...v }));

  const [created, create, creating] = useActionState<FormState, FormData>(createAiJoke, {});
  const [drafted, draft, drafting] = useActionState<DraftState, FormData>(async (prev, fd) => {
    const result = await draftWithGemini(prev, fd);
    if (result.draft) {
      const d = result.draft;
      setValues({ setup: d.setup, punchline: d.punchline, category: d.category, prompt: d.prompt, model: d.model });
      setGenerationId(d.generationId);
    }
    return result;
  }, {});

  return (
    <form className="form" action={create}>
      <Fields values={values} set={set} categories={categories} />
      {generationId ? <input type="hidden" name="generation_id" value={generationId} /> : null}
      <div className="form-actions">
        <button className="btn btn--primary" disabled={creating || drafting}>{creating ? "Publishing…" : "Publish AI joke"}</button>
        <button className="btn btn--accent" formAction={draft} formNoValidate disabled={creating || drafting}>
          {drafting ? "Asking Gemini…" : generationId ? "Redraft with Gemini" : "Draft with Gemini"}
        </button>
        {generationId ? <span className="muted" style={{ fontSize: 12 }}>Linked to ledger #{generationId}</span> : null}
      </div>
      {drafted.error ? <p className="form-error">{drafted.error}</p> : null}
      {created.error ? <p className="form-error">{created.error}</p> : null}
    </form>
  );
}

export function EditForm({ id, initial, categories }: { id: number; initial: Values; categories: string[] }) {
  const [values, setValues] = useState<Values>(initial);
  const set = (v: Partial<Values>) => setValues((prev) => ({ ...prev, ...v }));
  const [state, save, saving] = useActionState<FormState, FormData>(updateAiJoke.bind(null, id), {});

  return (
    <form className="form" action={save}>
      <Fields values={values} set={set} categories={categories} />
      <div className="form-actions">
        <button className="btn btn--primary" disabled={saving}>{saving ? "Saving…" : "Save changes"}</button>
        {state.ok ? <span className="form-ok">{state.ok}</span> : null}
      </div>
      {state.error ? <p className="form-error">{state.error}</p> : null}
    </form>
  );
}

export function DeleteButton({ id, ratings, matches }: { id: number; ratings: number; matches: number }) {
  const [pending, setPending] = useState(false);
  return (
    <form
      action={async () => {
        await deleteAiJoke(id);
      }}
      onSubmit={(e) => {
        const also = [ratings && `${ratings} rating${ratings === 1 ? "" : "s"}`, matches && `${matches} Showdown match${matches === 1 ? "" : "es"}`].filter(Boolean).join(" and ");
        if (!confirm(`Delete this AI joke permanently?${also ? ` Its ${also} will be deleted with it.` : ""}`)) e.preventDefault();
        else setPending(true);
      }}
    >
      <button className="btn btn--danger" disabled={pending}>{pending ? "Deleting…" : "Delete"}</button>
    </form>
  );
}
