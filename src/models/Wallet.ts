import {
  HydratedDocument,
  InferSchemaType,
  Model,
  Schema,
  model,
} from "mongoose";

const WalletTxSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["FAUCET", "SEND", "BRIDGE_IN", "BRIDGE_OUT", "FEE"],
      required: true,
    },
    amount: { type: Number, required: true, min: 0 },
    to: { type: String, required: false },
    hash: { type: String, required: true },
    status: { type: String, enum: ["pending", "confirmed"], default: "confirmed" },
  },
  { _id: false, timestamps: true }
);

const WalletSchema = new Schema(
  {
    user: { type: String, required: true, unique: true, index: true },
    address: { type: String, required: true, unique: true },
    balanceTon: { type: Number, default: 0, min: 0 },
    tx: { type: [WalletTxSchema], default: [] },
  },
  { timestamps: true, versionKey: false }
);

export type Wallet = InferSchemaType<typeof WalletSchema>;
export type WalletDocument = HydratedDocument<Wallet>;
export type WalletModel = Model<Wallet>;

export const WalletCollection = model<Wallet>("Wallet", WalletSchema);
