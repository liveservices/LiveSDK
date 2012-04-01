(function () {
    if (!window.skycmd)
        window.skycmd = {};

    skycmd.file = function (id, jsonfile) {
        this.isLoading = true;
        this.sortedChildList = [];
        this.childrenByName = {};
        this.name = '';
        this.id = id;
        this.path = '';
        this.type = '';

        $.extend(this, jsonfile);

        // GETCHILD
        //
        // does a case-insensitive lookup of the the child by filename
        //
        // FILENAME: the filename of the child to get
        //
        // returns the child if found. Otherwise returns NULL.
        this.getChild = function (filename) {
            if (filename) {
                return this.childrenByName[filename.toLowerCase()];
            }
        };

        // ISFOLDER
        //
        // whether or not the item is a folder or and album
        this.isFolder = function () {
            return this.type == 'folder' || this.type == 'album';
        };

        // GETAPIPATH
        //
        // gets the path that is used for fetching the item from the api
        //
        // returns the string path of the item for fetching more data from the api.
        this.getApiPath = function () {
            var apiPath = '';

            if (!this.id || this.id == '' || this.id == 'root') {
                apiPath = "/me/skydrive/files";
            }
            else {
                apiPath = '/' + this.id + '/files';
            }

            return apiPath;
        };

        // HASCHILDREN
        //
        // returns whether or not this file has any children
        this.hasChildren = function () {
            return this.sortedChildList.length > 0;
        };

        // HASEXTENSION
        //
        // checks to see if the file has a certain extension
        //
        // EXTENSION: string representing the extenstion to check for (ex 'mp3')
        this.hasExtension = function (extension) {
            return extension && this.name.substr(this.name.length - (extension.length + 1)) == '.' + extension;
        };
    };
})();