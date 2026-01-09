import { Request, Response } from "express";
import {
  CreateAuctionInput,
  auctionService,
} from "../../services/AuctionService";

type CreateAuctionBody = Partial<CreateAuctionInput>;

const toNumber = (value: unknown): number => {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim() !== "") return Number(value);
  return Number.NaN;
};

const parseAndValidate = (
  body: CreateAuctionBody
): { errors: string[]; value?: CreateAuctionInput } => {
  const errors: string[] = [];
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const description =
    typeof body.description === "string" && body.description.trim() !== ""
      ? body.description.trim()
      : undefined;

  const startingPrice = toNumber(body.startingPrice);
  const minBidStep = toNumber(body.minBidStep);
  const roundDurationSeconds = toNumber(body.roundDurationSeconds);
  const maxParticipantsPerRound = toNumber(body.maxParticipantsPerRound);

  if (!title) errors.push("title is required and must be non-empty");
  if (!Number.isFinite(startingPrice) || startingPrice < 0)
    errors.push("startingPrice must be a number >= 0");
  if (!Number.isFinite(minBidStep) || minBidStep <= 0)
    errors.push("minBidStep must be a number > 0");
  if (!Number.isFinite(roundDurationSeconds) || roundDurationSeconds <= 0)
    errors.push("roundDurationSeconds must be a number > 0");
  if (!Number.isFinite(maxParticipantsPerRound) || maxParticipantsPerRound <= 0)
    errors.push("maxParticipantsPerRound must be a number > 0");

  if (errors.length) return { errors };

  return {
    errors,
    value: {
      title,
      description,
      startingPrice,
      minBidStep,
      roundDurationSeconds,
      maxParticipantsPerRound,
    },
  };
};

export class AuctionController {
  // Валидацию оставляем в контроллере, бизнес-правила — в сервисе
  create = async (req: Request, res: Response): Promise<void> => {
    const { errors, value } = parseAndValidate(req.body ?? {});

    if (errors.length || !value) {
      res.status(400).json({ errors });
      return;
    }

    try {
      const auction = await auctionService.createAuction(value);
      res.status(201).json(auction);
    } catch (error) {
      console.error("Failed to create auction", error);
      res.status(500).json({ error: "Failed to create auction" });
    }
  };
}

export const auctionController = new AuctionController();