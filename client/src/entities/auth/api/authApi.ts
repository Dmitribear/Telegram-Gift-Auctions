import { request, setAuthToken } from "../../../shared/api/client";

type LoginResponse = { token: string; role: "user" | "admin" };

export const authApi = {
  loginUser: async (username: string) => {
    const res = await request<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username }),
    });
    setAuthToken(res.token, username, res.role);
    return { ...res, username };
  },
  loginAdmin: async (password: string, username?: string) => {
    const res = await request<LoginResponse>("/admin/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    setAuthToken(res.token, username || "admin", res.role);
    return { ...res, username: username || "admin" };
  },
  logout: () => setAuthToken(null),
};
