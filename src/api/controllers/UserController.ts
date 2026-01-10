import { Request, Response } from "express";
import { balanceService } from "../../services/BalanceService";

export class UserController {
  linkPayment = async (req: Request, res: Response): Promise<void> => {
    const { username, type, masked, provider } = req.body ?? {};
    if (!username || !type || !masked) {
      res.status(400).json({ error: "username, type, masked are required" });
      return;
    }
    if (!["card", "crypto"].includes(type)) {
      res.status(400).json({ error: "type must be card|crypto" });
      return;
    }
    try {
      const user = await balanceService.linkPayment(username, {
        type,
        masked,
        provider,
      });
      res.json(user);
    } catch (error) {
      console.error("linkPayment failed", error);
      res.status(500).json({ error: "Failed to link payment" });
    }
  };

  deposit = async (req: Request, res: Response): Promise<void> => {
    const { username, amount } = req.body ?? {};
    const num = Number(amount);
    if (!username || !Number.isFinite(num) || num <= 0) {
      res.status(400).json({ error: "username and amount > 0 are required" });
      return;
    }
    try {
      const user = await balanceService.deposit(username, num);
      res.json(user);
    } catch (error) {
      console.error("deposit failed", error);
      res.status(500).json({ error: "Failed to deposit" });
    }
  };

  me = async (req: Request, res: Response): Promise<void> => {
    const username = req.params.username;
    if (!username) {
      res.status(400).json({ error: "username required" });
      return;
    }
    const user = await balanceService.get(username);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json(user);
  };
}

export const userController = new UserController();
