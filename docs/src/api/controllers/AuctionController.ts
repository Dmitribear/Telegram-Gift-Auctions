import { Request, Response } from "express";
import { AuctionService } from "../../services/AuctionService";
import { AuctionStatus } from "../../models/Auction";
import { asyncHandler } from "../../utils/asyncHandler";
import { HttpError } from "../../utils/httpError";

export class AuctionController {
  static createAuction = asyncHandler(async (req: Request, res: Response) => {
    const {
      title,
      description,
      startPrice,
      bidStep,
      baseDurationMinutes,
      startTime,
      antiSnipeWindowMinutes,
      antiSnipeExtensionMinutes,
    } = req.body;

    if (!title || startPrice === undefined || bidStep === undefined) {
      throw new HttpError(
        400,
        "title, startPrice, bidStep and baseDurationMinutes are required"
      );
    }

    const parsedStartPrice = Number(startPrice);
    const parsedBidStep = Number(bidStep);
    const parsedDuration = Number(baseDurationMinutes ?? 24 * 60);

    if (
      !Number.isFinite(parsedStartPrice) ||
      !Number.isFinite(parsedBidStep) ||
      !Number.isFinite(parsedDuration)
    ) {
      throw new HttpError(400, "Numeric fields must be valid numbers");
    }

    if (parsedStartPrice < 0 || parsedBidStep <= 0 || parsedDuration <= 0) {
      throw new HttpError(
        400,
        "startPrice must be >= 0, bidStep > 0, baseDurationMinutes > 0"
      );
    }

    const parsedAntiWindow =
      antiSnipeWindowMinutes !== undefined
        ? Number(antiSnipeWindowMinutes)
        : undefined;
    const parsedAntiExtension =
      antiSnipeExtensionMinutes !== undefined
        ? Number(antiSnipeExtensionMinutes)
        : undefined;

    if (
      (parsedAntiWindow !== undefined && parsedAntiWindow < 0) ||
      (parsedAntiExtension !== undefined && parsedAntiExtension <= 0)
    ) {
      throw new HttpError(
        400,
        "antiSnipeWindowMinutes must be >= 0 and antiSnipeExtensionMinutes > 0"
      );
    }

    const auction = await AuctionService.createAuction({
      title,
      description,
      startPrice: parsedStartPrice,
      bidStep: parsedBidStep,
      baseDurationMinutes: parsedDuration,
      startTime,
      antiSnipeWindowMinutes: parsedAntiWindow,
      antiSnipeExtensionMinutes: parsedAntiExtension,
    });

    res.status(201).json(auction);
  });

  static listAuctions = asyncHandler(async (req: Request, res: Response) => {
    const status = req.query.status as AuctionStatus | undefined;
    const auctions = await AuctionService.listAuctions(status);
    res.json(auctions);
  });

  static getAuction = asyncHandler(async (req: Request, res: Response) => {
    const auction = await AuctionService.getAuction(req.params.auctionId);
    res.json(auction);
  });

  static finalizeAuction = asyncHandler(
    async (req: Request, res: Response) => {
      const forceParam = String(req.query.force ?? "").toLowerCase();
      const allowActive = ["true", "1", "yes"].includes(forceParam);

      const auction = await AuctionService.finalizeAuction(
        req.params.auctionId,
        undefined,
        allowActive
      );
      res.json(auction);
    }
  );

  static listBids = asyncHandler(async (req: Request, res: Response) => {
    const bids = await AuctionService.getBids(req.params.auctionId);
    res.json(bids);
  });
}
