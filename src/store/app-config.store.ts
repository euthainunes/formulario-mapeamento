import { create } from "zustand";
import { appConfig, AppConfig } from "@/lib/app-config";

interface AppConfigState {
  config: AppConfig;
}

/**
 * Expõe `appConfig` via Zustand para que componentes possam reagir a mudanças de
 * configuração de forma reativa, mesmo que hoje o valor seja estático (modo mock fixo).
 */
export const useAppConfigStore = create<AppConfigState>()(() => ({
  config: appConfig,
}));
