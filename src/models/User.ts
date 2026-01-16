import { Schema, model, HydratedDocument, InferSchemaType, Model } from "mongoose";

const PaymentMethodSchema = new Schema(
  {
    type: { type: String, enum: ["card", "crypto"], required: true },
    masked: { type: String, required: true }, // last4 или короткий адрес
    provider: { type: String },
  },
  { _id: false }
);

const UserSchema = new Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    balance: { type: Number, default: 0, min: 0 },
    lockedBalance: { type: Number, default: 0, min: 0 }, // каноничное поле
    heldBalance: { type: Number, default: 0, min: 0 }, // для совместимости со старым кодом
    prizeBalance: { type: Number, default: 0, min: 0 },
    paymentMethod: { type: PaymentMethodSchema, required: false },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export type User = InferSchemaType<typeof UserSchema>;
export type UserDocument = HydratedDocument<User>;
export type UserModel = Model<User>;

export const UserCollection = model<User>("User", UserSchema);