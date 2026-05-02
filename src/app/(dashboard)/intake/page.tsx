import { IntakeFormSection } from "@/components/intake-form-section";
import { PendingQueueSummary } from "@/components/pending-queue-summary";
import { getBothPendingCounts } from "@/lib/order-counts";

export const metadata = {
  title: "Order intake",
};

export default async function IntakePage() {
  const { parcelPending, entryPending } = await getBothPendingCounts();

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 break-words">
      <h1 className="text-balance text-2xl font-semibold tracking-tight">
        Order intake
      </h1>
      <PendingQueueSummary
        page="intake"
        parcelPending={parcelPending}
        entryPending={entryPending}
      />
      <IntakeFormSection />
    </div>
  );
}
