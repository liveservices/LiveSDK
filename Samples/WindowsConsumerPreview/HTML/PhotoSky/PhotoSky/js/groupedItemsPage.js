/// <reference path="///LiveSDKHTML//js/wl.js" />
(function () {
    "use strict";

    var appView = Windows.UI.ViewManagement.ApplicationView;
    var appViewState = Windows.UI.ViewManagement.ApplicationViewState;
    var nav = WinJS.Navigation;
    var ui = WinJS.UI;
    var utils = WinJS.Utilities;

   

    ui.Pages.define("/html/groupedItemsPage.html", {

        // This function is used in updateLayout to select the data to display
        // from an item's group.
        groupDataSelector: function (item) {
            return {
                title: item.group.title,
                click: function () {
                    nav.navigate("/html/groupDetailPage.html", { group: item.group });
                }
            }
        },

        // This function is used in updateLayout to select an item's group key.
        groupKeySelector: function (item) {
            return item.group.key;
        },

        itemInvoked: function (eventObject) {
            if (appView.value === appViewState.snapped) {
                // If the page is snapped, the user invoked a group.
                var group = data.groups.getAt(eventObject.detail.itemIndex);
                nav.navigate("/html/groupDetailPage.html", { group: group });
            } else {
                // If the page is not snapped, the user invoked an item.
                var item = data.items.getAt(eventObject.detail.itemIndex);
                nav.navigate("/html/itemDetailPage.html", { item: item });
            }
        },

        // This function is called whenever a user navigates to this page. It
        // populates the page elements with the app's data.
        ready: function (element, options) {
            var listView = element.querySelector(".groupeditemslist").winControl;
            
            
            WL.init();
            WL.getLoginStatus().then(function (response) {
                onSessionChange(response);
            });
            

      
            ui.setOptions(listView, {
                groupHeaderTemplate: element.querySelector(".headerTemplate"),
                itemTemplate: element.querySelector(".itemtemplate"),
                oniteminvoked: this.itemInvoked.bind(this)
            });

            this.updateLayout(element, appView.value);
        },

        // This function updates the page layout in response to viewState changes.
        updateLayout: function (element, viewState) {
            var listView = element.querySelector(".groupeditemslist").winControl;
            if (viewState === appViewState.snapped) {
                // If the page is snapped, display a list of groups.
                ui.setOptions(listView, {
                    itemDataSource: data.groups.dataSource,
                    groupDataSource: null,
                    layout: new ui.ListLayout()
                });
            } else {
                // If the page is not snapped, display a grid of grouped items.
                var groupDataSource = data.items.createGrouped(this.groupKeySelector, this.groupDataSelector).groups;

                ui.setOptions(listView, {
                    itemDataSource: data.items.dataSource,
                    groupDataSource: groupDataSource.dataSource,
                    layout: new ui.GridLayout({ groupHeaderPosition: "top" })
                });
            }
        },
     


       
    });

    function onSessionChange(response) {
        var session = WL.getSession();
        if (!session) {
            WL.Event.subscribe("auth.login", onLoginComplete);
            WL.ui({
                name: "signin",
                element: "signinbutton",
                scope: ["wl.signin", "wl.skydrive"],
            });
        }
        else {
            signedInUser();
        }
    }

    function onLoginComplete() {
        var session = WL.getSession();
        
        if (!session.error) {
    
            signedInUser();
        }
    }
    function signedInUser() {
        WL.api({
            path: "/me",
            method: "get"
        }
        ).then(
        function (result) {
            document.getElementById("meName").innerText = "Welcome, " + result.name;
            getUserPicture();
            getUserPhotos();
          });;
    };
    function getUserPicture() {
        var session = WL.getSession();
        var LIveConnectAPIUrl = "https://apis.live.net/v5.0";
        document.getElementById("meImg").src = LIveConnectAPIUrl + "/me/picture?return_ssl_resources=true&access_token=" + session.access_token;
        document.getElementById("meImg").style.visibility = "visible";
      
    };

    function getUserPhotos() {
        var albums_path = "/me/albums";
        WL.api({ path: albums_path, method: "GET" }).then(function (response) {
            getPictures(response);
        });

    }

    var groups = [];
    function getPictures(result) {
        if (result.error) {
        }
        else {
            var items = result.data
            for (var index in items) {
                downloadPicture(items[index].id);
                groups.push({
                    key: items[index].id,
                    title: items[index].name,
                    label: items[index].name,
                    description: items[index].type
                });
            }
        }
    };
    function downloadPicture(folderId) {

        var path = folderId + "/files"

        // Submit request
        WL.api({ path: path, method: "GET" }).then(function (response) {
            loadPhotos(response);
        });

    };
    function loadPhotos(result) {
        if (result.error) {

        }
        else {
            var msg;
            var items = result.data
            for (var index in items) {
                var parentGroup;
                for (var g = 0, gl = groups.length; g < gl; g++) {
                    if (groups[g].key === items[index].parent_id) {
                        parentGroup = groups[g];
                        break;
                    }
                }

                data.skydriveDataSource.push({
                    group: parentGroup,
                    key: items[index].id,
                    title: items[index].name,
                    subtitle: items[index].description,
                    backgroundImage: items[index].source,
                    content: '',
                    description: ''
                });

            }

        }
    };

})();
