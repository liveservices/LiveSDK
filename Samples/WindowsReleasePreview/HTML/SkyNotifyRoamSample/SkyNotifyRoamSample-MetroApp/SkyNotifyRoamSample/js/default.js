// For an introduction to the Grid template, see the following documentation:
// http://go.microsoft.com/fwlink/?LinkID=232446
(function () {
    "use strict";

    var app = WinJS.Application;
    var activation = Windows.ApplicationModel.Activation;
    var nav = WinJS.Navigation;
    //WinJS.strictProcessing();

    app.addEventListener("activated", function (args) {
        if (args.detail.kind === Windows.ApplicationModel.Activation.ActivationKind.launch) {
            if (args.detail.previousExecutionState !== Windows.ApplicationModel.Activation.ApplicationExecutionState.terminated) {
                // Initialize the application here.
                showAccountCharm();
                //WinJS.UI.process(document.getElementById('appbar'))
                //.then(function () {
                //    document.getElementById('home').addEventListener('click', navigateHome, false);
                //});
            } else {
                // Restore application state here.
            }
            if (app.sessionState.history) {
                nav.history = app.sessionState.history;
            }
            args.setPromise(WinJS.UI.processAll().then(function () {
                if (nav.location) {
                    nav.history.current.initialPlaceholder = true;
                    return nav.navigate(nav.location, nav.state);
                } else {
                    return nav.navigate(SkyNotifyRoamSample.navigator.home);
                }
            }));

        }
    });

    function showAccountCharm() {
        WinJS.Application.onsettings = function (e) {
            e.detail.applicationcommands = { "accountDiv": { title: "Account", href: "/html/settings/account.html" } };
            WinJS.UI.SettingsFlyout.populateSettings(e);
        };
        // Make sure the following is called after the DOM has initialized. Typically this would be part of app initialization
        //WinJS.Application.start();
    }

    app.oncheckpoint = function (eventObject) {
        // TODO: This application is about to be suspended. Save any state
        // that needs to persist across suspensions here. You might use the 
        // WinJS.Application.sessionState object, which is automatically
        // saved and restored across suspension. If you need to complete an
        // asynchronous operation before your application is suspended, call
        // eventObject.setPromise().
        app.sessionState.history = nav.history;
    };

    app.start();
})();
