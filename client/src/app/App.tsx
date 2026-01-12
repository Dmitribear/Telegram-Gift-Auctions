import { Link, Route, Routes } from "react-router-dom";
import HomePage from "../pages/HomePage";
import CreateAuctionPage from "../pages/CreateAuctionPage";
import AuctionPage from "../pages/AuctionPage";
import AdminBotsPage from "../pages/AdminBotsPage";
import ProfilePage from "../pages/ProfilePage";
import TransactionsPage from "../pages/TransactionsPage";
import WalletPage from "../pages/WalletPage";

function App() {
  return (
    <div className="container">
      <header className="nav">
        <Link to="/">
          <strong>Telegram Gift Auctions Demo</strong>
        </Link>
        <div className="spacer" />
        <Link to="/" className="btn secondary">
          Аукционы
        </Link>
        <Link to="/create" className="btn secondary">
          Create Auction
        </Link>
        <Link to="/admin" className="btn secondary">
          Admin
        </Link>
        <Link to="/profile" className="btn secondary">
          Profile
        </Link>
        <Link to="/transactions" className="btn secondary">
          Transactions
        </Link>
        <a href="/wallet" target="_blank" rel="noreferrer" className="btn secondary">
          Wallet
        </a>
      </header>

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/create" element={<CreateAuctionPage />} />
        <Route path="/auctions/:id" element={<AuctionPage />} />
        <Route path="/admin" element={<AdminBotsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/transactions" element={<TransactionsPage />} />
        <Route path="/wallet" element={<WalletPage />} />
      </Routes>
    </div>
  );
}

export default App;
