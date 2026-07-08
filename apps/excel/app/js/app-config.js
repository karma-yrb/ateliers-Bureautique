window.ATELIER_APP_CONFIG = {
  datasetGlobalName: "EXCEL_ATELIER_DATA",
  availabilityOverridesGlobalName: "EXCEL_ATELIER_AVAILABILITY_OVERRIDES",
  modelGlobalName: "ExcelAtelierModel",
  viewGlobalName: "ExcelAtelierView",
  storageGlobalName: "ExcelAtelierFileStorage",
  controllerGlobalName: "ExcelAtelierController",
  storage: {
    dbName: "excel_atelier_fs_settings_v1",
    pickerIds: {
      userFolder: "excel-atelier-user-folder",
      userFolderOpen: "excel-atelier-user-folder-open",
      documentsRoot: "excel-atelier-documents-root",
      scanRoot: "excel-atelier-scan-root",
    },
    progressFileName: "progression-excel.json",
    workFilePickerDescription: "Classeur Excel",
    workFileAccept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "application/vnd.ms-excel": [".xls"],
    },
    defaultWorkFileName: "fichier.xlsx",
  },
  controller: {
    progressFileName: "progression-excel.json",
    officeAppName: "Excel",
    completedFileExtension: "xlsx",
  },
};
