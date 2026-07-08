(() => {
function createAtelierPersistenceRuntime(config = {}) {
  const localStorage = config.localStorage || window.localStorage;
  const routeStorageKey = config.routeStorageKey || "";
  const uiStateStorageKey = config.uiStateStorageKey || "";
  const userSnapshotStorageKey = config.userSnapshotStorageKey || "";
  const model = config.model || null;

  function writeLocalStorage(key, value) {
    try {
      if (!key) return false;
      localStorage.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  }

  function readLocalStorageText(key) {
    try {
      if (!key) return "";
      return String(localStorage.getItem(key) || "").trim();
    } catch {
      return "";
    }
  }

  function readLocalStorageJson(key) {
    try {
      const raw = readLocalStorageText(key);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : null;
    } catch {
      return null;
    }
  }

  function persistCurrentHash(currentHash) {
    const normalizedHash = String(currentHash || "").trim();
    if (!normalizedHash) return;
    writeLocalStorage(routeStorageKey, normalizedHash);
  }

  function getPersistedHash() {
    const stored = readLocalStorageText(routeStorageKey);
    if (!stored.startsWith("#")) return "";
    return stored;
  }

  function persistUiState(state) {
    if (!state || typeof state !== "object") return;
    writeLocalStorage(uiStateStorageKey, JSON.stringify(state));
  }

  function getPersistedUiState() {
    return readLocalStorageJson(uiStateStorageKey);
  }

  function persistUserSnapshot(snapshot) {
    if (!snapshot || typeof snapshot !== "object") return;
    writeLocalStorage(userSnapshotStorageKey, JSON.stringify({
      firstName: String(snapshot.firstName || "").trim(),
      initials: String(snapshot.initials || "").trim(),
      folderName: String(snapshot.folderName || "").trim(),
      storageMode: String(snapshot.storageMode || "").trim(),
    }));
  }

  function getPersistedUserSnapshot() {
    const parsed = readLocalStorageJson(userSnapshotStorageKey);
    if (!parsed) return null;
    return {
      firstName: String(parsed.firstName || "").trim(),
      initials: String(parsed.initials || "").trim(),
      folderName: String(parsed.folderName || "").trim(),
      storageMode: String(parsed.storageMode || "").trim(),
    };
  }

  function buildFallbackHashFromUiState() {
    const state = getPersistedUiState();
    if (!state) return "";

    if (state.page === "exercise" && state.exerciseId) {
      const exercise = model.getExerciseById(state.exerciseId);
      if (exercise) return `#exercise/${exercise.id}`;
    }

    if (state.page === "affinity" && state.affinityId) {
      if (state.themeId) {
        const theme = model.getThemeById(state.themeId);
        if (theme && model.getAffinityIdForTheme(theme.id) === state.affinityId) {
          return `#affinity/${state.affinityId}/${theme.id}`;
        }
      }
      return `#affinity/${state.affinityId}`;
    }

    if (state.page === "themes" || state.page === "progress" || state.page === "profile" || state.page === "home") {
      return `#${state.page}`;
    }

    return "";
  }

  return {
    persistCurrentHash,
    getPersistedHash,
    persistUiState,
    getPersistedUiState,
    persistUserSnapshot,
    getPersistedUserSnapshot,
    buildFallbackHashFromUiState,
  };
}

window.createAtelierPersistenceRuntime = createAtelierPersistenceRuntime;
})();
