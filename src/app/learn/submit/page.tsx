import type { Metadata } from "next";
import { Container } from "@/components/layout/container";
import { AuthGate } from "@/components/learn/auth-gate";
import { SubmitForm } from "@/components/learn/submit-form";
import { getSessionUser } from "@/lib/auth";
import { listCategories } from "@/server/learn";

export const metadata: Metadata = { title: "Submit a resource", description: "Suggest an AI course, guide, eBook, tutorial or newsletter for AI Orbit Learn." };

export default async function SubmitPage() {
  const user = await getSessionUser();
  if (!user) {
    return (
      <Container className="py-16 md:py-24">
        <AuthGate
          title="Sign in to submit a resource"
          description="Know a great AI course, guide or newsletter? Log in to send it to our editors."
          next="/learn/submit"
        />
      </Container>
    );
  }

  const categories = await listCategories();
  return (
    <Container className="flex max-w-3xl flex-col gap-8 py-12">
      <header className="flex flex-col gap-2">
        <p className="eyebrow text-accent-fg">Submit</p>
        <h1 className="text-[2rem] leading-tight font-black tracking-[-0.025em] text-fg">Submit a resource</h1>
        <p className="text-[0.9375rem] text-fg-muted">
          Share a course, guide, eBook, tutorial or newsletter that helped you learn AI. Every submission is reviewed by an editor.
        </p>
      </header>
      <SubmitForm categories={categories} />
    </Container>
  );
}
