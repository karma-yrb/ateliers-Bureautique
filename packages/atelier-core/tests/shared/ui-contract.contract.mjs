import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { REQUIRED_DOM_IDS, SHARED_RUNTIME_SCRIPT_ORDER } from "../../runtime-contract.mjs";

export function registerUiContractTests({ appRoot, appLabel, forbiddenIds = [] }) {
  test(`${appLabel} HTML exposes the shared runtime DOM contract`, async () => {
    const html = await fs.readFile(path.join(appRoot, "index.html"), "utf8");

    for (const id of REQUIRED_DOM_IDS) {
      assert.match(html, new RegExp(`id="${id}"`));
    }

    for (const id of forbiddenIds) {
      assert.doesNotMatch(html, new RegExp(`id="${id}"`));
    }
  });

  test(`${appLabel} HTML loads shared runtime scripts in dependency order`, async () => {
    const html = await fs.readFile(path.join(appRoot, "index.html"), "utf8");
    const scriptIndexes = SHARED_RUNTIME_SCRIPT_ORDER.map((scriptPath) => html.indexOf(`src="${scriptPath}"`));

    for (const scriptIndex of scriptIndexes) {
      assert.notEqual(scriptIndex, -1);
    }

    for (let index = 0; index < scriptIndexes.length - 1; index += 1) {
      assert.ok(scriptIndexes[index] < scriptIndexes[index + 1]);
    }
  });
}
