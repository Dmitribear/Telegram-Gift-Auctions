import { Request, Response } from "express";
import { AuctionService } from "../../services/AuctionService";
import { asyncHandler } from "../../utils/asyncHandler";

export class AdminController {
  static closeAuction = asyncHandler(async (req: Request, res: Response) => {
    const auction = await AuctionService.finalizeAuction(req.params.auctionId);
    res.json(auction);
  });
}
