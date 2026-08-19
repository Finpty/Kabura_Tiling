import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { StatusSelect } from "@/components/admin/StatusSelect";
import { NoteForm } from "@/components/admin/NoteForm";
import { signUploadUrls } from "@/app/admin/actions";
import { getAdminSession } from "@/lib/admin-auth";
import { createServerSupabase } from "@/lib/supabase/server";
import type {
  QuoteRequest,
  QuoteRequestFile,
  QuoteRequestNote,
} from "@/lib/supabase/types";
import { QUOTE_SERVICE_OPTIONS } from "@/lib/services";
import { formatBytes, formatDateTime, telHref } from "@/lib/utils";

export const dynamic = "force-dynamic";

const serviceLabel = (value: string) =>
  QUOTE_SERVICE_OPTIONS.find((option) => option.value === value)?.label ?? value;

type Params = { params: Promise<{ id: string }> };

export default async function EnquiryPage({ params }: Params) {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const { id } = await params;
  const supabase = await createServerSupabase();

  const [{ data: enquiry }, { data: files }, { data: notes }] =
    await Promise.all([
      supabase!.from("quote_requests").select("*").eq("id", id).maybeSingle(),
      supabase!
        .from("quote_request_files")
        .select("*")
        .eq("quote_request_id", id)
        .order("created_at", { ascending: true }),
      supabase!
        .from("quote_request_notes")
        .select("*")
        .eq("quote_request_id", id)
        .order("created_at", { ascending: false }),
    ]);

  if (!enquiry) notFound();

  const request = enquiry as QuoteRequest;
  const uploads = (files ?? []) as QuoteRequestFile[];
  const noteList = (notes ?? []) as QuoteRequestNote[];

  // Private bucket: photos are only reachable through short-lived signed URLs.
  const signedUrls = await signUploadUrls(
    uploads.map((file) => file.storage_path),
  );

  const facts: [string, string | null][] = [
    ["Reference", request.reference],
    ["Received", formatDateTime(request.created_at)],
    ["Service", serviceLabel(request.service)],
    ["Suburb", request.suburb],
    ["Postcode", request.postcode],
    ["Approx. m²", request.approx_sqm],
    ["Tile size", request.tile_size],
    ["Build type", request.build_type],
    ["Start timing", request.start_timing],
  ];

  return (
    <AdminShell email={session.email}>
      <Link
        href="/admin"
        className="text-xs text-stone transition-colors hover:text-sand"
      >
        ← All enquiries
      </Link>

      <div className="mt-6 flex flex-wrap items-end justify-between gap-5">
        <div>
          <h1 className="font-display text-3xl font-medium tracking-[-0.03em] text-bone md:text-4xl">
            {request.name}
          </h1>
          <p className="mt-2 text-sm text-stone tabular-nums">
            {request.reference}
          </p>
        </div>
        <StatusSelect id={request.id} status={request.status} />
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-14">
        <div>
          {/* Contact */}
          <section aria-labelledby="contact-heading">
            <h2
              id="contact-heading"
              className="text-[0.72rem] font-semibold tracking-[0.14em] text-bone uppercase"
            >
              Contact
            </h2>
            <dl className="mt-5 grid gap-px overflow-hidden rounded-sm border border-stone/18 bg-stone/12 sm:grid-cols-3">
              <div className="bg-charcoal p-4">
                <dt className="eyebrow text-stone-light">Name</dt>
                <dd className="mt-2 text-bone">{request.name}</dd>
              </div>
              <div className="bg-charcoal p-4">
                <dt className="eyebrow text-stone-light">Phone</dt>
                <dd className="mt-2">
                  <a
                    href={telHref(request.phone)}
                    className="link-underline text-bone"
                  >
                    {request.phone}
                  </a>
                </dd>
              </div>
              <div className="bg-charcoal p-4">
                <dt className="eyebrow text-stone-light">Email</dt>
                <dd className="mt-2 break-all">
                  <a
                    href={`mailto:${request.email}`}
                    className="link-underline text-bone"
                  >
                    {request.email}
                  </a>
                </dd>
              </div>
            </dl>
          </section>

          {/* Description */}
          <section aria-labelledby="description-heading" className="mt-10">
            <h2
              id="description-heading"
              className="text-[0.72rem] font-semibold tracking-[0.14em] text-bone uppercase"
            >
              Description
            </h2>
            <p className="mt-5 rounded-sm border border-stone/18 bg-charcoal p-5 leading-relaxed whitespace-pre-wrap text-sand/85">
              {request.description || (
                <span className="text-stone italic">
                  No description supplied.
                </span>
              )}
            </p>
          </section>

          {/* Photos */}
          <section aria-labelledby="photos-heading" className="mt-10">
            <h2
              id="photos-heading"
              className="text-[0.72rem] font-semibold tracking-[0.14em] text-bone uppercase"
            >
              Uploaded photos ({uploads.length})
            </h2>

            {uploads.length === 0 ? (
              <p className="mt-5 text-sm text-stone">
                No photos were attached to this enquiry.
              </p>
            ) : (
              <>
                <ul className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {uploads.map((file, index) => {
                    const url = signedUrls[index];
                    return (
                      <li key={file.id}>
                        {url ? (
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group block"
                          >
                            <span className="relative block aspect-square overflow-hidden rounded-sm bg-charcoal-2">
                              <Image
                                src={url}
                                alt={file.file_name}
                                fill
                                unoptimized
                                sizes="220px"
                                className="object-cover transition-transform duration-700 group-hover:scale-105"
                              />
                            </span>
                          </a>
                        ) : (
                          <span className="block aspect-square rounded-sm bg-charcoal-2" />
                        )}
                        <span className="mt-2 block truncate text-xs text-stone">
                          {file.file_name}
                        </span>
                        <span className="block text-[0.66rem] text-stone/70">
                          {file.size_bytes ? formatBytes(file.size_bytes) : "—"}
                        </span>
                      </li>
                    );
                  })}
                </ul>
                <p className="mt-4 text-xs text-stone">
                  Links are signed and expire after five minutes. Reload the page
                  to generate fresh ones.
                </p>
              </>
            )}
          </section>

          {/* Notes */}
          <section aria-labelledby="notes-heading" className="mt-12">
            <h2
              id="notes-heading"
              className="text-[0.72rem] font-semibold tracking-[0.14em] text-bone uppercase"
            >
              Internal notes
            </h2>
            <p className="mt-2 text-xs text-stone">
              Staff only. Never shown to the customer or on the public site.
            </p>

            <NoteForm id={request.id} />

            <ul className="mt-8 flex flex-col gap-3">
              {noteList.length === 0 ? (
                <li className="text-sm text-stone">No notes yet.</li>
              ) : (
                noteList.map((note) => (
                  <li
                    key={note.id}
                    className="rounded-sm border border-stone/18 bg-charcoal p-4"
                  >
                    <p className="leading-relaxed whitespace-pre-wrap text-sand/85">
                      {note.body}
                    </p>
                    <p className="mt-3 text-[0.66rem] text-stone">
                      {note.author_email ?? "Staff"} ·{" "}
                      {formatDateTime(note.created_at)}
                    </p>
                  </li>
                ))
              )}
            </ul>
          </section>
        </div>

        {/* Facts */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <h2 className="text-[0.72rem] font-semibold tracking-[0.14em] text-bone uppercase">
            Project
          </h2>
          <dl className="mt-5 border-t border-stone/18">
            {facts.map(([label, value]) => (
              <div
                key={label}
                className="flex items-baseline justify-between gap-4 border-b border-stone/18 py-3"
              >
                <dt className="eyebrow text-stone-light">{label}</dt>
                <dd className="text-right text-sm text-bone">
                  {value || <span className="text-stone">—</span>}
                </dd>
              </div>
            ))}
          </dl>
        </aside>
      </div>
    </AdminShell>
  );
}
