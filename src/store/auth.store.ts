import { create } from "zustand";
import { persist } from "zustand/middleware";
import { AuthUser, PermissionKey } from "@/types/auth";
import { ROLES, hasPermission } from "@/lib/permissions";
import { MOCK_ACCOUNTS } from "@/mocks/users.mock";

interface AuthState {
  user: AuthUser | null;
  loginAs: (userId: string) => void;
  logout: () => void;
  can: (permission: PermissionKey) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      loginAs: (userId: string) => {
        const account = MOCK_ACCOUNTS.find((a) => a.id === userId);
        if (!account) return;
        set({
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
      logout: () => set({ user: null }),
      can: (permission: PermissionKey) => {
        const user = get().user;
        if (!user) return false;
        return hasPermission(ROLES[user.role].permissions, permission);
      },
    }),
    { name: "beehome-demo-auth" }
  )
);
