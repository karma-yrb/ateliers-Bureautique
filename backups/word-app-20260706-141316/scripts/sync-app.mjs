import path from "node:path";
import { fileURLToPath } from "node:url";
import { syncBrowserRuntime } from "../../../packages/atelier-core/scripts/sync-browser-runtime.mjs";
import { syncAppHtml } from "../../../packages/atelier-core/scripts/sync-app-html.mjs";
import { syncApp } from "../../../packages/atelier-core/scripts/sync-app.mjs";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");

syncBrowserRuntime({ appRoot: ROOT });
await syncAppHtml({ appRoot: ROOT, appName: "Word" });
syncApp({ root: ROOT });
