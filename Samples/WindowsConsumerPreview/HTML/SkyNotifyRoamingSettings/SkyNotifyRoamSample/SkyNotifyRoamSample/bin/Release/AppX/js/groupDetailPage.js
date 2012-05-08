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

    //the album that's being explored
    var AlbumId

    var RoamingVariables = {
        settingName: "playSettings",
        settingName1: "PageName",
        settingName2: "ItemId",
        settingName3: "ItemTitle",
        settingName4: "ItemParentID",
        settingName5: "ItemPicture",
        settingValue1: "groupDetailPage.html",
        settingValue2: "",
        settingValue3: "",
        settingValue4: "",
        settingValue5: "",
    }

    var MyObject;
    var list
    var pageData = {};
    pageData.groups = [];
    pageData.items = [];
    var group;
    var items;

    //vars for registering into WNS service
    var WindowsLiveId;
    var CurrentUserName;
    var AppServiceName;

    //Windows Live functionality
    WL.Event.subscribe("auth.login", onLoginComplete);
    WL.Event.subscribe("auth.logout", signUserOut);
    WL.Event.subscribe("auth.sessionChange", onSessionChange);


    function id(elementId) {
        return document.getElementById(elementId);
    }

   

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

    ui.Pages.define("/html/groupDetailPage.html", {
        // This function is used in updateLayout to select the data to display
        // from an item's group.
        groupDataSelector: function (item) {
            return {
                title: item.group.title,
                click: function () {
                    nav.navigate("/html/itemDetailPage.html", { group: item.group });
                }
            }
        },

        // This function is used in updateLayout to select an item's group key.
        groupKeySelector: function (item) {
            return item.group.key;
        },

        // This function is called whenever a user navigates to this page. It
        // populates the page elements with the app's data.
        ready: function (element, options) {
            //var AppBar = document.getElementById('appbar');
            //AppBar.disabled = false;
            //AppBar.style.visibility = "initial";
            try
            {
                var DetailAppBar = document.getElementById('ShareAppBar');
                if (DetailAppBar != null)
                    {
                        DetailAppBar.disabled = true;
                        DetailAppBar.style.visibility = "none";
                        }
            }
            catch (ex)
            {
               //ex, not share app bar available
            }
            
            pageData.groups.length = 0;
            pageData.items.length = 0;
            MyObject = this;
            //set variables for Sending Notifications
            WindowsLiveId = options.WindowsLiveId;
            CurrentUserName = options.CurrentUserName;
            AppServiceName = options.AppServiceName;

            var item = options && options.item ? options.item : getItem();
            element.querySelector("header[role=banner] .pagetitle").textContent = item.title;
            AlbumId = item.key;
            RoamingVariables.settingValue2 = item.key;
            RoamingVariables.settingValue3 = item.title;
            writeRoamingSettings();
            WLiveInit();

            //Add actions for error bar
            id("BtnDismiss").addEventListener('click', function () {
                var ErrorBar = document.getElementById('errorBar');
                ErrorBar.disabled = true;
                errorBar.winControl.hide();
            });
        },

        // This function updates the page layout in response to viewState changes.
        updateLayout: function (element, viewState) {
            if (element.querySelector(".grouplist") != undefined) {
                var lv = element.querySelector(".grouplist").winControl;
                pageLayout = viewState;

                list = new WinJS.Binding.List();
                var groupedItems = list.createGrouped(groupKeySelector, groupDataSelector);

                //converting the data obtained from SkyDrive to a WinJS.binding.list
                pageData.items.forEach(function (item) {
                    list.push(item);
                });

                WinJS.Namespace.define("data", {
                    items: groupedItems,
                    groups: groupedItems.groups,
                    getItemsFromGroup: getItemsFromGroup
                });


                items = data.items;
                var pageList = items.createGrouped(
            function (item) { return item.group.key; },
            function (item) { return item.group; }
            );

                var groupDataSource = pageList.groups.dataSource;
                var listView = document.querySelector(".grouplist").winControl;
                if (viewState === Windows.UI.ViewManagement.ApplicationViewState.snapped) {
                        ui.setOptions(listView, {
                            itemDataSource: pageList.dataSource,
                            itemTemplate: document.querySelector(".itemtemplate"),
                            groupDataSource: pageList.groups.dataSource,
                            groupHeaderTemplate: document.querySelector(".headerTemplate"),
                            oniteminvoked: this.itemInvoked.bind(this),
                            layout: new ui.ListLayout()
                        });
                        
                } else {
                    ui.setOptions(listView, {
                        itemDataSource: pageList.dataSource,
                        itemTemplate: document.querySelector(".itemtemplate"),
                        groupDataSource: pageList.groups.dataSource,
                        groupHeaderTemplate: document.querySelector(".headerTemplate"),
                        oniteminvoked: this.itemInvoked.bind(this),
                        layout: new ui.GridLayout({ groupHeaderPosition: "top" })
                    });
                }
               
            }
        },

        itemInvoked: function (eventObject) {
            if ((pageData.groups.length != 0) || (pageData.items.length != 0)) {
                var item = pageData.items[eventObject.detail.itemIndex];
                if (item.type == "folder")
                    WinJS.Navigation.navigate('/html/groupDetailPage.html', { item: item, AppServiceName: AppServiceName, WindowsLiveId: WindowsLiveId, CurrentUserName: CurrentUserName });
                else
                    WinJS.Navigation.navigate('/html/itemDetailPage.html', { item: item, AppServiceName: AppServiceName, WindowsLiveId: WindowsLiveId, CurrentUserName: CurrentUserName });
            }
        }
    });

    function writeRoamingSettings() {
        var composite = new Windows.Storage.ApplicationDataCompositeValue();
        composite[RoamingVariables.settingName1] = RoamingVariables.settingValue1;
        composite[RoamingVariables.settingName2] = RoamingVariables.settingValue2;
        composite[RoamingVariables.settingName3] = RoamingVariables.settingValue3;
        composite[RoamingVariables.settingName4] = RoamingVariables.settingValue4;
        composite[RoamingVariables.settingName5] = RoamingVariables.settingValue5;

        var roamingSettings = Windows.Storage.ApplicationData.current.roamingSettings;
        roamingSettings.values[RoamingVariables.settingName] = composite;
    }

    // Windows Live
    function WLiveInit() {
        //id("photoListView").addEventListener("selectionchanged", function () { });
        WL.init();
        var session = WL.getSession();
        WL.ui({
            name: "signin",
            element: "signinbutton",
            scope: ["wl.signin", "wl.basic", "wl.skydrive", "wl.contacts_skydrive", "wl.skydrive_update", "wl.photos", "wl.contacts_photos"],
        });
        signedInUser();
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
        }
    }

    function signedInUser() {
        getUserName();
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
        else if (result.name) {
            //document.getElementById("Name").innerText = "Welcome, " + result.name;
            WL.api({ path: "/me/picture", method: "GET" }, getUserPictureCallBack);
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
        getAlbums();
    }

    function getAlbums() {
        var albums_path = AlbumId + "/files";
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
            //just push photos if we are still on SkyCollectionPage, else cancel request
            var folderCount = 0;
            var PhotoCount = 0;
            var items = result.data;
            //Group for folders
            pageData.groups.push({
                key: "Folders",
                title: " Folders",
                label: "Folders",
                description: " Folders"
            });

            //Group for photos
            pageData.groups.push({
                key: "Photos",
                title: " Photos",
                label: "Photos",
                description: " Photos"
            });

            var FolderGroup = pageData.groups[0];
            var PhotoGroup = pageData.groups[1];
            for (var index in items) {
                if (items[index].type == "photo") {
                    PhotoCount++;
                    if (items[index].picture != null) {
                        pageData.items.push({
                            group: PhotoGroup,
                            key: items[index].id,
                            title: items[index].name,
                            subtitle: items[index].description,
                            //background: items[index].source,
                            background: items[index].picture,
                            content: '',
                            description: '',
                            type: items[index].type,
                            picture: items[index].id,
                            parent_id: items[index].parent_id
                        });
                    }
                    else {
                        pageData.items.push({
                            group: PhotoGroup,
                            key: items[index].id,
                            title: items[index].name,
                            subtitle: items[index].description,
                            //background: items[index].source,
                            background: items[index].picture,
                            content: '',
                            description: '',
                            type: items[index].type,
                            picture: items[index].id,
                            parent_id: items[index].parent_id
                        });
                    }
                }
                else {
                    if (items[index].type == "folder") {
                        folderCount++;
                        pageData.items.push({
                            group: FolderGroup,
                            key: items[index].id,
                            title: items[index].name,
                            subtitle: items[index].count + " items",
                            background: "images/FolderLogo.png",
                            content: '',
                            description: '',
                            type: items[index].type
                        });
                        //if the folder has 1 or more pictures inside then we display a random picture as background
                        if (items[index].count > 0) {
                            displayBackgroundForFolder(pageData.items[index], items[index].id);
                        }
                    }
                }
            }
            pageData.groups[0].description = folderCount + " Folders";
            pageData.groups[1].description = PhotoCount + " Photos";
            pageData.groups[0].title = folderCount + " Folders";
            pageData.groups[1].title = PhotoCount + " Photos";
        }
        RenderPage();
    };

    function displayBackgroundForFolder(FolderItem, FolderID) {
        //variables for the slideshow of each folder
        var playlist = [];
        var playlistCurrentIndex = 0;

        var albums_path = FolderID + "/files";
        WL.api({ path: albums_path, method: "GET", filter: "photos" }, function (result) {
            if (result.error) {
                var resultError = result.error;
                //display the errorBar
                id('ErrorTitle').style.visibility = "visible";
                var ErrorText = document.getElementById('ErrorText');
                ErrorText.innerHTML = "Couldn't retrieve user's photo(s): " + result.error.message;
                var ErrorBar = document.getElementById('errorBar');
                ErrorBar.disabled = false;
                id("BtnAccept").style.visibility = "hidden";
                errorBar.winControl.show();
            }
            else {
                var subItems = result.data;
                for (var subIndex in subItems) {
                    if (subItems[subIndex].picture != null) {
                        playlist.push(subItems[subIndex].picture)

                    }
                    else {
                        playlist.push(subItems[subIndex].source)
                    }
                }
                folderAddPhoto(FolderItem, playlist, Math.floor(Math.random() * subItems.length));
            }
        });
    }


    function folderAddPhoto(FolderItem, playlist, Index) {
        FolderItem.background = playlist[Index];
        RenderPage();
    }

    function signUserOut() {
        WL.logout();
        //document.getElementById("meImg").style.visibility = "hidden";
        //document.getElementById("meName").innerText = "Login to see your photos";
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


})();
