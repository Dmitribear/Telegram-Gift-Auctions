import { Request, Response } from "express";
import { walletService } from "../../services/WalletService";
import { AuthenticatedRequest } from "../middleware/auth";

const resolveUser = (req: AuthenticatedRequest, explicit?: string): string | null => {
  if (explicit) return explicit;
  return req.user?.username ?? null;
};

export class WalletController {
  me = async (req: AuthenticatedRequest, res: Response) => {
    const user = resolveUser(req, (req.query.user as string) || (req.body?.user as string));
    if (!user) return res.status(400).json({ error: "user required" });
    const w = await walletService.ensureWallet(user);
    res.json(w);
  };

  faucet = async (req: AuthenticatedRequest, res: Response) => {
    const user = resolveUser(req, (req.body?.user as string) || "");
    const amount = Number(req.body?.amount ?? 100);
    if (!user || !Number.isFinite(amount) || amount <= 0)
      return res.status(400).json({ error: "user and amount>0 required" });
    const w = await walletService.faucet(user, amount);
    res.json(w);
  };

  send = async (req: AuthenticatedRequest, res: Response) => {
    const { amount, to } = req.body ?? {};
    const user = resolveUser(req, req.body?.user as string);
    const num = Number(amount);
    if (!user || !to || !Number.isFinite(num) || num <= 0)
      return res.status(400).json({ error: "user,to,amount>0 required" });
    try {
      const w = await walletService.send(user, num, to);
      res.json(w);
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  };

  bridgeToSite = async (req: AuthenticatedRequest, res: Response) => {
    const user = resolveUser(req, req.body?.user as string);
    const num = Number(req.body?.amount);
    if (!user || !Number.isFinite(num) || num <= 0)
      return res.status(400).json({ error: "user, amount>0 required" });
    try {
      const w = await walletService.bridgeToSite(user, num);
      res.json(w);
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  };

  bridgeFromSite = async (req: AuthenticatedRequest, res: Response) => {
    const user = resolveUser(req, req.body?.user as string);
    const num = Number(req.body?.amount);
    if (!user || !Number.isFinite(num) || num <= 0)
      return res.status(400).json({ error: "user, amount>0 required" });
    try {
      const w = await walletService.bridgeFromSite(user, num);
      res.json(w);
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  };
}

export const walletController = new WalletController();
