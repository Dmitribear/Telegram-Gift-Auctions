import { useEffect, useState } from "react";
import { getAuthState, setAuthToken } from "../api/client";

export const useAuth = () => {
  const [auth, setAuth] = useState(getAuthState());

  useEffect(() => {
    const handler = () => setAuth(getAuthState());
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const update = (token: string | null, user?: string, role?: string) => {
    setAuthToken(token, user, role);
    setAuth(getAuthState());
  };

  return {
    ...auth,
    setAuth: update,
    logout: () => update(null),
  };
};
