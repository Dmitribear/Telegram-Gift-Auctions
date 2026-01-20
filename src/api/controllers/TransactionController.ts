import { Response } from "express";
import { transactionService } from "../../services/TransactionService";
import { AuthenticatedRequest } from "../middleware/auth";

class TransactionController {
  list = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { type, limit } = req.query;
    const filter: any = {};
    const max = Math.min(Number(limit) || 100, 200);
    if (req.user?.role !== "admin") {
      filter.user = req.user?.username;
    } else if (req.query.user) {
      filter.user = req.query.user;
    }
    if (type) filter.type = type;
    const tx = await transactionService.list(filter, max);
    res.json(tx);
  };
}

export const transactionController = new TransactionController();
