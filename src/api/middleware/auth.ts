import { Request, Response, NextFunction } from "express";
import { BotApiKeyCollection } from "../../models/BotApiKey";
import { authService } from "../../services/AuthService";

// Демонстрационный режим: админ-панель открыта для всех.
export function requireAdmin(
  _req: Request,
  _res: Response,
  next: NextFunction
): void {
  next();
}

export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const token = authHeader.replace("Bearer ", "");
    const payload = authService.verify(token);
    (req as any).user = payload;
    next();
  } catch (error) {
    res.status(401).json({ error: "Unauthorized" });
  }
}

export async function requireBotKey(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const apiKey = (req.headers["x-api-key"] as string | undefined)?.trim();
  if (!apiKey) {
    res.status(401).json({ error: "API key required" });
    return;
  }
  const key = await BotApiKeyCollection.findOne({ apiKey, active: true }).exec();
  if (!key) {
    res.status(401).json({ error: "Invalid API key" });
    return;
  }
  (req as any).botKey = key;
  next();
}