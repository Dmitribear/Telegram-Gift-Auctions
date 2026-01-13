import { useEffect, useMemo, useState } from "react";
import { walletApi, Wallet } from "../entities/wallet/api/walletApi";
import { userApi } from "../entities/user/api/userApi";
import { Loader } from "../shared/ui/loader";
import { ErrorBox } from "../shared/ui/error-box";

export default function WalletPage() {
  const [user, setUser] = useState("demo-user");
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [amount, setAmount] = useState("100");
  const [sendTo, setSendTo] = useState("ton-destination");
  const [bridgeAmount, setBridgeAmount] = useState("50");
  const [siteBalance, setSiteBalance] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const txSorted = useMemo(
    () => [...(wallet?.tx ?? [])].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)),
    [wallet?.tx]
  );

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const w = await walletApi.get(user);
      setWallet(w);
      const u = await userApi.me(user);
      setSiteBalance(u.balance);
    } catch (err) {
      setError((err as Error).message || "Ошибка при загрузке кошелька");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const faucet = async () => {
    setLoading(true);
    setError(null);
    try {
      const w = await walletApi.faucet(user, Number(amount) || 100);
      setWallet(w);
    } catch (err) {
      setError((err as Error).message || "Ошибка крана/отправки");
    } finally {
      setLoading(false);
    }
  };

  const send = async () => {
    setLoading(true);
    setError(null);
    try {
      const val = Number(amount) || 0;
      // Если не хватает в кошельке — докидываем краном перед отправкой
      if ((wallet?.balanceTon ?? 0) < val && val > 0) {
        await walletApi.faucet(user, val);
      }
      const w = await walletApi.send(user, val, sendTo);
      setWallet(w);
    } catch (err) {
      const msg = (err as Error).message;
      if (msg.includes("INSUFFICIENT_WALLET_FUNDS")) {
        setError("Недостаточно TON в кошельке — нажми кран и пробуй снова.");
      } else {
        setError(msg || "Ошибка отправки");
      }
    } finally {
      setLoading(false);
    }
  };

  const bridgeToSite = async () => {
    setLoading(true);
    setError(null);
    const value = Number(bridgeAmount) || 0;
    try {
      // если не хватает средств — автоматом докидываем из крана, чтобы UX был гладким
      if ((wallet?.balanceTon ?? 0) < value && value > 0) {
        await walletApi.faucet(user, value);
      }
      const w = await walletApi.bridgeToSite(user, value);
      setWallet(w);
      const u = await userApi.me(user);
      setSiteBalance(u.balance);
    } catch (err) {
      const msg = (err as Error).message;
      if (msg.includes("INSUFFICIENT_WALLET_FUNDS")) {
        setError("Недостаточно TON в кошельке — сначала кран (TON) и потом bridge.");
      } else {
        setError(msg || "Ошибка bridge");
      }
    } finally {
      setLoading(false);
    }
  };

  const bridgeFromSite = async () => {
    setLoading(true);
    setError(null);
    try {
      const w = await walletApi.bridgeFromSite(user, Number(bridgeAmount) || 0);
      setWallet(w);
      const u = await userApi.me(user);
      setSiteBalance(u.balance);
    } catch (err) {
      setError((err as Error).message || "Ошибка bridge");
    } finally {
      setLoading(false);
    }
  };

  const copyAddress = async () => {
    if (!wallet) return;
    try {
      await navigator.clipboard.writeText(wallet.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <h2 style={{ margin: 0 }}>TON Wallet (симулятор)</h2>

      <div className="card" style={{ display: "grid", gap: 10 }}>
        <div className="row">
          <div style={{ flex: 1, minWidth: 180, display: "grid", gap: 6 }}>
            <label htmlFor="user">Пользователь</label>
            <input
              id="user"
              value={user}
              onChange={(e) => setUser(e.target.value)}
              placeholder="demo-user"
            />
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
            <button className="btn secondary" type="button" onClick={load} disabled={loading}>
              Обновить
            </button>
          </div>
        </div>

        {loading && <Loader />}
        {error && <ErrorBox message={error} />}

        {wallet && (
          <div
            style={{
              background: "linear-gradient(135deg, #0b1628, #0f2b4a)",
              color: "white",
              borderRadius: 18,
              padding: "16px",
              display: "grid",
              gap: 10,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 12,
                    background: "#1b4ed0",
                    display: "grid",
                    placeItems: "center",
                    fontWeight: 700,
                  }}
                >
                  TON
                </div>
                <div style={{ fontSize: 13, color: "#bfdbfe" }}>Основной баланс</div>
              </div>
              <div style={{ fontSize: 13, color: "#bfdbfe" }}>
                Адрес: {wallet.address.slice(0, 8)}…{wallet.address.slice(-6)}
              </div>
            </div>

            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 12, color: "#bfdbfe" }}>Баланс</div>
              <div style={{ fontSize: 36, fontWeight: 700 }}>{wallet.balanceTon.toFixed(2)} TON</div>
              {siteBalance !== null && (
                <div style={{ fontSize: 13, color: "#bfdbfe" }}>
                  На сайте: {siteBalance.toFixed(2)} TON (для ставок)
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                className="btn secondary"
                type="button"
                onClick={copyAddress}
                disabled={loading}
                style={{ background: "rgba(255,255,255,0.1)", color: "white", border: "1px solid #1e3a8a" }}
              >
                {copied ? "Скопировано" : "Скопировать адрес"}
              </button>
              <button
                className="btn secondary"
                type="button"
                onClick={bridgeToSite}
                disabled={loading}
                style={{ background: "rgba(255,255,255,0.1)", color: "white", border: "1px solid #1e3a8a" }}
              >
                Отправить в аукцион (bridge)
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="card" style={{ display: "grid", gap: 8 }}>
        <h4 style={{ margin: 0 }}>Кран / Отправка</h4>
        <div className="row">
          <div style={{ flex: 1, minWidth: 140, display: "grid", gap: 6 }}>
            <label htmlFor="amount">Сумма (TON)</label>
            <input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/^0+(?=\d)/, ""))}
            />
          </div>
          <div style={{ flex: 1, minWidth: 140, display: "grid", gap: 6 }}>
            <label htmlFor="sendTo">Отправить на адрес</label>
            <input
              id="sendTo"
              value={sendTo}
              onChange={(e) => setSendTo(e.target.value)}
            />
          </div>
        </div>
        <div className="row">
          <button className="btn secondary" type="button" onClick={faucet} disabled={loading}>
            Кран
          </button>
          <button className="btn secondary" type="button" onClick={send} disabled={loading}>
            Отправить TON
          </button>
        </div>
      </div>

      <div className="card" style={{ display: "grid", gap: 8 }}>
        <h4 style={{ margin: 0 }}>Мост в аукцион</h4>
        <div className="row">
          <div style={{ flex: 1, minWidth: 140, display: "grid", gap: 6 }}>
            <label htmlFor="bridgeAmount">Сумма (TON)</label>
            <input
              id="bridgeAmount"
              type="number"
              value={bridgeAmount}
              onChange={(e) => setBridgeAmount(e.target.value.replace(/^0+(?=\d)/, ""))}
            />
          </div>
        </div>
        <div className="row">
          <button className="btn secondary" type="button" onClick={bridgeToSite} disabled={loading}>
            На баланс сайта
          </button>
          <button className="btn secondary" type="button" onClick={bridgeFromSite} disabled={loading}>
            С баланса сайта
          </button>
        </div>
      </div>

      {txSorted.length > 0 && (
        <div className="card" style={{ display: "grid", gap: 8 }}>
          <h4 style={{ margin: 0 }}>История кошелька</h4>
          <div className="list">
            {txSorted.map((t, idx) => (
              <div
                key={`${t.hash}-${idx}`}
                style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: 8,
                  padding: "10px 12px",
                  display: "grid",
                  gap: 4,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <strong>{t.type}</strong>
                  <span style={{ fontSize: 12, color: "#475569" }}>
                    {new Date(t.createdAt).toLocaleString()}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                  <span>{t.amount} TON</span>
                  {t.to && <span style={{ color: "#475569" }}>→ {t.to}</span>}
                </div>
                <div style={{ fontSize: 12, color: "#475569", wordBreak: "break-all" }}>{t.hash}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
