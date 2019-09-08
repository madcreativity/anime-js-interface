document.addEventListener("DOMContentLoaded", () => {
    const { remote } = require("electron");
    const { dialog } = require("electron").remote;
    const fs = require("fs");
    const XMLWriter = require("xml-writer");
    const XMLConverter = require("xml-js");

    // DOM
    const DOMlibraryAddAssetBtns = document.querySelectorAll(".library_addAsset");
    const DOMlibraryNoAssets = document.querySelector("#library_noAssets");
    const DOMlibraryAssetViewer = document.querySelector("#library_assetViewer");
    const DOMlibraryItems = document.querySelector("#library_items");

    const DOMnavSave = document.querySelector("#nav_save");
    const DOMnavSaveAs = document.querySelector("#nav_saveAs");

    const DOMnavWindowControlMinimize = document.querySelector("#nav_windowControlMinimize");
    const DOMnavWindowControlMaximize = document.querySelector("#nav_windowControlMaximize");
    const DOMnavWindowControlMaximizeIcon = document.querySelector("#nav_windowControlMaximize i");
    const DOMnavWindowControlClose = document.querySelector("#nav_windowControlClose");


    // Objects
    function Asset(asset, path, type) {
        this.asset = asset;
        this.path = path;
        this.type = type;
    }

    // Classes
    class Library {
        constructor() {
            this.assets = [];
            this.loadedAssets = [];
        }

        loadAssets(paths) {
            if(paths !== undefined) {
                if(typeof(paths) === "string") {
                    this.addAsset(paths);
                } else {
                    for(let i = 0; i < paths.length; i++) {
                        this.addAsset(paths[i]);
                    }
                }
            } else {
                console.error("Paths were not defined.");
                return;
            }
        }

        addAsset(path) {
            if(path.endsWith(".png") || path.endsWith(".jpg") || path.endsWith(".jpeg") || path.endsWith(".gif")) {
                let newAsset = new Image();
                newAsset.src = path;
                newAsset.addEventListener("load", (e) => {
                    this.loadedAssets[this.assets.indexOf(e.path[0])] = true;
                });


                this.assets[this.assets.length] = new Asset(newAsset, path, "IMAGE");
                this.loadedAssets[this.loadedAssets.length] = false;
            } else {
                return;
            }
            
            if(!DOMlibraryNoAssets.classList.contains("hidden")) {
                DOMlibraryNoAssets.classList.add("hidden");
                DOMlibraryAssetViewer.classList.remove("hidden");
            }

            
            // Create elements
            let libraryAssetContainerElement = document.createElement("div");
            let libraryAssetIconElement = document.createElement("i");
            let libraryAssetContentElement = document.createElement("div");

            // Set classes
            libraryAssetContainerElement.className = "item libraryAsset";
            libraryAssetIconElement.className = "file image outline icon";
            libraryAssetContentElement.className = "middle aligned content";

            // Set name
            libraryAssetContentElement.textContent = path.slice(path.lastIndexOf("\\") + 1);

            // Add to document
            libraryAssetContainerElement.appendChild(libraryAssetIconElement);
            libraryAssetContainerElement.appendChild(libraryAssetContentElement);
            DOMlibraryItems.appendChild(libraryAssetContainerElement);
        }
    }


    // Setup
    let SOFT_APPDATA = remote.app.getAppPath();
    let SOFT_PREFERENCES = {};

    if(fs.existsSync(SOFT_APPDATA + "\\preferences.json")) {
        SOFT_PREFERENCES = JSON.parse(fs.readFileSync(SOFT_APPDATA + "\\preferences.json"));
    } else {
        SOFT_PREFERENCES = {
            openPath: "",
            savePath: ""
        };

        fs.writeFileSync(SOFT_APPDATA + "\\preferences.json", JSON.stringify(SOFT_PREFERENCES));
    }

    let SOFT_LIBRARY = new Library();


    // Library - Add Asset
    DOMlibraryAddAssetBtns.forEach((button) => {
        button.addEventListener("click", () => {
            dialog.showOpenDialog({
                properties: [
                    "openFile",
                    "multiSelections",
                ],
                filters: [
                    { name: "Images", extensions: ["png", "jpg", "jpeg", "gif"] }
                ]
            }).then((result) => {
                if(!result.canceled) {
                    SOFT_LIBRARY.loadAssets(result.filePaths);
                }
            }).catch((err) => {
                console.error(err);
            });
        });
    });

    // Nav - Save
    DOMnavSave.addEventListener("click", () => {
        saveFile(false);
    });

    DOMnavSaveAs.addEventListener("click", () => {
        saveFile(true);
    });

    let saveFile = (isSaveAs) => {
        let writer = new XMLWriter();
        writer.startDocument();
        writer.startElement("root");
        
        // Assets start
        writer.startElement("assets");

        for(let i = 0; i < SOFT_LIBRARY.assets.length; i++) {
            writer.startElement("asset");
            writer.writeAttribute("path", SOFT_LIBRARY.assets[i].path);
            writer.endElement();
        }

        writer.endElement();
        // Assets end


        writer.endDocument();

        if(SOFT_PREFERENCES.savePath !== "" && !isSaveAs) {
            fs.writeFileSync(SOFT_PREFERENCES.savePath, writer.toString());
        } else {
            dialog.showSaveDialog({
                defaultPath: "interface",
                filters: [
                    { name: "Anime.js Interface File", extensions: ["ajsi"] }
                ]
            }).then((result) => {
                if(!result.canceled) {
                    fs.writeFileSync(result.filePath, writer.toString());

                    SOFT_PREFERENCES.savePath = result.filePath;
                }
            }).catch((err) => {
                console.error(err);
            });
        }
    }

    // Nav - Minimize Window
    DOMnavWindowControlMinimize.addEventListener("click", () => {
        remote.BrowserWindow.getFocusedWindow().minimize();
    });

    // Nav - Maximize Window/Restore
    DOMnavWindowControlMaximize.addEventListener("click", () => {
        if(!remote.BrowserWindow.getFocusedWindow().isMaximized()) {
            remote.BrowserWindow.getFocusedWindow().maximize();
        } else {
            remote.BrowserWindow.getFocusedWindow().restore();            
        }
    });

    let updateMaximizeIcon = () => {
        if(!remote.BrowserWindow.getFocusedWindow().isMaximized()) {
            DOMnavWindowControlMaximizeIcon.classList.replace("restore", "maximize");            
        } else {
            DOMnavWindowControlMaximizeIcon.classList.replace("maximize", "restore");
        }
    };

    remote.BrowserWindow.getFocusedWindow().on("maximize", () => {
        updateMaximizeIcon();
    });

    remote.BrowserWindow.getFocusedWindow().on("unmaximize", () => {
        updateMaximizeIcon();
    });

    // Nav - Close Window
    DOMnavWindowControlClose.addEventListener("click", () => {
        remote.BrowserWindow.getFocusedWindow().close();
    });


    /* Semantic UI */
    $(".ui.dropdown").dropdown();
    $(".tabmenu .item").tab();
});