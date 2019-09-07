const { dialog } = require('electron').remote;

// DOM
const DOMlibraryAddAsset = document.querySelector('#library_addAsset');
const DOMlibraryNoAssets = document.querySelector('#library_noAssets');
const DOMlibraryAssetViewer = document.querySelector('#library_assetViewer');

// Object
function Asset(asset, type) {
    this.asset = asset;
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
            if(typeof(paths) === 'string') {
                this.addAsset(paths);
            } else {
                for(let i = 0; i < paths.length; i++) {
                    this.addAsset(paths[i]);
                }
            }
        } else {
            console.error('Paths were not defined.');
            return;
        }
    }

    addAsset(path) {
        if(path.endsWith('.png') || path.endsWith('.jpg') || path.endsWith('.jpeg') || path.endsWith('.gif')) {
            let newAsset = new Image();
            newAsset.src = path;
            newAsset.addEventListener('load', (e) => {
                this.loadedAssets[this.assets.indexOf(e.path[0])] = true;
            });


            this.assets[this.assets.length] = new Asset(newAsset, 'IMAGE');
            this.loadedAssets[this.loadedAssets.length] = false;
        } else {
            return;
        }
        
        if(!DOMlibraryNoAssets.classList.contains('hidden')) {
            DOMlibraryNoAssets.classList.add('hidden');
            DOMlibraryAssetViewer.classList.remove('hidden');
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
        libraryAssetContentElement.textContent = path.slice(path.lastIndexOf('\\') + 1);

        // Add to document
        libraryAssetContainerElement.appendChild(libraryAssetIconElement);
        libraryAssetContainerElement.appendChild(libraryAssetContentElement);
        DOMlibraryAssetViewer.appendChild(libraryAssetContainerElement);
    }
}

let SOFT_LIBRARY = new Library();

// Library - Add Asset
DOMlibraryAddAsset.addEventListener('click', () => {
    dialog.showOpenDialog({
        properties: [
            'openFile',
            'multiSelections',
        ],
        filters: [
            { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif'] }
        ]
    }).then((result) => {
        if(!result.canceled) {
            SOFT_LIBRARY.loadAssets(result.filePaths);
        }
    }).catch((err) => {
        console.error(err);
    });
});


/* Semantic UI */
$('.ui.dropdown').dropdown();
$('.tabmenu .item').tab();