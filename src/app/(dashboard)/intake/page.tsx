import { IntakeFormSection } from "@/components/intake-form-section";

export const metadata = {
  title: "Order intake",
};

export default function IntakePage() {
  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 break-words">
      <h1 className="text-balance text-2xl font-semibold tracking-tight">
        Order intake
      </h1>
      <IntakeFormSection />
    </div>
  );
}
