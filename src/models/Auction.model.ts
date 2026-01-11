import {
  HydratedDocument,
  InferSchemaType,
  Model,
  Schema,
  model,
} from "mongoose";

// Статус храним строкой, чтобы в будущем расширять без миграций enum'ов в коде
export enum AuctionStatus {
  CREATED = "CREATED",
  RUNNING = "RUNNING",
  FINISHED = "FINISHED",
}

const AuctionSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    status: {
      type: String,
      enum: Object.values(AuctionStatus),
      default: AuctionStatus.CREATED,
      required: true,
    },
    startingPrice: {
      type: Number,
      required: true,
      min: [0, "startingPrice must be >= 0"],
    },
    minBidStep: {
      type: Number,
      required: true,
      validate: {
        validator: (value: number) => value > 0,
        message: "minBidStep must be > 0",
      },
    },
    roundDurationSeconds: {
      type: Number,
      required: true,
      min: [1, "roundDurationSeconds must be > 0"],
    },
    maxParticipantsPerRound: {
      type: Number,
      required: true,
      min: [1, "maxParticipantsPerRound must be > 0"],
    },
    totalRounds: { type: Number, default: 1, min: 1 },
    prizesCount: { type: Number, default: 1, min: 1 },
    currentRound: { type: Number, default: 0, min: 0 },
    endsAt: { type: Date, required: false },
    antiSnipeWindowSeconds: { type: Number, default: 10, min: 0 },
    antiSnipeExtendSeconds: { type: Number, default: 10, min: 0 },
    winnerUser: { type: String, required: false },
    winningBid: { type: Number, required: false, min: 0 },
    finishedAt: { type: Date, required: false },
    botMaxBidAmount: { type: Number, required: false, min: 0 },
    winners: [
      {
        user: { type: String, required: true },
        amount: { type: Number, required: true, min: 0 },
      },
    ],
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export type Auction = InferSchemaType<typeof AuctionSchema>;
export type AuctionDocument = HydratedDocument<Auction>;
export type AuctionModel = Model<Auction>;

export const AuctionCollection = model<Auction>("Auction", AuctionSchema);
