(function () {
    if (!window.skycmd)
        window.skycmd = {};

    skycmd.terminal = function ($container, datamodel, context) {
        var $currentConsoleLine;
        var currentPath = '';
        var currentFolder = '';
        var commandHistory = [];
        var commandCount = 0;
        var firstname = '';
        var loggedIn = false;
        var currentId;
        var searchTerm = '';
        var searchIndex = 0;
        var matches = [];

        var runningCommand = false;
        var commands = new skycmd.commands($container, datamodel, context);

        init();

        function init() {
            var welcomeText = '<pre>     _____ __ __  __ _____  _   _     ____\n' +
                              '    / ___// /_\\ \\/ // ___/ / | / |   / _  \\\n' +
                              '    \\__ \\/ / / \\  // /    /  |/  |  / / / /\n' +
                              '  ____/ /   /  / // /___ / /\\_/| | / /_/ /\n' +
                              ' /_____/_/|_\\ /_/ \\____//_/    |_|/_____/\n\n\n</pre>';
            welcomeText += 'type "help" for list of supported commands<br /><br />';
            welcomeText += '<br />';
            $container.html(welcomeText);

            newCommandLine();

            datamodel.getFile();

            $body.keydown(onKeyDown);

            setTimeout(blink, 600);
        }

        function onKeyDown(e) {
            var key = e.which;
            var handled = false;
            var text = $currentConsoleLine.text();

            // remove photo
            if ($('#overlay').size() > 0) {
                $('#overlay').remove();
                return true;
            }

            // ignore any keystrokes with alt, ctrl or cmd
            if (e.metaKey || e.altKey || e.ctrlKey || runningCommand) {
                // ctrl+c cancels the running command
                if ((e.ctrlKey || e.metaKey) && key == keymap.c) {
                    if (runningCommand) {
                        runningCommand = false;
                        newCommandLine();
                        $(document).scrollTop($(document).height());
                    }
                }

                return true;
            }

            // up should go back in history
            if (e.which == keymap.up) {
                if (commandCount > 0) {
                    commandCount--;

                    $currentConsoleLine.html(commandHistory[commandCount]);
                }

                return false;
            }

            // down should go forward in history
            if (e.which == keymap.down) {
                if (commandCount < commandHistory.length - 1) {
                    commandCount++;
                    $currentConsoleLine.html(commandHistory[commandCount]);
                }
                else {
                    $currentConsoleLine.html('');
                    commandCount = commandHistory.length;
                }

                return false;
            }

            // shift key presses
            if (e.shiftKey && keymap.uppercase[key]) {
                var character = keymap.uppercase[key];
                $currentConsoleLine.text(text + character);
                resetSearch();

                return false;
            }

            // supported key presses
            if (keymap.lowercase[key]) {
                var character = keymap.lowercase[key];
                $currentConsoleLine.text(text + character);
                resetSearch();

                return false;
            }

            // allow backspace
            if (e.which == keymap.backspace) {
                text = text.substr(0, text.length - 1);
                $currentConsoleLine.text(text);
                resetSearch();

                return false;
            }

            // tab auto completes
            if (e.which == keymap.tab) {
                var words = searchTerm.split(' ');
                var lastWord = words[words.length - 1];
                var newText = searchTerm.substr(0, searchTerm.length - lastWord.length);

                datamodel.getFile(context.currentId, function (folder) {
                    // need to find all of the search matches
                    if (matches.length == 0) {
                        for (var i = 0; i < folder.sortedChildList.length; i++) {
                            var file = folder.sortedChildList[i];
                            if (file.name.substr(0, lastWord.length).toLowerCase() == lastWord.toLowerCase()) {
                                matches.push(file.name);
                            }
                        }
                    }

                    // get the current match and update the command
                    var filename = matches[searchIndex];
                    if (filename) {
                        if (filename.indexOf(' ') != -1) {
                            filename = '"' + filename + '"';
                        }
                        $currentConsoleLine.text(newText + filename);
                    }

                    searchIndex++;
                    if (searchIndex >= matches.length)
                        searchIndex = 0;
                });

                return false;
            }

            // escape clears the command line
            if (e.which == keymap.escape) {
                $currentConsoleLine.html('');
                resetSearch();

                return false;
            }

            // enter evaluates the command
            if (e.which == keymap.enter) {
                $('#cursor').remove();
                if (text == '') {
                    newCommandLine();
                    $(document).scrollTop($(document).height());
                }
                else {
                    runningCommand = true;
                    var $output = $('<div class="output"></div>');
                    $container.append($output);
                    commands.run($output, text, function () {
                        if (runningCommand) {
                            runningCommand = false;
                            newCommandLine();
                            $(document).scrollTop($(document).height());
                        }
                    });
                    $(document).scrollTop($(document).height());
                    commandHistory.push(text);
                    commandCount = commandHistory.length;
                }
                return false;
            }

            $(document).scrollTop($(document).height());
        }

        function resetSearch() {
            searchTerm = $currentConsoleLine.text();
            searchIndex = 0;
            matches = [];
        }

        function echoOutput(text) {
            text = '<div class="output">' + text + '</div><br />';
            echo(text);
        }

        function echo(text) {
            $currentConsoleLine.html($currentConsoleLine.html() + text);
        }

        function newCommandLine() {
            var user = datamodel.getUser();
            var username = (user && user.name) || '';
            $container.append('<div><span class="path">' + username + ':SkyDrive' + context.pwd + '&gt;</span><span class="console"></span><span id="cursor">_</span></div>');
            $currentConsoleLine = $('.console:last');
        }

        function blink(show) {
            $('#cursor').toggle(show);
            setTimeout(function () { blink(!show); }, 600);
        }
    };

})();
