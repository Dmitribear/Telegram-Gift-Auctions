import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
  username: string;
  balance: number;
  lockedBalance: number;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    username: { type: String, required: true, unique: true, trim: true },
    balance: { type: Number, default: 0, min: 0 },
    lockedBalance: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>("User", UserSchema);
