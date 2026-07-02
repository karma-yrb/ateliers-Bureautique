import path from "node:path";
import { fileURLToPath } from "node:url";
import { registerUiContractTests } from "../../../packages/atelier-core/tests/shared/ui-contract.contract.mjs";

const APP_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

registerUiContractTests({
  appRoot: APP_ROOT,
  appLabel: "Excel",
  forbiddenIds: ["exercise-docx-btn", "exercise-xlsx-btn"],
});
