import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import { APP_BOOTSTRAP_SCRIPT_ORDER, APP_RUNTIME_SETUP_SCRIPT_ORDER } from "../../runtime-contract.mjs";

async function readSource(appRoot, relativePath) {
  return fs.readFile(path.join(appRoot, relativePath), "utf8");
}

export function registerBootstrapContractTests({
  appRoot,
  appLabel,
  datasetGlobalName,
  modelGlobalName,
  viewGlobalName,
  storageGlobalName,
  controllerGlobalName,
  createDataset,
}) {
  test(`${appLabel} browser globals match app bootstrap contract`, async () => {
    const context = vm.createContext({ window: {}, console });

    for (const file of APP_RUNTIME_SETUP_SCRIPT_ORDER) {
      vm.runInContext(await readSource(appRoot, file), context, { filename: file });
    }

    context.window.registerConfiguredAtelierApp();

    assert.equal(typeof context.window[modelGlobalName], "function");
    assert.equal(typeof context.window[viewGlobalName], "function");
    assert.equal(typeof context.window[storageGlobalName], "function");
    assert.equal(typeof context.window[controllerGlobalName], "function");

    const dataset = createDataset();
    const created = {};
    context.window[datasetGlobalName] = dataset;
    context.window.AtelierModel = class {
      constructor(data) {
        assert.equal(data, dataset);
        created.model = this;
      }
    };
    context.window.AtelierView = class {
      constructor() {
        created.view = this;
      }
    };
    context.window.createAtelierFileStorage = () => class {
      constructor() {
        created.storage = this;
      }
    };
    context.window.createAtelierController = () => class {
      constructor(model, view, storage) {
        assert.equal(model, created.model);
        assert.equal(view, created.view);
        assert.equal(storage, created.storage);
      }

      init() {
        created.initCalled = true;
      }
    };

    vm.runInContext(await readSource(appRoot, APP_BOOTSTRAP_SCRIPT_ORDER.at(-1)), context, {
      filename: APP_BOOTSTRAP_SCRIPT_ORDER.at(-1),
    });

    assert.equal(created.initCalled, true);
  });
}
