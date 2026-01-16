import mongoose, { Document, Schema, Types } from "mongoose";

export interface IBid extends Document {
  auction: Types.ObjectId;
  user: Types.ObjectId;
  amount: number;
  createdAt: Date;
  updatedAt: Date;
}

const BidSchema = new Schema<IBid>(
  {
    auction: { type: Schema.Types.ObjectId, ref: "Auction", required: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

BidSchema.index({ auction: 1, createdAt: -1 });
BidSchema.index({ auction: 1, amount: -1 });

export const Bid = mongoose.model<IBid>("Bid", BidSchema);
