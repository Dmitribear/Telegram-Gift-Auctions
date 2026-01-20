import { Request, Response } from "express";
import { balanceService } from "../../services/BalanceService";
import { AuthenticatedRequest } from "../middleware/auth";

const resolveUsername = (req: AuthenticatedRequest, explicit?: string): string | null => {
  if (explicit) return explicit;
  return req.user?.username ?? null;
};

const ensureAccess = (req: AuthenticatedRequest, targetUser: string): boolean => {
  if (req.user?.role === "admin") return true;
  return req.user?.username === targetUser;
};

export class UserController {
  linkPayment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { username: explicit, type, masked, provider } = req.body ?? {};
    const username = resolveUsername(req, explicit);
    if (!username || !type || !masked) {
      res.status(400).json({ error: "username, type, masked are required" });
      return;
    }
    if (!ensureAccess(req, username)) {
      res.status(403).json({ error: "Forbidden" });
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
      res.status(500).json({ error: "Failed to link payment" });
    }
  };

  deposit = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { username: explicit, amount } = req.body ?? {};
    const num = Number(amount);
    const username = resolveUsername(req, explicit);
    if (!username || !Number.isFinite(num) || num <= 0) {
      res.status(400).json({ error: "username and amount > 0 are required" });
      return;
    }
    if (!ensureAccess(req, username)) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    try {
      const user = await balanceService.deposit(username, num);
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to deposit" });
    }
  };

  me = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const username =
      (req.params.username as string | undefined) || resolveUsername(req, undefined);
    if (!username) {
      res.status(400).json({ error: "username required" });
      return;
    }
    if (!ensureAccess(req, username)) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    const user = await balanceService.ensureUser(username);
    res.json(user);
  };
}

export const userController = new UserController();
