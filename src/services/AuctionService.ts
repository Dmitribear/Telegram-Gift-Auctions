import mongoose from "mongoose";
import {
  AuctionCollection,
  AuctionDocument,
  AuctionStatus,
} from "../models/Auction.model";
import { BidCollection, BidDocument } from "../models/Bid";
import { balanceService } from "./BalanceService";
import { walletService } from "./WalletService";
import { UserCollection } from "../models/User";

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

    return auction;
  }

  async listAuctions(status?: AuctionStatus): Promise<AuctionDocument[]> {
    const filter = status ? { status } : {};
    return AuctionCollection.find(filter).sort({ createdAt: -1 }).limit(200).exec();
  }

  async getAuctionWithBids(
    id: string
  ): Promise<{ auction: AuctionDocument; bids: BidDocument[] } | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }

    const auction = await AuctionCollection.findById(id).exec();
    if (!auction) return null;

    // автофинализация если время вышло
    if (auction.status !== AuctionStatus.Ended && auction.endTime.getTime() <= Date.now()) {
      await this.finalizeAuction(id, true);
      const updated = await AuctionCollection.findById(id).exec();
      if (updated) return { auction: updated, bids: [] };
    }

    const bids = await BidCollection.find({ auction: auction._id })
      .sort({ createdAt: -1 })
      .exec();

    return { auction, bids };
  }

  async placeBid(
    auctionId: string,
    amount: number,
    username = "demo-user"
  ): Promise<BidDocument> {
    if (!mongoose.Types.ObjectId.isValid(auctionId)) {
      throw new Error("INVALID_ID");
    }

    const auction = await AuctionCollection.findById(auctionId).exec();
    if (!auction) throw new Error("AUCTION_NOT_FOUND");
    if (auction.status === AuctionStatus.Ended) throw new Error("AUCTION_ENDED");

    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error("INVALID_AMOUNT");
    }

    // ensure user
    const bidder = await balanceService.ensureUser(username);

    const lastBid = await BidCollection.findOne({ auction: auction._id })
      .sort({ createdAt: -1 })
      .exec();

    const minAllowed = (lastBid?.amount ?? auction.startPrice) + auction.bidStep;
    if (amount < minAllowed) throw new Error("BID_TOO_LOW");

    // анти-снайп: если время почти вышло — продлеваем
    const now = Date.now();
    const msToEnd = auction.endTime.getTime() - now;
    if (msToEnd <= (auction.antiSnipeWindowMs ?? 0)) {
      auction.endTime = new Date(auction.endTime.getTime() + (auction.antiSnipeExtensionMs ?? 0));
    }

    // Payment checks (используем lockedBalance)
    const available = bidder.balance;
    if (available < amount) throw new Error("INSUFFICIENT_FUNDS");

    // освобождение предыдущего лидера
    if (lastBid) {
      const prevUser = await UserCollection.findById(lastBid.user).exec();
      if (prevUser) {
        await balanceService.releaseHold(prevUser, auctionId, lastBid.amount);
        await walletService.refundToWallet(
          prevUser.username,
          lastBid.amount,
          lastBid.user.equals(bidder._id) ? "outbid_self" : "outbid_by_other"
        );
      }
    }

    await balanceService.hold(bidder, auctionId, amount);

    auction.currentPrice = amount;
    auction.highestBidder = bidder._id;
    auction.bidsCount = (auction.bidsCount ?? 0) + 1;
    auction.status = AuctionStatus.Active;

    const bid = await BidCollection.create({
      auction: auction._id,
      amount,
      user: bidder._id,
    });

    await auction.save();
    return bid;
  }

  async finalizeAuction(auctionId: string, allowActive = false): Promise<AuctionDocument> {
    if (!mongoose.Types.ObjectId.isValid(auctionId)) {
      throw new Error("INVALID_ID");
    }
    const auction = await AuctionCollection.findById(auctionId).exec();
    if (!auction) throw new Error("AUCTION_NOT_FOUND");
    if (!allowActive && auction.endTime > new Date()) throw new Error("AUCTION_ACTIVE");
    if (auction.status === AuctionStatus.Ended) return auction;

    const bids = await BidCollection.find({ auction: auction._id })
      .sort({ amount: -1, createdAt: 1 })
      .limit(1)
      .exec();

    if (bids.length === 0) {
      auction.status = AuctionStatus.Ended;
      await auction.save();
      return auction;
    }

    const top = bids[0];
    const winnerUser = await UserCollection.findById(top.user).exec();
    if (!winnerUser) throw new Error("WINNER_NOT_FOUND");

    await balanceService.charge(winnerUser, auctionId, top.amount);
    await balanceService.awardPrize(winnerUser, auctionId, top.amount);

    auction.status = AuctionStatus.Ended;
    auction.winnerUserId = winnerUser._id;
    auction.winnerBidId = top._id;
    auction.currentPrice = top.amount;
    await auction.save();

    return auction;
  }
}

export const auctionService = new AuctionService();