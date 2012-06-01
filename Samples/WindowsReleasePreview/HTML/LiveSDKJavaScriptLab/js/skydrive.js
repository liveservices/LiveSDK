/// <reference path="//Microsoft.WinJS.0.6//js/base.js" />
/// <reference path="//Microsoft.WinJS.0.6//js/ui.js" />
// For an introduction to the Blank template, see the following documentation:
// http://go.microsoft.com/fwlink/?LinkId=232509
/// <reference path="///LiveSDKHTML/js/wl.js" />
/// <reference path="share.js" />

(function () {
    "use strict";

    var nav = WinJS.Navigation;
    var ui = WinJS.UI;
    var utils = WinJS.Utilities;
    ui.Pages.define("/skydrive.html", {
        // This function is called whenever a user navigates to this page. It
        // populates the page elements with the app's data.
        ready: function (element, options) {
            WinJS.UI.Fragments.render("/header.html", header).then(
                function () {
                    liveSdkSample.init();
                    attachDomEvents();
                    getCurrentFolderContent();
                }
            ).then(
                function () {
                    
                }
            );
        }
    });

    function attachDomEvents() {
        selectfolder.addEventListener("dblclick", onSelectFolderDoubleClick, false);
        selectfile.addEventListener("dblclick", onSelectFileDoubleClick, false);
        clearoutputbox.onclick = clearOutput;

        savetoskydrive.onclick = saveToSkydrive_BT;
    }

    function id(tagName) {
        return document.getElementById(tagName);
    }

    // Save a reference to the current media element for PlayTo.
    var mediaElement;

    function showDiv(divName) {
        id("audioDiv").style.display = "none";
        id("aplayer").src = null;
        id("imageDiv").style.display = "none";
        id("videoDiv").style.display = "none";
        id("vplayer").src = null;

        id(divName).style.display = "block";

        switch (divName) {
            case "audioDiv":
                mediaElement = id("aplayer");
                break;
            case "videoDiv":
                mediaElement = id("vplayer");
                break;
            case "imageDiv":
                mediaElement = id("iplayer");
                break;
        }
    }
    
    function showSkyDriveImageFile(skydriveObj) {
        WL.backgroundDownload({
            path: skydriveObj.get("id") + "/content"
        }).then(
            function (result) {
                showDiv("imageDiv");
                var url = URL.createObjectURL(MSApp.createStreamFromInputStream(result.content_type, result.stream));
                    
                log("Show image: " + skydriveObj.get("name"));
                id("iplayer").src = url;//skydriveObj.get("source");
            },
            function (result) {
                logObject("download file failure", result);
            },
            function (result) {
                logObject("download file progress", result);
            });
    }
    
    function playSkyDriveAudioFile(skydriveObj) {
        WL.backgroundDownload({
            path: skydriveObj.get("id") + "/content"
        }).then(
            function (result) {
                showDiv("audioDiv");
                var url = URL.createObjectURL(MSApp.createStreamFromInputStream(result.content_type, result.stream));
                log("Play audio: " + skydriveObj.get("name"));
                id("aplayer").src = url; //skydriveObj.get("source");
                id("aplayer").play();                                
            },
            function (result) {
                logObject("download file failure", result);
            },
            function (result) {
                logObject("download file progress", result);
            });
    }

    function playSkyDriveVideoFile(skydriveObj) {
        WL.backgroundDownload({
            path: skydriveObj.get("id") + "/content"
        }).then(
            function (result) {
                showDiv("videoDiv");
                var url = URL.createObjectURL(MSApp.createStreamFromInputStream(result.content_type, result.stream));
                log("Play video: " + skydriveObj.get("name"));
                id("vplayer").src = url;//skydriveObj.get("source");
                id("vplayer").play();
            },
            function (result) {
                logObject("download file failure", result);
            },
            function (result) {
                logObject("download file progress", result);
            });
    }

    function downloadFile(path) {
        setupSavePicker().pickSaveFileAsync().then(
                function (newfile) {
                    if (newfile) {
                        return WL.backgroundDownload({ path: path, file_output: newfile });
                    } else {
                        log("Where to download file was not specified.");
                    }
                }
            ).then(
                function (resp) {
                    if (resp) {
                        logObject("download response", resp);
                    }
                },
                function (error) { logObject("download failure", error); },
                function (progress) { logObject("download progress", progress); }
            );
    }

    function uploadFile(path) {
        setupOpenPicker().pickSingleFileAsync().then(
                function (file) {
                    if (file) {
                        return WL.backgroundUpload({ path: path, file_name: file.fileName, file_input: file });
                    } else {
                        log("No file was picked to upload.");
                    }
                }
            ).then(
                function (resp) {
                    if (resp) {
                        logObject("upload success", resp);
                    }
                },
                function (error) { logObject("upload failure", error); },
                function (progress) { logObject("upload progress", progress); }
            );
    }

    function setupSavePicker() {

        // Required - picker does not work without setting these properties
        var savepicker = new Windows.Storage.Pickers.FileSavePicker();
        savepicker.suggestedStartLocation = Windows.Storage.Pickers.PickerLocationId.documentsLibrary;
        savepicker.fileTypeChoices.insert("Executable", [".exe"]);
        savepicker.fileTypeChoices.insert("Picture", [".jpg"]);
        savepicker.fileTypeChoices.insert("Html", [".html"]);
        savepicker.fileTypeChoices.insert("Documents", [".docx", ]);
        savepicker.fileTypeChoices.insert("Text", [".txt"]);
        savepicker.fileTypeChoices.insert("Special Docs", [".sd"]);
        savepicker.defaultFileExtension = ".jpg";

        return savepicker;
    }

    function setupOpenPicker() {
        // Required - picker does not work without setting these properties
        var openpicker = new Windows.Storage.Pickers.FileOpenPicker();
        openpicker.fileTypeFilter.replaceAll(["*"]);
        return openpicker;
    }


    // SkyDrive operations
    var skyDriveObjects = {};
    var scopeValue = ["wl.signin", "wl.basic", "wl.skydrive", "wl.skydrive_update"];
    window.skydrivePathHandlers = {};
    function SkyDriveObject(props, parent) {
        var _this = this;
        _this._parent = parent;
        _this._props = props;
        _this._folders = null;
        _this._files = null;

        skyDriveObjects[props.id] = _this;
        window.skydrivePathHandlers[props.id] = function () {
            currentFolder = _this;
            getCurrentFolderContent();
        };

        _this.getFolderContent = function (callback) {
            if (_this._folders) {
                callback(_this);
                return;
            }

            WL.login({
                scope: scopeValue
            }).then(
                function (result) {
                    return WL.api({
                        path: _this._props.id + "/files"
                    });
                },
                function (error) {
                    
                }
            ).then(
                function (result) {
                    if (result.data) {
                        var folders = [],
                            files = [];
                        _this._folders = folders;
                        _this._files = files;

                        for (var i = 0; i < result.data.length; i++) {
                            var obj = result.data[i],
                                skyDriveObj = new SkyDriveObject(obj, _this);

                            switch (obj.type) {
                                case "folder":
                                case "album":
                                    folders.push(skyDriveObj);
                                    break;
                                default:
                                    files.push(skyDriveObj);
                                    break;
                            }
                        }

                        callback(_this);
                    }                    
                },
                function(error){

                }
            );

        };

        this.get = function (key) {
            return this._props[key];
        };

        this.getCurrentPathHtml = function () {
            var userName = meInfo.first_name ? meInfo.first_name : meInfo.name,
                parentPathHtml = (this._parent) ? this._parent.getCurrentPathHtml() : "<span>" + userName + "'s </span>",
                currentPathHtml = "<a onclick=\"window.skydrivePathHandlers['" + this.get("id") + "']();\">" + this.get("name") + "</a>",
                midFix = (this._parent) ? "<span> / </span>" : "",
                pathHtml = parentPathHtml + midFix + currentPathHtml;

            return pathHtml;
        };
    }

    var rootFolder = new SkyDriveObject({ id: "me/skydrive", name: "SkyDrive", type: "folder" }),
        currentFolder = rootFolder,
        meInfo = null;

    function getMeInfo(callback) {
        if (meInfo) {
            callback(meInfo);
            return;
        }

        WL.login({
            scope: scopeValue
        }).then(
               function (result) {
                   return WL.api({
                       path: "me"
                   });
               },
               function (error) {

               }
           ).then(
               function (result) {
                   meInfo = result;
                   callback();
               },
               function (error) {

               }
           );
    }

    function getCurrentFolderContent() {
        getMeInfo(function () {
            currentFolder.getFolderContent(pupulateCurrentFolderContent);
        });
    }

    function pupulateCurrentFolderContent() {
        clearSelectOptions(selectfolder);
        clearSelectOptions(selectfile);

        addSelectOptions(selectfolder, currentFolder._folders);
        addSelectOptions(selectfile, currentFolder._files);

        updateCurrentFolderText();
    }

    function updateCurrentFolderText() {
        MSApp.execUnsafeLocalFunction(function () {
            currentfolderElm.innerHTML = "";
            currentfolderElm.innerHTML = currentFolder.getCurrentPathHtml();
        });
    }

    function addSelectOptions(select, objects) {
        var i;
        for (i = 0; i < objects.length; i++) {
            var obj = objects[i];
            var option = document.createElement("option");
            option.text = obj.get("name");
            option.value = obj.get("id");
            select.appendChild(option)
            //select.options.add(option);
        }
    }

    function clearSelectOptions(select) {
        while (select.options.length > 0) {
            select.options.remove(0);
        }
    }

    function onSelectFolderDoubleClick() {
        var selectedFolderId = selectfolder.options[selectfolder.selectedIndex].value,
            selectedFolder = skyDriveObjects[selectedFolderId];
        logObject("Selected folder", {
            id: selectedFolder.get("id"),
            name: selectedFolder.get("name"),
            type: selectedFolder.get("type")
            });

        selectedFolder.getFolderContent(function (result) {
            currentFolder = selectedFolder;
            pupulateCurrentFolderContent();
        });
    }

    function onSelectFileDoubleClick() {

        var selectedFileId = selectfile.options[selectfile.selectedIndex].value,
            selectedFile = skyDriveObjects[selectedFileId],
            type = selectedFile.get("type");

        logObject("Selected file", {
            id: selectedFile.get("id"),
            name: selectedFile.get("name"),
            type: selectedFile.get("type")
        });

        if (selectedFile == null) {
            return;
        }

        switch (type) {
            case "audio":
                playSkyDriveAudioFile(selectedFile);
                break;
            case "video":
                playSkyDriveVideoFile(selectedFile);                
                break;
            case "photo":
                showSkyDriveImageFile(selectedFile);                
                break;
            case "file":
                break;
        }
    }

    /// logging functions ///
    function clearOutput() {
        id("outputbox").value = "";
    }

    function log(text) {
        id("outputbox").value += text + "\r\n";
    }

    function logSeperatorLine() {
        log("------------------" + new Date().toTimeString() + "--------------------");
    }

    function logObject(name, obj) {
        log(name + " : ");
        log(window.JSON.stringify(obj, null, "\t"));
        logSeperatorLine();
    }   

    function saveToSkydrive_BT() {
        try{
            var path = id("upload_source").value,
                fileName = id("upload_filename").value;

            if (path.trim() === "" || fileName.trim() === "") {
                return;
            }

            var uri = new Windows.Foundation.Uri(path),
                downloader = Windows.Networking.BackgroundTransfer.BackgroundDownloader();

            downloader.createDownload(uri, null).startAsync().then(
                function (result) {
                    var stream = result.getResultStreamAt(0);
                    WL.backgroundUpload({
                        path: currentFolder.get("id"),
                        stream_input: stream,
                        file_name: fileName,
                        overwrite: true
                    }).then(
                        function (result) {
                            logObject("Upload result success", result);
                        },
                        function (result) {
                            logObject("Upload result failure", result);
                        },
                        function (progress) {
                            logObject("Upload result progress", progress);
                        });

                },
                function (result) {
                    logObject("SaveToSkyDrive(BT) download error", result);
                }, 
                function (result) {
                    logObject("SaveToSkyDrive(BT) download progress", result);
                });
        }
        catch (ex) {
            log("Unable to start to save file to skydrive. Error: " + ex.message);
        }        
    }
})();