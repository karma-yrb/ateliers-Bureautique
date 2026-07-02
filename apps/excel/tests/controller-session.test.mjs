import path from "node:path";
import { fileURLToPath } from "node:url";
import { registerControllerSessionContractTests } from "../../../packages/atelier-core/tests/shared/controller-session.contract.mjs";

const APP_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PACKAGE_ROOT = path.resolve(APP_ROOT, "..", "..", "packages", "atelier-core");

await registerControllerSessionContractTests({
  appRoot: APP_ROOT,
  packageRoot: PACKAGE_ROOT,
  controllerGlobalName: "ExcelAtelierController",
});
