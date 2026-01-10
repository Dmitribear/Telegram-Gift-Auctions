import { request } from "../../../shared/api/client";

export type BotConfig = {
  enabled: boolean;
  bots: number;
  minDelayMs: number;
  maxDelayMs: number;
  antiSnipeWindowSeconds: number;
  antiSnipeExtendSeconds: number;
  maxBidAmount?: number;
};

const headers = (token: string) => ({
  "x-admin-token": token,
});

export const adminApi = {
  login: (token: string) =>
    request<{ ok: true }>("/admin/login", {
      method: "POST",
      headers: headers(token),
    }),
  getBots: (token: string) =>
    request<BotConfig>("/admin/bots", { headers: headers(token) }),
  updateBots: (token: string, payload: Partial<BotConfig>) =>
    request<BotConfig>("/admin/bots", {
      method: "POST",
      headers: headers(token),
      body: JSON.stringify(payload),
    }),
};
