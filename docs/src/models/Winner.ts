import mongoose, { Document, Schema, Types } from "mongoose";

export interface IWinner extends Document {
  auction: Types.ObjectId;
  user: Types.ObjectId;
  bid: Types.ObjectId;
  finalPrice: number;
  createdAt: Date;
}

const WinnerSchema = new Schema<IWinner>(
  {
    auction: { type: Schema.Types.ObjectId, ref: "Auction", required: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    bid: { type: Schema.Types.ObjectId, ref: "Bid", required: true },
    finalPrice: { type: Number, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

WinnerSchema.index({ auction: 1 }, { unique: true });

export const Winner = mongoose.model<IWinner>("Winner", WinnerSchema);
