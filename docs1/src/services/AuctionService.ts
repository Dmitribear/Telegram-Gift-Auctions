import mongoose, { ClientSession } from "mongoose";
import { AuctionRepository } from "../repositories/AuctionRepository";
import { BidRepository } from "../repositories/BidRepository";
import { AuctionStatus, IAuction } from "../models/Auction";
import { Winner } from "../models/Winner";
import { HttpError } from "../utils/httpError";
import {
  defaultTransactionOptions,
  endSessionSafe,
} from "../utils/transactions";

export interface CreateAuctionPayload {
  title: string;
  description?: string;
  startPrice: number;
  bidStep: number;
  baseDurationMinutes: number;
  startTime?: Date | string;
  antiSnipeWindowMinutes?: number;
  antiSnipeExtensionMinutes?: number;
}

export class AuctionService {
  static async createAuction(payload: CreateAuctionPayload) {
    const startTime = payload.startTime
      ? new Date(payload.startTime)
      : new Date();
    const baseDurationMs = payload.baseDurationMinutes * 60 * 1000;

    if (Number.isNaN(baseDurationMs) || baseDurationMs <= 0) {
      throw new HttpError(400, "Base duration must be greater than zero");
    }

    const endTime = new Date(startTime.getTime() + baseDurationMs);

    const auctionStatus =
      startTime.getTime() > Date.now()
        ? AuctionStatus.Scheduled
        : AuctionStatus.Active;

    const auction = await AuctionRepository.create({
      title: payload.title,
      description: payload.description,
      startPrice: payload.startPrice,
      currentPrice: payload.startPrice,
      bidStep: payload.bidStep,
      startTime,
      endTime,
      antiSnipeWindowMs: (payload.antiSnipeWindowMinutes ?? 10) * 60 * 1000,
      antiSnipeExtensionMs: (payload.antiSnipeExtensionMinutes ?? 5) * 60 * 1000,
      status: auctionStatus,
      bidsCount: 0,
    });

    return auction;
  }

  static async listAuctions(status?: AuctionStatus) {
    const filters = status ? { status } : {};
    return AuctionRepository.list(filters, 200);
  }

  static async getAuction(id: string) {
    const auction = await AuctionRepository.findById(id);
    if (!auction) {
      throw new HttpError(404, "Auction not found");
    }

    if (
      auction.status !== AuctionStatus.Ended &&
      auction.endTime.getTime() <= Date.now()
    ) {
      const finalized = await this.finalizeAuction(
        auction._id.toString(),
        undefined,
        true
      );
      return finalized;
    }

    return auction;
  }

  static async finalizeAuction(
    auctionId: string,
    session?: ClientSession,
    allowActive = false
  ) {
    const run = async (txSession: ClientSession) => {
      const auction = await AuctionRepository.findById(auctionId, txSession);
      if (!auction) {
        throw new HttpError(404, "Auction not found");
      }

      const now = new Date();
      if (!allowActive && auction.endTime > now) {
        throw new HttpError(400, "Auction is still active");
      }

      if (auction.status === AuctionStatus.Ended) {
        return auction;
      }

      auction.status = AuctionStatus.Ended;
      auction.winnerBidId = auction.highestBid;
      auction.winnerUserId = auction.highestBidder;
      const savedAuction = await auction.save({ session: txSession });

      if (auction.winnerBidId && auction.winnerUserId) {
        await Winner.findOneAndUpdate(
          { auction: auction._id },
          {
            auction: auction._id,
            user: auction.winnerUserId,
            bid: auction.winnerBidId,
            finalPrice: auction.currentPrice,
          },
          { upsert: true, session: txSession, new: true }
        );
      }

      return savedAuction;
    };

    if (session) {
      return run(session);
    }

    const ownSession = await mongoose.startSession();
    try {
      let finalized: IAuction | null = null;
      await ownSession.withTransaction(async () => {
        finalized = await run(ownSession);
      }, defaultTransactionOptions);
      return finalized;
    } finally {
      await endSessionSafe(ownSession);
    }
  }

  static async getBids(auctionId: string) {
    await this.getAuction(auctionId);
    return BidRepository.listByAuction(auctionId, 100);
  }
}
