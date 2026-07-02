(() => {
if (!window.bootstrapConfiguredAtelierApp) {
  throw new Error("Bootstrap partage bootstrapConfiguredAtelierApp non charge");
}

window.bootstrapConfiguredAtelierApp();
})();
