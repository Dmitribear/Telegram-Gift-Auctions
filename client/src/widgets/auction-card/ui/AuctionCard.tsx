import { Link } from "react-router-dom";
import { Auction } from "../../../entities/auction";
import { StatusBadge } from "../../../shared/ui/status-badge";

type Props = {
  auction: Auction;
};

export function AuctionCard({ auction }: Props) {
  return (
    <div className="card" style={{ display: "grid", gap: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <h3 style={{ margin: 0 }}>{auction.title}</h3>
        <StatusBadge status={auction.status} />
      </div>
      <div style={{ fontSize: 14, color: "#475569" }}>
        {auction.description || "No description"}
      </div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", fontSize: 14 }}>
        <span>Start: {auction.startingPrice}</span>
        <span>Min step: {auction.minBidStep}</span>
        <span>Round: {auction.currentRound}</span>
      </div>
      <div>
        <Link className="btn secondary" to={`/auctions/${auction._id}`}>
          Open
        </Link>
      </div>
    </div>
  );
}
