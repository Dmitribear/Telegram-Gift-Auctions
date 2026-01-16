export type AuctionStatus = "scheduled" | "active" | "ended";

export interface Auction {
  _id: string;
  title: string;
  description?: string;
  status: AuctionStatus;
  startPrice: number;
  bidStep: number;
  currentPrice: number;
  startTime: string;
  endTime: string;
  antiSnipeWindowMs?: number;
  antiSnipeExtensionMs?: number;
  bidsCount?: number;
  highestBidder?: string;
  highestBid?: string;
  winnerUserId?: string;
  winnerBidId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Bid {
  _id: string;
  auction: string;
  user: string; // ObjectId as string
  amount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AuctionDetailsResponse {
  auction: Auction;
  bids: Bid[];
}

export interface CreateAuctionPayload {
  title: string;
  description?: string;
  startPrice: number;
  bidStep: number;
  baseDurationMinutes: number;
  startTime?: string;
  antiSnipeWindowMinutes?: number;
  antiSnipeExtensionMinutes?: number;
}
