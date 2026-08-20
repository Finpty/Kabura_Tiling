import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";
import { JobEditor } from "@/components/admin/JobEditor";
import { PageHeader, Section } from "@/components/admin/ui";

export const metadata = { title: "New job", robots: { index: false } };

export default async function NewJobPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  return (
    <>
      <PageHeader
        title="New job"
        subtitle="Booking it here is what takes the dates off the public calendar."
      />
      <Section title="Details">
        <JobEditor />
      </Section>
    </>
  );
}
