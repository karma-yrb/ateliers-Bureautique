import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  createConfiguredStorageFactory,
  createDirectoryHandle,
  registerSharedStorageContractTests,
} from "../../../packages/atelier-core/tests/shared/storage.contract.mjs";

const APP_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const createStorage = await createConfiguredStorageFactory({
  appRoot: APP_ROOT,
  storageGlobalName: "WordAtelierFileStorage",
});

registerSharedStorageContractTests(createStorage);

test("loadUserProfile returns null for a new folder without ProgressionAtelier", async () => {
  const storage = createStorage();
  const newFolder = createDirectoryHandle("TE", {
    hasProgress: false,
    id: "te",
  });

  const profile = await storage.loadUserProfile(newFolder, "TE", false);

  assert.equal(profile, null);
});

test("pickWorkFile opens a file picker, not a directory picker", async () => {
  const fileHandle = { kind: "file", name: "exercice.docx" };
  let filePickerOptions = null;
  const storage = createStorage({
    async showDirectoryPicker() {
      throw new Error("directory picker should not be used");
    },
    async showOpenFilePicker(options) {
      filePickerOptions = options;
      return [fileHandle];
    },
  });

  const selected = await storage.pickWorkFile();

  assert.equal(selected, fileHandle);
  assert.equal(filePickerOptions.multiple, false);
  assert.equal(filePickerOptions.types[0].description, "Document Word");
});
