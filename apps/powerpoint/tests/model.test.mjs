import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  createConfiguredModelFactory,
  registerSharedModelContractTests,
} from "../../../packages/atelier-core/tests/shared/model.contract.mjs";

const APP_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const createModel = await createConfiguredModelFactory({
  appRoot: APP_ROOT,
  modelGlobalName: "PowerPointAtelierModel",
});

registerSharedModelContractTests(createModel);

test("exercise tabs are normalized into visuals payload", () => {
  const model = createModel({
    modules: [
      { id: "m1", cleanName: "Saisir du texte", section: "bases", sectionOrder: 1, orderInSection: 1 },
      { id: "m2", cleanName: "Smart Art", section: "avance", sectionOrder: 2, orderInSection: 2 },
    ],
    exercises: [
      {
        id: "ex-001",
        globalIndex: 1,
        moduleId: "m1",
        moduleNameClean: "Saisir du texte",
        num: 1,
        title: "Selectionner du texte",
        instructions: ["Etape 1"],
      },
      {
        id: "ex-004",
        globalIndex: 4,
        moduleId: "m2",
        moduleNameClean: "Smart Art",
        num: 2,
        title: "Tabs",
        exerciseTabs: [
          {
            id: "tab-1",
            title: "Exercice 1",
            instructions: ["Consigne A", "Consigne B"],
            resultImages: ["https://img/tab-1.jpg"],
          },
        ],
      },
    ],
  });
  const exercise = model.getExerciseById("ex-004");
  const visuals = model.getVisualsForExercise(exercise);

  assert.equal(visuals.tabs.length, 1);
  assert.deepEqual(JSON.parse(JSON.stringify(visuals.tabs[0])), {
    id: "tab-1",
    title: "Exercice 1",
    instructions: ["Consigne A", "Consigne B"],
    resultImages: [{ src: "https://img/tab-1.jpg", caption: "" }],
    enonceImages: [],
  });
});
