import mongoose, { Document, Schema, Types } from "mongoose";

export enum AuctionStatus {
  Scheduled = "scheduled",
  Active = "active",
  Ended = "ended",
}

export interface IAuction extends Document {
  title: string;
  description?: string;
  startPrice: number;
  bidStep: number;
  currentPrice: number;
  startTime: Date;
  endTime: Date;
  antiSnipeWindowMs: number;
  antiSnipeExtensionMs: number;
  status: AuctionStatus;
  highestBidder?: Types.ObjectId;
  highestBid?: Types.ObjectId;
  bidsCount: number;
  winnerUserId?: Types.ObjectId;
  winnerBidId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AuctionSchema = new Schema<IAuction>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String },
    startPrice: { type: Number, required: true, min: 0 },
    bidStep: { type: Number, required: true, min: 1 },
    currentPrice: { type: Number, required: true, min: 0 },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    antiSnipeWindowMs: { type: Number, default: 10 * 60 * 1000 }, // default 10 minutes
    antiSnipeExtensionMs: { type: Number, default: 5 * 60 * 1000 }, // default 5 minutes
    status: {
      type: String,
      enum: Object.values(AuctionStatus),
      default: AuctionStatus.Active,
    },
    highestBidder: { type: Schema.Types.ObjectId, ref: "User" },
    highestBid: { type: Schema.Types.ObjectId, ref: "Bid" },
    bidsCount: { type: Number, default: 0 },
    winnerUserId: { type: Schema.Types.ObjectId, ref: "User" },
    winnerBidId: { type: Schema.Types.ObjectId, ref: "Bid" },
  },
  { timestamps: true }
);

AuctionSchema.index({ status: 1, endTime: 1 });
AuctionSchema.index({ title: "text", description: "text" });

export const Auction = mongoose.model<IAuction>("Auction", AuctionSchema);
