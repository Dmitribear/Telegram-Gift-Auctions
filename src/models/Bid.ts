import mongoose, { HydratedDocument, Model, Schema } from "mongoose";

const BidSchema = new Schema(
  {
    auction: { type: Schema.Types.ObjectId, ref: "Auction", required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true, min: 0 },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

BidSchema.index({ auction: 1, createdAt: -1 });
BidSchema.index({ auction: 1, amount: -1 });

export type Bid = mongoose.InferSchemaType<typeof BidSchema>;
export type BidDocument = HydratedDocument<Bid>;
export type BidModel = Model<Bid>;

export const BidCollection = mongoose.model<Bid>("Bid", BidSchema);
