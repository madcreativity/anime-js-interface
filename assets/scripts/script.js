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

    const DOMnavOpenFile = document.querySelector("#nav_openFile");
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

    let updatePreferenceFile = () => {
        fs.writeFileSync(SOFT_APPDATA + "\\preferences.json", JSON.stringify(SOFT_PREFERENCES));
    }


    // Setup
    let SOFT_APPDATA = remote.app.getPath("userData");
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


    // Library - Item Selection
    DOMlibraryItems.addEventListener("click", (e) => {
        if(e.target.classList.contains("libraryAsset") || e.target.parentNode.classList.contains("libraryAsset")) {
            console.log("test");
        }
    });

    // Library - Add Asset
    DOMlibraryAddAssetBtns.forEach((button) => {
        button.addEventListener("click", () => {
            let defaultPath = (SOFT_PREFERENCES.openPath !== "") ? SOFT_PREFERENCES.openPath : ""
            dialog.showOpenDialog({
                properties: [
                    "openFile",
                    "multiSelections",
                ],
                filters: [
                    { name: "Images", extensions: ["png", "jpg", "jpeg", "gif"] }
                ],
                defaultPath: defaultPath
            }).then((result) => {
                if(!result.canceled) {
                    SOFT_LIBRARY.loadAssets(result.filePaths);

                    SOFT_PREFERENCES.openPath = result.filePaths[0];
                    updatePreferenceFile();
                }
            }).catch((err) => {
                console.error(err);
            });
        });
    });

    // Nav - Load
    DOMnavOpenFile.addEventListener("click", () => {
        loadFile();
    });

    let loadFile = () => {
        let defaultPath = (SOFT_PREFERENCES.savePath !== "") ? SOFT_PREFERENCES.savePath : "interface"
        dialog.showOpenDialog({
            properties: [
                "openFile"
            ],
            filters: [
                { name: "Anime.js Interface File", extensions: ["ajsi"] }
            ],
            defaultPath: defaultPath
        }).then((result) => {
            if(!result.canceled) {
                let readData = XMLConverter.xml2js(fs.readFileSync(result.filePaths[0]), { ignoreComment: true, compact: true });
                
                // Assets start
                for(let i = 0; i < readData["root"]["assets"]["asset"].length; i++) {
                    SOFT_LIBRARY.loadAssets(readData["root"]["assets"]["asset"][i]["_attributes"]["path"]);
                }
                // Assets end
            }
        }).catch((err) => {
            console.error(err);
        });
        
    }

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
            let defaultPath = (SOFT_PREFERENCES.savePath !== "") ? SOFT_PREFERENCES.savePath : "interface"
            dialog.showSaveDialog({
                filters: [
                    { name: "Anime.js Interface File", extensions: ["ajsi"] }
                ],
                defaultPath: defaultPath
            }).then((result) => {
                if(!result.canceled) {
                    fs.writeFileSync(result.filePath, writer.toString());

                    SOFT_PREFERENCES.savePath = result.filePath;
                    updatePreferenceFile();
                }
            }).catch((err) => {
                console.error(err);
            });
        }
    }

    // Nav - Minimize Window
    DOMnavWindowControlMinimize.addEventListener("click", () => {
        remote.getCurrentWindow().minimize();
    });

    // Nav - Maximize Window/Restore
    DOMnavWindowControlMaximize.addEventListener("click", () => {
        if(!remote.getCurrentWindow().isMaximized()) {
            remote.getCurrentWindow().maximize();
        } else {
            remote.getCurrentWindow().restore();            
        }
    });

    let updateMaximizeIcon = () => {
        if(!remote.getCurrentWindow().isMaximized()) {
            DOMnavWindowControlMaximizeIcon.classList.replace("restore", "maximize");            
        } else {
            DOMnavWindowControlMaximizeIcon.classList.replace("maximize", "restore");
        }
    };

    remote.getCurrentWindow().on("maximize", () => {
        updateMaximizeIcon();
    });

    remote.getCurrentWindow().on("unmaximize", () => {
        updateMaximizeIcon();
    });

    // Nav - Close Window
    DOMnavWindowControlClose.addEventListener("click", () => {
        remote.getCurrentWindow().close();
    });


    /* Semantic UI */
    $(".ui.dropdown").dropdown();
    $(".tabmenu .item").tab();
});