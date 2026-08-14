// Alterna entre o modo "mock" (dados 100% simulados em memória, padrão em
// produção/demonstração pública — não requer nenhuma dependência externa) e
// o modo "api" (repositories reais, que chamam o backend NestJS através dos
// Route Handlers do Next.js em src/app/api/*, atuando como BFF autenticado).
//
// Controlado por NEXT_PUBLIC_APP_MODE ("mock" | "api"). Como este arquivo é
// importado por código client-side (as factories em src/services/repositories),
// a variável precisa ter o prefixo NEXT_PUBLIC_ para ficar disponível no
// bundle do navegador. Qualquer valor diferente de "api" cai em "mock".
const dataSource: "mock" | "api" = process.env.NEXT_PUBLIC_APP_MODE === "api" ? "api" : "mock";

export const appConfig = {
  dataSource,
  mockMode: dataSource === "mock",
  integrations: {
    beeHome: dataSource === "api",
    microsoftPlanner: false,
    microsoftTeams: false,
    outlook: false,
  },
};

export type AppConfig = typeof appConfig;
