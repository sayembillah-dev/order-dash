import mongoose, { Schema, type InferSchemaType } from "mongoose";

const OrderSchema = new Schema(
  {
    customerName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    orderDetails: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    /** Pathao / digital entry completed */
    pathaoEntryDone: { type: Boolean, default: false },
    /** Physical parcel creation completed */
    parcelCreationDone: { type: Boolean, default: false },
    images: { type: [String], default: [] },
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

export const Order =
  mongoose.models.Order ?? mongoose.model("Order", OrderSchema);
