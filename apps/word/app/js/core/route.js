(() => {
function createAtelierRouteRuntime(config = {}) {
  const renderHome = typeof config.renderHome === "function" ? config.renderHome : () => {};
  const renderThemes = typeof config.renderThemes === "function" ? config.renderThemes : () => {};
  const renderAffinity = typeof config.renderAffinity === "function" ? config.renderAffinity : () => {};
  const renderExercise = typeof config.renderExercise === "function" ? config.renderExercise : () => {};
  const renderProgress = typeof config.renderProgress === "function" ? config.renderProgress : () => {};
  const renderProfile = typeof config.renderProfile === "function" ? config.renderProfile : () => {};

  return {
    renderFromHash(hashValue) {
      const hash = String(hashValue || "").replace(/^#/, "");
      const [route, param1, param2] = hash.split("/");

      if (route === "themes") {
        renderThemes();
        return "themes";
      }
      if (route === "affinity") {
        renderAffinity(param1 || null, param2 || null);
        return "affinity";
      }
      if (route === "exercise" && param1) {
        renderExercise(param1);
        return "exercise";
      }
      if (route === "progress") {
        renderProgress();
        return "progress";
      }
      if (route === "profile") {
        renderProfile();
        return "profile";
      }

      renderHome();
      return "home";
    },
  };
}

window.createAtelierRouteRuntime = createAtelierRouteRuntime;
})();
