(() => {
function formatDay(isoDay) {
  const parts = String(isoDay || "").split("-");
  if (parts.length !== 3) return "";
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function createAtelierHomeRuntime(config = {}) {
  const persistenceRuntime = config.persistenceRuntime;
  const view = config.view;
  const model = config.model;

  return {
    render() {
      persistenceRuntime.persistUiState({ page: "home" });
      view.showPage("home");
      const summary = model.getSummary();
      const lastExercise = model.getLastExercise();
      const resumeExercise = model.getResumeExercise();
      let lastDoneText = "Pas encore termine.";
      if (lastExercise) {
        const done = model.getIsDone(lastExercise.id);
        if (done) {
          const day = model.getLastCompletedDate(lastExercise.id);
          lastDoneText = day ? `Fait le ${formatDay(day)}.` : "Dernier exercice marque comme fait.";
        } else {
          lastDoneText = "Dernier exercice ouvert.";
        }
      }

      let startLabel = "Commencer maintenant";
      let startTheme = "Aucun theme selectionne";
      let startExercise = "Choisissez votre premier exercice";
      let startHelp = "Lance automatiquement le prochain exercice conseille.";
      if (resumeExercise && summary.completed > 0) {
        startLabel = `Continuer : Exercice ${resumeExercise.num}`;
        startTheme = resumeExercise.moduleName;
        startExercise = `Exercice ${resumeExercise.num} - ${resumeExercise.title}`;
        startHelp = `${resumeExercise.title} (${resumeExercise.moduleName})`;
      } else if (resumeExercise) {
        startLabel = `Demarrer : Exercice ${resumeExercise.num}`;
        startTheme = resumeExercise.moduleName;
        startExercise = `Exercice ${resumeExercise.num} - ${resumeExercise.title}`;
        startHelp = `${resumeExercise.title} (${resumeExercise.moduleName})`;
      }

      view.renderHome({
        ...summary,
        lastExercise,
        lastDoneText,
        startLabel,
        startTheme,
        startExercise,
        startHelp,
      });
    },
  };
}

window.createAtelierHomeRuntime = createAtelierHomeRuntime;
})();
