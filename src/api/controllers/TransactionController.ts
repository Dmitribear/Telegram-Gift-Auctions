import { Request, Response } from "express";
import { transactionService } from "../../services/TransactionService";

class TransactionController {
  list = async (req: Request, res: Response): Promise<void> => {
    const { user, type, limit } = req.query;
    const filter: any = {};
    if (user) filter.user = user;
    if (type) filter.type = type;
    const lim = limit ? Number(limit) : 100;
    const tx = await transactionService.list(filter, lim);
    res.json(tx);
  };
}

export const transactionController = new TransactionController();
