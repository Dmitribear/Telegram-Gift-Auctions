import { Request, Response } from "express";
import { walletService } from "../../services/WalletService";

class WalletController {
  me = async (req: Request, res: Response) => {
    const user = (req.query.user as string) || (req.body?.user as string);
    if (!user) return res.status(400).json({ error: "user required" });
    const w = await walletService.ensureWallet(user);
    res.json(w);
  };

  faucet = async (req: Request, res: Response) => {
    const user = (req.body?.user as string) || "";
    const amount = Number(req.body?.amount ?? 100);
    if (!user || !Number.isFinite(amount) || amount <= 0)
      return res.status(400).json({ error: "user and amount>0 required" });
    const w = await walletService.faucet(user, amount);
    res.json(w);
  };

  send = async (req: Request, res: Response) => {
    const { user, amount, to } = req.body ?? {};
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

  bridgeToSite = async (req: Request, res: Response) => {
    const { user, amount } = req.body ?? {};
    const num = Number(amount);
    if (!user || !Number.isFinite(num) || num <= 0)
      return res.status(400).json({ error: "user, amount>0 required" });
    try {
      const w = await walletService.bridgeToSite(user, num);
      res.json(w);
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  };

  bridgeFromSite = async (req: Request, res: Response) => {
    const { user, amount } = req.body ?? {};
    const num = Number(amount);
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
