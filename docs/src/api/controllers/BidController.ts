import { Request, Response } from "express";
import { BidService } from "../../services/BidService";
import { asyncHandler } from "../../utils/asyncHandler";
import { HttpError } from "../../utils/httpError";

export class BidController {
  static placeBid = asyncHandler(async (req: Request, res: Response) => {
    const { amount, userId } = req.body;
    const auctionId = req.params.auctionId ?? req.body.auctionId;

    if (!auctionId) {
      throw new HttpError(400, "auctionId is required");
    }
    if (!userId) {
      throw new HttpError(400, "userId is required");
    }

    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount)) {
      throw new HttpError(400, "amount must be a number");
    }

    const bid = await BidService.placeBid({
      auctionId,
      userId,
      amount: parsedAmount,
    });

    res.status(201).json(bid);
  });
}
