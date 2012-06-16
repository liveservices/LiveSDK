(function () {
    "use strict";

    var appView = Windows.UI.ViewManagement.ApplicationView;
    var appViewState = Windows.UI.ViewManagement.ApplicationViewState;
    var nav = WinJS.Navigation;
    var ui = WinJS.UI;
    var utils = WinJS.Utilities;
    var PictureId;

    //vars for slideShow
    var g_playlist = [];
    var g_playlistCurrIndex = 0;
    var g_playlistImageTimerID = null;
    var g_playlistAutoPlay = false;
    var g_playlistImageTimerID = null;

    var RoamingVariablesLanding = {
        settingName: "playSettings",
        settingName1: "PageName",
        settingName2: "ItemId",
        settingName3: "ItemTitle",
        settingName4: "ItemParentID",
        settingName5: "ItemPicture",
        settingValue1: "itemDetailPage.html",
        settingValue2: "",
        settingValue3: "",
        settingValue4: "",
        settingValue5: "",
    }

    //vars for registering into WNS service
    var WindowsLiveId;
    var CurrentUserName;
    var AppServiceName;
    var PictureURLLinkToShare;
    var firstTime = true;
    //Windows Live functionality
    WL.Event.subscribe("auth.login", onLoginComplete);
    WL.Event.subscribe("auth.logout", signUserOut);
    WL.Event.subscribe("auth.sessionChange", onSessionChange);

    //flag for share indicator
    var sharedSource = false;

    function id(elementId) {
        return document.getElementById(elementId);
    }

    ui.Pages.define("/html/itemDetailPage.html", {
        // This function is called whenever a user navigates to this page. It
        // populates the page elements with the app's data.
        ready: function (element, options) {
            if (firstTime == true) {
                WinJS.UI.processAll();
                firstTime = false;
            }
            var item = options && options.item ? options.item : getItem();
            //set variables for Sending Notifications
            WindowsLiveId = options.WindowsLiveId;
            CurrentUserName = options.CurrentUserName;
            AppServiceName = options.AppServiceName;

            document.querySelector('.pagetitle').textContent = item.title;
            PictureId = item.key;
            var parent_id = item.parent_id;

            RoamingVariablesLanding.settingValue2 = item.key;
            RoamingVariablesLanding.settingValue3 = item.title;
            RoamingVariablesLanding.settingValue4 = item.parent_id;
            RoamingVariablesLanding.settingValue5 = item.picture;


            writeRoamingSettings();

            WinJS.UI.processAll()
            .then(function () {
                if (item.subtitle != null)
                    id('description').innerHTML = item.subtitle;
                var foto_path = "/"+item.picture;
                WL.api({ path: foto_path, method: "GET" }, function (result) {
                    if (result.error) {
                        //TODO DISPLAY TOP BAR ERROR...throw new Exception(result.error);
                    }
                    else {
                        var PhotoItem = result;
                        id('player').src = PhotoItem.source;
                    }
                });
            });

            init(parent_id);

            //ad the action of sending a pciture to the AppBar & disabling the main appBar
            //var AppBar = document.getElementById('appbar');
            //AppBar.disabled = true;
            //AppBar.style.visibility = "none";

            var DetailAppBar = document.getElementById('ShareAppBar');
            DetailAppBar.disabled = false;
            
            //add actions for buttons
            id("btnSend").addEventListener('click', sendNotification);
            id("BtnDismiss").addEventListener('click', function () {
                var ErrorBar = document.getElementById('errorBar');
                ErrorBar.disabled = true;
                errorBar.winControl.hide();
            });
            id("BtnDismiss2").addEventListener('click', function () {
                var ShareErrorBar = document.getElementById('ShareError');
                hideFlyout(ShareErrorBar);
                ShareErrorBar.disabled = true;
            });
            id("BtnShareAccept").addEventListener('click', function () {
                var ShareErrorBar = document.getElementById('ShareError');
                hideFlyout(ShareErrorBar);
                ShareErrorBar.disabled = true;
                //Share the link and show the ShareUI
                Windows.ApplicationModel.DataTransfer.DataTransferManager.showShareUI();
            });
            
        }
    })

    WinJS.Namespace.define("Player", {
        onDisplayNext: function () {
                if (g_playlist.length > 1)
                    displayNext(1);
            
            },
            onPlaySlideShow: function () {
                var DetailAppBar = document.getElementById('ShareAppBar');
                if (g_playlistAutoPlay == false) {
                    if (g_playlist.length > 1) {
                        g_playlistAutoPlay = true;
                        DetailAppBar.children.play.innerHTML = "<span tabIndex=\"-1\" class=\"win-commandicon win-commandring\"><span tabIndex=\"-1\" class=\"win-commandimage\">&#xE103;</span></span><span tabIndex=\"-1\" class=\"win-label\">Pause</span>"
                       displayNext(1);
                    }
                }
                else {
                    if (g_playlistImageTimerID)
                        clearTimeout(g_playlistImageTimerID);
                    DetailAppBar.children.play.innerHTML = "<span tabIndex=\"-1\" class=\"win-commandicon win-commandring\"><span tabIndex=\"-1\" class=\"win-commandimage\">&#xE102;</span></span><span tabIndex=\"-1\" class=\"win-label\">Slide Show</span>"
                    g_playlistAutoPlay = false;
                }
            },
            onDisplayPrev: function () {
                if (g_playlist.length > 1)
                    displayPrev(1);
            },
            ShowShareFlyout: function () {
                if (ShareAppBar.length > 1) {
                    showFlyout(ShareFlyOut, ShareAppBar[ShareAppBar.length-1].children.share, "top");
                } else {
                    showFlyout(ShareFlyOut, ShareAppBar.children.share, "top");
                }
                
            }
    });

    function writeRoamingSettings() {
        var composite = new Windows.Storage.ApplicationDataCompositeValue();
        composite[RoamingVariablesLanding.settingName1] = RoamingVariablesLanding.settingValue1;
        composite[RoamingVariablesLanding.settingName2] = RoamingVariablesLanding.settingValue2;
        composite[RoamingVariablesLanding.settingName3] = RoamingVariablesLanding.settingValue3;
        composite[RoamingVariablesLanding.settingName4] = RoamingVariablesLanding.settingValue4;
        composite[RoamingVariablesLanding.settingName5] = RoamingVariablesLanding.settingValue5;

        var roamingSettings = Windows.Storage.ApplicationData.current.roamingSettings;
        roamingSettings.values[RoamingVariablesLanding.settingName] = composite;
    }

    function init(parent_id) {
        WL.init();
        WL.ui({
            name: "signin",
            element: "signinbutton",
            scope: ["wl.signin", "wl.basic", "wl.skydrive", "wl.contacts_skydrive", "wl.skydrive_update", "wl.photos", "wl.contacts_photos"],
        });
        signedInUser();

        g_playlistAutoPlay = false;
        g_playlist.length = 0;
        var photos_path = parent_id + "/files";
        WL.api({ path: photos_path, method: "GET", filter: "photos" }, onEnumeratePhotosComplete);

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

    function signUserOut() {
        WL.logout();
        //document.getElementById("meImg").style.visibility = "hidden";
        //document.getElementById("meName").innerText = "Login to see your photos";
    }

    function onSessionChange() {
        var session = WL.getSession();
    }

    function getUserName() {
        WL.api({ path: "/me", method: "GET" }, getUserName_Callback);
    }

    function getUserName_Callback(result) {
        if (result.error) {
            alert("Couldn't retrieve user's name: " + result.error);
        }
        else if (result.name) {
            //document.getElementById("meName").innerText = "Welcome, " + result.name;
            WL.api({ path: "/me/picture", method: "GET" }, getUserPictureCallBack);
        }
    }

    function getUserPictureCallBack(result) {
        if (result.error) {
            //document.getElementById("meImg").src = "Couldn't retrieve user's picture: " + result.error.message;
        }
        else if (result) {
            try {
                //document.getElementById("meImg").src = result.location;
                //document.getElementById("meImg").style.visibility = "visible";
            }
            catch (e) { }
        }
    }

    function showFlyout(flyout, anchor, placement) {
        flyout.winControl.show(anchor, placement);
        //TESTING TOASTS
        //var toastTemplateName = "toastText03";
        //// Get the toast manager.
        //var notificationManager = Windows.UI.Notifications.ToastNotificationManager;
        //var toastXml = notificationManager.getTemplateContent(Windows.UI.Notifications.ToastTemplateType[toastTemplateName]);
        //var textNodes = toastXml.getElementsByTagName("text");
        //textNodes.forEach(function (value, index) {
        //    if (index == 0)
        //        value.appendChild(toastXml.createTextNode("Keep your device protected"));
        //    if (index == 1)
        //        value.appendChild(toastXml.createTextNode("You can protect your device with CONTOSO protector. Learn more!"));
        //});
        //var toast = new Windows.UI.Notifications.ToastNotification(toastXml);
        //notificationManager.createToastNotifier().show(toast);
    }

    function hideFlyout(flyout) {
        flyout.winControl.hide();
    }

    function sendNotification(e) {
        hideFlyout(ShareFlyOut);
        //share picture here first and we wil share the public URL
        var SharedPictureURL = PictureURLLinkToShare;

        var LiveIdTo = id("tbemail").value;
        var Message1 = "New picture from " + WindowsLiveId;
        var Message2 = CurrentUserName + " has shared a new pciture with you"
        //the web service will send a Toast and Tile notification if the other mail account is registered with our metro App
        //if it doesn't it will send a email.
        var baseURl = AppServiceName + "/WNSSkyDriveService/SkyDriveService.svc/rest/SendNotify?IDFrom=" + WindowsLiveId + "&IDTo=" + LiveIdTo + "&Message1=" + Message1 + "&Message2=" + Message2 + "&PicURL=" + SharedPictureURL;
        var url = baseURl;
        WinJS.xhr({
            url: url
        }).then(function (r) {
            var resultText = r.responseText;
            //the user is not on our Win8 Database on the server, then we open the share charms
            if (resultText == "\"User not recognized\"") {
                //display the errorBar as WarningBar and set the link of the picture for sharing
                shareLink(Message1, Message2, SharedPictureURL);
                var ErrorText = document.getElementById('ShareErrorText');
                ErrorText.innerHTML = "The user you are trying to notify doesn't have this application installed, would you like to share it with other app instead?";
                var ShareErrorFlyOut = document.getElementById('ShareError');
                ShareErrorFlyOut.disabled = false;
                id("BtnShareAccept").style.visibility = "visible";
                id("BtnShareAccept").innerHTML = "Share";
                    showFlyout(ShareErrorFlyOut, ShareFlyOut, "top");
                
            }
        },
                    function (error) {
                        var resultError = error;
                        //display the errorBar
                        id('ErrorTitle').style.visibility = "visible";
                        var ErrorText = document.getElementById('ErrorText');
                        ErrorText.innerHTML = "We were unable to notify the user, please try again in a few minutes.";
                        var ErrorBar = document.getElementById('errorBar');
                        ErrorBar.disabled = false;
                        id("BtnAccept").style.visibility = "hidden";
                        errorBar.winControl.show();
                    })
    }


    function shareLink(title, description, PhotoLink) {
        if (sharedSource == false) {
            var dataTransferManager = Windows.ApplicationModel.DataTransfer.DataTransferManager.getForCurrentView();
            dataTransferManager.addEventListener("datarequested", function (e) {
                var request = e.request;
                request.data.properties.title = title;
                request.data.properties.description = description;
                var link = new Windows.Foundation.Uri(PhotoLink);
                request.data.setUri(link);
            });
            sharedSource = true;
        }
    }


    function onEnumeratePhotosComplete(result) {
        if (result.error) {
            //throw new Exception(result.error);
        }
        else {
            var items = result.data;

            for (var index in items) {
                if (items[index].id == PictureId) {
                    g_playlistCurrIndex = index;
                    if (items[index].picture != null) {
                        PictureURLLinkToShare = items[index].picture;
                    }
                    else {
                        if (items[index].size < 150000)//if the picture weight less than 150 Kb then we use it as the image for sharing
                            PictureURLLinkToShare = items[index].source;
                        else // we use a generic image
                            PictureURLLinkToShare = "http://i.microsoft.com/global/en-us/homepage/PublishingImages/sprites/microsoft_gray.png"
                    }
                }
                var sourceSharing;
                //if the picture weight less than 150 Kb then we use it as the image for sharing
                //else the toast and tile won't be displayed,
                //therefore we use a generic image only for this sample
                if (items[index].picture != null) {
                    PictureURLLinkToShare = items[index].picture;
                }
                else {
                    if (items[index].size < 150000)
                        sourceSharing = items[index].source;
                    else
                        sourceSharing = "http://i.microsoft.com/global/en-us/homepage/PublishingImages/sprites/microsoft_gray.png"
                }
                g_playlist.push({
                    key: items[index].id,
                    subtitle: items[index].description,
                    picture: items[index].id,
                    name: items[index].name,
                    link: items[index].sourceSharing,
                    source: items[index].source
                });
            }
        }
    };

    function displayNext(offset) {
        try {
            var selectedIndex = parseInt(g_playlistCurrIndex) + offset;
            if (selectedIndex >= g_playlist.length) {
                selectedIndex = 0;
                g_playlistCurrIndex = 0;
            }
            else
                g_playlistCurrIndex++;

            // Cancel previous timer.
            if (g_playlistImageTimerID)
                clearTimeout(g_playlistImageTimerID);

            // Play it.
            var player = id("player");
            //we are out of the player page
            if (g_playlist[selectedIndex] != undefined) {
                if (g_playlist[selectedIndex].subtitle != null)
                    id('description').innerHTML = g_playlist[selectedIndex].subtitle;
                id('player').src = g_playlist[selectedIndex].source;
                id('PageTitle').innerHTML = g_playlist[selectedIndex].name;

                //Setting the link url to share the current picture
                PictureURLLinkToShare = g_playlist[selectedIndex].link;

                //we save roamign settings
                RoamingVariablesLanding.settingValue2 = g_playlist[selectedIndex].key;
                RoamingVariablesLanding.settingValue3 = g_playlist[selectedIndex].name;
                RoamingVariablesLanding.settingValue5 = g_playlist[selectedIndex].picture;
                writeRoamingSettings();

                if (g_playlistAutoPlay) {
                    g_playlistImageTimerID = setTimeout(function () {
                        displayNext(1);
                    }, 10000);
                }
            }
        }
        catch (exception) {
        }
    }

    function displayPrev(offset) {
        var selectedIndex = parseInt(g_playlistCurrIndex) - offset;
        if (selectedIndex < 0) {
            selectedIndex = g_playlist.length - 1;;
            g_playlistCurrIndex = g_playlist.length - 1;;
        }
        else
            g_playlistCurrIndex--;


        // Play it.
        var player = id("player");
        if (g_playlist[selectedIndex].subtitle != null)
            id('description').innerHTML = g_playlist[selectedIndex].subtitle;
        id('player').src = g_playlist[selectedIndex].source;
        id('PageTitle').innerHTML = g_playlist[selectedIndex].name;

        //Setting the link url to share the current picture
        PictureURLLinkToShare = g_playlist[selectedIndex].link;

        //we save roamign settings
        RoamingVariablesLanding.settingValue2 = g_playlist[selectedIndex].key;
        RoamingVariablesLanding.settingValue3 = g_playlist[selectedIndex].name;
        RoamingVariablesLanding.settingValue5 = g_playlist[selectedIndex].picture;
        writeRoamingSettings();
    }
})();
