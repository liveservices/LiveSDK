/// <reference path="/LiveSDKHTML/js/wl.js" />
(function () {
    "use strict";

    var appView = Windows.UI.ViewManagement.ApplicationView;
    var appViewState = Windows.UI.ViewManagement.ApplicationViewState;
    var nav = WinJS.Navigation;
    var ui = WinJS.UI;
    var utils = WinJS.Utilities;

    
    ui.Pages.define("/pages/settingsAccountUI/settingsFlyoutUi.html", {
        
        // This function is called whenever a user navigates to this page. It
        // populates the page elements with the app's data.
        
        ready: function (element, options) {
            document.getElementById("userName").innerHTML = App.username;
            var signOut = document.getElementById("signOutLink");
            var onlineID = new Windows.Security.Authentication.OnlineId.OnlineIdAuthenticator();
            if (onlineID.canSignOut) {

                signOut.onclick = signOutButtonClick;
                signOut.style.visibility = "visible";
            }
            else {
                signOut.style.visibility = "hidden";

            }

              
        },
      


    });
    function signOutButtonClick(event) {
         WL.logout();
    }
    WinJS.Namespace.define("Accounts", {
        signOutButtonClick: signOutButtonClick,
    });
    
})();
