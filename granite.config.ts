import { defineConfig } from "@apps-in-toss/web-framework/config";

export default defineConfig({
  appName: "match-picture-app",
  brand: {
    displayName: "같은그림찾기",
    primaryColor: "#F4D03F",
    icon: "icon.png",
  },
  web: {
    host: "localhost",
    port: 5173,
    commands: {
      dev: "vite dev",
      build: "vite build",
    },
  },
  permissions: [],
  outdir: "dist",
});
