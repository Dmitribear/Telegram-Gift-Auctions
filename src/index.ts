import express from "express";
import cors from "cors";
import connectDB from "./config/db";
import "./config/env";
import auctionRoutes from "./api/routes/auction.routes";
import adminRoutes from "./api/routes/admin.routes";
import userRoutes from "./api/routes/user.routes";

const app = express();

const allowedOrigin = "http://localhost:4174";
app.use(
  cors({
    origin: allowedOrigin,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "X-Admin-Token"],
    credentials: false,
    optionsSuccessStatus: 204,
  })
);

app.use(express.json());

app.use("/auctions", auctionRoutes);
app.use("/admin", adminRoutes);
app.use("/users", userRoutes);

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

const port = Number(process.env.PORT ?? 3000);

connectDB()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server listening on http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error("Startup error", error);
    process.exit(1);
  });
