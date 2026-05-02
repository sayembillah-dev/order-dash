export type SerializedOrder = {
  _id: string;
  customerName: string;
  phone: string;
  address: string;
  orderDetails: string;
  price: number;
  images: string[];
  createdAt: string;
  pathaoEntryDone: boolean;
  parcelCreationDone: boolean;
};

/** Accepts Mongoose lean docs or plain objects from queries */
export function serializeOrder(doc: {
  _id: { toString(): string };
  customerName: string;
  phone: string;
  address: string;
  orderDetails: string;
  price: number;
  images?: string[];
  createdAt?: Date | string;
  pathaoEntryDone?: boolean;
  parcelCreationDone?: boolean;
}): SerializedOrder {
  const created =
    doc.createdAt instanceof Date
      ? doc.createdAt.toISOString()
      : typeof doc.createdAt === "string"
        ? doc.createdAt
        : "";

  return {
    _id: String(doc._id),
    customerName: doc.customerName,
    phone: doc.phone,
    address: doc.address,
    orderDetails: doc.orderDetails,
    price: doc.price,
    images: doc.images ?? [],
    createdAt: created,
    pathaoEntryDone: Boolean(doc.pathaoEntryDone),
    parcelCreationDone: Boolean(doc.parcelCreationDone),
  };
}
