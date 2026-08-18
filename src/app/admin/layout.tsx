import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Admin",
  // Belt and braces alongside the Disallow in robots.txt.
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <div className="flex min-h-svh flex-col bg-ink">{children}</div>;
}
