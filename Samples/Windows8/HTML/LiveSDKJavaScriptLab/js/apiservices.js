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

    function showCode() {
        
        var method = getApiMethod(),
            path = apiPath.value,
            authScope = getAuthScope();

        if (path.trim() == "") {
            code.value = "The 'path' value is required.";
            code.style.color = "red";
            return;
        }

        code.style.color = "blue";

        switch (method) {
            case "UPLOAD":
                showUploadCode(authScope);
                break;
            case "DOWNLOAD":
                showDownloadCode(authScope);
                break;
            default:
                showApiCode(method, path, authScope);
                break;
        }
    }

    function showApiCode(method, path, scope) {
        var jsonBody = null;
        var requestParams = {
            method: method,
            path: path
        };

        switch (method) {
            case "COPY":
            case "MOVE":
                if (destinationPath.value.trim() == "") {
                    code.value = "The 'destination' value is required for COPY and MOVE requests";
                    code.style.color = "red";
                    return;
                }
                else {
                    jsonBody = { destination: destinationPath.value };
                    apiBody.value = JSON.stringify(jsonBody, null, "\t");
                    requestParams.body = jsonBody;
                }
                break;
            case "PUT":
            case "POST":
                jsonBody = getBody(method);
                if (jsonBody) {
                    requestParams.body = jsonBody;
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

        code.value = invokeApi.toString() +
            "\ninvokeApi(" + window.JSON.stringify(requestParams, null, "\t") + ", " +
            "\n\t'" + scope + "'" +
            "\n});";
    }

    function showUploadCode(scope) {
        code.value = uploadFile.toString() +
            "\n" + setupOpenPicker.toString() +
            "\nuploadFile('" + apiPath.value + "', '" + scope + "');";
    }

    function showDownloadCode(scope) {
        code.value = downloadFile.toString() +
            "\n" + setupSavePicker.toString() +
            "\ndownloadFile('" + apiPath.value + "', '" + scope + "');";
    }

    function getApiMethod() {
        var apiMethodBox = id("apiMethod");
        return apiMethodBox[apiMethodBox.selectedIndex].text;
    }

    function getAuthScope() {
        var authScope = id("apiScope");
        return authScope[authScope.selectedIndex].text;
    }

    function sendAPIServiceRequest() {
        
        var path = id("apiPath").value,
            method = getApiMethod(),
            authScope = getAuthScope();

        log("[api-request](" + path + "," + method + ")");
        logSeperatorLine();

        switch (method) {
            case "DOWNLOAD":
                downloadFile(path, authScope);
                break;
            case "UPLOAD":
                uploadFile(path, authScope);
                break;
            default:
                prepareAndInvokeApi(path, method, authScope);
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

    function prepareAndInvokeApi(path, method, scope) {
        var body = getBody(method),
            requestProps = {
                path: path,
                method: method
            };

        if (body) {
            requestProps.body = body;
        }

        invokeApi(requestProps, scope);
    }

    function invokeApi(requestParams, scope) {
        WL.login({ scope: scope }).then(
            function (result) {
                WL.api(requestParams).then(
                    function (response) {
                        logObject("api_response", response);
                    },
                    function (response) {
                        logObject("api_response_error", response);
                    }
                );
            },
            function (result) {
                logObject("api_auth_error", result);
            });
    }

    function downloadFile(path, scope) {
        WL.login({ scope: scope }).then(
            function (result) {
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
                        function (error) { logObject("error", error); },
                        function (progress) { logObject("progress", progress); }
                    );
            },
            function (result) {
                logObject("download auth error", result);
            });
    }

    function uploadFile(path, scope) {
        WL.login({ scope: scope }).then(
           function (result) {
               setupOpenPicker().pickSingleFileAsync().then(
                       function (file) {
                           if (file) {
                               return WL.backgroundUpload({ path: path, file_name: file.name, file_input: file });
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
           },
           function (result) {
                logObject("upload auth error", result);
           });
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