(() => {
function requireWindowValue(name, message) {
  const value = window[name];
  if (!value) {
    throw new Error(message || `${name} introuvable`);
  }
  return value;
}

function getAtelierAppConfig() {
  const config = window.ATELIER_APP_CONFIG;
  if (!config) {
    throw new Error("Configuration d'application ATELIER_APP_CONFIG introuvable");
  }
  return config;
}

function getAtelierDeploymentDefaults(appConfig = getAtelierAppConfig()) {
  return {
    environment: {
      label: appConfig.deployment?.environment?.label || appConfig.controller?.officeAppName || "atelier",
      defaultMode: "local",
      allowGuestLocalMode: true,
      offerConnectedModeWhenServerReachable: true,
    },
    server: {
      enabled: false,
      baseUrl: "",
      healthcheckPath: "/health",
      clientConfigPath: "/config/client",
      timeoutMs: 1500,
    },
    networkShares: {
      userFoldersRoot: "",
      documentsRoot: "",
      exportsRoot: "",
      reportsRoot: "",
    },
    features: {
      trainerAdmin: false,
      centralUserDirectory: false,
      remoteProgressSync: false,
    },
  };
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function mergeDeep(base, extra) {
  if (!isPlainObject(base)) return extra;
  if (!isPlainObject(extra)) return { ...base };

  const merged = { ...base };
  for (const [key, value] of Object.entries(extra)) {
    if (isPlainObject(value) && isPlainObject(base[key])) {
      merged[key] = mergeDeep(base[key], value);
    } else {
      merged[key] = value;
    }
  }
  return merged;
}

async function loadAtelierDeploymentConfig(appConfig = getAtelierAppConfig()) {
  const defaults = getAtelierDeploymentDefaults(appConfig);
  const configUrl = appConfig.deployment?.configUrl || "deployment-config.json";
  const fetchImpl = typeof window.fetch === "function" ? window.fetch.bind(window) : null;

  if (!fetchImpl) {
    const fallback = mergeDeep(defaults, {
      meta: {
        source: "defaults",
        configUrl,
        loaded: false,
        reason: "fetch-unavailable",
      },
    });
    window.ATELIER_DEPLOYMENT_CONFIG = fallback;
    return fallback;
  }

  try {
    const response = await fetchImpl(configUrl, {
      method: "GET",
      cache: "no-store",
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      const fallback = mergeDeep(defaults, {
        meta: {
          source: "defaults",
          configUrl,
          loaded: false,
          reason: `http-${response.status}`,
        },
      });
      window.ATELIER_DEPLOYMENT_CONFIG = fallback;
      return fallback;
    }

    const parsed = await response.json();
    const merged = mergeDeep(defaults, parsed);
    merged.meta = {
      source: "file",
      configUrl,
      loaded: true,
    };
    window.ATELIER_DEPLOYMENT_CONFIG = merged;
    return merged;
  } catch (error) {
    const fallback = mergeDeep(defaults, {
      meta: {
        source: "defaults",
        configUrl,
        loaded: false,
        reason: error && error.name ? error.name : "fetch-error",
      },
    });
    window.ATELIER_DEPLOYMENT_CONFIG = fallback;
    return fallback;
  }
}

function normalizeBaseUrl(value) {
  return String(value || "").trim().replace(/\/+$/, "");
}

async function checkAtelierServerAvailability(deploymentConfig = window.ATELIER_DEPLOYMENT_CONFIG || getAtelierDeploymentDefaults()) {
  const serverConfig = deploymentConfig && deploymentConfig.server ? deploymentConfig.server : {};
  const enabled = serverConfig.enabled !== false;
  const baseUrl = normalizeBaseUrl(serverConfig.baseUrl);
  const healthcheckPath = String(serverConfig.healthcheckPath || "/health");
  const timeoutMs = Number.isFinite(serverConfig.timeoutMs)
    ? Math.max(250, Number(serverConfig.timeoutMs))
    : 1500;

  if (!enabled) {
    const result = {
      available: false,
      reason: "server-disabled",
      checkedAt: new Date().toISOString(),
      baseUrl,
      healthcheckUrl: "",
    };
    window.ATELIER_SERVER_STATUS = result;
    return result;
  }

  if (!baseUrl) {
    const result = {
      available: false,
      reason: "server-base-url-missing",
      checkedAt: new Date().toISOString(),
      baseUrl,
      healthcheckUrl: "",
    };
    window.ATELIER_SERVER_STATUS = result;
    return result;
  }

  const fetchImpl = typeof window.fetch === "function" ? window.fetch.bind(window) : null;
  if (!fetchImpl) {
    const result = {
      available: false,
      reason: "fetch-unavailable",
      checkedAt: new Date().toISOString(),
      baseUrl,
      healthcheckUrl: `${baseUrl}${healthcheckPath}`,
    };
    window.ATELIER_SERVER_STATUS = result;
    return result;
  }

  const controller = typeof window.AbortController === "function" ? new AbortController() : null;
  const timeoutId = controller
    ? window.setTimeout(() => controller.abort(), timeoutMs)
    : null;

  try {
    const response = await fetchImpl(`${baseUrl}${healthcheckPath}`, {
      method: "GET",
      cache: "no-store",
      signal: controller ? controller.signal : undefined,
    });
    const result = {
      available: response.ok,
      reason: response.ok ? "ok" : `http-${response.status}`,
      checkedAt: new Date().toISOString(),
      baseUrl,
      healthcheckUrl: `${baseUrl}${healthcheckPath}`,
      status: response.status,
    };
    window.ATELIER_SERVER_STATUS = result;
    return result;
  } catch (error) {
    const result = {
      available: false,
      reason: error && error.name ? error.name : "network-error",
      checkedAt: new Date().toISOString(),
      baseUrl,
      healthcheckUrl: `${baseUrl}${healthcheckPath}`,
    };
    window.ATELIER_SERVER_STATUS = result;
    return result;
  } finally {
    if (timeoutId) window.clearTimeout(timeoutId);
  }
}

function registerConfiguredAtelierModel(config = getAtelierAppConfig()) {
  const modelClass = requireWindowValue("AtelierModel", "Classe commune AtelierModel non chargee");
  window[config.modelGlobalName] = modelClass;
  return window[config.modelGlobalName];
}

function registerConfiguredAtelierView(config = getAtelierAppConfig()) {
  const viewClass = requireWindowValue("AtelierView", "Classe commune AtelierView non chargee");
  window[config.viewGlobalName] = viewClass;
  return window[config.viewGlobalName];
}

function registerConfiguredAtelierStorage(config = getAtelierAppConfig()) {
  const storageFactory = requireWindowValue("createAtelierFileStorage", "Fabrique commune createAtelierFileStorage non chargee");
  window[config.storageGlobalName] = storageFactory(config.storage || {});
  return window[config.storageGlobalName];
}

function registerConfiguredAtelierController(config = getAtelierAppConfig()) {
  const controllerFactory = requireWindowValue("createAtelierController", "Fabrique commune createAtelierController non chargee");
  window[config.controllerGlobalName] = controllerFactory(config.controller || {});
  return window[config.controllerGlobalName];
}

function registerConfiguredAtelierApp(config = getAtelierAppConfig()) {
  registerConfiguredAtelierModel(config);
  registerConfiguredAtelierView(config);
  registerConfiguredAtelierStorage(config);
  registerConfiguredAtelierController(config);
  return config;
}

function bootstrapConfiguredAtelierApp(config = getAtelierAppConfig()) {
  registerConfiguredAtelierApp(config);

  const data = window[config.datasetGlobalName];
  if (!data) {
    throw new Error(`Donnees ${config.datasetGlobalName} introuvables`);
  }

  const ModelClass = requireWindowValue(config.modelGlobalName, `Classe ${config.modelGlobalName} non chargee`);
  const ViewClass = requireWindowValue(config.viewGlobalName, `Classe ${config.viewGlobalName} non chargee`);
  const StorageClass = requireWindowValue(config.storageGlobalName, `Classe ${config.storageGlobalName} non chargee`);
  const ControllerClass = requireWindowValue(config.controllerGlobalName, `Classe ${config.controllerGlobalName} non chargee`);

  const model = new ModelClass(data);
  const view = new ViewClass();
  const storage = new StorageClass();
  const controller = new ControllerClass(model, view, storage);

  controller.init();
  return { model, view, storage, controller };
}

window.getAtelierAppConfig = getAtelierAppConfig;
window.getAtelierDeploymentDefaults = getAtelierDeploymentDefaults;
window.loadAtelierDeploymentConfig = loadAtelierDeploymentConfig;
window.checkAtelierServerAvailability = checkAtelierServerAvailability;
window.registerConfiguredAtelierModel = registerConfiguredAtelierModel;
window.registerConfiguredAtelierView = registerConfiguredAtelierView;
window.registerConfiguredAtelierStorage = registerConfiguredAtelierStorage;
window.registerConfiguredAtelierController = registerConfiguredAtelierController;
window.registerConfiguredAtelierApp = registerConfiguredAtelierApp;
window.bootstrapConfiguredAtelierApp = bootstrapConfiguredAtelierApp;
})();
