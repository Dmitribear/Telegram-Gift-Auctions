import { request } from "../../../shared/api/client";

export type Wallet = {
  user: string;
  address: string;
  balanceTon: number;
  tx: {
    type: string;
    amount: number;
    to?: string;
    hash: string;
    status: string;
    createdAt: string;
  }[];
};

export const walletApi = {
  get: (user: string) => request<Wallet>(`/wallet?user=${encodeURIComponent(user)}`),
  faucet: (user: string, amount: number) =>
    request<Wallet>("/wallet/faucet", {
      method: "POST",
      body: JSON.stringify({ user, amount }),
    }),
  send: (user: string, amount: number, to: string) =>
    request<Wallet>("/wallet/send", {
      method: "POST",
      body: JSON.stringify({ user, amount, to }),
    }),
  bridgeToSite: (user: string, amount: number) =>
    request<Wallet>("/wallet/bridge-to-site", {
      method: "POST",
      body: JSON.stringify({ user, amount }),
    }),
  bridgeFromSite: (user: string, amount: number) =>
    request<Wallet>("/wallet/bridge-from-site", {
      method: "POST",
      body: JSON.stringify({ user, amount }),
    }),
};
