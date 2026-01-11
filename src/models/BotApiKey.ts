import {
  HydratedDocument,
  InferSchemaType,
  Model,
  Schema,
  model,
} from "mongoose";

const BotApiKeySchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    apiKey: { type: String, required: true, unique: true },
    active: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export type BotApiKey = InferSchemaType<typeof BotApiKeySchema>;
export type BotApiKeyDocument = HydratedDocument<BotApiKey>;
export type BotApiKeyModel = Model<BotApiKey>;

export const BotApiKeyCollection = model<BotApiKey>(
  "BotApiKey",
  BotApiKeySchema
);
