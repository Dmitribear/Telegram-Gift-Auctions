import { useEffect, useState } from "react";
import {
  adminApi,
  BotApiKey,
  BotConfig,
  Transaction,
} from "../entities/admin/api/adminApi";
import { ErrorBox } from "../shared/ui/error-box";
import { Loader } from "../shared/ui/loader";

const initialConfig: BotConfig = {
  enabled: false,
  bots: 0,
  minDelayMs: 2000,
  maxDelayMs: 6000,
  antiSnipeWindowSeconds: 5,
  antiSnipeExtendSeconds: 5,
};

export default function AdminBotsPage() {
  const [token, setToken] = useState("");
  const [config, setConfig] = useState<BotConfig>(initialConfig);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [keys, setKeys] = useState<BotApiKey[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [keyName, setKeyName] = useState("bot-key");

  const loadConfig = async () => {
    if (!token) {
      setError("Введите admin token");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await adminApi.getBots(token);
      setConfig(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // no auto load without token
  }, []);

  const loadKeys = async () => {
    if (!token) return;
    try {
      const ks = await adminApi.listKeys(token);
      setKeys(ks);
    } catch (err) {
      console.error(err);
    }
  };

  const loadTx = async () => {
    if (!token) return;
    try {
      const tx = await adminApi.listTransactions(token, { limit: 50 });
      setTransactions(tx);
    } catch (err) {
      console.error(err);
    }
  };

  const createKey = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await adminApi.createKey(token, keyName || "bot-key");
      setSuccess("API key created");
      await loadKeys();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const revokeKey = async (id: string) => {
    if (!token) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await adminApi.revokeKey(token, id);
      setSuccess("API key revoked");
      await loadKeys();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError("Введите admin token");
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const data = await adminApi.updateBots(token, config);
      setConfig(data);
      setSuccess("Обновлено");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const sanitizeNumber = (val: string) => {
    const cleaned = val.replace(/[^\d]/g, "").replace(/^0+(?=\d)/, "");
    return cleaned === "" ? "0" : cleaned;
  };

  return (
    <div className="card" style={{ display: "grid", gap: 16 }}>
      <h2 style={{ margin: 0 }}>Admin: Bot control</h2>

      <div style={{ display: "grid", gap: 8 }}>
        <label htmlFor="token">Admin token (x-admin-token)</label>
        <input
          id="token"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="admin"
        />
        <button className="btn secondary" onClick={loadConfig}>
          Load config
        </button>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
        <label htmlFor="enabled" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input
            id="enabled"
            type="checkbox"
            checked={config.enabled}
            onChange={(e) => setConfig((c) => ({ ...c, enabled: e.target.checked }))}
          />
          Enable bots
        </label>

        <div className="row">
          <div style={{ flex: 1, minWidth: 140, display: "grid", gap: 6 }}>
            <label htmlFor="bots">Bots count</label>
            <input
              id="bots"
              type="number"
              min={0}
              value={config.bots}
              onChange={(e) =>
                setConfig((c) => ({ ...c, bots: Number(sanitizeNumber(e.target.value)) }))
              }
            />
          </div>
          <div style={{ flex: 1, minWidth: 140, display: "grid", gap: 6 }}>
            <label htmlFor="minDelayMs">Min delay, ms</label>
            <input
              id="minDelayMs"
              type="number"
              min={500}
              value={config.minDelayMs}
              onChange={(e) =>
                setConfig((c) => ({ ...c, minDelayMs: Number(sanitizeNumber(e.target.value)) }))
              }
            />
          </div>
          <div style={{ flex: 1, minWidth: 140, display: "grid", gap: 6 }}>
            <label htmlFor="maxDelayMs">Max delay, ms</label>
            <input
              id="maxDelayMs"
              type="number"
              min={config.minDelayMs}
              value={config.maxDelayMs}
              onChange={(e) =>
                setConfig((c) => ({ ...c, maxDelayMs: Number(sanitizeNumber(e.target.value)) }))
              }
            />
          </div>
        </div>

        <div className="row">
          <div style={{ flex: 1, minWidth: 140, display: "grid", gap: 6 }}>
            <label htmlFor="antiSnipeWindowSeconds">Anti-snipe window, s</label>
            <input
              id="antiSnipeWindowSeconds"
              type="number"
              min={0}
              value={config.antiSnipeWindowSeconds}
              onChange={(e) =>
                setConfig((c) => ({
                  ...c,
                  antiSnipeWindowSeconds: Number(sanitizeNumber(e.target.value)),
                }))
              }
            />
          </div>
          <div style={{ flex: 1, minWidth: 140, display: "grid", gap: 6 }}>
            <label htmlFor="antiSnipeExtendSeconds">Anti-snipe extend, s</label>
            <input
              id="antiSnipeExtendSeconds"
              type="number"
              min={0}
              value={config.antiSnipeExtendSeconds}
              onChange={(e) =>
                setConfig((c) => ({
                  ...c,
                  antiSnipeExtendSeconds: Number(sanitizeNumber(e.target.value)),
                }))
              }
            />
          </div>
        </div>

        <div className="row">
          <div style={{ flex: 1, minWidth: 140, display: "grid", gap: 6 }}>
            <label htmlFor="maxBidAmount">
              Max bid amount (bots stop above)
            </label>
            <input
              id="maxBidAmount"
              type="number"
              min={0}
              value={config.maxBidAmount ?? ""}
              placeholder="e.g. 500"
              onChange={(e) =>
                setConfig((c) => ({
                  ...c,
                  maxBidAmount:
                    e.target.value === ""
                      ? undefined
                      : Number(sanitizeNumber(e.target.value)),
                }))
              }
            />
          </div>
        </div>

        {loading && <Loader />}
        {error && <ErrorBox message={error} />}
        {success && <div className="success">{success}</div>}

        <div style={{ display: "flex", gap: 12 }}>
          <button className="btn" type="submit" disabled={loading}>
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </form>

      <div className="card" style={{ display: "grid", gap: 10 }}>
        <h4 style={{ margin: 0 }}>Bot API keys</h4>
        <div className="row">
          <div style={{ flex: 1, minWidth: 140, display: "grid", gap: 6 }}>
            <label htmlFor="keyName">Name</label>
            <input
              id="keyName"
              value={keyName}
              onChange={(e) => setKeyName(e.target.value)}
              placeholder="bot-key"
            />
          </div>
          <div style={{ display: "flex", alignItems: "flex-end" }}>
            <button className="btn secondary" type="button" onClick={createKey} disabled={loading}>
              Create key
            </button>
            <button
              className="btn secondary"
              type="button"
              style={{ marginLeft: 8 }}
              onClick={loadKeys}
              disabled={loading}
            >
              Refresh keys
            </button>
          </div>
        </div>
        <div className="list">
          {keys.map((k) => (
            <div
              key={k._id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8,
                border: "1px solid #e2e8f0",
                borderRadius: 8,
                padding: "8px 12px",
              }}
            >
              <div style={{ display: "grid" }}>
                <strong>{k.name}</strong>
                <span style={{ fontSize: 12, color: "#475569" }}>
                  {k.apiKey.slice(0, 8)}…{k.apiKey.slice(-4)}
                </span>
                <span style={{ fontSize: 12, color: k.active ? "#15803d" : "#b91c1c" }}>
                  {k.active ? "active" : "revoked"}
                </span>
              </div>
              {k.active && (
                <button className="btn secondary" type="button" onClick={() => revokeKey(k._id)}>
                  Revoke
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ display: "grid", gap: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h4 style={{ margin: 0 }}>Transactions (last 50)</h4>
          <button className="btn secondary" type="button" onClick={loadTx} disabled={loading}>
            Refresh
          </button>
        </div>
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
    </div>
  );
}
