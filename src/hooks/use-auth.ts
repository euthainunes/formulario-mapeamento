"use client";

import { useAuthStore } from "@/store/auth.store";

export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const loginAs = useAuthStore((s) => s.loginAs);
  const logout = useAuthStore((s) => s.logout);
  return { user, loginAs, logout, isAuthenticated: Boolean(user) };
}
