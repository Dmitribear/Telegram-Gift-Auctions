import mongoose from "mongoose";
import {
  AuctionCollection,
  AuctionDocument,
  AuctionStatus,
} from "../models/Auction.model";
import { BidCollection, BidDocument } from "../models/Bid";
import { balanceService } from "./BalanceService";
import { UserCollection } from "../models/User";

export interface CreateAuctionInput {
  title: string;
  description?: string;
  startingPrice: number;
  minBidStep: number;
  roundDurationSeconds: number;
  maxParticipantsPerRound: number;
  antiSnipeWindowSeconds?: number;
  antiSnipeExtendSeconds?: number;
  botMaxBidAmount?: number;
}

class AuctionService {
  // Отдельный слой, чтобы менять бизнес-правила без переписывания контроллеров
  async createAuction(payload: CreateAuctionInput): Promise<AuctionDocument> {
    const auction = await AuctionCollection.create({
      ...payload,
      status: AuctionStatus.CREATED,
      currentRound: 0,
      endsAt: new Date(Date.now() + payload.roundDurationSeconds * 1000),
      antiSnipeWindowSeconds: payload.antiSnipeWindowSeconds ?? 10,
      antiSnipeExtendSeconds: payload.antiSnipeExtendSeconds ?? 10,
      botMaxBidAmount: payload.botMaxBidAmount,
    });

    return auction;
  }

  async listAuctions(): Promise<AuctionDocument[]> {
    return AuctionCollection.find().sort({ createdAt: -1 }).exec();
  }

  async getAuctionWithBids(
    id: string
  ): Promise<{ auction: AuctionDocument; bids: BidDocument[] } | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }

    const auction = await AuctionCollection.findById(id).exec();
    if (!auction) return null;

    const bids = await BidCollection.find({ auctionId: auction._id })
      .sort({ createdAt: -1 })
      .exec();

    return { auction, bids };
  }

  async placeBid(
    auctionId: string,
    amount: number,
    user = "demo-user"
  ): Promise<BidDocument> {
    if (!mongoose.Types.ObjectId.isValid(auctionId)) {
      throw new Error("INVALID_ID");
    }

    const auction = await AuctionCollection.findById(auctionId).exec();
    if (!auction) {
      throw new Error("AUCTION_NOT_FOUND");
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error("INVALID_AMOUNT");
    }

    const lastBid = await BidCollection.findOne({ auctionId })
      .sort({ createdAt: -1 })
      .exec();

    const minAllowed =
      (lastBid?.amount ?? auction.startingPrice) + auction.minBidStep;

    if (amount < minAllowed) {
      throw new Error(`BID_TOO_LOW`);
    }

    // Payment checks
    const bidder = await balanceService.ensureUser(user);
    // Боты сами пополняют и создают способ оплаты
    if (user.startsWith("bot-")) {
      if (!bidder.paymentMethod) {
        bidder.paymentMethod = { type: "card", masked: "bot", provider: "bot" } as any;
        await bidder.save();
      }
      const availableBot = bidder.balance - bidder.heldBalance;
      if (availableBot < amount) {
        await balanceService.deposit(user, amount * 10); // с запасом
      }
    } else {
      if (!bidder.paymentMethod) {
        throw new Error("PAYMENT_METHOD_REQUIRED");
      }
      const available = bidder.balance - bidder.heldBalance;
      if (available < amount) {
        throw new Error("INSUFFICIENT_FUNDS");
      }
    }

    // Release previous hold:
    // - if текущий лидер тот же пользователь — освободим его прошлую ставку
    // - если лидер другой — освободим его hold
    if (lastBid) {
      if (lastBid.user === bidder.username) {
        await balanceService.releaseHold(bidder, auctionId, lastBid.amount);
      } else {
        const prevLeader = await UserCollection.findOne({
          username: lastBid.user,
        }).exec();
        if (prevLeader) {
          await balanceService.releaseHold(prevLeader, auctionId, lastBid.amount);
        }
      }
    }

    // Hold bidder funds
    await balanceService.hold(bidder, auctionId, amount);

    const round = auction.currentRound + 1;

    const bid = await BidCollection.create({
      auctionId: auction._id,
      amount,
      user,
      round,
    });

    // Anti-snipe: extend timer if near end
    const now = Date.now();
    if (!auction.endsAt) {
      auction.endsAt = new Date(now + auction.roundDurationSeconds * 1000);
    }
    const msToEnd = auction.endsAt.getTime() - now;
    if (msToEnd <= (auction.antiSnipeWindowSeconds ?? 0) * 1000) {
      auction.endsAt = new Date(
        auction.endsAt.getTime() +
          (auction.antiSnipeExtendSeconds ?? 0) * 1000
      );
    }

    if (auction.status === AuctionStatus.CREATED) {
      auction.status = AuctionStatus.RUNNING;
    }
    auction.currentRound = round;
    await auction.save();

    return bid;
  }

  async finalizeAuction(auctionId: string): Promise<AuctionDocument> {
    if (!mongoose.Types.ObjectId.isValid(auctionId)) {
      throw new Error("INVALID_ID");
    }
    const auction = await AuctionCollection.findById(auctionId).exec();
    if (!auction) {
      throw new Error("AUCTION_NOT_FOUND");
    }
    if (auction.status === AuctionStatus.FINISHED) {
      return auction;
    }

    const lastBid = await BidCollection.findOne({ auctionId })
      .sort({ createdAt: -1 })
      .exec();

    if (!lastBid) {
      auction.status = AuctionStatus.FINISHED;
      auction.finishedAt = new Date();
      await auction.save();
      return auction;
    }

    const winnerUser = await balanceService.ensureUser(lastBid.user);
    await balanceService.charge(winnerUser, auctionId, lastBid.amount);
    await balanceService.awardPrize(winnerUser, auctionId, lastBid.amount);

    auction.status = AuctionStatus.FINISHED;
    auction.winnerUser = lastBid.user;
    auction.winningBid = lastBid.amount;
    auction.finishedAt = new Date();
    await auction.save();

    return auction;
  }
}

export const auctionService = new AuctionService();