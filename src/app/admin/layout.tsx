import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { getAdminSession } from "@/lib/admin-auth";

export const metadata: Metadata = {
  title: { default: "Portal", template: "%s · Kabura portal" },
  // Belt and braces alongside the Disallow in robots.txt. Nothing under
  // /admin should ever be indexed, cached or followed.
  robots: { index: false, follow: false, nocache: true },
};

/**
 * The admin layout.
 *
 * Renders the portal chrome only for a signed-in member of the allow-list.
 * Everyone else — including someone on the login or password-reset pages —
 * gets a bare frame, because navigation you cannot use is just a list of doors
 * that are locked.
 *
 * This is presentation, not protection: middleware turns signed-out visitors
 * away before a page renders, and row level security refuses the data even if
 * both were somehow bypassed.
 */
export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getAdminSession();

  if (!session) {
    return <div className="flex min-h-svh flex-col bg-ink">{children}</div>;
  }

  return <AdminShell email={session.email}>{children}</AdminShell>;
}
