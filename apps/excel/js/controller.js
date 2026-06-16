if (!window.createAtelierController) {
  throw new Error("Fabrique commune createAtelierController non chargée");
}

window.ExcelAtelierController = window.createAtelierController({
  progressFileName: "progression-excel.json",
  officeAppName: "Excel",
  completedFileExtension: "xlsx",
});
