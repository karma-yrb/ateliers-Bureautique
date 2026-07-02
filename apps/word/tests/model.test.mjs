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
  modelGlobalName: "WordAtelierModel",
});

registerSharedModelContractTests(createModel);

test("getExerciseStepsView separates introductory sentence from actionable steps", () => {
  const model = createModel({
    modules: [{ id: "m1", cleanName: "Prise en main", section: "bases", sectionOrder: 1, orderInSection: 1 }],
    exercises: [
      {
        id: "ex-001",
        globalIndex: 1,
        moduleId: "m1",
        moduleNameClean: "Prise en main",
        num: 1,
        title: "Prise en main du logiciel Word",
        instructions: [
          "Petit exercice de prise en main pour sortir de la presentation classique.",
          "Faites disparaitre les regles superieures et laterales.",
          "Presentez le document sur deux feuilles cote a cote.",
        ],
      },
    ],
  });

  const exercise = model.getExerciseById("ex-001");
  const stepsVm = model.getExerciseStepsView(exercise);

  assert.equal(stepsVm.preamble, "Petit exercice de prise en main pour sortir de la presentation classique.");
  assert.deepEqual(Array.from(stepsVm.steps), [
    "Faites disparaitre les regles superieures et laterales.",
    "Presentez le document sur deux feuilles cote a cote.",
  ]);
});
