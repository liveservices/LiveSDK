/// <reference path="output.js" />
/// <reference path="share.js" />
// For an introduction to the Blank template, see the following documentation:
// http://go.microsoft.com/fwlink/?LinkId=232509
/// <reference path="///LiveSDKHTML/js/wl.js" />
(function () {
    "use strict";

    var nav = WinJS.Navigation;
    var ui = WinJS.UI;
    var utils = WinJS.Utilities;
    var path = document.location.pathname + document.location.search;
    ui.Pages.define(path, {
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
                    showAuthCode();

                }
            );
        }
    });

    function attachDomEvents() {
        id("select-scopes").onchange = showAuthCode;
        id("button-authorize").onclick = authorize;
        id("buton-logout").onclick = logout;

        if (!WL.canLogout()) {
            id("buton-logout").style.display = "none";
        }
    }

    function showAuthCode() {
        var code = 
            "WL.login({\n" +
            "    scope: ['" + selectedScopes().join("', '") + "']\n" +
            "}).then(\n" +
            "    function (response) {\n" +
            "        logObject('Authorization response', response);\n" +
            "    },\n" +
            "    function (response) {\n" +
            "        logObject('Authorization error', response);\n" +
            "    }\n" +
            ");\n" 

        id("auth-code").value = code;
    }

    function selectedScopes() {
        var options = id("select-scopes").options,
            scopes = [];
        for (var i = 0; i < options.length; i++) {
            if (options[i].selected) {
                scopes.push(options[i].text);
            }
        }

        return scopes;
    }

    function authorize() {
        var scopes = selectedScopes();
        if (scopes.length > 0) {
            WL.login({
                scope: scopes
            }).then(
                function (response) {
                    logObject("Authorization response", response);
                },
                function (response) {
                    logObject("Authorization error", response);
                }
            );
        }
    }
    
    function logout() {
        WL.logout().then(
            function (result) {
                logObject("Logout success", result);
            },
            function (result) {
                logObject("Logout error", result);
            }
            );
    }
})();


