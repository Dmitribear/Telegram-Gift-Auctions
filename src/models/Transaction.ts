import {
  HydratedDocument,
  InferSchemaType,
  Model,
  Schema,
  model,
} from "mongoose";

const TransactionSchema = new Schema(
  {
    user: { type: String, required: true, index: true },
    auctionId: { type: Schema.Types.ObjectId, ref: "Auction", required: false },
    type: {
      type: String,
      enum: [
        "DEPOSIT",
        "HOLD",
        "RELEASE",
        "CHARGE",
        "PRIZE",
        "LINK_PAYMENT",
        "BOT_FUND",
        "BRIDGE_IN",
        "BRIDGE_OUT",
      ],
      required: true,
    },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "TON" },
    meta: { type: Schema.Types.Mixed, required: false },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export type Transaction = InferSchemaType<typeof TransactionSchema>;
export type TransactionDocument = HydratedDocument<Transaction>;
export type TransactionModel = Model<Transaction>;

export const TransactionCollection = model<Transaction>(
  "Transaction",
  TransactionSchema
);
