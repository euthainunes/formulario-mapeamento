"use client";

import { useAuthStore } from "@/store/auth.store";

export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const loginAs = useAuthStore((s) => s.loginAs);
  const loginWithCredentials = useAuthStore((s) => s.loginWithCredentials);
  const logout = useAuthStore((s) => s.logout);
  return {
    user,
    loginAs,
    loginWithCredentials,
    logout,
    // Só é seguro concluir "não autenticado" depois que o zustand/persist
    // terminar de reidratar o localStorage (ver auth.store.ts). Antes disso,
    // `hasHydrated` é `false` e o autenticado real ainda é desconhecido.
    hasHydrated,
    isAuthenticated: Boolean(user),
  };
}
