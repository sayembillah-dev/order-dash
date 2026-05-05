import { ArchivePageClient } from "@/components/archive-page-client";
import { connectDB } from "@/lib/mongodb";
import { Order } from "@/lib/models/Order";
import { serializeOrder } from "@/lib/serialize-order";

export const metadata = {
  title: "Archive — ready to ship",
};

const PAGE_SIZE = 20;

type PageProps = {
  searchParams: Promise<{ q?: string; page?: string }>;
};

function buildSearchConditions(q: string) {
  const conditions: object[] = [];
  // Name: case-insensitive substring
  conditions.push({ customerName: { $regex: q, $options: "i" } });
  // Phone: match on digits only — mirrors orderMatchesQuery behaviour
  const digits = q.replace(/\D/g, "");
  if (digits) {
    if (digits.length <= 4) {
      // Last-N-digits match: digits must appear at the end of the stored phone string
      conditions.push({ phone: { $regex: `${digits}\\D*$` } });
    } else {
      // Full/partial number: stored phone must contain the digit run
      conditions.push({ phone: { $regex: digits } });
    }
  }
  return conditions;
}

export default async function ArchivePage({ searchParams }: PageProps) {
  const { q: rawQ, page: rawPage } = await searchParams;

  const q = (rawQ ?? "").trim().slice(0, 100);
  const page = Math.max(1, parseInt(rawPage ?? "1", 10) || 1);

  const baseFilter = { pathaoEntryDone: true, parcelCreationDone: true };
  const filter = q
    ? { ...baseFilter, $or: buildSearchConditions(q) }
    : baseFilter;

  await connectDB();

  const [total, docs] = await Promise.all([
    Order.countDocuments(filter),
    Order.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .lean(),
  ]);

  const orders = docs.map((o) => serializeOrder(o));
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <h1 className="text-balance text-2xl font-semibold tracking-tight">
        Ready to ship (archive)
      </h1>

      {total === 0 && !q ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          No completed orders yet. When both teams finish, orders land here.
        </p>
      ) : (
        <ArchivePageClient
          orders={orders}
          page={page}
          totalPages={totalPages}
          total={total}
          query={q}
        />
      )}
    </div>
  );
}
