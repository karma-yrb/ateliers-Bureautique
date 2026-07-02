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
window.registerConfiguredAtelierModel = registerConfiguredAtelierModel;
window.registerConfiguredAtelierView = registerConfiguredAtelierView;
window.registerConfiguredAtelierStorage = registerConfiguredAtelierStorage;
window.registerConfiguredAtelierController = registerConfiguredAtelierController;
window.registerConfiguredAtelierApp = registerConfiguredAtelierApp;
window.bootstrapConfiguredAtelierApp = bootstrapConfiguredAtelierApp;
})();
