import { Request, Response } from "express";
import { CreateAuctionInput, auctionService } from "../../services/AuctionService";
import { AuthenticatedRequest } from "../middleware/auth";

type BidBody = { amount: number };

export class AuctionController {
  list = async (_req: Request, res: Response): Promise<void> => {
    try {
      const auctions = await auctionService.listAuctions();
      res.json(auctions);
    } catch (error) {
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
      res.status(500).json({ error: "Failed to get auction" });
    }
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const body = req.body as CreateAuctionInput;
    try {
      const auction = await auctionService.createAuction(body);
      res.status(201).json(auction);
    } catch (error) {
      const message = (error as Error).message;
      if (message === "INVALID_DURATION") {
        res.status(400).json({ error: "Invalid duration" });
        return;
      }
      res.status(500).json({ error: "Failed to create auction" });
    }
  };

  placeBid = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const amount = Number((req.body as BidBody)?.amount);
    const user = req.user?.username;
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
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
        res.status(400).json({ error: "Bid too low (must exceed previous by bidStep)" });
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
      if (message === "AUCTION_NOT_STARTED") {
        res.status(400).json({ error: "Auction not started yet" });
        return;
      }

      res.status(500).json({ error: "Failed to place bid" });
    }
  };

  finalize = async (req: Request, res: Response): Promise<void> => {
    const force =
      typeof req.query.force === "string"
        ? req.query.force === "true"
        : Boolean(req.query.force);
    try {
      const auction = await auctionService.finalizeAuction(req.params.id, force);
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
      if (message === "AUCTION_ACTIVE") {
        res.status(400).json({ error: "Auction is still active" });
        return;
      }
      res.status(500).json({ error: "Failed to finalize auction" });
    }
  };
}

export const auctionController = new AuctionController();
