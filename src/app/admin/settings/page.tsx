import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";
import { getSettings } from "@/lib/admin/data";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { EstimateNote, PageHeader, Section } from "@/components/admin/ui";

export const metadata = { title: "Settings", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  const settings = await getSettings();

  return (
    <>
      <PageHeader
        title="Settings"
        subtitle="Rates, the working week and who gets told about what."
      />
      <Section title="Business">
        <SettingsForm settings={settings} />
        <EstimateNote>
          The income tax rate here only drives an estimate on the dashboard and
          finance screens. It is not used to lodge anything, and it is not
          advice — set it to whatever your accountant tells you.
        </EstimateNote>
      </Section>
    </>
  );
}
