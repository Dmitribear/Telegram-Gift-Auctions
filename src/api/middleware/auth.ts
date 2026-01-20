import { Request, Response, NextFunction } from "express";
import { BotApiKeyCollection } from "../../models/BotApiKey";
import { authService, AuthTokenPayload } from "../../services/AuthService";

export interface AuthenticatedRequest extends Request {
  user?: AuthTokenPayload;
}

const parseBearer = (req: Request): string | null => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.replace("Bearer ", "");
  }
  return null;
};

export function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const token = parseBearer(req);
  if (!token) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const payload = authService.verify(token);
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: "Unauthorized" });
  }
}

export function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const headerSecret = (req.headers["x-admin-token"] as string | undefined)?.trim();
  if (headerSecret && headerSecret === (process.env.ADMIN_TOKEN || process.env.ADMIN_PASSWORD)) {
    req.user = { username: "admin", role: "admin" };
    next();
    return;
  }

  const token = parseBearer(req);
  if (!token) {
    res.status(401).json({ error: "Admin token required" });
    return;
  }
  try {
    const payload = authService.verify(token);
    if (payload.role !== "admin") {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    req.user = payload;
    next();
  } catch {
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
