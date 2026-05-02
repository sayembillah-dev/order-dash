import { ArchiveOrderCard } from "@/components/archive-order-card";
import { connectDB } from "@/lib/mongodb";
import { Order } from "@/lib/models/Order";
import { serializeOrder } from "@/lib/serialize-order";

export const metadata = {
  title: "Archive — ready to ship",
};

export default async function ArchivePage() {
  await connectDB();
  const docs = await Order.find({
    pathaoEntryDone: true,
    parcelCreationDone: true,
  })
    .sort({ createdAt: -1 })
    .lean();

  const orders = docs.map((o) => serializeOrder(o));

  return (
    <div className="space-y-6">
      <h1 className="text-balance text-2xl font-semibold tracking-tight">
        Ready to ship (archive)
      </h1>

      {orders.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          No completed orders yet. When both teams finish, orders land here.
        </p>
      ) : (
        <ul className="grid gap-6 lg:grid-cols-2">
          {orders.map((order) => (
            <li key={order._id}>
              <ArchiveOrderCard order={order} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
