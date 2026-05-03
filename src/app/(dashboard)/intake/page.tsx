import { IntakeFormSection } from "@/components/intake-form-section";
import { PageRefreshButton } from "@/components/page-refresh-button";
import { connectDB } from "@/lib/mongodb";
import { Order } from "@/lib/models/Order";
import { serializeOrder } from "@/lib/serialize-order";

export const metadata = {
  title: "Order intake",
};

export default async function IntakePage() {
  await connectDB();
  const docs = await Order.find({
    $nor: [{ pathaoEntryDone: true, parcelCreationDone: true }],
  })
    .sort({ createdAt: -1 })
    .lean();

  const workflowOrders = docs.map((o) => serializeOrder(o));

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 break-words">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h1 className="text-balance text-2xl font-semibold tracking-tight">
          Order intake
        </h1>
        <PageRefreshButton />
      </div>
      <IntakeFormSection workflowOrders={workflowOrders} />
    </div>
  );
}
