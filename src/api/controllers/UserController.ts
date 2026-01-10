import { Request, Response } from "express";
import { MongoServerError } from "mongodb";
import { UserRepository } from "../../repositories/UserRepository";
import { BalanceService } from "../../services/BalanceService";
import { asyncHandler } from "../../utils/asyncHandler";
import { HttpError } from "../../utils/httpError";

export class UserController {
  static createUser = asyncHandler(async (req: Request, res: Response) => {
    const { username, balance } = req.body;
    if (!username) {
      throw new HttpError(400, "Username is required");
    }

    const initialBalance =
      balance !== undefined ? Number(balance) : undefined;
    if (initialBalance !== undefined && initialBalance < 0) {
      throw new HttpError(400, "Balance cannot be negative");
    }

    try {
      const user = await UserRepository.create(
        { username, balance: initialBalance ?? 0 },
        undefined
      );
      res.status(201).json(user);
    } catch (error) {
      if (error instanceof MongoServerError && error.code === 11000) {
        throw new HttpError(409, "Username already exists");
      }
      throw error;
    }
  });

  static getUser = asyncHandler(async (req: Request, res: Response) => {
    const user = await UserRepository.findById(req.params.userId);
    if (!user) {
      throw new HttpError(404, "User not found");
    }
    res.json(user);
  });

  static deposit = asyncHandler(async (req: Request, res: Response) => {
    const { amount } = req.body;
    const { userId } = req.params;
    if (amount === undefined) {
      throw new HttpError(400, "Amount is required");
    }

    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount)) {
      throw new HttpError(400, "Amount must be a number");
    }

    const updatedUser = await BalanceService.deposit(userId, parsedAmount);
    res.json(updatedUser);
  });
}
