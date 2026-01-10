import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Auction, auctionApi } from "../entities/auction";
import { AuctionCard } from "../widgets/auction-card";
import { Loader } from "../shared/ui/loader";
import { ErrorBox } from "../shared/ui/error-box";

export default function HomePage() {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    auctionApi
      .getAll()
      .then((data) => {
        if (!mounted) return;
        setAuctions(data);
        setError(null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <h2 style={{ margin: 0 }}>Auctions</h2>
        <Link className="btn secondary" to="/create">
          Create Auction
        </Link>
      </div>

      {loading && <Loader />}
      {error && <ErrorBox message={error} />}

      {!loading && auctions.length === 0 && (
        <div className="card">No auctions yet. Create the first one.</div>
      )}

      <div className="list">
        {auctions.map((auction) => (
          <AuctionCard key={auction._id} auction={auction} />
        ))}
      </div>
    </div>
  );
}
