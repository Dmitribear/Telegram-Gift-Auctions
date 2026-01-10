import {
  HydratedDocument,
  InferSchemaType,
  Model,
  Schema,
  model,
} from "mongoose";

const BidSchema = new Schema(
  {
    auctionId: {
      type: Schema.Types.ObjectId,
      ref: "Auction",
      required: true,
      index: true,
    },
    user: { type: String, required: true, trim: true },
    amount: {
      type: Number,
      required: true,
      min: [0.01, "amount must be greater than 0"],
    },
    round: { type: Number, default: 1, min: 0 },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export type Bid = InferSchemaType<typeof BidSchema>;
export type BidDocument = HydratedDocument<Bid>;
export type BidModel = Model<Bid>;

export const BidCollection = model<Bid>("Bid", BidSchema);
