import mongoose, { Document, Schema, Types } from "mongoose";

export type LedgerReason =
  | "deposit"
  | "bid_hold"
  | "bid_release"
  | "payout"
  | "adjustment";

export interface IBalanceLedger extends Document {
  user: Types.ObjectId;
  change: number;
  reason: LedgerReason;
  auction?: Types.ObjectId;
  note?: string;
  createdAt: Date;
}

const BalanceLedgerSchema = new Schema<IBalanceLedger>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    change: { type: Number, required: true },
    reason: { type: String, required: true },
    auction: { type: Schema.Types.ObjectId, ref: "Auction" },
    note: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

BalanceLedgerSchema.index({ user: 1, createdAt: -1 });

export const BalanceLedger = mongoose.model<IBalanceLedger>(
  "BalanceLedger",
  BalanceLedgerSchema
);
