(function () {
    if (!window.skycmd)
        window.skycmd = {};

    skycmd.commands = function ($container, datamodel, context) {
        // RUN
        //
        // executes the user-input command
        //
        // $OUTPUT: jquery object of where the command should output any text
        // COMMANDTEXT: input string from the user
        // CALLBACK: callback function to call once the command has completed execution. Until
        //           this is called, the commandline will block all input.
        this.run = function ($output, commandText, callback) {
            var output = '';
            var immediateCallback = true;

            var commandData = parse(commandText);
            if (commandData.error) {
                $output.html(commandData.error);
                callback();
                return;
            }

            var user = datamodel.getUser();
            var command = commands[commandData.name] || {};
            command.requiredArgs = command.requiredArgs == null ? 0 : command.requiredArgs;
            command.optionalArgs = command.optionalArgs == null ? 0 : command.optionalArgs;

            if (!command.func) {
                $output.html('invalid command');
            }
            else if (!user && command.needsAuth) {
                $output.html('type "login" to log in');
            }
            else if (command.requiredArgs > commandData.args.length || (command.optionalArgs + command.requiredArgs) < commandData.args.length) {
                var output = 'invalid syntax<br />';
                output += '  syntax: "' + command.syntax + '"';
                $output.html(output);
            }
            else {
                var value = command.func($output, callback, commandData);
                immediateCallback = value == null || value == true;
            }

            if (immediateCallback) {
                callback();
            }
        };

        var commands = {
            'login': {
                func: login,
                needsAuth: false,
                syntax: 'login'
            },
            'logout': {
                func: logout,
                needsAuth: true,
                syntax: 'logout'
            },
            'dir': {
                func: dir,
                needsAuth: true,
                syntax: 'dir'
            },
            'cd': {
                func: cd,
                requiredArgs: 1,
                needsAuth: true,
                syntax: 'cd directory'
            },
            'cls': {
                func: cls,
                needsAuth: false,
                syntax: 'cls'
            },
            'help': {
                func: help,
                needsAuth: false,
                syntax: 'help'
            },
            'play': {
                func: play,
                optionalArgs: 1,
                needsAuth: true,
                syntax: 'play song.mp3'
            },
            'queue': {
                func: queue,
                optionalArgs: 1,
                needsAuth: true,
                syntax: 'queue music.mp3 OR queue'
            },
            'start': {
                func: start,
                requiredArgs: 1,
                needsAuth: true,
                syntax: 'start photo.jpg'
            },
            'pause': {
                func: pause,
                needsAuth: true,
                syntax: 'pause (pauses the playing song)'
            },
            'next': {
                func: next,
                needsAuth: true,
                syntax: 'next (goes to the next song in your queue)'
            },
            'mkdir': {
                func: mkdir,
                requiredArgs: 1,
                needsAuth: true,
                syntax: 'mkdir directory_name'
            },
            'green': {
                func: function () { color('green'); },
                needsAuth: false,
                syntax: 'green'
            },
            'white': {
                func: function () { color('white'); },
                needsAuth: false,
                syntax: 'white'
            },
            'color': {
                func: function () { $('body').toggleClass('green'); },
                needsAuth: false,
                syntax: 'color'
            },
            'download': {
                func: download,
                requiredArgs: 1,
                needsAuth: true,
                syntax: 'download file_name'
            },
            'move': {
                func: function ($output, callback, commandData) { return movecopy($output, callback, commandData, 'MOVE'); },
                requiredArgs: 2,
                needsAuth: true,
                syntax: 'move source destination'
            },
            'copy': {
                func: function ($output, callback, commandData) { return movecopy($output, callback, commandData, 'COPY'); },
                requiredArgs: 2,
                needsAuth: true,
                syntax: 'copy source destination'
            },
            'ver': {
                func: function ($output) { $output.html('ver=4.1.2012'); },
                syntax: 'ver'
            },
            'format': {
                func: imsorry,
                syntax: 'format'
            },
            'fdisk': {
                func: imsorry,
                syntax: 'fdisk'
            }
        };

        // FILE commands
        function mkdir($output, callback, commandData) {
            var filename = commandData.args[0];

            $output.html('creating ' + filename);
            datamodel.getFile(context.currentId, function (folder) {
                var currentChild = folder.getChild(filename);
                if (currentChild) {
                    $output.html('directory with that filename already exists');
                    return true;
                }

                datamodel.mkdir(folder, filename, function (succeeded) {
                    if (succeeded) {
                        $output.html('created ' + filename);
                    }
                    else {
                        $output.html('creation failed');
                    }
                    callback();
                });
            });

            return false;
        }

        function start($output, callback, commandData) {
            var filename = commandData.args[0];
            datamodel.getFile(context.currentId, function (folder) {
                var file = folder.getChild(filename);
                if (file.type == 'photo' && (file.hasExtension('jpg') || file.hasExtension('jpeg') || file.hasExtension('gif') || file.hasExtension('png'))) {
                    $('body').append($('<div id="overlay"><div id="backdrop"></div><img src="' + file.source + '" /></div>'));
                }
                else {
                    window.open(file.link, '_blank');
                }
            });

        }

        function download($output, callback, commandData) {
            var filename = commandData.args[0];
            datamodel.getFile(context.currentId, function (folder) {
                var file = folder.getChild(filename);
                window.open(file.source, '_blank');
            });
        }

        function movecopy($output, callback, commandData, movecopy) {
            var source = commandData.args[0];
            var destination = commandData.args[1];

            var t_movingcopying = movecopy == 'MOVE' ? 'moving' : 'copying';
            var t_movedcopied = movecopy == 'MOVE' ? 'moved' : 'copied';
            var t_movecopy = movecopy == 'MOVE' ? 'move' : 'copy';
            $output.html(t_movingcopying + ' ' + source);
            datamodel.getFile(context.currentId, function (folder) {
                var sourceFile = folder.getChild(source);
                if (sourceFile) {
                    var destinationId = folder.getChild(destination);
                    destinationId = destinationId && destinationId.id;
                    if (destination == '..' || destination == '..\\') {
                        destinationId = folder.parent_id;
                    }

                    datamodel.getFile(destinationId, function (destinationItem) {
                        if (destinationItem.isFolder()) {
                            datamodel.movecopy(sourceFile, destinationId, movecopy, function (succeeded) {
                                if (succeeded) {
                                    $output.html(t_movedcopied + ' ' + source + ' to ' + destination);
                                }
                                else {
                                    $output.html(t_movecopy + ' failed');
                                }
                                callback();
                            });
                        }
                        else {
                            $output.html(destination + ' is not a folder');
                            callback();
                        }
                    });
                    return false;
                }
                else {
                    $output.html(source + ' does not exist');
                    callback();
                }
            });

            return false;
        }

        // ACCOUNT commands
        function logout($output) {
            datamodel.logout();
            $output.html('logged out');
            context.currentId = '';
            context.pwd = '';
        }

        function login($output, callback) {
            if (!datamodel.getUser()) {
                $output.html('logging in');
                datamodel.login(function (succeeded) {
                    if (succeeded) {
                        $output.html('logged in');
                        context.currentId = '';
                        context.pwd = '';
                    }
                    else {
                        $output.html('logged in failed');
                    }
                    callback();
                });
                return false;
            }
            else {
                $output.html('already logged in');
            }
        }

        // NAVIGATION commands
        function cls() {
            $container.empty();
        }

        function dir($output, callback, commandData) {
            $output.html('loading');

            // wait for the directory to load
            datamodel.getFile(context.currentId, function (folder) {
                if (folder.hasChildren()) {
                    // this folder has children, so print them out
                    var output = '<table>';
                    for (var i = 0; i < folder.sortedChildList.length; i++) {
                        var file = folder.sortedChildList[i];

                        output += '<tr>';
                        output += '<td>';
                        output += file.name;
                        output += '</td>';
                        output += '</tr>';
                    }
                    output += '</table>';
                    $output.html(output);
                }
                else {
                    // this folder is empty so print out 'no files'
                    $output.html('[no files]');
                }

                callback();
            });

            return false;
        }

        function cd($output, callback, commandData) {
            var directoryName = commandData.args[0];
            datamodel.getFile(context.currentId, function (folder) {
                if (directoryName == '..' || directoryName == '..\\') {
                    datamodel.getFile(folder.parent_id, function (parent) {
                        context.currentId = parent.id;
                        context.pwd = parent.path;
                        callback();
                    });

                    // we have one more async call so we don't want the callback yet.
                    return false;
                }
                else if (directoryName != '.' && directoryName != '.\\') {
                    var file = folder.getChild(directoryName);
                    if (file && file.isFolder()) {
                        context.currentId = file.id;
                        context.pwd += '\\' + file.name;

                        // start loading the children.
                        datamodel.getFile(file.id);
                    }
                    else if (file) {
                        $output.html(directoryName + ' is not a directory');
                    }
                    else {
                        $output.html(directoryName + ' does not exist');
                    }
                }

                callback();
            });

            return false;
        }

        // MUSIC commands
        function play($output, callback, commandData) {
            if ($('#music') && $('#music')[0] && $('#music')[0].play) {
                var filename = commandData.args[0];
                if (filename) {
                    datamodel.getFile(context.currentId, function (folder) {
                        var file = folder.getChild(filename);
                        if (file && file.hasExtension('mp3')) {
                            $('#music')[0].innerHTML = '<source src="' + file.source + '" type="audio/mpeg" />';
                            $('#music')[0].play();
                        }
                        else {
                            $output.html('invalid music file');
                        }

                        callback();
                    });
                    return false;
                }
                else {
                    $('#music')[0].play();
                }
            }
        }

        function next() {
            if (context.songQueue.length > 0) {
                var song = context.songQueue[0];
                context.songQueue.splice(0, 1);
                $('#music').html('<source src="' + song.source + '" type="audio/mpeg" />');
                setTimeout(function () {
                    $('#music')[0].pause();
                    $('#music')[0].play();
                }, 0);
            }
        }

        function pause() {
            $('#music')[0].pause();
        }

        function queue($output, callback, commandData) {
            var filename = commandData.args[0];
            if (filename) {
                // add the file to the queue
                datamodel.getFile(context.currentId, function (folder) {
                    var file = folder.getChild(filename);

                    if (filename == '*' || filename == '*.mp3') {
                        for (var i = 0; i < folder.sortedChildList.length; i++) {
                            var song = folder.sortedChildList[i];
                            if (song && song.hasExtension('mp3')) {
                                context.songQueue.push(song);
                            }
                        }
                    }
                    else if (file && file.hasExtension('mp3')) {
                        context.songQueue.push(file);
                    }
                    else {
                        $output.html('invalid music file');
                    }

                    callback();
                });

                return false;
            }
            else {
                var output = '';
                for (var i = 0; i < context.songQueue.length; i++) {
                    var song = context.songQueue[i];
                    output += song.name + '<br />';
                }
                $output.html(output);
            }
        }

        // SYSTEM commands
        function color(color) {
            $('body').toggleClass('green', color == 'green');
        }

        function imsorry($output, callback, commandData, movecopy) {
            var user = datamodel.getUser();
            var username = (user && ' ' + (user.first_name || user.name)) || '';
            $output.html("I'm sorry" + username + ", I'm afraid I can't do that...");
        }

        // HELP
        function help($output) {
            var output = '';
            output += 'ACCOUNT<br />';
            output += '  login - opens the login window, make sure your browser doesn\'t block the popup<br/>';
            output += '  logout<br />';
            output += '<br />';

            output += 'NAVIGATION<br />';
            output += '  dir - displays contents of current directory<br />';
            output += '  cd [directory] - changes the current directory<br />';
            output += '  cls - clears the terminal window<br />';
            output += '<br />';

            output += 'FILE<br />';
            output += '  mkdir [directory] - creates a new directory<br />';
            output += '  move [source] [destination] - moves the source file to the destination<br />';
            output += '  copy [source] [destination] - copies the source file to the destination<br />';
            output += '  start [file] - opens a file in the browser<br />';
            output += '  download [file] - downloads a file<br />';
            output += '<br />';

            output += 'SYSTEM<br />';
            output += '  ver - displays the system version<br />';
            output += '  green - sets command line text to green<br />';
            output += '  white - sets command line text to white<br />';
            output += '<br />';

            $output.html(output);
        }

        function parse(input) {
            var result = {
                args: [],
                flags: []
            };
            input = $.trim(input);
            var commandParts = input.split(' ');

            if (commandParts.length == 0) {
                return result;
            }

            result.name = commandParts.splice(0, 1)[0];

            if (commandParts.length == 0) {
                result.length = 0;
                return result;
            }

            var args = commandParts;
            if (args[0].charAt(0) == '/') {
                // parse flags
                var flags = args.splice(0, 1)[0];
                flags = flags.substr(1).split('');

                var flagDict = {};
                for (var i = 0; i < flags.length; i++) {
                    var flag = flags[i];
                    flagDict[flag] = true;
                }

                result.flags = flagDict;
            }

            var waitingForArgToEnd = false;
            var parsedArgs = [];
            var currentArg = '';
            for (var i = 0; i < args.length; i++) {
                var arg = args[i];
                if (arg != '' && arg.charAt(0) == '"') {
                    if (waitingForArgToEnd) {
                        result.error = "invalid syntax";
                        break;
                    }

                    waitingForArgToEnd = true;
                    arg = arg.substr(1);
                }

                if (!waitingForArgToEnd) {
                    currentArg = '';
                }

                if (arg != '' && arg.charAt(arg.length - 1) == '"') {
                    if (!waitingForArgToEnd) {
                        result.error = "invalid syntax";
                        break;
                    }

                    arg = arg.substr(0, arg.length - 1);
                    waitingForArgToEnd = false;
                }

                currentArg += ' ' + arg;

                if (!waitingForArgToEnd) {
                    parsedArgs.push($.trim(currentArg));
                    currentArg = '';
                }
            }

            result.args = parsedArgs;

            return result;
        }
    };
})();
