"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  addAssignment,
  removeAssignment,
  type Result,
} from "@/app/admin/portal-actions";
import type { JobAssignmentRow } from "@/lib/supabase/portal-types";

/** Who is on the job. Add by name, remove with one tap. */

const FIELD =
  "w-full rounded-lg border border-stone/25 bg-charcoal px-3.5 py-2.5 text-sm text-bone placeholder:text-stone focus:border-bronze-light focus:outline-none";

function Add() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="h-11 shrink-0 rounded-full border border-stone/30 px-6 text-[0.68rem] font-semibold tracking-[0.14em] text-sand uppercase transition-colors hover:border-bronze-light hover:text-bronze-light disabled:opacity-50"
    >
      {pending ? "Adding…" : "Add"}
    </button>
  );
}

function Remove({ id, jobId }: { id: string; jobId: string }) {
  const [, action] = useActionState<Result, FormData>(removeAssignment, {});
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="job_id" value={jobId} />
      <button
        type="submit"
        aria-label="Remove from this job"
        className="grid h-7 w-7 place-items-center rounded-full text-stone transition-colors hover:bg-bone/[0.06] hover:text-bone"
      >
        ×
      </button>
    </form>
  );
}

export function CrewList({
  jobId,
  assignments,
}: {
  jobId: string;
  assignments: JobAssignmentRow[];
}) {
  const [state, action] = useActionState<Result, FormData>(addAssignment, {});

  return (
    <div className="flex flex-col gap-3">
      {assignments.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {assignments.map((person) => (
            <li
              key={person.id}
              className="flex items-center gap-1.5 rounded-full border border-stone/25 bg-charcoal/50 py-1 pr-1 pl-3.5 text-sm text-sand/85"
            >
              {person.worker_name}
              {person.role ? (
                <span className="text-[0.65rem] text-stone">{person.role}</span>
              ) : null}
              <Remove id={person.id} jobId={jobId} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-stone">No one assigned yet.</p>
      )}

      <form action={action} className="flex flex-wrap items-center gap-2">
        <input type="hidden" name="job_id" value={jobId} />
        <input
          name="worker_name"
          required
          placeholder="Name"
          className={`${FIELD} max-w-52`}
        />
        <input
          name="role"
          placeholder="Role (optional)"
          className={`${FIELD} max-w-44`}
        />
        <Add />
        {state.error ? (
          <p role="alert" className="w-full text-sm text-bronze-light">
            {state.error}
          </p>
        ) : null}
      </form>
    </div>
  );
}
