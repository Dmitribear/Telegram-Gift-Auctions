import { Request, Response } from "express";
import { CreateAuctionInput, auctionService } from "../../services/AuctionService";

type CreateAuctionBody = Partial<CreateAuctionInput>;
type BidBody = { amount?: number; user?: string };

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

  const startPrice = toNumber(body.startPrice);
  const bidStep = toNumber(body.bidStep);
  const baseDurationMinutes = toNumber(body.baseDurationMinutes);
  const antiSnipeWindowMinutes = toNumber(body.antiSnipeWindowMinutes);
  const antiSnipeExtensionMinutes = toNumber(body.antiSnipeExtensionMinutes);

  if (!title) errors.push("title is required and must be non-empty");
  if (!Number.isFinite(startPrice) || startPrice < 0)
    errors.push("startPrice must be a number >= 0");
  if (!Number.isFinite(bidStep) || bidStep <= 0) errors.push("bidStep must be a number > 0");
  if (!Number.isFinite(baseDurationMinutes) || baseDurationMinutes <= 0)
    errors.push("baseDurationMinutes must be a number > 0");
  if (
    body.antiSnipeWindowMinutes !== undefined &&
    (!Number.isFinite(antiSnipeWindowMinutes) || antiSnipeWindowMinutes < 0)
  )
    errors.push("antiSnipeWindowMinutes must be >= 0");
  if (
    body.antiSnipeExtensionMinutes !== undefined &&
    (!Number.isFinite(antiSnipeExtensionMinutes) || antiSnipeExtensionMinutes < 0)
  )
    errors.push("antiSnipeExtensionMinutes must be >= 0");

  if (errors.length) return { errors };

  return {
    errors,
    value: {
      title,
      description,
      startPrice,
      bidStep,
      baseDurationMinutes,
      startTime: body.startTime as any,
      antiSnipeWindowMinutes:
        Number.isFinite(antiSnipeWindowMinutes) && antiSnipeWindowMinutes >= 0
          ? antiSnipeWindowMinutes
          : undefined,
      antiSnipeExtensionMinutes:
        Number.isFinite(antiSnipeExtensionMinutes) && antiSnipeExtensionMinutes >= 0
          ? antiSnipeExtensionMinutes
          : undefined,
    },
  };
};

export class AuctionController {
  list = async (_req: Request, res: Response): Promise<void> => {
    try {
      const auctions = await auctionService.listAuctions();
      res.json(auctions);
    } catch (error) {
      console.error("Failed to list auctions", error);
      res.status(500).json({ error: "Failed to list auctions" });
    }
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await auctionService.getAuctionWithBids(req.params.id);
      if (!result) {
        res.status(404).json({ error: "Auction not found" });
        return;
      }

      res.json({
        auction: result.auction,
        bids: result.bids,
      });
    } catch (error) {
      console.error("Failed to get auction", error);
      res.status(500).json({ error: "Failed to get auction" });
    }
  };

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

  placeBid = async (req: Request, res: Response): Promise<void> => {
    const amount = toNumber((req.body as BidBody)?.amount);
    const user = ((req.body as BidBody)?.user ?? "demo-user").toString();
    if (!Number.isFinite(amount) || amount <= 0) {
      res.status(400).json({ error: "amount must be a number > 0" });
      return;
    }

    try {
      const bid = await auctionService.placeBid(req.params.id, amount, user);

      res.status(201).json(bid);
    } catch (error) {
      const message = (error as Error).message;
      if (message === "INVALID_ID") {
        res.status(400).json({ error: "Invalid auction id" });
        return;
      }
      if (message === "AUCTION_NOT_FOUND") {
        res.status(404).json({ error: "Auction not found" });
        return;
      }
      if (message === "INVALID_AMOUNT") {
        res.status(400).json({ error: "Invalid bid amount" });
        return;
      }
      if (message === "BID_TOO_LOW") {
        res
          .status(400)
          .json({ error: "Bid too low (must exceed previous by bidStep)" });
        return;
      }
      if (message === "PAYMENT_METHOD_REQUIRED") {
        res.status(400).json({ error: "Payment method is required" });
        return;
      }
      if (message === "INSUFFICIENT_FUNDS") {
        res.status(400).json({ error: "Insufficient funds" });
        return;
      }
      if (message === "AUCTION_ENDED") {
        res.status(400).json({ error: "Auction already ended" });
        return;
      }
      if (message === "AUCTION_ACTIVE") {
        res.status(400).json({ error: "Auction is still active" });
        return;
      }

      console.error("Failed to place bid", error);
      res.status(500).json({ error: "Failed to place bid" });
    }
  };

  finalize = async (req: Request, res: Response): Promise<void> => {
    try {
      const auction = await auctionService.finalizeAuction(req.params.id);
      res.json(auction);
    } catch (error) {
      const message = (error as Error).message;
      if (message === "INVALID_ID") {
        res.status(400).json({ error: "Invalid auction id" });
        return;
      }
      if (message === "AUCTION_NOT_FOUND") {
        res.status(404).json({ error: "Auction not found" });
        return;
      }
      console.error("Failed to finalize auction", error);
      res.status(500).json({ error: "Failed to finalize auction" });
    }
  };
}

export const auctionController = new AuctionController();