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
    ui.Pages.define("/apiservices.html", {
        // This function is called whenever a user navigates to this page. It
        // populates the page elements with the app's data.
        ready: function (element, options) {
            WinJS.UI.Fragments.render("/header.html", header).then(
                function () {
                    return WinJS.UI.Fragments.render("/output.html", outputpanel);
                }
            ).then(
                function () {
                    liveSdkSample.init();
                    attachDomEvents();
                    onMethodChange();
                }
            );
        }
    });

    function attachDomEvents() {
        id("clear").onclick = clearOutput;
        id("sendRequest").onclick = sendAPIServiceRequest;
        id("apiBody").onfocusout = showCode;
        id("apiMethod").onchange = onMethodChange;
        id("apiPath").onchange = showCode;
        destinationPath.onchange = showCode;
    }

    function onMethodChange() {
        var disableApiBody = true,
            disableDestinationPath = true;
        
        switch (getApiMethod()) {
            case "MOVE":
            case "COPY":
                disableDestinationPath = false;
                break;
            case "PUT":
            case "POST":
                disableApiBody = false;
                break;
            default:                
                break;
        }

        apiBody.disabled = disableApiBody;
        destinationPath.disabled = disableDestinationPath;

        showCode();
    }

    function getJsonRequestBody() {
        return liveSdkSample.parseJson(id("apiBody").value);
    }

    function showCode() {
        
        var method = getApiMethod(),
            path = apiPath.value;

        if (path.trim() == "") {
            code.value = "The 'path' value is required.";
            code.style.color = "red";
            return;
        }

        code.style.color = "blue";

        switch (method) {
            case "UPLOAD":
                showUploadCode();
                break;
            case "DOWNLOAD":
                showDownloadCode();
                break;
            default:
                showApiCode(method, path);
                break;
        }
    }

    function showApiCode(method, path) {
        var jsonBody = "";

        switch (method) {
            case "COPY":
            case "MOVE":                
                if (destinationPath.value.trim() == "") {
                    code.value = "The 'destination' value is required for COPY and MOVE requests";
                    code.style.color = "red";
                    return;
                }
                else {
                    apiBody.value = "{\n  'destination': '" + destinationPath.value + "'\n}";
                    jsonBody = ",\n  body: " + window.JSON.stringify({ destination: destinationPath.value }, null, "\t") + "\n";
                }                
                break;
            case "PUT":
            case "POST":
                jsonBody = getJsonRequestBody();
                if (jsonBody) {
                    jsonBody = ",\n  body: " + window.JSON.stringify(jsonBody, null, "\t") + "\n";
                }
                else {
                    code.value = "The request body is not in JSON format. Please correct it.";
                    code.style.color = "red";
                    return;
                }
                break;
            default:
                break;
        }

        var codeText =
            "WL.api({ " +
            "\n  path: '" + path + "'" +
            ",\n  method: '" + method + "'" +
            jsonBody +
            "\n});";

        code.value = codeText;
    }

    function showUploadCode() {
        code.value = uploadFile.toString() +
            "\n" + setupOpenPicker.toString() +
            "\nuploadFile('" + apiPath.value + "');";
    }

    function showDownloadCode() {
        code.value = downloadFile.toString() +
            "\n" + setupSavePicker.toString() +
            "\ndownloadFile('" + apiPath.value + "');";
    }

    function getApiMethod() {
        var apiMethodBox = id("apiMethod");
        return apiMethodBox[apiMethodBox.selectedIndex].text;
    }

    function sendAPIServiceRequest() {
        
        var path = id("apiPath").value,
            method = getApiMethod();

        log("[api-request](" + path + "," + method + ")");
        logSeperatorLine();

        switch (method) {
            case "DOWNLOAD":
                downloadFile(path);
                break;
            case "UPLOAD":
                uploadFile(path);
                break;
            default:
                invokeApi(path, method);
                break;
        }
    }

    function getBody(method) {
        switch (method) {
            case "PUT":
            case "POST":
            case "MOVE":
            case "COPY":
                return liveSdkSample.parseJson(apiBody.value);
            default:
                return null;
        }
    }

    function invokeApi(path, method) {
        var body = getBody(method),
            requestProps = {
                path: path,
                method: method
            };

        if (body) {
            requestProps.body = body;
        }

        WL.api(requestProps).then(
            function (response) {
                logObject("api_response", response);
            },
            function (response) {
                logObject("api_response_error", response);
            }
        );
    }

    function downloadFile(path) {
        setupSavePicker().pickSaveFileAsync().then(
                function (newfile) {
                    if (newfile) {
                        return WL.download({ path: path, file_output: newfile });
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
                function (error) { logObject("error", error); },
                function (progress) { logObject("progress", progress); }
            );
    }

    function uploadFile(path) {
        setupOpenPicker().pickSingleFileAsync().then(
                function (file) {
                    if (file) {
                        return WL.upload({ path: path, file_name: file.fileName, file_input: file });
                    } else {
                        log("No file was picked to upload.");
                    }
                }
            ).then(
                function (resp) {
                    if (resp) {
                        logObject("upload onsuccess response", resp);
                    }
                },
                function (error) { logObject("upload onerror response", error); },
                function (progress) { logObject("upload onprogress response", progress); }
            );
    }

    function setupSavePicker() {

        // Required - picker does not work without setting these properties
        var savepicker = new Windows.Storage.Pickers.FileSavePicker();
        savepicker.suggestedStartLocation = Windows.Storage.Pickers.PickerLocationId.documentsLibrary;
        savepicker.fileTypeChoices.insert("Executable", [".exe"]);
        savepicker.fileTypeChoices.insert("Picture", [".jpg"]);
        savepicker.fileTypeChoices.insert("Html", [".html"]);
        savepicker.fileTypeChoices.insert("Documents", [".docx",]);
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

})();