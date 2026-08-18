"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { addNote, type ActionState } from "@/app/admin/actions";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="self-start rounded-full bg-bone px-6 py-2.5 text-[0.7rem] font-semibold tracking-[0.14em] text-ink uppercase transition-colors hover:bg-paper disabled:opacity-50"
    >
      {pending ? "Saving…" : "Add note"}
    </button>
  );
}

/** Internal notes. Never rendered anywhere on the public site. */
export function NoteForm({ id }: { id: string }) {
  const [state, action] = useActionState<ActionState, FormData>(addNote, {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  return (
    <form ref={formRef} action={action} className="mt-6 flex flex-col gap-3">
      <input type="hidden" name="id" value={id} />
      <label htmlFor={`note-${id}`} className="eyebrow text-stone-light">
        Add an internal note
      </label>
      <textarea
        id={`note-${id}`}
        name="body"
        rows={4}
        maxLength={4000}
        placeholder="Site visit booked for Thursday, access via the rear gate…"
        className="w-full resize-y rounded-sm border border-stone/30 bg-ink px-4 py-3 text-bone placeholder:text-stone/60 focus:border-bronze-light focus:outline-none"
      />
      {state.error ? (
        <p role="alert" className="text-sm text-bronze-light">
          {state.error}
        </p>
      ) : null}
      <Submit />
    </form>
  );
}
