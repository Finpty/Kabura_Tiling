"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { updateStatus, type ActionState } from "@/app/admin/actions";
import {
  ENQUIRY_STATUSES,
  ENQUIRY_STATUS_LABELS,
  type EnquiryStatus,
} from "@/lib/supabase/types";

function Pending() {
  const { pending } = useFormStatus();
  return pending ? (
    <span className="text-xs text-stone" role="status">
      Saving…
    </span>
  ) : null;
}

/** Status change. Submits on select so there is no separate save step. */
export function StatusSelect({
  id,
  status,
}: {
  id: string;
  status: EnquiryStatus;
}) {
  const [state, action] = useActionState<ActionState, FormData>(
    updateStatus,
    {},
  );
  const formRef = useRef<HTMLFormElement>(null);
  const liveRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (state.ok && liveRef.current) {
      liveRef.current.textContent = "Status updated.";
      const timer = setTimeout(() => {
        if (liveRef.current) liveRef.current.textContent = "";
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [state.ok]);

  return (
    <form ref={formRef} action={action} className="flex items-center gap-3">
      <input type="hidden" name="id" value={id} />
      <label htmlFor={`status-${id}`} className="sr-only">
        Enquiry status
      </label>
      <select
        id={`status-${id}`}
        name="status"
        defaultValue={status}
        onChange={() => formRef.current?.requestSubmit()}
        className="rounded-sm border border-stone/30 bg-charcoal px-3 py-2 text-sm text-bone focus:border-bronze-light focus:outline-none"
      >
        {ENQUIRY_STATUSES.map((value) => (
          <option key={value} value={value}>
            {ENQUIRY_STATUS_LABELS[value]}
          </option>
        ))}
      </select>
      <Pending />
      <p ref={liveRef} aria-live="polite" className="text-xs text-emerald-300" />
      {state.error ? (
        <p role="alert" className="text-xs text-bronze-light">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
