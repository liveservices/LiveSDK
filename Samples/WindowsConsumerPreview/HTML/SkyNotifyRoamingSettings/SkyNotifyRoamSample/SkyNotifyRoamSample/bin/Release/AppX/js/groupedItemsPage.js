(function () {
    "use strict";

    var appView = Windows.UI.ViewManagement.ApplicationView;
    var appViewState = Windows.UI.ViewManagement.ApplicationViewState;
    var nav = WinJS.Navigation;
    var ui = WinJS.UI;
    var utils = WinJS.Utilities;

    var listRenderer;
    var headerRenderer;
    var itemRenderer;
    var pageLayout;
    WL.Event.subscribe("auth.login", onLoginComplete);
    WL.Event.subscribe("auth.logout", signUserOut);
    WL.Event.subscribe("auth.sessionChange", onSessionChange);

    var CurrentPath;

    var RoamingLoaded = false;
    var RoamingVariables = {
        settingName: "playSettings",
        settingName1: "PageName",
        settingName2: "ItemId",
        settingName3: "ItemTitle",
        settingName4: "ItemParentID",
        settingName5: "ItemPicture",
        settingValue1: "landingPage.html",
        settingValue2: "",
        settingValue3: "",
        settingValue4: "",
        settingValue5: "",
    }
    //vars for registering into WNS service
    var WindowsLiveId;
    var CurrentUserName;

    //update the AppServiceName with your own path where you have deployed the WCF Web Service
    //var AppServiceName = "http://192.168.1.215";
    var AppServiceName = "http://192.168.0.14";
    //var AppServiceName = "http://10.80.6.0";
    var NotificationChannelOpen = false;
    var channelUri;
    var channelExpirationTime;
    var pushNotifications = Windows.Networking.PushNotifications;

    var MyObject;

    function id(elementId) {
        return document.getElementById(elementId);
    }

    var pageData = {};
    pageData.groups = [];
    pageData.items = [];


    /*Functions to build de data using the data retrieved from SkyDrive*/
    function groupKeySelector(item) {
        return item.group.key;
    }

    function groupDataSelector(item) {
        return item.group;
    }

    // This function returns a WinJS.Binding.List containing only the items
    // that belong to the provided group.
    function getItemsFromGroup(group) {
        return list.createFiltered(function (item) { return item.group.key === group.key; });
    }
    /*Functions to build de data using the data retrieved from SkyDrive*/

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
                var item = data.items.getAt(eventObject.detail.itemIndex);
                nav.navigate('/html/groupDetailPage.html', { item: item, AppServiceName: AppServiceName, WindowsLiveId: WindowsLiveId, CurrentUserName: CurrentUserName });
            } else {
                //// If the page is not snapped, the user invoked an item.
                var item = data.items.getAt(eventObject.detail.itemIndex);
                nav.navigate('/html/groupDetailPage.html', { item: item, AppServiceName: AppServiceName, WindowsLiveId: WindowsLiveId, CurrentUserName: CurrentUserName });
            }
        },
        // This function is called whenever a user navigates to this page. It
        // populates the page elements with the app's data.
        ready: function (element, options) {
            //show / Hide ap bars
            //var AppBar = document.getElementById('appbar');
            //AppBar.disabled = false;
            //AppBar.style.visibility = "initial";
            try {
                var DetailAppBar = document.getElementById('ShareAppBar');
                if (DetailAppBar != null) {
                    DetailAppBar.disabled = true;
                    DetailAppBar.style.visibility = "none";
                    //DetailAppBar.winControl._sticky = "false";
                }
            }
            catch (ex) {
                //ex, not share app bar available
            }

            MyObject = this;
            WLiveInit();
            var listView = element.querySelector(".groupeditemslist").winControl;

            ui.setOptions(listView, {
                groupHeaderTemplate: element.querySelector(".headerTemplate"),
                itemTemplate: element.querySelector(".itemtemplate"),
                oniteminvoked: this.itemInvoked.bind(this)
            });

            //add actions for error bar
            id("BtnDismiss").addEventListener('click', function () {
                var ErrorBar = document.getElementById('errorBar');
                ErrorBar.disabled = true;
                errorBar.winControl.hide();
            });
            //we update the layout every time we load the page
            RenderPage();
            getUserName();
        },

        // This function updates the page layout in response to viewState changes.
        updateLayout: function (element, viewState) {
            if (element.querySelector(".groupeditemslist") != undefined) {
                var lv = element.querySelector(".groupeditemslist").winControl;
                pageLayout = viewState;

                var list = new WinJS.Binding.List();
                var groupedItems = list.createGrouped(groupKeySelector, groupDataSelector);

                //converting the data obtained fron SkyDrive to a WinJS.binding.list
                pageData.items.forEach(function (item) {
                    list.push(item);
                });

                WinJS.Namespace.define("data", {
                    items: groupedItems,
                    groups: groupedItems.groups,
                    getItemsFromGroup: getItemsFromGroup
                });

                if (pageLayout === Windows.UI.ViewManagement.ApplicationViewState.snapped) {
                    var groupDataSource = data.items.createGrouped(this.groupKeySelector, this.groupDataSelector).groups;

                    ui.setOptions(lv, {
                        itemDataSource: data.items.dataSource,
                        groupDataSource: groupDataSource.dataSource,
                        layout: new ui.GridLayout({ layoutHeader: "top" })
                    });
                } else {
                    var groupDataSource = data.items.createGrouped(this.groupKeySelector, this.groupDataSelector).groups;

                    ui.setOptions(lv, {
                        itemDataSource: data.items.dataSource,
                        groupDataSource: groupDataSource.dataSource,
                        layout: new ui.GridLayout({ groupHeaderPosition: "top" })
                    });
                }
            }
    
        },

    });

    // Windows Live Functions
    function WLiveInit() {
        WL.init();
        var session = WL.getSession();
        WL.login({
            //scope: ["wl.emails", "wl.work_profile", "wl.basic", "wl.signin", "wl.share", "wl.skydrive", "wl.contacts_skydrive", "wl.skydrive_update", "wl.photos", "wl.contacts_photos"],
            scope: ["wl.basic", "wl.signin","wl.emails", "wl.contacts_photos"],
            //scope: ["wl.emails"]
        });
        WL.ui({
            name: "signin",
            element: "signinbutton",
            them: "dark"
        });
    }


    function onAPIError(error) {
        if (error) {
                var resultError = error;
            //display the errorBar
                id('ErrorTitle').style.visibility = "visible";
                var ErrorText = document.getElementById('ErrorText');
                ErrorText.innerHTML = error.message;
                var ErrorBar = document.getElementById('errorBar');
                ErrorBar.disabled = false;
                id("BtnAccept").style.visibility = "hidden";
                errorBar.winControl.show();
        }
    }

    function onLoginComplete() {
        var session = WL.getSession();
        if (!session.error) {
            signedInUser();
            getAlbums();
        }
    }

    function signedInUser() {
        //we load the roaming settings only if the user was able to log in to the live account.
        getUserName();
    }

    function loadRoamingSettings() {
        var roamingSettings = Windows.Storage.ApplicationData.current.roamingSettings;
        var composite = roamingSettings.values[RoamingVariables.settingName];
        if (composite) {
            if (RoamingLoaded == false) {
                var item = {
                    key: composite[RoamingVariables.settingName2],
                    title: composite[RoamingVariables.settingName3],
                    parent_id: composite[RoamingVariables.settingName4],
                    picture: composite[RoamingVariables.settingName5],
                }
                RoamingLoaded = true;
                WinJS.Navigation.navigate('/html/' + composite[RoamingVariables.settingName1] + '', { item: item, WindowsLiveId: WindowsLiveId, CurrentUserName: CurrentUserName, AppServiceName: AppServiceName });
            }
            else {
                deleteRoamingSettings();
            }
        }


    }

    function deleteRoamingSettings() {
        var roamingSettings = Windows.Storage.ApplicationData.current.roamingSettings;
        roamingSettings.values.remove(RoamingVariables.settingName);
    }

    function getUserName() {
        WL.api({ path: "/me", method: "GET" }, getUserName_Callback);
    }

    function getUserName_Callback(result) {
        if (result.error) {
            var resultError = result.error;
            //display the errorBar
            id('ErrorTitle').style.visibility = "visible";
            var ErrorText = document.getElementById('ErrorText');
            ErrorText.innerHTML = "Couldn't retrieve user's name: " + result.error.message;
            var ErrorBar = document.getElementById('errorBar');
            ErrorBar.disabled = false;
            id("BtnAccept").style.visibility = "hidden";
            errorBar.winControl.show();
        }
        else if (result) {
            try {
                CurrentUserName = result.name;
                WindowsLiveId = result.emails.account;//obtain the windows live id so we can register into WNS Service
                //document.getElementById("Name").innerText = result.name;
                WL.api({ path: "/me/picture", method: "GET" }, getUserPictureCallBack);
                //we have to update the WNS channel at this point because we need that the variable WindowsLiveId had already been instantiated
                UpdateWNSChannel();
                //after variables have been set we load roaming settings to navigate where the user left the app in other device
                loadRoamingSettings();
            }
            catch (e) { }
        }
    }

    function getUserPictureCallBack(result) {
        if (result.error) {
            var resultError = result.error;
            //display the errorBar
            id('ErrorTitle').style.visibility = "visible";
            var ErrorText = document.getElementById('ErrorText');
            ErrorText.innerHTML = "Couldn't retrieve user's picture: " + result.error.message;
            var ErrorBar = document.getElementById('errorBar');
            ErrorBar.disabled = false;
            id("BtnAccept").style.visibility = "hidden";
            errorBar.winControl.show();
        }
        else if (result) {
            try {
                //document.getElementById("meImg").src = result.location;
                //document.getElementById("meImg").style.visibility = "visible";
            }
            catch (e) { }
        }
    }

    function getAlbums() {
        var albums_path = "/me/albums";
        //var albums_path = "/me/skydrive/files";
        WL.api({ path: albums_path, method: "GET" }, onEnumerateAlbumsComplete);
    }

    function onEnumerateAlbumsComplete(result) {
        if (result.error) {
            var resultError = result.error;
            //display the errorBar
            id('ErrorTitle').style.visibility = "visible";
            var ErrorText = document.getElementById('ErrorText');
            ErrorText.innerHTML = "Couldn't retrieve user's album(s): " + result.error.message;
            var ErrorBar = document.getElementById('errorBar');
            ErrorBar.disabled = false;
            id("BtnAccept").style.visibility = "hidden";
            errorBar.winControl.show();
        }
        else {

            var items = result.data
            pageData.groups.push({
                key: "Albums",
                title: items.length + " albums",
                subtitle: "Group Subtitle",
                label: "Albums",
                description: items.length + " Albums"
            });
            var GroupKey = pageData.groups[0];
            for (var index in items) {
                downloadPicture(items[index].id, items[index].name, items[index].count, GroupKey);
            }
        }
    };

    function downloadPicture(folderId, name, count, groupkey) {

        CurrentPath = folderId + "/files"
        // Submit request
        WL.api({ path: CurrentPath, method: "GET", body: { filter: "photos" } }, function (result) {
            onMainPhotoLoad(result, folderId, name, count, groupkey)
        });
    };

    function onMainPhotoLoad(result, folderId, name, count, groupkey) {
        if (result.error) {
            var resultError = result.error;
            //display the errorBar
            id('ErrorTitle').style.visibility = "visible";
            var ErrorText = document.getElementById('ErrorText');
            ErrorText.innerHTML = "Couldn't retrieve user's main photo album: " + result.error.message;
            var ErrorBar = document.getElementById('errorBar');
            ErrorBar.disabled = false;
            id("BtnAccept").style.visibility = "hidden";
            errorBar.winControl.show();
        }
        else {
            var items = result.data
            if (result.data.length == 0) {
                //if there is no pictures inside the album we seek for a folder inside..  if there is none, then the album is empty and we don't display it
                var SubPath = folderId + "/files"
                WL.api({ path: SubPath, method: "GET"}, function (result) {
                    onSubFolderPhotoLoad(result, folderId, name, count, groupkey)
                });

            }
            else {
                var indexToDisplay = Math.floor(Math.random() * items.length);
                if (items[indexToDisplay].type == "photo") {
                    pageData.items.push({
                        group: pageData.groups[0],
                        key: folderId,
                        title: name,
                        subtitle: count,
                        picture: items[indexToDisplay].source,
                        content: '',
                        description: ''
                    });
                }
            }
            RenderPage();
        }
    };

    function onSubFolderPhotoLoad(result, folderId, name, count, groupkey) {
        if (result.error) {
            var resultError = result.error;
            //display the errorBar
            id('ErrorTitle').style.visibility = "visible";
            var ErrorText = document.getElementById('ErrorText');
            ErrorText.innerHTML = "Couldn't retrieve user's files: " + result.error.message;
            var ErrorBar = document.getElementById('errorBar');
            ErrorBar.disabled = false;
            id("BtnAccept").style.visibility = "hidden";
            errorBar.winControl.show();
        }
        else {
            var items = result.data
            var backgroundFound = false;
            for (var index in items) {
                if (items[index].type == "folder") {
                    CurrentPath = items[index].id + "/files"
                    // Submit request
                    if (items[index].count > 0) {
                        WL.api({ path: CurrentPath, method: "GET", body: { filter: "photos" } }, function (result) {
                            var SubItems = result.data
                            var indexToDisplay = Math.floor(Math.random() * SubItems.length);
                            if (SubItems[indexToDisplay].type == "photo") {
                                pageData.items.push({
                                    group: pageData.groups[0],
                                    key: folderId,
                                    title: name,
                                    subtitle: count,
                                    picture: SubItems[indexToDisplay].source,
                                    content: '',
                                    description: ''
                                });
                                RenderPage();
                            }
                        });
                        break;

                    }
                }
            }

        }
    };



    function signUserOut() {
        WL.logout();
        //document.getElementById("meImg").style.visibility = "hidden";
        document.getElementById("Name").innerText = "Login to see your photos";
        pageData.groups.length = 0;
        pageData.items.length = 0;
        RenderPage();
    }

    function onSessionChange() {
        var session = WL.getSession();
    }

    function RenderPage() {
        var Page = document.querySelector('.pagecontrol');
        if (Page) {
            var element = Page.winControl.element;
            MyObject.updateLayout(element, appView.value);
        }
    }

    function UpdateWNSChannel() {
        var hostNames = Windows.Networking.Connectivity.NetworkInformation.getHostNames();
        var hostName = hostNames[0].canonicalName;
        //only register the app on the first run of the landingPage.html script
        if (NotificationChannelOpen == false) {
            openNotificationsChannel().then(function () {
                //You would have to update this URL With your server URL
                var baseURl = AppServiceName + "/WNSSkyDriveService/SkyDriveService.svc/rest/UpdateChannel?HostName=" + hostName + "&LiveId=" + WindowsLiveId + "&ChannelUri=" + channelUri + "&ChannelExpirationTime=" + channelExpirationTime;
                var url = baseURl;
                WinJS.xhr({
                    url: url
                }).then(function (r) {
                    var result = r.responseText;
                    NotificationChannelOpen = true;
                },
                    function (error) {
                        var resultError = error;
                        //display the errorBar
                        id('ErrorTitle').style.visibility = "visible";
                        var ErrorText = document.getElementById('ErrorText');
                        ErrorText.innerHTML = "Couldn't update the channel for notify other users: " + error.message;
                        var ErrorBar = document.getElementById('errorBar');
                        ErrorBar.disabled = false;
                        id("BtnAccept").style.visibility = "hidden";
                        errorBar.winControl.show();
                    })
            });

        }
    }

    function openNotificationsChannel() {
        var channelOperation = pushNotifications.PushNotificationChannelManager.createPushNotificationChannelForApplicationAsync();
        return channelOperation.then(function (newChannel) {
            channelUri = newChannel.uri;
            channelExpirationTime = newChannel.expirationTime
        },
            function (error) {
                var resultError = error;
                //display the errorBar
                id('ErrorTitle').style.visibility = "visible";
                var ErrorText = document.getElementById('ErrorText');
                ErrorText.innerHTML = "Couldn't open the channel for notify other users: " + error.message;
                var ErrorBar = document.getElementById('errorBar');
                ErrorBar.disabled = false;
                id("BtnAccept").style.visibility = "hidden";
                errorBar.winControl.show();
            }
        );
    }
    ///END OF WINDOWS LIVE FUNCTIONS
})();
