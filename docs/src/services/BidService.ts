import mongoose from "mongoose";
import { redlock } from "../config/redlock";
import { AuctionStatus } from "../models/Auction";
import { HttpError } from "../utils/httpError";
import {
  defaultTransactionOptions,
  endSessionSafe,
} from "../utils/transactions";
import { AuctionRepository } from "../repositories/AuctionRepository";
import { UserRepository } from "../repositories/UserRepository";
import { BidRepository } from "../repositories/BidRepository";
import { BalanceLedgerRepository } from "../repositories/BalanceLedgerRepository";
import { AuctionService } from "./AuctionService";

export interface PlaceBidPayload {
  auctionId: string;
  userId: string;
  amount: number;
}

export class BidService {
  static async placeBid(payload: PlaceBidPayload) {
    if (payload.amount <= 0) {
      throw new HttpError(400, "Bid amount must be positive");
    }

    const lock = await redlock.acquire(
      [`locks:auction:${payload.auctionId}`],
      5000
    );
    const session = await mongoose.startSession();

    try {
      let createdBid = null;

      await session.withTransaction(async () => {
        const auction = await AuctionRepository.findById(
          payload.auctionId,
          session
        );
        if (!auction) {
          throw new HttpError(404, "Auction not found");
        }

        const now = new Date();
        if (auction.status === AuctionStatus.Ended) {
          throw new HttpError(400, "Auction already ended");
        }

        if (auction.startTime > now) {
          throw new HttpError(400, "Auction has not started yet");
        }

        if (
          auction.status === AuctionStatus.Scheduled &&
          auction.startTime <= now
        ) {
          auction.status = AuctionStatus.Active;
        }

        if (auction.endTime <= now) {
          await AuctionService.finalizeAuction(
            auction._id.toString(),
            session,
            true
          );
          throw new HttpError(400, "Auction already finished");
        }

        const user = await UserRepository.findById(payload.userId, session);
        if (!user) {
          throw new HttpError(404, "User not found");
        }

        const minBid = auction.currentPrice + auction.bidStep;
        if (payload.amount < minBid) {
          throw new HttpError(
            400,
            `Bid must be at least ${minBid}, got ${payload.amount}`
          );
        }

        if (user.balance < payload.amount) {
          throw new HttpError(400, "Insufficient balance for this bid");
        }

        createdBid = await BidRepository.create(
          {
            auction: auction._id,
            user: user._id,
            amount: payload.amount,
          },
          session
        );

        auction.currentPrice = payload.amount;
        auction.highestBidder = user._id;
        auction.highestBid = createdBid._id;
        auction.bidsCount += 1;
        auction.status = AuctionStatus.Active;

        const timeLeft = auction.endTime.getTime() - now.getTime();
        if (timeLeft <= auction.antiSnipeWindowMs) {
          auction.endTime = new Date(
            now.getTime() + auction.antiSnipeExtensionMs
          );
        }

        await auction.save({ session });

        await BalanceLedgerRepository.create(
          {
            user: user._id,
            auction: auction._id,
            change: 0,
            reason: "bid_hold",
            note: `Bid placed for ${payload.amount}`,
          },
          session
        );
      }, defaultTransactionOptions);

      return createdBid;
    } finally {
      await endSessionSafe(session);
      await lock.release().catch(() => {
        /* ignore lock release errors */
      });
    }
  }
}
