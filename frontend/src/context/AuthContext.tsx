"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { authApi, type User } from "../lib/api";
import { tokenStore } from "../lib/tokenStore";

type AuthState =
  | { status: "loading" }
  | { status: "authenticated"; user: User }
  | { status: "unauthenticated" };

type AuthContext = AuthState & {
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  googleLogin: (idToken: string) => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  connectLink: (pluginId: string) => Promise<string>;
  refreshUser: () => Promise<void>;
};

const Ctx = createContext<AuthContext | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: "loading" });

  const setUser = (user: User, token: string) => {
    tokenStore.set(token);
    setState({ status: "authenticated", user });
  };

  const clearUser = () => {
    tokenStore.clear();
    setState({ status: "unauthenticated" });
  };

  useEffect(() => {
    authApi
      .refresh()
      .then(({ token, user }) => {
        tokenStore.set(token);
        setState({ status: "authenticated", user });
      })
      .catch(() => clearUser());
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { token, user } = await authApi.login({ email, password });
    setUser(user, token);
  }, []);

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      const { token, user } = await authApi.register({ name, email, password });
      setUser(user, token);
    },
    [],
  );

  const googleLogin = useCallback(async (idToken: string) => {
    const { token, user } = await authApi.google(idToken);
    setUser(user, token);
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout().catch(() => {});
    clearUser();
  }, []);

  const deleteAccount = useCallback(async () => {
    await authApi.deleteAccount();
    clearUser();
  }, []);

  const connectLink = useCallback(async (pluginId: string) => {
    const { url } = await authApi.connectLink(pluginId);
    return url;
  }, []);

  const refreshUser = useCallback(async () => {
    const { token, user } = await authApi.refresh();
    tokenStore.set(token);
    setState({ status: "authenticated", user });
  }, []);

  return (
    <Ctx.Provider
      value={{
        ...state,
        login,
        register,
        googleLogin,
        logout,
        deleteAccount,
        connectLink,
        refreshUser,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
