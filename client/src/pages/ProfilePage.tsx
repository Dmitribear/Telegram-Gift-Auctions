import { useState } from "react";
import { userApi, User } from "../entities/user/api/userApi";
import { adminApi, Transaction } from "../entities/admin/api/adminApi";
import { ErrorBox } from "../shared/ui/error-box";
import { Loader } from "../shared/ui/loader";

export default function ProfilePage() {
  const [username, setUsername] = useState("demo-user");
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentType, setPaymentType] = useState<"card" | "crypto">("card");
  const [paymentMasked, setPaymentMasked] = useState("****1234");
  const [depositAmount, setDepositAmount] = useState("100");
  const [success, setSuccess] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const loadProfile = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const u = await userApi.me(username);
      setUser(u);
      const tx = await adminApi.listTransactions("", { user: username, limit: 20 });
      setTransactions(tx);
    } catch (err) {
      setError((err as Error).message);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const linkPayment = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await userApi.linkPayment({
        username,
        type: paymentType,
        masked: paymentMasked,
      });
      setSuccess("Payment method linked");
      await loadProfile();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const makeDeposit = async () => {
    const amount = Number(depositAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Amount must be > 0");
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await userApi.deposit({ username, amount });
      setSuccess("Deposited");
      await loadProfile();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ display: "grid", gap: 16 }}>
      <h2 style={{ margin: 0 }}>Profile / Wallet</h2>

      <div className="row">
        <div style={{ flex: 1, minWidth: 180, display: "grid", gap: 6 }}>
          <label htmlFor="username">Username</label>
          <input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        <div style={{ display: "flex", alignItems: "flex-end" }}>
          <button className="btn secondary" type="button" onClick={loadProfile}>
            Load profile
          </button>
        </div>
      </div>

      {loading && <Loader />}
      {error && <ErrorBox message={error} />}
      {success && <div className="success">{success}</div>}

      {user && (
        <div className="card" style={{ display: "grid", gap: 8 }}>
          <strong>Balances</strong>
          <div>Wallet: {user.balance.toFixed(2)}</div>
          <div>Held: {user.heldBalance.toFixed(2)}</div>
          <div>Prize: {(user.prizeBalance ?? 0).toFixed(2)}</div>
          {user.paymentMethod && (
            <div style={{ fontSize: 13, color: "#475569" }}>
              Payment: {user.paymentMethod.type} ({user.paymentMethod.masked})
            </div>
          )}
        </div>
      )}

      <div className="card" style={{ display: "grid", gap: 10 }}>
        <h4 style={{ margin: 0 }}>Payment</h4>
        <div className="row">
          <div style={{ flex: 1, minWidth: 140, display: "grid", gap: 6 }}>
            <label htmlFor="paymentType">Method</label>
            <select
              id="paymentType"
              value={paymentType}
              onChange={(e) => setPaymentType(e.target.value as "card" | "crypto")}
            >
              <option value="card">Card</option>
              <option value="crypto">Crypto</option>
            </select>
          </div>
          <div style={{ flex: 1, minWidth: 140, display: "grid", gap: 6 }}>
            <label htmlFor="paymentMasked">Masked</label>
            <input
              id="paymentMasked"
              value={paymentMasked}
              onChange={(e) => setPaymentMasked(e.target.value)}
              placeholder="****1234 / 0xabc..."
            />
          </div>
        </div>
        <button className="btn secondary" type="button" onClick={linkPayment}>
          Link payment
        </button>
      </div>

      <div className="card" style={{ display: "grid", gap: 10 }}>
        <h4 style={{ margin: 0 }}>Deposit</h4>
        <div className="row">
          <div style={{ flex: 1, minWidth: 140, display: "grid", gap: 6 }}>
            <label htmlFor="depositAmount">Amount</label>
            <input
              id="depositAmount"
              type="number"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
            />
          </div>
          <div style={{ display: "flex", alignItems: "flex-end" }}>
            <button className="btn" type="button" onClick={makeDeposit}>
              Deposit
            </button>
          </div>
        </div>
      </div>

      {transactions.length > 0 && (
        <div className="card" style={{ display: "grid", gap: 10 }}>
          <h4 style={{ margin: 0 }}>Transactions (last 20)</h4>
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
                  {t.amount} {t.currency}
                </div>
                {t.auctionId && (
                  <div style={{ fontSize: 12, color: "#475569" }}>auction: {t.auctionId}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
