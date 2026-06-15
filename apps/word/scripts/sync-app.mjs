import path from "node:path";
import { fileURLToPath } from "node:url";
import { syncApp } from "../../../packages/atelier-core/scripts/sync-app.mjs";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");

syncApp({ root: ROOT });
