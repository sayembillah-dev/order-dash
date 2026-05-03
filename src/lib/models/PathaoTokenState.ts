import mongoose, { Schema, type InferSchemaType } from "mongoose";

/** Singleton row for Pathao OAuth tokens (serverless-safe refresh persistence). */
const PathaoTokenStateSchema = new Schema(
  {
    _id: {
      type: String,
      default: "singleton",
    },
    refreshToken: { type: String, required: true },
    accessToken: { type: String, required: true },
    /** Epoch ms when accessToken should be treated as expired */
    accessExpiresAt: { type: Number, required: true },
  },
  { timestamps: false },
);

export type PathaoTokenStateDoc = InferSchemaType<
  typeof PathaoTokenStateSchema
> & {
  _id: string;
};

if (
  process.env.NODE_ENV === "development" &&
  mongoose.models.PathaoTokenState
) {
  delete mongoose.models.PathaoTokenState;
}

export const PathaoTokenState =
  mongoose.models.PathaoTokenState ??
  mongoose.model("PathaoTokenState", PathaoTokenStateSchema);
