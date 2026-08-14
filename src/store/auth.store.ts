import { create } from "zustand";
import { persist } from "zustand/middleware";
import { AuthUser, PermissionKey, RoleId } from "@/types/auth";
import { ROLES, hasPermission } from "@/lib/permissions";
import { MOCK_ACCOUNTS } from "@/mocks/users.mock";
import { initialsFromName } from "@/lib/utils";
import { appConfig } from "@/lib/app-config";
import { apiFetch } from "@/lib/client/api-fetch";

/** Corpo de resposta de POST /api/auth/login (ver src/app/api/auth/login/route.ts) — nunca inclui o token, apenas o perfil. */
interface ApiLoginResponse {
  user: {
    id: string;
    name: string;
    email: string;
    tenantId: string;
    permissions: string[];
    avatarInitials?: string | null;
  };
}

/**
 * Os papéis reais do backend (Role, com permissões livremente configuráveis
 * via RolePermission) não mapeiam 1:1 para os 3 `RoleId` fixos do mock do
 * front-end. Para continuar reaproveitando os componentes visuais existentes
 * (que exibem `ROLES[user.role].name`), inferimos o `RoleId` mais próximo a
 * partir do conjunto de permissões reais — só para fins de rótulo. A
 * autorização de fato, em modo api, usa sempre `apiPermissions` (a lista
 * exata devolvida pelo backend), nunca esse mapeamento aproximado.
 */
function inferRoleId(permissions: string[]): RoleId {
  if (permissions.includes("user.manage") || permissions.includes("role.manage")) return "administradora";
  if (permissions.includes("report.export") || permissions.includes("alert.manage")) return "gestao-comunicacao";
  return "colaborador";
}

interface AuthState {
  user: AuthUser | null;
  /** Permissões efetivas vindas do backend (preenchido apenas em modo "api"). Quando presente, é a fonte de verdade de `can()` — substitui o mapeamento por RoleId usado no modo mock. */
  apiPermissions: PermissionKey[] | null;
  /**
   * Fica `false` até o zustand/persist terminar de reidratar `user` a partir
   * do localStorage. Enquanto isso, `user === null` não significa "não
   * autenticado" — significa "ainda não sabemos". Componentes que decidem
   * redirecionar para /login com base em `isAuthenticated` DEVEM esperar
   * `hasHydrated === true` antes de agir, senão qualquer navegação direta
   * (F5, link direto, `page.goto` em teste) numa rota protegida dispara uma
   * ida para /login seguida de volta para "/", perdendo a rota original.
   */
  hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
  loginAs: (userId: string) => void;
  /** Login real (modo "api"): chama POST /api/auth/login (BFF), que autentica contra o backend e seta o cookie httpOnly de sessão. Lança em caso de credenciais inválidas. */
  loginWithCredentials: (tenantSlug: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  can: (permission: PermissionKey) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      apiPermissions: null,
      hasHydrated: false,
      setHasHydrated: (value: boolean) => set({ hasHydrated: value }),

      loginAs: (userId: string) => {
        const account = MOCK_ACCOUNTS.find((a) => a.id === userId);
        if (!account) return;
        set({
          apiPermissions: null,
          user: {
            id: account.id,
            name: account.name,
            email: account.email,
            role: account.role,
            department: account.department,
            jobTitle: account.jobTitle,
            avatarInitials: account.avatarInitials,
          },
        });
      },

      loginWithCredentials: async (tenantSlug: string, email: string, password: string) => {
        const response = await apiFetch<ApiLoginResponse>("/api/auth/login", {
          method: "POST",
          body: JSON.stringify({ tenantSlug, email, password }),
        });
        const permissions = response.user.permissions as PermissionKey[];
        set({
          apiPermissions: permissions,
          user: {
            id: response.user.id,
            name: response.user.name,
            email: response.user.email,
            role: inferRoleId(permissions),
            department: "",
            jobTitle: "",
            avatarInitials: response.user.avatarInitials || initialsFromName(response.user.name),
          },
        });
      },

      logout: () => {
        const wasApiSession = get().apiPermissions !== null;
        set({ user: null, apiPermissions: null });
        if (wasApiSession && typeof window !== "undefined") {
          // Best-effort: limpa o cookie httpOnly no servidor. Não bloqueia o
          // logout local mesmo se a chamada falhar (ex: backend fora do ar).
          fetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
        }
      },

      can: (permission: PermissionKey) => {
        const state = get();
        if (!state.user) return false;
        if (state.apiPermissions) {
          return state.apiPermissions.includes(permission);
        }
        return hasPermission(ROLES[state.user.role].permissions, permission);
      },
    }),
    {
      name: "beehome-demo-auth",
      // IMPORTANTE: isto persiste apenas o PERFIL do usuário (id/nome/email/
      // permissões), nunca um token — em modo "api" o JWT real fica somente
      // no cookie httpOnly (inacessível a este código), setado pelo Route
      // Handler /api/auth/login. Ver appConfig.dataSource / README.md.
      partialize: (state) => ({ user: state.user, apiPermissions: state.apiPermissions }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

if (typeof window !== "undefined" && appConfig.dataSource === "api") {
  window.addEventListener("beehome:unauthorized", () => {
    useAuthStore.setState({ user: null, apiPermissions: null });
  });
}
