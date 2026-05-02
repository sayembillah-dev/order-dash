import { connectDB } from "@/lib/mongodb";
import { Order } from "@/lib/models/Order";

export async function getBothPendingCounts(): Promise<{
  parcelPending: number;
  entryPending: number;
}> {
  await connectDB();
  const [parcelPending, entryPending] = await Promise.all([
    Order.countDocuments({ parcelCreationDone: false }),
    Order.countDocuments({ pathaoEntryDone: false }),
  ]);
  return { parcelPending, entryPending };
}
