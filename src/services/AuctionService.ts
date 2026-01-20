import mongoose from "mongoose";
import {
  AuctionCollection,
  AuctionDocument,
  AuctionStatus,
} from "../models/Auction.model";
import { BidCollection, BidDocument } from "../models/Bid";
import { balanceService } from "./BalanceService";
import { UserCollection } from "../models/User";
import { withLock } from "../utils/locks";
import { defaultTransactionOptions, endSessionSafe } from "../utils/transactions";
import { notificationService } from "./NotificationService";
import {
  activeAuctionsGauge,
  auctionsFinalizedCounter,
  bidsPlacedCounter,
} from "../config/metrics";
import { logger } from "../utils/logger";

export interface CreateAuctionInput {
  title: string;
  description?: string;
  startPrice: number;
  bidStep: number;
  baseDurationMinutes: number;
  startTime?: string | Date;
  antiSnipeWindowMinutes?: number;
  antiSnipeExtensionMinutes?: number;
}

class AuctionService {
  private async updateActiveGauge() {
    const active = await AuctionCollection.countDocuments({
      status: { $ne: AuctionStatus.Ended },
    });
    activeAuctionsGauge.set(active);
  }

  async createAuction(payload: CreateAuctionInput): Promise<AuctionDocument> {
    const startTime = payload.startTime ? new Date(payload.startTime) : new Date();
    const baseMs = (payload.baseDurationMinutes ?? 0) * 60 * 1000;
    if (!Number.isFinite(baseMs) || baseMs <= 0) {
      throw new Error("INVALID_DURATION");
    }
    const endTime = new Date(startTime.getTime() + baseMs);
    const status =
      startTime.getTime() > Date.now() ? AuctionStatus.Scheduled : AuctionStatus.Active;

    const auction = await AuctionCollection.create({
      title: payload.title,
      description: payload.description,
      startPrice: payload.startPrice,
      bidStep: payload.bidStep,
      currentPrice: payload.startPrice,
      startTime,
      endTime,
      antiSnipeWindowMs: (payload.antiSnipeWindowMinutes ?? 10) * 60 * 1000,
      antiSnipeExtensionMs: (payload.antiSnipeExtensionMinutes ?? 5) * 60 * 1000,
      status,
    });

    await this.updateActiveGauge();
    return auction;
  }

  async listAuctions(status?: AuctionStatus): Promise<AuctionDocument[]> {
    const filter = status ? { status } : {};
    const list = await AuctionCollection.find(filter).sort({ createdAt: -1 }).limit(200).exec();
    await this.updateActiveGauge();
    return list;
  }

  async getAuctionWithBids(
    id: string
  ): Promise<{ auction: AuctionDocument; bids: BidDocument[] } | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }

    const auction = await AuctionCollection.findById(id).exec();
    if (!auction) return null;

    if (auction.status !== AuctionStatus.Ended && auction.endTime.getTime() <= Date.now()) {
      await this.finalizeAuction(id, true);
      const updated = await AuctionCollection.findById(id).exec();
      if (updated) {
        const bids = await BidCollection.find({ auction: updated._id })
          .sort({ createdAt: -1 })
          .exec();
        return { auction: updated, bids };
      }
    }

    const bids = await BidCollection.find({ auction: auction._id })
      .sort({ createdAt: -1 })
      .exec();

    return { auction, bids };
  }

  async placeBid(
    auctionId: string,
    amount: number,
    username: string
  ): Promise<BidDocument> {
    if (!mongoose.Types.ObjectId.isValid(auctionId)) {
      throw new Error("INVALID_ID");
    }

    return withLock(`auction:${auctionId}`, 7000, async () => {
      const session = await mongoose.startSession();
      session.startTransaction(defaultTransactionOptions);
      try {
        const auction = await AuctionCollection.findById(auctionId).session(session).exec();
        if (!auction) throw new Error("AUCTION_NOT_FOUND");
        if (auction.status === AuctionStatus.Ended) throw new Error("AUCTION_ENDED");
        if (auction.startTime > new Date()) throw new Error("AUCTION_NOT_STARTED");
        if (auction.endTime <= new Date()) throw new Error("AUCTION_ENDED");

        if (!Number.isFinite(amount) || amount <= 0) {
          throw new Error("INVALID_AMOUNT");
        }

        const bidder = await balanceService.ensureUser(username, session);
        if (!bidder.paymentMethod) throw new Error("PAYMENT_METHOD_REQUIRED");

        const lastBid = await BidCollection.findOne({ auction: auction._id })
          .sort({ createdAt: -1 })
          .session(session)
          .exec();

        const minAllowed = (lastBid?.amount ?? auction.startPrice) + auction.bidStep;
        if (amount < minAllowed) throw new Error("BID_TOO_LOW");

        const now = Date.now();
        const msToEnd = auction.endTime.getTime() - now;
        let extended = false;
        if (msToEnd <= (auction.antiSnipeWindowMs ?? 0)) {
          auction.endTime = new Date(
            auction.endTime.getTime() + (auction.antiSnipeExtensionMs ?? 0)
          );
          extended = true;
        }

        if (lastBid) {
          const prevUser = await UserCollection.findById(lastBid.user)
            .session(session)
            .exec();
          if (prevUser) {
            await balanceService.releaseHold(prevUser, auctionId, lastBid.amount, session);
          }
        }

        await balanceService.hold(bidder, auctionId, amount, session);

        auction.currentPrice = amount;
        auction.highestBidder = bidder._id;
        auction.bidsCount = (auction.bidsCount ?? 0) + 1;
        auction.status = AuctionStatus.Active;

        const [bid] = await BidCollection.create(
          [{ auction: auction._id, amount, user: bidder._id }],
          { session }
        );
        auction.highestBid = bid._id;

        await auction.save({ session });
        await session.commitTransaction();
        bidsPlacedCounter.inc();

        if (extended) {
          await notificationService.notifyAuctionExtended(
            auction._id.toString(),
            auction.endTime,
            username
          );
        }
        await notificationService.notifyBidPlaced(auction._id.toString(), bid, username);
        await this.updateActiveGauge();
        return bid;
      } catch (error) {
        await session.abortTransaction().catch(() => undefined);
        throw error;
      } finally {
        await endSessionSafe(session);
      }
    });
  }

  async finalizeAuction(auctionId: string, allowActive = false): Promise<AuctionDocument> {
    if (!mongoose.Types.ObjectId.isValid(auctionId)) {
      throw new Error("INVALID_ID");
    }

    return withLock(`auction:${auctionId}:finalize`, 7000, async () => {
      const session = await mongoose.startSession();
      session.startTransaction(defaultTransactionOptions);
      try {
        const auction = await AuctionCollection.findById(auctionId).session(session).exec();
        if (!auction) throw new Error("AUCTION_NOT_FOUND");
        if (!allowActive && auction.endTime > new Date()) throw new Error("AUCTION_ACTIVE");
        if (auction.status === AuctionStatus.Ended) return auction;

        const bids = await BidCollection.find({ auction: auction._id })
          .sort({ amount: -1, createdAt: 1 })
          .limit(1)
          .session(session)
          .exec();

        if (bids.length === 0) {
          auction.status = AuctionStatus.Ended;
          await auction.save({ session });
          await session.commitTransaction();
          auctionsFinalizedCounter.inc();
          await this.updateActiveGauge();
          return auction;
        }

        const top = bids[0];
        const winnerUser = await UserCollection.findById(top.user).session(session).exec();
        if (!winnerUser) throw new Error("WINNER_NOT_FOUND");

        await balanceService.charge(winnerUser, auctionId, top.amount, session);
        await balanceService.awardPrize(winnerUser, auctionId, top.amount, session);

        auction.status = AuctionStatus.Ended;
        auction.winnerUserId = winnerUser._id;
        auction.winnerBidId = top._id;
        auction.currentPrice = top.amount;
        await auction.save({ session });
        await session.commitTransaction();
        auctionsFinalizedCounter.inc();
        await notificationService.notifyAuctionFinalized(
          auction,
          winnerUser.username,
          top.amount
        );
        await this.updateActiveGauge();
        return auction;
      } catch (error) {
        await session.abortTransaction().catch(() => undefined);
        throw error;
      } finally {
        await endSessionSafe(session);
      }
    });
  }
}

export const auctionService = new AuctionService();
