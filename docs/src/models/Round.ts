import mongoose, { Document, Schema, Types } from "mongoose";

export interface IRound extends Document {
  auction: Types.ObjectId;
  number: number;
  startTime: Date;
  endTime: Date;
  createdAt: Date;
  updatedAt: Date;
}

const RoundSchema = new Schema<IRound>(
  {
    auction: { type: Schema.Types.ObjectId, ref: "Auction", required: true },
    number: { type: Number, required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
  },
  { timestamps: true }
);

RoundSchema.index({ auction: 1, number: 1 }, { unique: true });

export const Round = mongoose.model<IRound>("Round", RoundSchema);
