import Link from "next/link";
import { JsonLd } from "./JsonLd";
import { breadcrumbSchema } from "@/lib/seo";
import { centreRow } from "@/lib/align";
import { cn } from "@/lib/utils";

type Crumb = { name: string; path: string };

/** Visible breadcrumbs plus the matching BreadcrumbList structured data. */
export function Breadcrumbs({
  items,
  className,
}: {
  items: Crumb[];
  className?: string;
}) {
  const full: Crumb[] = [{ name: "Home", path: "/" }, ...items];

  return (
    <>
      <nav aria-label="Breadcrumb" className={cn("text-xs", className)}>
        <ol
          className={cn(
            "flex flex-wrap items-center gap-2 text-stone",
            centreRow,
          )}
        >
          {full.map((crumb, index) => {
            const last = index === full.length - 1;
            return (
              <li key={crumb.path} className="flex items-center gap-2">
                {last ? (
                  <span aria-current="page" className="text-sand/70">
                    {crumb.name}
                  </span>
                ) : (
                  <Link
                    href={crumb.path}
                    className="link-underline hover:text-sand"
                  >
                    {crumb.name}
                  </Link>
                )}
                {last ? null : (
                  <span aria-hidden="true" className="text-stone/50">
                    /
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
      <JsonLd data={breadcrumbSchema(full)} />
    </>
  );
}
