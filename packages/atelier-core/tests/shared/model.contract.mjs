import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";

function createBaseDataset() {
  return {
    modules: [
      { id: "m1", cleanName: "Saisir du texte", section: "bases", sectionOrder: 1, orderInSection: 1 },
      { id: "m2", cleanName: "Smart Art", section: "avance", sectionOrder: 2, orderInSection: 2 },
      { id: "m3", cleanName: "Impression", section: "bases", sectionOrder: 1, orderInSection: 3 },
    ],
    exercises: [
      {
        id: "ex-001",
        globalIndex: 1,
        moduleId: "m1",
        moduleNameClean: "Saisir du texte",
        num: 1,
        title: "Selectionner du texte",
        description: "Description",
        instructions: ["Etape 1", "Etape 2"],
        imageEnonce: "https://img/ex1.jpg",
        imageResultat: null,
      },
      {
        id: "ex-002",
        globalIndex: 2,
        moduleId: "m1",
        moduleNameClean: "Saisir du texte",
        num: 2,
        title: "Mettre en forme",
        instructions: ["Etape 1"],
        imageEnonce: "https://img/ex2-enonce.jpg",
        imageResultat: "https://img/ex2-result.jpg",
      },
      {
        id: "ex-003",
        globalIndex: 3,
        moduleId: "m2",
        moduleNameClean: "Smart Art",
        num: 1,
        title: "Creer un Smart Art",
        instructions: ["Etape 1", "Etape 2", "Etape 3"],
      },
    ],
  };
}

export async function createConfiguredModelFactory({ appRoot, modelGlobalName }) {
  const coreModelSource = await fs.readFile(path.join(appRoot, "js", "core", "model.js"), "utf8");
  const appConfigSource = await fs.readFile(path.join(appRoot, "js", "app-config.js"), "utf8");
  const appRuntimeSource = await fs.readFile(path.join(appRoot, "js", "core", "app-runtime.js"), "utf8");

  return function createModel(rawData = createBaseDataset()) {
    const context = vm.createContext({ window: {} });
    vm.runInContext(appConfigSource, context, { filename: "js/app-config.js" });
    vm.runInContext(coreModelSource, context, { filename: "js/core/model.js" });
    vm.runInContext(appRuntimeSource, context, { filename: "js/core/app-runtime.js" });
    context.window.registerConfiguredAtelierModel();
    const ModelClass = context.window[modelGlobalName];
    return new ModelClass(rawData);
  };
}

export function registerSharedModelContractTests(createModel) {
  test("constructor filters modules without exercises", () => {
    const model = createModel();
    const themeIds = model.getThemes().map((theme) => theme.id);
    assert.deepEqual(themeIds, ["m1", "m2"]);
  });

  test("markExerciseDone updates summary and history", () => {
    const model = createModel();
    model.markExerciseDone("ex-001", true);
    const summary = model.getSummary();

    assert.equal(summary.completed, 1);
    assert.equal(model.getIsDone("ex-001"), true);
    assert.equal(model.getLastExercise().id, "ex-001");
  });

  test("resume exercise continues in same theme when possible", () => {
    const model = createModel();
    model.markExerciseDone("ex-001", true);
    const resume = model.getResumeExercise();
    assert.equal(resume.id, "ex-002");
  });

  test("resume exercise returns last opened exercise when it is not done yet", () => {
    const model = createModel();
    model.markExerciseOpened("ex-003");
    const resume = model.getResumeExercise();
    assert.equal(resume.id, "ex-003");
  });

  test("single image is treated as expected result when result image is missing", () => {
    const model = createModel();
    const exercise = model.getExerciseById("ex-001");
    const visuals = model.getVisualsForExercise(exercise);
    assert.deepEqual(Array.from(visuals.enonceImages), []);
    assert.equal(
      JSON.stringify(Array.from(visuals.resultImages)),
      JSON.stringify([{ src: "https://img/ex1.jpg", caption: "" }]),
    );
  });

  test("multiple fallback result images are preserved", () => {
    const model = createModel({
      modules: [{ id: "m1", cleanName: "Prise en main", section: "bases", sectionOrder: 1, orderInSection: 1 }],
      exercises: [
        {
          id: "ex-001",
          globalIndex: 1,
          moduleId: "m1",
          moduleNameClean: "Prise en main",
          num: 1,
          title: "Plusieurs images",
          instructions: ["Etape 1"],
          imageResultat: ["data/ex-001a.png", "data/ex-001b.png", "data/ex-001c.png"],
        },
      ],
    });

    const exercise = model.getExerciseById("ex-001");
    const visuals = model.getVisualsForExercise(exercise);

    assert.deepEqual(JSON.parse(JSON.stringify(visuals.resultImages)), [
      { src: "data/ex-001a.png", caption: "" },
      { src: "data/ex-001b.png", caption: "" },
      { src: "data/ex-001c.png", caption: "" },
    ]);
  });

  test("importProgressObject sanitizes invalid exercise ids", () => {
    const model = createModel();
    model.importProgressObject({
      completedIds: ["ex-001", "unknown-id"],
      lastExerciseId: "unknown-id",
      history: [
        { date: "2026-04-20T10:00:00.000Z", exerciseId: "ex-001", delta: 1 },
        { date: "2026-04-20", exerciseId: "unknown-id", delta: 1 },
      ],
    });

    assert.equal(model.getIsDone("ex-001"), true);
    assert.equal(model.getIsDone("unknown-id"), false);
    assert.equal(model.getLastExercise().id, "ex-001");
  });

  test("resetProgress clears completion data", () => {
    const model = createModel();
    model.markExerciseDone("ex-001", true);
    model.resetProgress();

    const summary = model.getSummary();
    assert.equal(summary.completed, 0);
    assert.equal(model.getLastExercise(), null);
  });

  test("theme affinity groups are generated by pedagogical family", () => {
    const model = createModel();
    const affinityIds = Array.from(model.getThemeAffinityGroups(), (group) => group.id);
    assert.deepEqual(affinityIds, ["fondations", "visuel"]);
  });
}
