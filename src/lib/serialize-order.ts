export type SerializedOrder = {
  _id: string;
  customerName: string;
  phone: string;
  address: string;
  orderDetails: string;
  note: string;
  price: number;
  images: string[];
  createdAt: string;
  pathaoEntryDone: boolean;
  parcelCreationDone: boolean;
  lazySubmission: boolean;
  pathaoConsignmentId?: string;
  pathaoDeliveryFee?: number;
  pathaoBulkAcceptedAt?: string;
};

/** Accepts Mongoose lean docs or plain objects from queries */
export function serializeOrder(doc: {
  _id: { toString(): string };
  customerName?: string;
  phone?: string;
  address?: string;
  orderDetails: string;
  note?: string;
  price: number;
  images?: string[];
  createdAt?: Date | string;
  pathaoEntryDone?: boolean;
  parcelCreationDone?: boolean;
  lazySubmission?: boolean;
  pathaoConsignmentId?: string;
  pathaoDeliveryFee?: number;
  pathaoBulkAcceptedAt?: Date | string;
}): SerializedOrder {
  const created =
    doc.createdAt instanceof Date
      ? doc.createdAt.toISOString()
      : typeof doc.createdAt === "string"
        ? doc.createdAt
        : "";

  const bulkAt = doc.pathaoBulkAcceptedAt;
  const bulkIso =
    bulkAt instanceof Date
      ? bulkAt.toISOString()
      : typeof bulkAt === "string"
        ? bulkAt
        : undefined;

  return {
    _id: String(doc._id),
    customerName: doc.customerName ?? "",
    phone: doc.phone ?? "",
    address: doc.address ?? "",
    orderDetails: doc.orderDetails,
    note: doc.note ?? "",
    price: doc.price,
    images: doc.images ?? [],
    createdAt: created,
    pathaoEntryDone: Boolean(doc.pathaoEntryDone),
    parcelCreationDone: Boolean(doc.parcelCreationDone),
    lazySubmission: Boolean(doc.lazySubmission),
    pathaoConsignmentId: doc.pathaoConsignmentId?.trim()
      ? doc.pathaoConsignmentId.trim()
      : undefined,
    pathaoDeliveryFee:
      typeof doc.pathaoDeliveryFee === "number" ? doc.pathaoDeliveryFee : undefined,
    pathaoBulkAcceptedAt: bulkIso,
  };
}
