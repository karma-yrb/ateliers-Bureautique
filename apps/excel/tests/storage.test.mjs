import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  createConfiguredStorageFactory,
  registerSharedStorageContractTests,
} from "../../../packages/atelier-core/tests/shared/storage.contract.mjs";

const APP_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const createStorage = await createConfiguredStorageFactory({
  appRoot: APP_ROOT,
  storageGlobalName: "ExcelAtelierFileStorage",
});

registerSharedStorageContractTests(createStorage);
