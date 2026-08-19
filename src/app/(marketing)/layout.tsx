import type { ReactNode } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MobileCTABar } from "@/components/layout/MobileCTABar";
import { SmoothScroll } from "@/components/layout/SmoothScroll";
import { ScrollProgress } from "@/components/layout/ScrollProgress";
import { Cursor } from "@/components/layout/Cursor";
import { PageTransition } from "@/components/layout/PageTransition";
import { JsonLd } from "@/components/seo/JsonLd";
import { localBusinessSchema, websiteSchema } from "@/lib/seo";

export default function MarketingLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      <JsonLd data={[localBusinessSchema(), websiteSchema()]} />
      <SmoothScroll />
      <ScrollProgress />
      <Cursor />
      <Header />
      <main id="main" className="flex-1 pb-20 lg:pb-0">
        <PageTransition>{children}</PageTransition>
      </main>
      <Footer />
      <MobileCTABar />
    </>
  );
}
