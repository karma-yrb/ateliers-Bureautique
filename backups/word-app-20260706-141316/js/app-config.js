window.ATELIER_APP_CONFIG = {
  datasetGlobalName: "WORD_ATELIER_DATA",
  modelGlobalName: "WordAtelierModel",
  viewGlobalName: "WordAtelierView",
  storageGlobalName: "WordAtelierFileStorage",
  controllerGlobalName: "WordAtelierController",
  storage: {
    dbName: "word_atelier_fs_settings_v1",
    pickerIds: {
      userFolder: "word-atelier-user-folder",
      userFolderOpen: "word-atelier-user-folder-open",
      documentsRoot: "word-atelier-documents-root",
      scanRoot: "word-atelier-scan-root",
    },
    progressFileName: "progression-word.json",
    workFilePickerDescription: "Document Word",
    workFileAccept: {
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "application/msword": [".doc"],
    },
    defaultWorkFileName: "fichier.docx",
  },
  controller: {
    progressFileName: "progression-word.json",
    officeAppName: "Word",
    completedFileExtension: "docx",
  },
};
