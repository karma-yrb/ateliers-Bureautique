if (!window.createAtelierController) {
  throw new Error("Fabrique commune createAtelierController non chargée");
}

window.WordAtelierController = window.createAtelierController({
  progressFileName: "progression-word.json",
  officeAppName: "Word",
  completedFileExtension: "docx",
});
