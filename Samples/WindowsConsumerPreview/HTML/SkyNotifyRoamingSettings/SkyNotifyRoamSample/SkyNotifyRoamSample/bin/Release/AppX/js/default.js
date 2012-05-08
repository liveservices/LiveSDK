// For an introduction to the Grid template, see the following documentation:
// http://go.microsoft.com/fwlink/?LinkID=232446
(function () {
    "use strict";

    var app = WinJS.Application;

    app.onactivated = function (eventObject) {
        if (eventObject.detail.kind === Windows.ApplicationModel.Activation.ActivationKind.launch) {
            if (eventObject.detail.previousExecutionState !== Windows.ApplicationModel.Activation.ApplicationExecutionState.terminated) {
                // Initialize the application here.
                showAccountCharm();
                //WinJS.UI.process(document.getElementById('appbar'))
                //.then(function () {
                //    document.getElementById('home').addEventListener('click', navigateHome, false);
                //});
            } else {
                // Restore application state here.
            }
            WinJS.UI.processAll();

        }
    };

    function showAccountCharm() {
        WinJS.Application.onsettings = function (e) {
            e.detail.applicationcommands = { "accountDiv": { title: "Account", href: "/html/settings/account.html" } };
            WinJS.UI.SettingsFlyout.populateSettings(e);
        };
        // Make sure the following is called after the DOM has initialized. Typically this would be part of app initialization
        WinJS.Application.start();
    }

    app.oncheckpoint = function (eventObject) {
        // TODO: This application is about to be suspended. Save any state
        // that needs to persist across suspensions here. You might use the 
        // WinJS.Application.sessionState object, which is automatically
        // saved and restored across suspension. If you need to complete an
        // asynchronous operation before your application is suspended, call
        // eventObject.setPromise(). 
    };

    app.start();
})();
