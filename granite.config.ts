import { defineConfig } from "@apps-in-toss/web-framework/config";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseEnv } from "node:util";

const LOCAL_DEV_DISPLAY_NAME = "같은그림찾기";
const LOCAL_DEV_ICON = "icon.png";

const nodeProcess = (
  globalThis as typeof globalThis & {
    process?: {
      argv?: string[];
      cwd?: () => string;
      env?: Record<string, string | undefined>;
    };
  }
).process;

const processEnv = nodeProcess?.env ?? {};
const isBuildCommand =
  processEnv.npm_lifecycle_event === "build" ||
  nodeProcess?.argv?.some((arg) => arg === "build") === true;
const envMode = isBuildCommand ? "production" : "development";

function parseEnvFile(filePath: string) {
  if (!existsSync(filePath)) {
    return {};
  }

  return parseEnv(readFileSync(filePath, "utf8"));
}

function loadLocalEnv(mode: string) {
  const cwd = nodeProcess?.cwd?.();

  if (cwd == null) {
    return {};
  }

  return {
    ...parseEnvFile(resolve(cwd, ".env")),
    ...parseEnvFile(resolve(cwd, ".env.local")),
    ...parseEnvFile(resolve(cwd, `.env.${mode}`)),
    ...parseEnvFile(resolve(cwd, `.env.${mode}.local`)),
  };
}

const fileEnv = loadLocalEnv(envMode);
const env = {
  ...fileEnv,
  ...processEnv,
};

function getDisplayName() {
  const displayName = env.AIT_APP_DISPLAY_NAME?.trim();

  if (displayName != null && displayName.length > 0) {
    return displayName;
  }

  if (isBuildCommand) {
    throw new Error(
      "AIT_APP_DISPLAY_NAME is required for release builds. Set it to the exact app name submitted in Apps in Toss Console app info.",
    );
  }

  return LOCAL_DEV_DISPLAY_NAME;
}

function getBrandIcon() {
  const iconUrl = env.AIT_BRAND_ICON_URL?.trim();

  if (iconUrl != null && iconUrl.length > 0) {
    let parsedUrl: URL;

    try {
      parsedUrl = new URL(iconUrl);
    } catch {
      throw new Error("AIT_BRAND_ICON_URL must be a valid HTTPS URL.");
    }

    if (parsedUrl.protocol !== "https:") {
      throw new Error("AIT_BRAND_ICON_URL must be an HTTPS URL.");
    }

    return iconUrl;
  }

  if (isBuildCommand) {
    throw new Error(
      "AIT_BRAND_ICON_URL is required for release builds. Copy the app logo URL from Apps in Toss Console > app info and set it before running npm run build.",
    );
  }

  return LOCAL_DEV_ICON;
}

export default defineConfig({
  appName: "match-picture-app",
  brand: {
    displayName: getDisplayName(),
    primaryColor: "#F4D03F",
    icon: getBrandIcon(),
  },
  web: {
    host: "localhost",
    port: 5173,
    commands: {
      dev: "vite dev --host 0.0.0.0",
      build: "vite build",
    },
  },
  webViewProps: {
    type: "game",
    bounces: false,
    pullToRefreshEnabled: false,
    overScrollMode: "never",
    allowsBackForwardNavigationGestures: false,
  },
  permissions: [],
  outdir: "dist",
});
