import { useEffect, useState } from "react";
import { adminApi, Transaction } from "../entities/admin/api/adminApi";
import { ErrorBox } from "../shared/ui/error-box";
import { Loader } from "../shared/ui/loader";

export default function TransactionsPage() {
  const [token, setToken] = useState("");
  const [userFilter, setUserFilter] = useState("");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const tx = await adminApi.listTransactions(token, {
        user: userFilter || undefined,
        limit: 100,
      });
      setTransactions(tx);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // no auto load
  }, []);

  return (
    <div className="card" style={{ display: "grid", gap: 12 }}>
      <h2 style={{ margin: 0 }}>Transactions</h2>

      <div className="row">
        <div style={{ flex: 1, minWidth: 180, display: "grid", gap: 6 }}>
          <label htmlFor="token">Admin token (x-admin-token)</label>
          <input
            id="token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="admin"
          />
        </div>
        <div style={{ flex: 1, minWidth: 180, display: "grid", gap: 6 }}>
          <label htmlFor="userFilter">User filter</label>
          <input
            id="userFilter"
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
            placeholder="username"
          />
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
          <button className="btn secondary" type="button" onClick={load}>
            Load
          </button>
        </div>
      </div>

      {loading && <Loader />}
      {error && <ErrorBox message={error} />}

      <div className="list">
        {transactions.map((t) => (
          <div
            key={t._id}
            style={{
              display: "grid",
              gap: 4,
              border: "1px solid #e2e8f0",
              borderRadius: 8,
              padding: "8px 12px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <strong>{t.type}</strong>
              <span style={{ fontSize: 12, color: "#475569" }}>
                {new Date(t.createdAt).toLocaleString()}
              </span>
            </div>
            <div style={{ fontSize: 14 }}>
              {t.amount} {t.currency} · user: {t.user}
            </div>
            {t.auctionId && (
              <div style={{ fontSize: 12, color: "#475569" }}>auction: {t.auctionId}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
