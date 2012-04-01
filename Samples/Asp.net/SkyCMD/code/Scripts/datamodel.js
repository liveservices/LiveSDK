(function () {
    if (!window.skycmd)
        window.skycmd = {};

    var filesById = {};
    var userInfo = null;
    var loggingIn = false;

    skycmd.datamodel = function () { };

    var proto = skycmd.datamodel.prototype;

    // MKDIR
    //
    // creates a directory with NAME under the PARENT
    //
    // PARENT: containing directory of the soon to be created directory
    // NAME: name of the directory to be created
    // CALLBACK: callback function when the directory creation completes
    //
    // once the directory has been created (or fails to create)
    // the CALLBACK will be called with a SUCCEEDED input parameter
    //
    // fires a POST to the destination path of the file with
    // the NAME set in the body. When the folder creation succeeds
    // the current directory is cleared from the client cache and
    // requeried to get the update.
    proto.mkdir = function (parent, name, callback) {
        // cant create a folder with no name or with a name that already exists under the parent.
        if (!name || name == '' || parent.getChild(name)) {
            callback(false);
            return;
        }

        var me = this;

        // create the path of the current directory
        var parent_id = parent && parent.id;
        var destination = '/' + parent_id;
        if (!parent_id || parent_id == '' || parent_id == 'root') {
            destination = '/me/skydrive';
        }

        // make the POST request
        WL.api(
    	    {
    	        path: destination,
    	        method: "POST",
    	        body: { name: name }
    	    },
    	    function (response) {
    	        if (!response.error) {
    	            // succeeded: clear the local cache and requery
    	            var id = parent_id || 'root';
    	            delete filesById[id];
    	            me.getFile(parent_id);
    	            callback(true);
    	        }
    	        else {
    	            // failed
    	            callback(false);
    	        }
    	    }
    	);
    };

    // MOVECOPY
    //
    // moves or copies a FILE to the DESTINATION
    //
    // FILE: source file to move
    // DESTINATIONID: resource id of the destination to move the FILE
    // MOVECOPY: {"MOVE", "COPY"} denotes which call to make
    // CALLBACK: callback function when the move/copy completes
    //
    // once the move or copy has completed (or failes) the CALLBACK
    // is called with a SUCCEEDED input parameter
    //
    // once the move/copy completes, the source parent and the destination
    // are cleared from the cached and requeried to get updated content.
    proto.movecopy = function (file, destinationId, movecopy, callback) {
        var me = this;

        WL.api(
    	    {
    	        path: '/' + file.id,
    	        method: movecopy,
    	        body: { destination: destinationId }
    	    },
    	    function (response) {
    	        if (!response.error) {
    	            // success: clear source and destination from cache	
    	            var id = destinationId || 'root';
    	            delete filesById[id];
    	            me.getFile(destinationId);

    	            var sourceid = file.parent_id || 'root';
    	            delete filesById[sourceid];
    	            me.getFile(file.parent_id);

    	            callback(true);
    	        }
    	        else {
    	            // failed
    	            callback(false);
    	        }
    	    }
    	);
    };

    // GETFILE
    //
    // retrieves a file and its children (if folder) from the server and caches
    //
    // ID: id of the file to load
    // CALLBACK: callback function called when the item is loaded. CALLBACK is called with the FILE that was loaded
    // 
    // if the file is already cached, the callback is called immediately with the cached file
    proto.getFile = function (id, callback) {
        id = id || 'root';
        var file = filesById[id];
        if (!file || (file.isFolder() && file.isLoading)) {
            // The children of this folder have not been downloaded yet.

            if (!file) {
                // This file does not exist yet. Create it.
                file = filesById[id] = new skycmd.file(id);
            }

            // Fetch children.
            WL.api(
        	    {
        	        path: file.getApiPath(),
        	        method: "GET"
        	    },
        	    function (response) { processResponse(id, response, callback); });

            // The callback will be called once the item loads.
            return;
        }

        // This item is fully loaded.
        callback && callback(file);
    };

    // LOGIN
    //
    // logs the user in to their LIVE ID
    //
    // CALLBACK: callback function when the login completes
    proto.login = function (callback) {
        filesById = {};
        waitings = {};
        loggingIn = true;
        WL.login({ "scope": "wl.skydrive_update" },
        	function (response) {
        	    if (response.status == "connected") {
        	        loggedIn(function () {
        	            callback(true);
        	        });
        	    }
        	    else {
        	        alert('not loggedin');
        	        userInfo = null;
        	        loggingIn = false;
        	        callback(false);
        	    }
        	});
    };

    // LOGOUT
    //
    // logs the user out of their LIVE ID
    proto.logout = function () {
        WL.logout();
        userInfo = null;
        filesById = {};
        waitings = {};
        loggingIn = false;
    };

    // CHECKLOGINSTATUS
    //
    // checks the login status of the user. If user is not logged in, tries to authenticate the user.
    //
    // CALLBACK: callback function once the user's login state has been verified
    proto.checkLoginStatus = function (callback) {
        var calledBack = false;
        WL.getLoginStatus(function (response) {
            if (response.status == "connected") {
                // set the login info for the user and then call the callback
                loggedIn(callback);
            }
            else {
                if (!calledBack) {
                    callback();
                }
            }
            calledBack = true;
        });

        // sometimes the getLoginStatus doesnt ever call the callback function. This ensures that it gets called at some point.
        setTimeout(function () {
            if (!calledBack) {
                calledBack = true;
                callback();
            }
        }, 2000);
    };

    // GETUSER
    // 
    // gets the user info. NULL if user is not logged in
    proto.getUser = function () {
        return userInfo;
    };

    function loggedIn(callback) {
        WL.api({
            path: '/me',
            method: 'GET'
        },
	    function (response) {
	        userInfo = response;
	        loggingIn = false;
	        callback();
	    });
    }

    function processResponse(id, response, callback) {
        if (!response.error) {
            id = id || 'root';
            var folder = filesById[id];

            var children = response.data;

            if (folder.sortedChildList == 0) {
                for (var i = 0; i < children.length; i++) {
                    var childId = children[i].id;
                    var file = filesById[childId] = new skycmd.file(childId, children[i]);
                    file.parent_id = id == 'root' ? '' : id;
                    file.isLoading = true;
                    file.path = (!!folder.path ? (folder.path) : '') + '\\' + file.name;

                    // add to parent folder
                    folder.sortedChildList.push(file);
                    folder.childrenByName[file.name.toLowerCase()] = file;

                    folder.sortedChildList.sort(sortChildren);
                }

            }
            // This folder has now been fully loaded.
            folder.isLoading = false;

            callback && callback(folder);
        }
    }

    // Sort function for a folder's children list. We sort by name, but sort folders first.
    function sortChildren(a, b) {
        if (a.isFolder() && !b.isFolder()) {
            return -1
        }
        else if (b.isFolder() && !a.isFolder()) {
            return 1;
        }
        else {
            return (a.name.toUpperCase() > b.name.toUpperCase()) ? 1 : -1;
        }
    }
})();
