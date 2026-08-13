export const appConfig = {
  dataSource: "mock" as "mock" | "api",
  mockMode: true,
  integrations: {
    beeHome: false,
    microsoftPlanner: false,
    microsoftTeams: false,
    outlook: false,
  },
};

export type AppConfig = typeof appConfig;
