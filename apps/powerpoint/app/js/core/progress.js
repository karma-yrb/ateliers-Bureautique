(() => {
function createAtelierProgressRuntime(config = {}) {
  const persistenceRuntime = config.persistenceRuntime;
  const view = config.view;
  const model = config.model;

  return {
    render() {
      persistenceRuntime.persistUiState({ page: "progress" });
      view.showPage("progress");
      const summary = model.getSummary();
      const curveSeries = model.getCurveSeries(30);
      view.renderProgress({ ...summary, curveSeries });
    },
  };
}

window.createAtelierProgressRuntime = createAtelierProgressRuntime;
})();
