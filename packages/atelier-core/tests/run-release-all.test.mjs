import assert from "node:assert/strict";
import test from "node:test";
import { runReleaseAll } from "../scripts/run-release-all.mjs";

test("runReleaseAll prefers Git Bash on Windows when available", () => {
  const calls = [];
  const fakeProcess = {
    env: {
      LOCALAPPDATA: "C:\\Users\\Yannick\\AppData\\Local",
    },
    platform: "win32",
    exit(status) {
      calls.push({ kind: "exit", status });
    },
  };

  const status = runReleaseAll({
    processImpl: fakeProcess,
    existsSyncImpl(filePath) {
      return filePath.endsWith("\\Git\\bin\\bash.exe");
    },
    spawnSyncImpl(command, args, options) {
      calls.push({ kind: "spawn", command, args, options });
      return { status: 0 };
    },
    exitOnComplete: false,
  });

  assert.equal(status, 0);
  assert.deepEqual(calls, [
    {
      kind: "spawn",
      command: "C:\\Users\\Yannick\\AppData\\Local\\Programs\\Git\\bin\\bash.exe",
      args: ["scripts/release-all.sh"],
      options: { stdio: "inherit" },
    },
  ]);
});

test("runReleaseAll falls back to bash and returns a non-zero default status", () => {
  const status = runReleaseAll({
    processImpl: {
      env: {},
      platform: "linux",
      exit() {},
    },
    existsSyncImpl() {
      return false;
    },
    spawnSyncImpl(command, args) {
      assert.equal(command, "bash");
      assert.deepEqual(args, ["scripts/release-all.sh"]);
      return {};
    },
    exitOnComplete: false,
  });

  assert.equal(status, 1);
});
