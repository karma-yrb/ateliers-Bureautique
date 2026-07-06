import path from "node:path";
import { fileURLToPath } from "node:url";
import { registerBootstrapContractTests } from "../../../packages/atelier-core/tests/shared/bootstrap.contract.mjs";

const APP_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

registerBootstrapContractTests({
  appRoot: APP_ROOT,
  appLabel: "PowerPoint",
  datasetGlobalName: "POWERPOINT_ATELIER_DATA",
  modelGlobalName: "PowerPointAtelierModel",
  viewGlobalName: "PowerPointAtelierView",
  storageGlobalName: "PowerPointAtelierFileStorage",
  controllerGlobalName: "PowerPointAtelierController",
  createDataset() {
    return {
      modules: [
        { id: "m1", cleanName: "Bases PowerPoint", section: "bases", sectionOrder: 1, orderInSection: 1 },
      ],
      exercises: [
        {
          id: "ex-001",
          globalIndex: 1,
          moduleId: "m1",
          moduleNameClean: "Bases PowerPoint",
          num: 1,
          title: "Creer une premiere presentation",
          instructions: ["Inserer un titre et une image."],
        },
      ],
    };
  },
});
