import { useEffect, useState } from "react";
import { adminApi, BotConfig } from "../entities/admin/api/adminApi";
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
                setConfig((c) => ({ ...c, bots: Number(e.target.value) }))
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
                setConfig((c) => ({ ...c, minDelayMs: Number(e.target.value) }))
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
                setConfig((c) => ({ ...c, maxDelayMs: Number(e.target.value) }))
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
                  antiSnipeWindowSeconds: Number(e.target.value),
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
                  antiSnipeExtendSeconds: Number(e.target.value),
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
                    e.target.value === "" ? undefined : Number(e.target.value),
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
    </div>
  );
}
