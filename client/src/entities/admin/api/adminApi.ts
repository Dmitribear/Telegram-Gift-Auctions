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

export type BotApiKey = {
  _id: string;
  name: string;
  apiKey: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Transaction = {
  _id: string;
  user: string;
  auctionId?: string;
  type: string;
  amount: number;
  currency: string;
  createdAt: string;
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
  listKeys: (token: string) =>
    request<BotApiKey[]>("/bot-api", { headers: headers(token) }),
  createKey: (token: string, name: string) =>
    request<BotApiKey>("/bot-api", {
      method: "POST",
      headers: headers(token),
      body: JSON.stringify({ name }),
    }),
  revokeKey: (token: string, id: string) =>
    request<{ ok: true }>(`/bot-api/${id}/revoke`, {
      method: "POST",
      headers: headers(token),
    }),
  listTransactions: (token: string, params?: { user?: string; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params?.user) qs.set("user", params.user);
    if (params?.limit) qs.set("limit", String(params.limit));
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return request<Transaction[]>(`/transactions${suffix}`, { headers: headers(token) });
  },
};
