
(function () {
    'use strict';

    var listRenderer;
    var headerRenderer;
    var itemRenderer;
    var pageLayout;

    WL.Event.subscribe("auth.login", onLoginComplete);

    // Custom event raised after the fragment is appended to the DOM.
    WinJS.Application.addEventListener('fragmentappended', function handler(e) {
        if (e.location === '/html/landingPage.html') { fragmentLoad(e.fragment, e.state); }
    });

    function updateForLayout(lv, layout) {
        pageLayout = layout;
        if (pageLayout === Windows.UI.ViewManagement.ApplicationLayoutState.snapped) {
            WinJS.UI.setOptions(lv, {
                dataSource: pageData.groups,
                itemRenderer: listRenderer,
                groupDataSource: null,
                groupRenderer: null,
                oniteminvoked: itemInvoked
            });

            lv.layout = new WinJS.UI.ListLayout();
        } else {
            var albumnDataSource = new WinJS.UI.ListDataSource(pageData.groups);
            var groupDataSource = new WinJS.UI.GroupDataSource(
                    albumnDataSource, function (item) {
                        return {
                            key: item.data.group.key,
                            data: {
                                title: item.data.group.title,
                                click: function () {
                                    WinJS.Navigation.navigate('/html/collectionPage.html', { group: item.data.group });
                                }
                            }
                        };
                    });
            
            WinJS.UI.setOptions(lv, {
                dataSource: pageData.items,
                itemRenderer: itemRenderer,
                groupDataSource: groupDataSource,
                groupRenderer: headerRenderer,
                oniteminvoked: itemInvoked
            });
            lv.layout = new WinJS.UI.GridLayout({ groupHeaderPosition: 'top' });
        }
        lv.refresh();
    }

    function layoutChanged(e) {
        var list = document.querySelector('.landingList');
        if (list) {
            var lv = WinJS.UI.getControl(list);
            updateForLayout(lv, e.layout);
        }
    }

    function fragmentLoad(elements, options) {
        try {
            var appLayout = Windows.UI.ViewManagement.ApplicationLayout.getForCurrentView();
            if (appLayout) {
                appLayout.addEventListener('layoutchanged', layoutChanged);
                init();
            }
        } catch (e) { }

        WinJS.UI.processAll(elements)
            .then(function () {
                itemRenderer = elements.querySelector('.itemTemplate');
                headerRenderer = elements.querySelector('.headerTemplate');
                listRenderer = elements.querySelector('.listTemplate');
                var lv = WinJS.UI.getControl(elements.querySelector('.landingList'));
                updateForLayout(lv, Windows.UI.ViewManagement.ApplicationLayout.value);
            });
    }

    function itemInvoked(e) {
        if (pageLayout === Windows.UI.ViewManagement.ApplicationLayoutState.snapped) {
            var group = pageData.groups[e.detail.itemIndex];
            WinJS.Navigation.navigate('/html/collectionPage.html', { group: group });
        } else {
            var item = pageData.items[e.detail.itemIndex];
            WinJS.Navigation.navigate('/html/detailPage.html', { item: item });
        }
    }

    // The getGroups() and getItems() functions contain sample data.
    // TODO: Replace with custom data.

    // Windows Live

    function init() {
        WL.init();

        WL.ui({
            name: "signin",
            element: "signinbutton",
            scope: ["wl.signin", "wl.skydrive"],
        });
    }


    function onAPIError(error) {
        if (error) {
            alert("API Error: " + error);
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
            alert("Couldn't retrieve user's name: " + result.error);
        }
        else if (result.name) {
            document.getElementById("meName").innerText = "Welcome, " + result.name;
            getUserPicture();
        }
    }

    function getUserPicture() {
        var session = WL.getSession();
        var LIveConnectAPIUrl = "https://beta.apis.live.net/v5.0";
        document.getElementById("meImg").src = LIveConnectAPIUrl + "/me/picture?return_ssl_resources=true&access_token=" + session.access_token;
        document.getElementById("meImg").style.visibility = "visible";

        getAlbums();
    }

    function getAlbums() {
        var albums_path = "/me/albums";
        WL.api({ path: albums_path, method: "GET" }, onEnumerateAlbumsComplete);
    }

    function onEnumerateAlbumsComplete(result) {
        if (result.error) {
        }
        else {
            var items = result.data
            for (var index in items) {
                downloadPicture(items[index].id);
                pageData.groups.push({
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
        WL.api({ path: path, method: "GET" }, onEnumerateFolderComplete)

    };
    function onEnumerateFolderComplete(result) {
        if (result.error) {

        }
        else {
            var msg;
            var items = result.data
            for (var index in items) {
                var parentGroup;
                for (var g = 0, gl = pageData.groups.length; g < gl; g++) {
                    if (pageData.groups[g].key === items[index].parent_id) {
                        parentGroup = pageData.groups[g];
                        break;
                    }
                }
               
                pageData.items.push({
                    group: parentGroup,
                    key: items[index].id,
                    title: items[index].name,
                    subtitle: items[index].description,
                    background: items[index].source,
                    content: '',
                    description: ''
                });

            }

        }
        var list = document.querySelector('.landingList');
        if (list) {
            var lv = WinJS.UI.getControl(list);
            
            updateForLayout(lv, Windows.UI.ViewManagement.ApplicationLayout.getForCurrentView());
        }
    };
    
    var pageData = {};
    pageData.groups = [];
    pageData.items = [];

    WinJS.Namespace.define('landingPage', {
        fragmentLoad: fragmentLoad,
        itemInvoked: itemInvoked
    });


})();
