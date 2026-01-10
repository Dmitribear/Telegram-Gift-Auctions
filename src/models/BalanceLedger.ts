import {
  HydratedDocument,
  InferSchemaType,
  Model,
  Schema,
  model,
} from "mongoose";

const BalanceLedgerSchema = new Schema(
  {
    user: { type: String, required: true, index: true },
    auctionId: { type: Schema.Types.ObjectId, ref: "Auction", required: true },
    type: {
      type: String,
      enum: ["HOLD", "RELEASE", "CHARGE", "PRIZE"],
      required: true,
    },
    amount: { type: Number, required: true, min: 0 },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export type BalanceLedger = InferSchemaType<typeof BalanceLedgerSchema>;
export type BalanceLedgerDocument = HydratedDocument<BalanceLedger>;
export type BalanceLedgerModel = Model<BalanceLedger>;

export const BalanceLedgerCollection = model<BalanceLedger>(
  "BalanceLedger",
  BalanceLedgerSchema
);
