window.ATELIER_APP_CONFIG = {
  datasetGlobalName: "POWERPOINT_ATELIER_DATA",
  modelGlobalName: "PowerPointAtelierModel",
  viewGlobalName: "PowerPointAtelierView",
  storageGlobalName: "PowerPointAtelierFileStorage",
  controllerGlobalName: "PowerPointAtelierController",
  storage: {
    dbName: "powerpoint_atelier_fs_settings_v1",
    pickerIds: {
      userFolder: "powerpoint-atelier-user-folder",
      userFolderOpen: "powerpoint-atelier-user-folder-open",
      documentsRoot: "powerpoint-atelier-documents-root",
      scanRoot: "powerpoint-atelier-scan-root",
    },
    progressFileName: "progression-powerpoint.json",
    workFilePickerDescription: "Presentation PowerPoint",
    workFileAccept: {
      "application/vnd.openxmlformats-officedocument.presentationml.presentation": [".pptx"],
      "application/vnd.ms-powerpoint": [".ppt"],
    },
    defaultWorkFileName: "presentation.pptx",
  },
  controller: {
    progressFileName: "progression-powerpoint.json",
    officeAppName: "PowerPoint",
    completedFileExtension: "pptx",
  },
};
