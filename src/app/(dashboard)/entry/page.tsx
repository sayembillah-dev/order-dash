import { OrderQueueCard } from "@/components/order-queue-card";
import { PendingQueueSummary } from "@/components/pending-queue-summary";
import { connectDB } from "@/lib/mongodb";
import { Order } from "@/lib/models/Order";
import { serializeOrder } from "@/lib/serialize-order";

export const metadata = {
  title: "Pathao entry",
};

export default async function EntryPage() {
  await connectDB();
  const docs = await Order.find({ pathaoEntryDone: false })
    .sort({ createdAt: -1 })
    .lean();

  const orders = docs.map((o) => serializeOrder(o));

  return (
    <div className="space-y-6">
      <h1 className="text-balance text-2xl font-semibold tracking-tight">
        Pathao entry
      </h1>

      <PendingQueueSummary page="entry" pending={orders.length} />

      {orders.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          No pending Pathao entries.
        </p>
      ) : (
        <ul className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2">
          {orders.map((order) => (
            <li key={order._id}>
              <OrderQueueCard order={order} variant="entry" />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
