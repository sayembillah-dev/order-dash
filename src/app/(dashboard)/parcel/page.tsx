import { ParcelPageClient } from "@/components/parcel-page-client";
import { PageRefreshButton } from "@/components/page-refresh-button";
import { PendingQueueSummary } from "@/components/pending-queue-summary";
import { connectDB } from "@/lib/mongodb";
import { Order } from "@/lib/models/Order";
import { serializeOrder } from "@/lib/serialize-order";

export const metadata = {
  title: "Parcel creation",
};

export default async function ParcelPage() {
  await connectDB();
  const docs = await Order.find({ parcelCreationDone: false })
    .sort({ createdAt: -1 })
    .lean();

  const orders = docs.map((o) => serializeOrder(o));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h1 className="text-balance text-2xl font-semibold tracking-tight">
          Parcel creation
        </h1>
        <PageRefreshButton />
      </div>

      <PendingQueueSummary page="parcel" pending={orders.length} />

      {orders.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          No pending parcel jobs. New intake orders will show up here
          automatically.
        </p>
      ) : (
        <ParcelPageClient orders={orders} />
      )}
    </div>
  );
}
