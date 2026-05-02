import { OrderQueueCard } from "@/components/order-queue-card";
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
      <h1 className="text-balance text-2xl font-semibold tracking-tight">
        Parcel creation
      </h1>

      <PendingQueueSummary page="parcel" pending={orders.length} />

      {orders.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          No pending parcel jobs. New intake orders will show up here
          automatically.
        </p>
      ) : (
        <ul className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2">
          {orders.map((order) => (
            <li key={order._id}>
              <OrderQueueCard order={order} variant="parcel" />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
