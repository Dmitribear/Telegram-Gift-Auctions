import mongoose from "mongoose";
import { MongoServerError } from "mongodb";
import { NextFunction, Request, Response } from "express";
import { HttpError } from "../../utils/httpError";
import { logger } from "../../utils/logger";

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof MongoServerError && err.code === 11000) {
    res.status(409).json({
      error: "Duplicate key error",
      details: err.keyValue,
    });
    return;
  }

  if (err instanceof mongoose.Error.ValidationError) {
    res.status(400).json({ error: err.message });
    return;
  }

  if (err instanceof HttpError) {
    res.status(err.status).json({
      error: err.message,
      details: err.details,
    });
    return;
  }

  logger.error("Unhandled error", { error: err.message, stack: err.stack });
  res.status(500).json({ error: "Internal server error" });
}
