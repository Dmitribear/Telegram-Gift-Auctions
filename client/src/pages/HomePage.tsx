import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Auction, auctionApi } from "../entities/auction";
import { authApi } from "../entities/auth";
import { userApi, User } from "../entities/user/api/userApi";
import { Loader } from "../shared/ui/loader";
import { ErrorBox } from "../shared/ui/error-box";
import { useAuth } from "../shared/hooks/useAuth";

type WsEvent = { ts: string; text: string };

export default function HomePage() {
  const { token, user, role, setAuth, logout } = useAuth();
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loginUser, setLoginUser] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [me, setMe] = useState<User | null>(null);
  const [paymentMasked, setPaymentMasked] = useState("**** 0000");
  const [paymentType, setPaymentType] = useState<"card" | "crypto">("card");
  const [depositAmount, setDepositAmount] = useState("50");
  const [wsEvents, setWsEvents] = useState<WsEvent[]>([]);

  const fetchAuctions = async () => {
    setLoading(true);
    try {
      const data = await auctionApi.getAll();
      setAuctions(data);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async () => {
    if (!token) {
      setMe(null);
      return;
    }
    try {
      const profile = await userApi.me();
      setMe(profile);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  useEffect(() => {
    fetchAuctions();
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [token]);

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const ws = new WebSocket(`${protocol}://${window.location.host}/ws`);
    ws.onmessage = (evt) => {
      const text = typeof evt.data === "string" ? evt.data : JSON.stringify(evt.data);
      setWsEvents((prev) => [{ ts: new Date().toISOString(), text }, ...prev].slice(0, 6));
    };
    ws.onerror = () => {
      setWsEvents((prev) => [{ ts: new Date().toISOString(), text: "ws error" }, ...prev].slice(0, 6));
    };
    return () => ws.close();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginUser) return;
    const result = await authApi.loginUser(loginUser);
    setAuth(result.token, result.username, result.role);
    setLoginUser("");
    fetchProfile();
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminPassword) return;
    const result = await authApi.loginAdmin(adminPassword, "admin");
    setAuth(result.token, result.username, result.role);
    setAdminPassword("");
  };

  const handleLinkPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    await userApi.linkPayment({
      type: paymentType,
      masked: paymentMasked,
    });
    await fetchProfile();
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(depositAmount);
    if (!Number.isFinite(amount) || amount <= 0) return;
    await userApi.deposit({ amount });
    setDepositAmount("");
    await fetchProfile();
  };

  const activeAuctions = useMemo(
    () => auctions.filter((a) => a.status !== "ended"),
    [auctions]
  );

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div className="card" style={{ display: "grid", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <h2 style={{ margin: 0 }}>Авторизация</h2>
          <a className="btn secondary" href="/docs" target="_blank" rel="noreferrer">
            Swagger
          </a>
        </div>
        {token ? (
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <span>
              Вошли как <strong>{user}</strong> ({role})
            </span>
            <button className="btn secondary" onClick={logout}>
              Выйти
            </button>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            <form
              onSubmit={handleLogin}
              style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}
            >
              <input
                placeholder="username"
                value={loginUser}
                onChange={(e) => setLoginUser(e.target.value)}
              />
              <button className="btn" type="submit">
                Войти
              </button>
            </form>
            <form
              onSubmit={handleAdminLogin}
              style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}
            >
              <input
                type="password"
                placeholder="admin secret"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
              />
              <button className="btn secondary" type="submit">
                Admin login
              </button>
            </form>
          </div>
        )}
      </div>

      {token && (
        <div className="card" style={{ display: "grid", gap: 10 }}>
          <h3 style={{ margin: 0 }}>Баланс и платежи</h3>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <span>Баланс: {me?.balance ?? "—"} TON</span>
            <span>Заблокировано: {me?.lockedBalance ?? "—"} TON</span>
            <span>Призы: {me?.prizeBalance ?? "—"} TON</span>
            <span>
              Метод: {me?.paymentMethod ? `${me.paymentMethod.type} (${me.paymentMethod.masked})` : "нет"}
            </span>
          </div>
          <form
            onSubmit={handleLinkPayment}
            style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}
          >
            <select value={paymentType} onChange={(e) => setPaymentType(e.target.value as any)}>
              <option value="card">Карта</option>
              <option value="crypto">Крипто</option>
            </select>
            <input
              placeholder="**** 1111"
              value={paymentMasked}
              onChange={(e) => setPaymentMasked(e.target.value)}
            />
            <button className="btn secondary" type="submit">
              Сохранить метод
            </button>
          </form>
          <form
            onSubmit={handleDeposit}
            style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}
          >
            <input
              type="number"
              min="1"
              step="1"
              placeholder="Сумма"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
            />
            <button className="btn" type="submit">
              Депозит
            </button>
          </form>
        </div>
      )}

      <div style={{ display: "grid", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <h2 style={{ margin: 0 }}>Аукционы</h2>
          {token && role === "admin" && (
            <Link className="btn secondary" to="/create">
              Создать аукцион
            </Link>
          )}
        </div>

        {loading && <Loader />}
        {error && <ErrorBox message={error} />}

        {!loading && auctions.length === 0 && (
          <div className="card">Аукционов пока нет. Создайте первый.</div>
        )}

        <div className="list">
          {auctions.map((auction) => (
            <Link
              key={auction._id}
              to={`/auctions/${auction._id}`}
              className="card"
              style={{ display: "grid", gap: 6, textDecoration: "none" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <strong>{auction.title}</strong>
                <span style={{ fontSize: 12, color: "#475569" }}>{auction.status}</span>
              </div>
              <div style={{ fontSize: 14, color: "#475569" }}>
                Текущая цена: {auction.currentPrice} TON · шаг {auction.bidStep} TON
              </div>
              {auction.endTime && (
                <div style={{ fontSize: 12, color: "#64748b" }}>
                  До {new Date(auction.endTime).toLocaleTimeString()}
                </div>
              )}
            </Link>
          ))}
        </div>
      </div>

      <div className="card" style={{ display: "grid", gap: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0 }}>Вебсокет события</h3>
          <span style={{ fontSize: 12, color: "#64748b" }}>ставки, продления, финализации</span>
        </div>
        {wsEvents.length === 0 && <span style={{ color: "#64748b" }}>Нет событий</span>}
        {wsEvents.map((evt, idx) => (
          <div
            key={idx}
            style={{
              display: "flex",
              justifyContent: "space-between",
              border: "1px solid #e2e8f0",
              borderRadius: 8,
              padding: "6px 10px",
            }}
          >
            <span style={{ fontFamily: "monospace", fontSize: 12 }}>{evt.text}</span>
            <span style={{ fontSize: 11, color: "#94a3b8" }}>
              {new Date(evt.ts).toLocaleTimeString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
