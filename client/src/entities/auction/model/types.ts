export type AuctionStatus = "CREATED" | "RUNNING" | "FINISHED";

export interface Auction {
  _id: string;
  title: string;
  description?: string;
  status: AuctionStatus;
  startingPrice: number;
  minBidStep: number;
  roundDurationSeconds: number;
  maxParticipantsPerRound: number;
  currentRound: number;
  endsAt?: string;
  antiSnipeWindowSeconds?: number;
  antiSnipeExtendSeconds?: number;
  botMaxBidAmount?: number;
  totalRounds?: number;
  prizesCount?: number;
  winners?: { user: string; amount: number }[];
  createdAt: string;
  updatedAt: string;
}

export interface Bid {
  _id: string;
  auctionId: string;
  user: string;
  amount: number;
  round: number;
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
  startingPrice: number;
  minBidStep: number;
  roundDurationSeconds: number;
  maxParticipantsPerRound: number;
}
