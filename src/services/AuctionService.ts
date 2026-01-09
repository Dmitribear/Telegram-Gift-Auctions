import {
  AuctionCollection,
  AuctionDocument,
  AuctionStatus,
} from "../models/Auction.model";

export interface CreateAuctionInput {
  title: string;
  description?: string;
  startingPrice: number;
  minBidStep: number;
  roundDurationSeconds: number;
  maxParticipantsPerRound: number;
}

class AuctionService {
  // Отдельный слой, чтобы менять бизнес-правила без переписывания контроллеров
  async createAuction(payload: CreateAuctionInput): Promise<AuctionDocument> {
    const auction = await AuctionCollection.create({
      ...payload,
      status: AuctionStatus.CREATED,
      currentRound: 0,
    });

    return auction;
  }
}

export const auctionService = new AuctionService();