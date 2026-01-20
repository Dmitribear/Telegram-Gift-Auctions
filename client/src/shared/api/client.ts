const API_BASE = import.meta.env.VITE_API_BASE ?? "";

const defaultHeaders: HeadersInit = {
  "Content-Type": "application/json",
};

const hasWindow = typeof window !== "undefined";
let authToken = hasWindow ? window.localStorage.getItem("authToken") : null;
let authUser = hasWindow ? window.localStorage.getItem("authUser") : null;
let authRole = hasWindow ? window.localStorage.getItem("authRole") : null;

export const setAuthToken = (token: string | null, user?: string, role?: string) => {
  authToken = token;
  authUser = user ?? authUser;
  authRole = role ?? authRole;
  if (hasWindow) {
    if (token) window.localStorage.setItem("authToken", token);
    else window.localStorage.removeItem("authToken");
    if (user) window.localStorage.setItem("authUser", user);
    if (role) window.localStorage.setItem("authRole", role);
  }
};

export const getAuthState = () => ({
  token: authToken,
  user: authUser,
  role: authRole,
});

const friendly = (msg: string): string => {
  const m = msg?.toUpperCase?.() ?? "";
  if (m.includes("INSUFFICIENT_FUNDS")) return "Недостаточно средств на балансе сайта.";
  if (m.includes("INSUFFICIENT_WALLET_FUNDS")) return "Недостаточно TON в кошельке.";
  if (m.includes("INSUFFICIENT_SITE_BALANCE")) return "Недостаточно TON на сайте.";
  if (m.includes("BID_TOO_LOW")) return "Ставка слишком низкая (нужно выше минимального шага).";
  if (m.includes("INVALID_AMOUNT")) return "Некорректная сумма.";
  if (m.includes("INVALID_ID")) return "Неверный идентификатор.";
  if (m.includes("AUCTION_NOT_FOUND")) return "Аукцион не найден.";
  if (m.includes("PAYMENT_METHOD_REQUIRED")) return "Нужно привязать способ оплаты (демо-карта создаётся автоматически).";
  if (m.includes("user required")) return "Укажите пользователя.";
  return msg || "Произошла ошибка";
};

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      ...defaultHeaders,
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    // пытаемся достать json {error} или {errors}
    let msg = "";
    try {
      const data = await response.json();
      if (data?.error) msg = String(data.error);
      else if (Array.isArray(data?.errors)) msg = data.errors.join("; ");
      else msg = JSON.stringify(data);
    } catch {
      msg = await response.text();
    }
    throw new Error(friendly(msg) || `Request failed with ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
