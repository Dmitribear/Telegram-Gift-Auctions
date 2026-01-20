import { request } from "../../../shared/api/client";

export type User = {
  username: string;
  balance: number;
  heldBalance: number;
  prizeBalance?: number;
  paymentMethod?: {
    type: "card" | "crypto";
    masked: string;
    provider?: string;
  };
};

export const userApi = {
  linkPayment: (payload: {
    username?: string;
    type: "card" | "crypto";
    masked: string;
    provider?: string;
  }): Promise<User> =>
    request<User>("/users/link", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  deposit: (payload: { username?: string; amount: number }): Promise<User> =>
    request<User>("/users/deposit", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  me: (username?: string): Promise<User> =>
    request<User>(`/users/${username ?? ""}`),
};
