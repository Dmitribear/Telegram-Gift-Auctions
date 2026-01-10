import express, { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import { MongoServerError } from "mongodb";
import connectDB from "./config/db";
import "./config/env";
import auctionRoutes from "./api/routes/auction.routes";
import userRoutes from "./api/routes/user.routes";
import bidRoutes from "./api/routes/bid.routes";
import adminRoutes from "./api/routes/admin.routes";
import { HttpError } from "./utils/httpError";
import swaggerUi from "swagger-ui-express";
import { openApiSpec } from "./config/swagger";

const app = express();

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/users", userRoutes);
app.use("/api/auctions", auctionRoutes);
app.use("/api/bids", bidRoutes);
app.use("/api/admin", adminRoutes);
app.use("/docs", swaggerUi.serve, swaggerUi.setup(openApiSpec));

app.use(
  (
    err: Error,
    _req: Request,
    res: Response,
    _next: NextFunction // eslint-disable-line @typescript-eslint/no-unused-vars
  ) => {
    if (err instanceof MongoServerError && err.code === 11000) {
      res.status(409).json({
        message: "Duplicate key error",
        details: err.keyValue,
      });
      return;
    }

    if (err instanceof mongoose.Error.ValidationError) {
      res.status(400).json({ message: err.message });
      return;
    }

    if (err instanceof HttpError) {
      res.status(err.status).json({
        message: err.message,
        details: err.details,
      });
      return;
    }

    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
);

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
