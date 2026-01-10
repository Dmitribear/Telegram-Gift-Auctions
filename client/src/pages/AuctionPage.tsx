import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Auction,
  AuctionDetailsResponse,
  AuctionStatus,
  Bid,
  auctionApi,
} from "../entities/auction";
import { Loader } from "../shared/ui/loader";
import { ErrorBox } from "../shared/ui/error-box";
import { StatusBadge } from "../shared/ui/status-badge";

type State = {
  data: AuctionDetailsResponse | null;
  loading: boolean;
  error: string | null;
};

const POLL_MS = 4000;

export default function AuctionPage() {
  const { id } = useParams<{ id: string }>();
  const [state, setState] = useState<State>({
    data: null,
    loading: true,
    error: null,
  });
  const [bidAmount, setBidAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  const fetchData = async (silent = false) => {
    if (!id) return;
    if (!silent) setState((prev) => ({ ...prev, loading: true }));
    try {
      const data = await auctionApi.getById(id);
      setState({ data, loading: false, error: null });
      updateCountdown(data.auction);
    } catch (err) {
      setState({
        data: null,
        loading: false,
        error: (err as Error).message,
      });
    }
  };

  const updateCountdown = (auction: Auction) => {
    if (auction.endsAt) {
      const ms = new Date(auction.endsAt).getTime() - Date.now();
      setCountdown(Math.max(0, Math.round(ms / 1000)));
    } else if (auction.createdAt && auction.roundDurationSeconds) {
      const endMs =
        new Date(auction.createdAt).getTime() +
        auction.roundDurationSeconds * 1000;
      const ms = endMs - Date.now();
      setCountdown(Math.max(0, Math.round(ms / 1000)));
    }
  };

  const [username, setUsername] = useState("demo-user");

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(true), POLL_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (!state.data?.auction) return;
    updateCountdown(state.data.auction);
    const interval = setInterval(() => {
      if (state.data?.auction) {
        updateCountdown(state.data.auction);
      }
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.data?.auction?.endsAt]);

  const lastBid = useMemo(() => {
    return state.data?.bids?.[0];
  }, [state.data]);

  const minNextBid = useMemo(() => {
    if (!state.data) return 0;
    const base =
      lastBid?.amount ?? state.data.auction.startingPrice;
    return base + state.data.auction.minBidStep;
  }, [lastBid, state.data]);

  const handleBidSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    const normalized = bidAmount.replace(",", ".");
    const amount = Number(normalized);
    if (!Number.isFinite(amount)) {
      setState((prev) => ({ ...prev, error: "Amount must be a number" }));
      return;
    }

    setSubmitting(true);
    setState((prev) => ({ ...prev, error: null }));
    try {
      await auctionApi.placeBid(id, amount, username);
      setBidAmount("");
      await fetchData(true);
    } catch (err) {
      const message = (err as Error).message;
      const friendly =
        message.includes("Insufficient funds") || message.includes("INSUFFICIENT")
          ? "Недостаточно средств: пополните баланс или уменьшите ставку"
          : message;
      setState((prev) => ({
        ...prev,
        error: friendly,
      }));
    } finally {
      setSubmitting(false);
    }
  };

  const auction: Auction | undefined = state.data?.auction;
  const bids: Bid[] = state.data?.bids ?? [];

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {state.loading && <Loader />}
      {state.error && <ErrorBox message={state.error} />}

      {auction && (
        <div className="card" style={{ display: "grid", gap: 10 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <h2 style={{ margin: 0 }}>{auction.title}</h2>
            <StatusBadge status={auction.status as AuctionStatus} />
          </div>
          <div style={{ color: "#475569", fontSize: 14 }}>
            {auction.description || "No description"}
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <span>Round: {auction.currentRound}</span>
            <span>Min step: {auction.minBidStep}</span>
            <span>Round duration: {auction.roundDurationSeconds}s</span>
            {auction.endsAt && (
              <span>
                Ends at: {new Date(auction.endsAt).toLocaleTimeString()}
              </span>
            )}
            {countdown !== null && (
              <span>Timer: {Math.max(0, countdown)}s</span>
            )}
            {auction.antiSnipeWindowSeconds !== undefined && (
              <span>
                Anti-snipe: +{auction.antiSnipeExtendSeconds ?? 0}s if bid in last{" "}
                {auction.antiSnipeWindowSeconds}s
              </span>
            )}
          </div>

          <form
            onSubmit={handleBidSubmit}
            style={{ display: "grid", gap: 10 }}
          >
            <label htmlFor="amount">Place bid</label>
            <input
              id="amount"
              name="amount"
              type="number"
              step="0.01"
              value={bidAmount}
              placeholder={`>= ${minNextBid.toFixed(2)}`}
              onChange={(e) => setBidAmount(e.target.value)}
              disabled={submitting}
            />
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <button className="btn" type="submit" disabled={submitting}>
                {submitting ? "Placing..." : "Place Bid"}
              </button>
              <span style={{ fontSize: 13, color: "#475569" }}>
                Min next bid: {minNextBid.toFixed(2)}
              </span>
            </div>
          </form>
        </div>
      )}

      {bids.length > 0 ? (
        <div className="card" style={{ display: "grid", gap: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <h3 style={{ margin: 0 }}>Bids</h3>
            <span style={{ fontSize: 13, color: "#475569" }}>
              {bids.length} total
            </span>
          </div>
          <div className="list">
            {bids.map((bid) => (
              <div
                key={bid._id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 8,
                  border: "1px solid #e2e8f0",
                  borderRadius: 10,
                  padding: "8px 12px",
                }}
              >
                <div style={{ display: "grid" }}>
                  <strong>{bid.user}</strong>
                  <span style={{ fontSize: 12, color: "#475569" }}>
                    {new Date(bid.createdAt).toLocaleString()}
                  </span>
                </div>
                <div style={{ fontWeight: 700 }}>{bid.amount}</div>
                <div style={{ fontSize: 12, color: "#475569" }}>
                  Round {bid.round}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        auction && (
          <div className="card">No bids yet. Be the first to bid.</div>
        )
      )}
    </div>
  );
}
