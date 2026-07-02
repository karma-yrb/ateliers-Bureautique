import path from "node:path";
import { fileURLToPath } from "node:url";
import { registerBootstrapContractTests } from "../../../packages/atelier-core/tests/shared/bootstrap.contract.mjs";

const APP_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

registerBootstrapContractTests({
  appRoot: APP_ROOT,
  appLabel: "Word",
  datasetGlobalName: "WORD_ATELIER_DATA",
  modelGlobalName: "WordAtelierModel",
  viewGlobalName: "WordAtelierView",
  storageGlobalName: "WordAtelierFileStorage",
  controllerGlobalName: "WordAtelierController",
  createDataset() {
    return {
      modules: [
        { id: "m1", cleanName: "Bases Word", section: "bases", sectionOrder: 1, orderInSection: 1 },
      ],
      exercises: [
        {
          id: "ex-001",
          globalIndex: 1,
          moduleId: "m1",
          moduleNameClean: "Bases Word",
          num: 1,
          title: "Mettre en forme un texte",
          instructions: ["Appliquer une mise en forme simple."],
        },
      ],
    };
  },
});
