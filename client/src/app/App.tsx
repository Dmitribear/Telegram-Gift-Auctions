import { Link, Route, Routes } from "react-router-dom";
import HomePage from "../pages/HomePage";
import CreateAuctionPage from "../pages/CreateAuctionPage";
import AuctionPage from "../pages/AuctionPage";
import ProfilePage from "../pages/ProfilePage";
import TransactionsPage from "../pages/TransactionsPage";
import WalletPage from "../pages/WalletPage";
import { useAuth } from "../shared/hooks/useAuth";

function App() {
  const { user, role, logout, token } = useAuth();

  return (
    <div className="container">
      <header className="nav">
        <Link to="/">
          <strong>Telegram Gift Auctions</strong>
        </Link>
        <div className="spacer" />
        <a href="/docs" target="_blank" rel="noreferrer" className="btn secondary">
          Swagger
        </a>
        <Link to="/" className="btn secondary">
          Auctions
        </Link>
        <Link to="/wallet" className="btn secondary">
          Wallet
        </Link>
        {role === "admin" && (
          <Link to="/create" className="btn secondary">
            Create
          </Link>
        )}
        {token ? (
          <button className="btn secondary" onClick={logout}>
            {user} ({role}) · logout
          </button>
        ) : (
          <span style={{ fontSize: 12, color: "#475569" }}>Not authenticated</span>
        )}
      </header>

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/create" element={<CreateAuctionPage />} />
        <Route path="/auctions/:id" element={<AuctionPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/transactions" element={<TransactionsPage />} />
        <Route path="/wallet" element={<WalletPage />} />
      </Routes>
    </div>
  );
}

export default App;
