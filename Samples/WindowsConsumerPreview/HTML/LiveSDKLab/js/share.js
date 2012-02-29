// For an introduction to the Blank template, see the following documentation:
// http://go.microsoft.com/fwlink/?LinkId=232509
/// <reference path="///LiveSDKHTML/js/wl.js" />
(function () {
    "use strict";

    window.id = function (objId) {
        return document.getElementById(objId);
    };

    window.selected = function selected(objId) {
        var selectElement = id(objId),
        selectedOption = selectElement[selectElement.selectedIndex];
        return selectedOption.value || selectedOption.text;
    };

    window.setLocale = function (locale) {
        try {
            var rm = Windows.ApplicationModel.Resources.Core.ResourceManager;
            rm.current.defaultContext.languages = [locale];
        }
        catch (ex) {
        }
    };

    window.liveSdkSample = {
        parseJson: function (value) {
            try {
                return JSON.parse(value);
            }
            catch (error) {
                return null;
            }
        },

        serializeParameters: function (dict) {
            var serialized = "";
            if (dict != null) {
                for (var key in dict) {
                    var separator = (serialized.length == 0) ? "" : "&";
                    var value = dict[key];
                    serialized += separator + encodeURIComponent(key) + "=" + encodeURIComponent(value);
                }
            }

            return serialized;
        },

        deserializeParameters: function (value) {
            var dict = {};

            if (value != null) {
                var properties = value.split('&');
                for (var i = 0; i < properties.length; i++) {
                    var property = properties[i].split('=');
                    if (property.length == 2) {
                        dict[decodeURIComponent(property[0])] = decodeURIComponent(property[1]);
                    }
                }
            }

            return dict;
        },

        init: function (options) {

            WL.Event.subscribe("auth.sessionChange", onSessionChanged);

            var initOptions = {};
            if (options && options.scope) {
                initOptions.scope = options.scope;
            }

            WL.init(initOptions);

            var signInControlProps = {
                name: "signin",
                element: "header-signin-control"
            };

            if (options && options.theme) {
                signInControlProps.theme = options.theme;
            }

            WL.ui(signInControlProps);

            WL.getLoginStatus().then(updateSessionStatus);
        }
    }

    function onSessionChanged(e) {

        updateSessionStatus(e);

        if (e.session) {
            displayMe();
        }
        else {
            clearMe();
        }
    }

    function updateSessionStatus(e) {
        id("current-session-status").innerText = e.status;
        if (e.session) {
            id("current-session-scope").innerText = e.session.scope.join(' ');
        }
        else {
            id("current-session-scope").innerText = "";
        }
    }

    function displayMe() {
        var imgHolder = id("meImg"),
            nameHolder = id("meName");

        if (imgHolder.innerHTML != "") return;

        if (WL.getSession() != null) {
            WL.api({ path: "me/picture", method: "get" }).then(
                    function (response) {
                        if (response.location) {
                            imgHolder.innerHTML = "<img src='" + response.location + "' />";
                        }
                    },
                    function (failedResponse) {
                        logObject("get-me/picture failure", failedResponse);
                    }
                );

            WL.api({ path: "me", method: "get" }).then(
                    function (response) {
                        nameHolder.innerHTML = response.name;
                    },
                    function (failedResponse) {
                        logObject("get-me failure", failedResponse);
                    }
                );
        }
    }

    function clearMe() {
        id("meImg").innerHTML = "";
        id("meName").innerHTML = "";
    }

})();