document.addEventListener("DOMContentLoaded", () => {
    const { remote } = require("electron");
    const { dialog } = require("electron").remote;
    const fs = require("fs");
    const XMLWriter = require("xml-writer");
    const XMLConverter = require("xml-js");

    // DOM
    const DOMprogramCanvas = document.querySelector(".program_canvas");

    const DOMlibraryAddAssetBtns = document.querySelectorAll(".library_addAsset");
    const DOMlibraryNoAssets = document.querySelector("#library_noAssets");
    const DOMlibraryAssetViewer = document.querySelector("#library_assetViewer");
    const DOMlibraryItems = document.querySelector("#library_items");
    const DOMlibraryAssetView = document.querySelector("#library_assetView");
    const DOMlibraryItemContext = document.querySelector("#library_itemContext");

    const DOMnavNewFile = document.querySelector("#nav_newFile");
    const DOMnavOpenFile = document.querySelector("#nav_openFile");
    const DOMnavSave = document.querySelector("#nav_save");
    const DOMnavSaveAs = document.querySelector("#nav_saveAs");
    const DOMnavExit = document.querySelector("#nav_exit");

    const DOMnavWindowControlMinimize = document.querySelector("#nav_windowControlMinimize");
    const DOMnavWindowControlMaximize = document.querySelector("#nav_windowControlMaximize");
    const DOMnavWindowControlMaximizeIcon = document.querySelector("#nav_windowControlMaximize i");
    const DOMnavWindowControlClose = document.querySelector("#nav_windowControlClose");


    // Objects
    function Asset(name, asset, path, type) {
        this.name = name;
        this.asset = asset;
        this.path = path.replace(/\\/g, "/");
        this.type = type;
    }

    // Classes
    class Library {
        constructor() {
            this.assets = [];
            this.loadedAssets = [];
        }

        loadAssets(paths, name) {
            if(paths !== undefined) {
                if(typeof(paths) === "string") {
                    this.addAsset(paths, name);
                } else {
                    for(let i = 0; i < paths.length; i++) {
                        this.addAsset(paths[i], name);
                    }
                }
            } else {
                console.error("Paths were not defined.");
                return;
            }
        }

        addAsset(path, name) {
            if(path.endsWith(".png") || path.endsWith(".jpg") || path.endsWith(".jpeg") || path.endsWith(".gif")) {
                let newAsset = new Image();
                newAsset.src = path;
                newAsset.addEventListener("load", (e) => {
                    this.loadedAssets[this.assets.indexOf(e.path[0])] = true;
                });


                this.assets[this.assets.length] = new Asset((name !== undefined) ? name : path.slice(path.lastIndexOf("\\") + 1), newAsset, path, "IMAGE");
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

            // Set asset index attribute
            libraryAssetContentElement.setAttribute("data-index", this.assets.length - 1);

            // Set name
            libraryAssetContentElement.textContent = (name !== undefined) ? name : path.slice(path.lastIndexOf("\\") + 1);

            // Add to document
            libraryAssetContainerElement.appendChild(libraryAssetIconElement);
            libraryAssetContainerElement.appendChild(libraryAssetContentElement);
            DOMlibraryItems.appendChild(libraryAssetContainerElement);
        }
    }

    let setProgramCanvasSize = (width, height) => {
        DOMprogramCanvas.style.width = SOFT_PROPERTIES.width = width;
        DOMprogramCanvas.style.height = SOFT_PROPERTIES.height = height;
        DOMprogramCanvas.style.marginLeft = -(SOFT_PROPERTIES.width / 2);
    }

    // Maximize icon
    let updateMaximizeIcon = () => {
        if(!remote.getCurrentWindow().isMaximized()) {
            DOMnavWindowControlMaximizeIcon.classList.replace("restore", "maximize");            

            SOFT_PREFERENCES.maximized = "false";
            updatePreferenceFile();
        } else {
            DOMnavWindowControlMaximizeIcon.classList.replace("maximize", "restore");

            SOFT_PREFERENCES.maximized = "true";
            updatePreferenceFile();
        }
    };

    remote.getCurrentWindow().on("maximize", () => {
        updateMaximizeIcon();
    });

    remote.getCurrentWindow().on("unmaximize", () => {
        updateMaximizeIcon();
    });


    // Update "preferences.json"
    let updatePreferenceFile = () => {
        fs.writeFileSync(SOFT_APPDATA + "\\preferences.json", JSON.stringify(SOFT_PREFERENCES));
    }


    // Setup
    let SOFT_APPDATA = remote.app.getPath("userData");
    let SOFT_PREFERENCES = {};
    let SOFT_SELECTED_ITEMS = [];
    let SOFT_PROPERTIES = {
        width: 650,
        height: 450,
    };
    
    if(fs.existsSync(SOFT_APPDATA + "\\preferences.json")) {
        SOFT_PREFERENCES = JSON.parse(fs.readFileSync(SOFT_APPDATA + "\\preferences.json"));
        
        if(SOFT_PREFERENCES.maximized === "true") {
            remote.getCurrentWindow().maximize();
        }
    } else {
        SOFT_PREFERENCES = {
            openPath: "",
            savePath: "",
            maximized: "",
        };
        
        fs.writeFileSync(SOFT_APPDATA + "\\preferences.json", JSON.stringify(SOFT_PREFERENCES));
    }
    

    let SOFT_LIBRARY = new Library();


    // Library - Item Selection
    DOMlibraryItems.addEventListener("click", (e) => {
        if(e.target.classList.contains("libraryAsset") || e.target.parentNode.classList.contains("libraryAsset")) {
            let thisTarget = e.target;
            if(e.target.parentNode.classList.contains("libraryAsset")) thisTarget = e.target.parentNode;

            if(!e.shiftKey) {
                document.querySelectorAll("#library_items .libraryAsset").forEach((element) => element.classList.remove("active"));
                thisTarget.classList.add("active");
                DOMlibraryAssetView.style.backgroundImage = "url(" + SOFT_LIBRARY.assets[0].path + ")";
            } else {
                if(thisTarget.classList.contains("active")) {
                    thisTarget.classList.remove("active");
                    DOMlibraryAssetView.style.backgroundImage = "none";
                } else {
                    thisTarget.classList.add("active");
                }
            }

            document.querySelectorAll("#library_items .libraryAsset").forEach((element) => {
                SOFT_SELECTED_ITEMS[SOFT_SELECTED_ITEMS.length] = parseInt(element.getAttribute("data-index"));
            });
        }
    });

    // Library - Item Context Menu
    DOMlibraryItems.addEventListener("contextmenu", (e) => {
        if(e.target.classList.contains("libraryAsset") || e.target.parentNode.classList.contains("libraryAsset")) {
            let thisTarget = e.target;
            if(e.target.parentNode.classList.contains("libraryAsset")) thisTarget = e.target.parentNode;

            
            DOMlibraryItemContext.style.opacity = "1";
            DOMlibraryItemContext.style.visibility = "visible";
            DOMlibraryItemContext.style.left = e.clientX + "px";
            DOMlibraryItemContext.style.top = e.clientY + "px";
        }
    });

    DOMlibraryItemContext.addEventListener("click", (e) => {
        if(e.target.id === "library_itemContextRename") {

        } else if(e.target.id === "library_itemContextDelete") {
            
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
                
                setProgramCanvasSize(parseInt(readData["root"]["_attributes"]["width"]), parseInt(readData["root"]["_attributes"]["height"]));

                // Assets start
                for(let i = 0; i < readData["root"]["assets"]["asset"].length; i++) {
                    SOFT_LIBRARY.loadAssets(readData["root"]["assets"]["asset"][i]["_attributes"]["path"], readData["root"]["assets"]["asset"][i]["_attributes"]["name"]);
                }
                // Assets end

                SOFT_PREFERENCES.savePath = result.filePaths[0];
                updatePreferenceFile();
            }
        }).catch((err) => {
            console.error(err);
        });
        
    }

    // Nav - Exit
    DOMnavExit.addEventListener("click", () => {
        remote.getCurrentWindow().close();        
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
        writer.writeAttribute("width", SOFT_PROPERTIES.width);
        writer.writeAttribute("height", SOFT_PROPERTIES.height);
        
        // Assets start
        writer.startElement("assets");

        for(let i = 0; i < SOFT_LIBRARY.assets.length; i++) {
            writer.startElement("asset");
            writer.writeAttribute("name", SOFT_LIBRARY.assets[i].name);
            writer.writeAttribute("path", SOFT_LIBRARY.assets[i].path);
            writer.endElement();
        }

        writer.endElement();
        // Assets end

        // Elements start
        writer.startElement("elements");

        for(let i = 0; i < SOFT_ELEMENTS.length; i++) {
            writer.startElement("element");
            
            // Add attributes

            writer.endElement();
        }

        writer.endElement();
        // Elements end

        // Elements start
        writer.startElement("elements");

        for(let i = 0; i < SOFT_ELEMENTS.length; i++) {
            writer.startElement("element");
            
            // Add attributes

            writer.endElement();
        }

        writer.endElement();
        // Elements end


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

    // Nav - Close Window
    DOMnavWindowControlClose.addEventListener("click", () => {
        remote.getCurrentWindow().close();
    });

    // Shortcuts
    document.addEventListener("keydown", (e) => {
        // Nav - New File
        if (e.ctrlKey && e.which == 78) {
            DOMnavNewFile.click();
        }

        // Nav - Open File
        if (e.ctrlKey && e.which == 79) {
            DOMnavOpenFile.click();
        }

        // Nav - Save
        else if (e.ctrlKey && !e.shiftKey && e.which == 83) {
            DOMnavSave.click();
        }

        // Nav - Save As
        else if (e.ctrlKey && e.shiftKey && e.which == 83) {
            DOMnavSaveAs.click();
        }
    });


    /* Semantic UI */
    $(".ui.dropdown").dropdown();
    $(".tabmenu .item").tab();
});