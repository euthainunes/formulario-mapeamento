"use client";

import { useAuthStore } from "@/store/auth.store";

export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const loginAs = useAuthStore((s) => s.loginAs);
  const loginWithCredentials = useAuthStore((s) => s.loginWithCredentials);
  const logout = useAuthStore((s) => s.logout);
  return { user, loginAs, loginWithCredentials, logout, isAuthenticated: Boolean(user) };
}
