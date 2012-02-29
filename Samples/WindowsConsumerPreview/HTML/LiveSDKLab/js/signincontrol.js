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
    var path = document.location.pathname + document.location.search;
    ui.Pages.define(path, {
        // This function is called whenever a user navigates to this page. It
        // populates the page elements with the app's data.
        ready: function (element, options) {
            WinJS.UI.Fragments.render("/header.html", header).then(
                function () {
                    var options = initSelections();
                    liveSdkSample.init(options);

                    WL.ui({
                        name: "signin",
                        element: "sign-in-ctrl",
                        brand: options.brand,
                        type: options.type,
                        theme: options.theme
                    });

                    attachDomEvents();
                    showCode(options);
                }
            );
        }
    });

    function attachDomEvents() {

        var onOptionChange = function () {
            showCode();
        };

        id("select-locale").onchange = onOptionChange;
        id("select-theme").onchange = onOptionChange;
        id("select-brand").onchange = onOptionChange;
        id("select-type").onchange = onOptionChange;
        id("select-scopes").onchange = onOptionChange;

        id("button-apply-changes").onclick = function () {
            var options = getCurrentCustomization();
            options.scope = options.scope.join(' ');

            window.location = "/signincontrol.html?" + liveSdkSample.serializeParameters(options);
        };
    }

    function getCurrentCustomization() {
        return {
            locale: selected("select-locale"),
            theme: selected("select-theme"),
            brand: selected("select-brand"),
            type: selected("select-type"),
            scope: selectedScopes()
        };
    }
    
    function initSelections() {
        
        var search = document.location.search;
        if (search.charAt(0) == "?") {
            search = search.substr(1);
        }

        var options = liveSdkSample.deserializeParameters(search);

        options.theme = options.theme || "dark";
        options.brand = options.brand || "windows";
        options.type = options.type || "signin";
        options.locale = options.locale || "en";
        options.scope = options.scope || "wl.signin";

        options.scope = options.scope.split(' ');

        setThemeCss(options.theme);
        setLocale(options.locale);

        setSelectedOption("select-theme", options.theme);
        setSelectedOption("select-brand", options.brand);
        setSelectedOption("select-type", options.type);
        setSelectedOption("select-locale", options.locale);
        setSelectedScopes(options.scope);

        return options;
    }

    function setSelectedOption(objId, selectValue) {
        var element = id(objId);
        for (var i = 0; i < element.options.length; i++){
            var option = element.options[i];
            if (option.value == selectValue) {
                option.selected = true;
                return;
            }
        }

        throw new Error("BugBug, selectValue cannot be found: " + selectValue);
    }

    function setThemeCss(theme) {
        var link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "//Microsoft.WinJS.0.6/css/ui-" + theme + ".css";

        document.head.appendChild(link);
    }
    
    function showCode(options) {

        options = options || getCurrentCustomization();

        var code = 
            "<div id='sign-in-ctrl'></div>\n" +
            "<script type='text/javascript' >\n" +
            "  // Set locale value before invoking WL.init().\n" +
            "  var rm = Windows.ApplicationModel.Resources.Core.ResourceManager;\n" +
            "  rm.current.defaultContext.languages = ['" + options.locale + "'];\n\n" +
            "  WL.init({\n" +
            "    scope: ['" + options.scope.join("','") + "']\n" +
            "  });\n\n" +
            "  WL.ui({\n" +
            "    name: 'signin',\n" +
            "    element: 'sign-in-ctrl',\n" +
            "    brand: '"+ options.brand + "',\n" +
            "    type: '"+ options.type + "',\n" +
            "    theme: '"+ options.theme + "'\n" +
            "  });\n" +
            "</script>";

        id("sign-in-ctrl-code").value = code;
    }

    function selectedScopes() {
        var options = id("select-scopes").options,
            scopes = [];
        for (var i = 0; i < options.length; i++) {
            if (options[i].selected) {
                scopes.push(options[i].value);
            }
        }

        return scopes;
    }

    function setSelectedScopes(scopes) {
        var options = id("select-scopes").options;
        for (var i = 0; i < options.length; i++) {
            if (scopes.indexOf(options[i].value) >= 0)
                options[i].selected = true;
            else
                options[i].selected = false;
        }
    }
})();


