import mongoose, { HydratedDocument, Model, Schema } from "mongoose";

// Каноничные статусы
export enum AuctionStatus {
  Scheduled = "scheduled",
  Active = "active",
  Ended = "ended",
}

const AuctionSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String },
    startPrice: { type: Number, required: true, min: 0 },
    bidStep: { type: Number, required: true, min: 1 },
    currentPrice: { type: Number, required: true, min: 0 },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    antiSnipeWindowMs: { type: Number, default: 10 * 60 * 1000 },
    antiSnipeExtensionMs: { type: Number, default: 5 * 60 * 1000 },
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
  { timestamps: true, versionKey: false }
);

AuctionSchema.index({ status: 1, endTime: 1 });
AuctionSchema.index({ title: "text", description: "text" });

export type Auction = mongoose.InferSchemaType<typeof AuctionSchema>;
export type AuctionDocument = HydratedDocument<Auction>;
export type AuctionModel = Model<Auction>;

export const AuctionCollection = mongoose.model<Auction>("Auction", AuctionSchema);
