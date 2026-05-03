import mongoose, { Schema, type InferSchemaType } from "mongoose";

const OrderSchema = new Schema(
  {
    customerName: { type: String, default: "", trim: true },
    phone: { type: String, default: "", trim: true },
    address: { type: String, default: "", trim: true },
    orderDetails: {
      type: String,
      required: false,
      default: "",
      trim: true,
    },
    /** Extra note (used heavily in Lazy mode intake) */
    note: { type: String, default: "", trim: true },
    price: { type: Number, required: true, min: 0 },
    /** Created via Lazy mode (minimal fields); helps display/copy when settings toggle is off */
    lazySubmission: { type: Boolean, default: false },
    /** Pathao / digital entry completed */
    pathaoEntryDone: { type: Boolean, default: false },
    /** When Pathao entry was marked complete (for “today’s history”) */
    pathaoEntryCompletedAt: { type: Date, required: false },
    /** Physical parcel creation completed */
    parcelCreationDone: { type: Boolean, default: false },
    /** When parcel step was marked complete */
    parcelCreationCompletedAt: { type: Date, required: false },
    images: { type: [String], default: [] },
    /** Pathao consignment id after successful single-order API create */
    pathaoConsignmentId: { type: String, trim: true, required: false },
    /** Delivery fee returned by Pathao create order */
    pathaoDeliveryFee: { type: Number, required: false },
    /** Set when order was submitted via Pathao bulk API (async processing) */
    pathaoBulkAcceptedAt: { type: Date, required: false },
  },
  { timestamps: true }
);

OrderSchema.index({ parcelCreationDone: 1, createdAt: -1 });
OrderSchema.index({ pathaoEntryDone: 1, createdAt: -1 });
OrderSchema.index({
  pathaoEntryDone: 1,
  parcelCreationDone: 1,
  createdAt: -1,
});

export type OrderDoc = InferSchemaType<typeof OrderSchema> & {
  _id: mongoose.Types.ObjectId;
};

/** Next.js dev HMR can keep a stale compiled model; drop it so schema edits apply. */
if (process.env.NODE_ENV === "development" && mongoose.models.Order) {
  delete mongoose.models.Order;
}

export const Order =
  mongoose.models.Order ?? mongoose.model("Order", OrderSchema);
