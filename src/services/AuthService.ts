import jwt from "jsonwebtoken";
import { balanceService } from "./BalanceService";

const JWT_SECRET = process.env.JWT_SECRET || "demo-secret";
const JWT_EXPIRES_IN = "12h";
const ADMIN_SECRET = process.env.ADMIN_PASSWORD || process.env.ADMIN_TOKEN || "admin-secret";

export type AuthRole = "user" | "admin";

export interface AuthTokenPayload {
  username: string;
  role: AuthRole;
}

class AuthService {
  issueToken(payload: AuthTokenPayload): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  }

  verify(token: string): AuthTokenPayload {
    return jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
  }

  async login(username: string): Promise<{ token: string; role: AuthRole }> {
    await balanceService.ensureUser(username);
    const payload: AuthTokenPayload = { username, role: "user" };
    const token = this.issueToken(payload);
    return { token, role: payload.role };
  }

  async loginAdmin(username: string | undefined, password: string): Promise<{
    token: string;
    role: AuthRole;
  }> {
    if (password !== ADMIN_SECRET) {
      throw new Error("INVALID_ADMIN_SECRET");
    }
    const payload: AuthTokenPayload = {
      username: username || "admin",
      role: "admin",
    };
    const token = this.issueToken(payload);
    return { token, role: payload.role };
  }
}

export const authService = new AuthService();
