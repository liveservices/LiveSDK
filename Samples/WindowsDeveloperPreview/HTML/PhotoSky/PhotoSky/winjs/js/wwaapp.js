/// <loc filename="metadata\wwaapp_loc_oam.xml" format="messagebundle" />
/// <reference path='base.js' />
/// <reference path='wwaapp.js' />
/// <reference winrt='true'  />
 
/*
  © Microsoft. All rights reserved.

  This library is supported for use in Windows Tailored Apps only.

  Build: 6.2.8100.0 
  Version: 0.5 
*/
 


(function (global, WinJS, undefined) {
    var checkpointET = "checkpoint", 
        unloadET = "unload", 
        mainwindowactivatedET = "mainwindowactivated", 
        activatedET = "activated", 
        loadedET = "loaded", 
        readyET = "ready",
        errorET = "error";
        
    var pendingDrain;

    function dispatchEvent(eventRecord) {
        var promise = WinJS.Promise.as();
        eventRecord.setPromise = function (p) { 
            promise = promise.then(function() { return p; }); 
        };
        eventRecord.detail = eventRecord.detail || {};
        if (typeof(eventRecord.detail) === "object") {
            eventRecord.detail.setPromise = eventRecord.setPromise;
        }

        try {
            if (listeners._listeners) {
                l = listeners._listeners[eventRecord.type];
                if (l) {
                    l.forEach(function dispatchOne(e) { e.listener(eventRecord); });
                }
            }

            // Fire built in listeners last, for checkpoint this is important
            // as it lets our built in serialization see any mutations to 
            // app.sessionState
            //
            var l = builtInListeners[eventRecord.type];
            if (l) {
                l.forEach(function dispatchOne(e) { e(eventRecord); });
            }
        }
        catch (err) {
            queueEvent({type:errorET, detail:err});
        }
        
        return promise.then(function() {
            if (eventRecord._deferral) {
                eventRecord._deferral.complete();
            }
        });
    }

    function drainQueue(queue) {
        pendingDrain = true;
        if (queue.length === 0) {
            if (eventQueue.length > 0) {
                return drainQueue(copyAndClearQueue());
            }
            pendingDrain = false;
            return WinJS.Promise.as(queue);
        }
        function drainNext() {
            return drainQueue(queue.slice(1));
        }
        function drainError(err) {
            queueEvent({type:errorET, detail:err});
            return drainNext();
        }
        return dispatchEvent(queue[0]).
            then(drainNext, drainError);
    }

    function queueEvent(eventRecord) {
        /// <summary locid="1">
        /// Queue an event to be processed by the WinJS.Application
        /// </summary>
        /// <param name="eventRecord" type="object" locid="2">
        /// The event record is expected to have a type property which will be
        /// used as the event name when dispatching on the WinJS.Application
        /// event queue. The entire object will be provided to event listeners
        /// in the detail property of the event.
        /// </param>
        eventQueue.push(eventRecord);
        if (running && !pendingDrain) {
            drainQueue(copyAndClearQueue());
        }
    }

    function copyAndClearQueue() {
        var queue = eventQueue;
        eventQueue = [];
        return queue;
    }
    
    var ListenerType = WinJS.Class.mix(WinJS.Class.define(null), WinJS.Utilities.eventMixin);
    var listeners = new ListenerType();
    var builtInListeners = { 
        mainwindowactivated: [
            function (e) { 
                queueEvent({type: activatedET, detail: e.detail});
            }
        ],
        activated: [
            function () { 
                queueEvent({ type: readyET });
            }
        ],
        checkpoint: [
            function(e) {
                // comes from state.js
                WinJS.Application._oncheckpoint(e);
            }
        ]
    };

    var eventQueue = [ ];
    var running = false;
    
    // loaded == DOMContentLoaded
    // mainwindowactivated == after WinRT Activated
    // ready == after all of the above
    //
    var useWinRT = false;
    if (window.Windows && Windows.UI) {
        useWinRT = true;
        var wui = Windows.UI.WebUI.WebUIApplication;
        wui.addEventListener("activated", function (e) {
            WinJS.Application._loadState(e).then(function () {
                queueEvent({type: mainwindowactivatedET, detail: e});
            });
        });

        function suspendingHandler(e) {
            WinJS.Application.queueEvent({type:checkpointET, _deferral: e.suspendingOperation.getDeferral() });
        }
        wui.addEventListener("suspending", suspendingHandler, false);
    }

    document.addEventListener("DOMContentLoaded", function (e) {
        queueEvent({ type: loadedET });
        if (!useWinRT) {
            var activatedArgs = { 
                arguments: "",
                kind: "Windows.Launch", 
                previousExecutionState: 0 //Windows.ApplicationModel.Activation.ApplicationExecutionState.NotRunning
                // UNDONE: tileId: e.tileId,
                // UNDONE: splashScreen: e.splashScreen,
            };
            WinJS.Application._loadState(activatedArgs).then(function () {
                queueEvent({ type: mainwindowactivatedET, detail:activatedArgs});
            });
        }
    }, false);

    window.addEventListener("beforeunload", function (e) {
        queueEvent({type:checkpointET});
        queueEvent({type:unloadET});
    }, false);
    
    WinJS.Namespace.defineWithParent(WinJS, "Application", {
        stop: function() {
            /// <summary locid="3">
            /// Stop application event processing and reset the WinJS.Application
            /// to its initial state
            /// </summary>
            listeners = new ListenerType();
            running = false;
            sawActivated = false;
            sawLoaded = false;
            queuedReady = false;
            copyAndClearQueue();
        },

        addEventListener: function (eventType, listener, capture) {
            /// <summary locid="4">
            /// Adds an event listener to the control.
            /// </summary>
            /// <param name="eventType" locid="5">
            /// The type (name) of the event.
            /// </param>
            /// <param name="listener" locid="6">
            /// The listener to invoke when the event gets raised.
            /// </param>
            /// <param name="capture" locid="7">
            /// Specifies whether or not to initiate capture.
            /// </param>
            listeners.addEventListener(eventType, listener, capture);
        },
        removeEventListener: function (eventType, listener, capture) {
            /// <summary locid="8">
            /// Removes an event listener from the control.
            /// </summary>
            /// <param name="eventType" locid="5">
            /// The type (name) of the event.
            /// </param>
            /// <param name="listener" locid="9">
            /// The listener to remove from the invoke list.
            /// </param>
            /// <param name="capture" locid="7">
            /// Specifies whether or not to initiate capture.
            /// </param>
            listeners.removeEventListener(eventType, listener, capture);
        }, 
        
        checkpoint: function() {
            /// <summary locid="10">
            /// Queue a checkpoint event
            /// </summary>
            queueEvent({type:checkpointET});
        },
        
        start: function () {
            /// <summary locid="11">
            /// Start processing items in the WinJS.Application event queue
            /// </summary>
            var queue = copyAndClearQueue();
            running = true;
            drainQueue(queue);
        },

        queueEvent : queueEvent
    });
    
    Object.defineProperties(WinJS.Application, WinJS.Utilities.createEventProperties(checkpointET, unloadET, mainwindowactivatedET, activatedET, loadedET, readyET));
})(this, WinJS);



(function (WinJS, undefined) {
    var navigatedEventName = "navigated";
    var navigatingEventName = "navigating";
    var beforenavigateEventName = "beforenavigate";
    var ListenerType = WinJS.Class.mix(WinJS.Class.define(null), WinJS.Utilities.eventMixin);
    var listeners = new ListenerType();
    var history = {
        backStack: [],
        current: {location:"", initialPlaceholder: true},
        forwardStack: []
    };

    var raiseBeforeNavigate = function (proposed) {
        return WinJS.Promise.as().
            then(function () {
                var promise = WinJS.Promise.as();
                var defaultPrevented = listeners.dispatchEvent(beforenavigateEventName, { 
                    setPromise: function(p) {  promise = p; },
                    location: proposed.location,
                    state: proposed.state
                });
                return promise.then(function beforeNavComplete() {
                    return defaultPrevented;
                });
            });
    };
    var raiseNavigating = function (delta) {
        return WinJS.Promise.as().
            then(function () {
                var promise = WinJS.Promise.as();
                listeners.dispatchEvent(navigatingEventName, { 
                    setPromise: function(p) {  promise = p; },
                    location: history.current.location,
                    state: history.current.state,
                    delta: delta
                });
                return promise;
            });
    };
    var raiseNavigated = function(value, err) {
        var promise = WinJS.Promise.as();
        var detail = { 
            value: value,
            location: history.current.location,
            state: history.current.state,
            setPromise: function(p) {  promise = p; }
        };
        if (!value && err) {
            detail.error = err;
        }
        listeners.dispatchEvent(navigatedEventName, detail);
        return promise;
    };

    var go = function (distance, fromStack, toStack, delta) {
        distance = Math.min(distance, fromStack.length);
        if (distance > 0) { 
            return raiseBeforeNavigate(fromStack[fromStack.length-distance]).
                then(function goBeforeCompleted(cancel) {
                    if (!cancel) {
                        toStack.push(history.current);
                        while (distance-1 != 0) {
                            distance--;
                            toStack.push(fromStack.pop());
                        }
                        history.current = fromStack.pop();
                        return raiseNavigating(delta).then(
                            raiseNavigated, 
                            function (err) { 
                                raiseNavigated(undefined, err || true); 
                                throw err;
                            }).then(function() { return true; });
                    }
                    else {
                        return false;
                    }
                });
        }
        return WinJS.Promise.wrap(false);
    }

    WinJS.Namespace.defineWithParent(WinJS, "Navigation", {
        /// <field name="state" type="Boolean" locid="12">
        /// True if we can navigate forwards
        /// </field>
        canGoForward: {
            get: function () {
                return history.forwardStack.length > 0;
            }
        },
        /// <field name="state" type="Boolean" locid="13">
        /// True if we can navigate backwards
        /// </field>
        canGoBack: {
            get: function () {
                return history.backStack.length > 0;
            }
        },
        /// <field name="state" locid="14">
        /// Current location
        /// </field>
        location: {
            get: function () {
                return history.current.location;
            }
        },
        /// <field name="state" locid="15">
        /// Navigation state
        /// </field>
        state: {
            get: function () {
                return history.current.state;
            },
            set: function (value) {
                history.current.state = value;
            }
        },
        /// <field name="history" locid="16">
        /// Navigation history
        /// </field>
        history: {
            get: function() {
                return history;
            },
            set: function(value) {
                var s = history = value;

                // ensure the require fields are present
                //
                s.backStack = s.backStack || [];
                s.forwardStack = s.forwardStack || [];
                s.current = s.current || {location:"", initialPlaceholder:true};
                s.current.location = s.current.location || "";
            }
        },
        forward: function(distance) {
            /// <summary locid="17">
            /// Navigate forwards
            /// </summary>
            /// <param name="distance" type="Number" optional="true" locid="18">
            /// The number of entries forward to go
            /// </param>
            /// <returns type="Promise" locid="19">
            /// Promise which is completed with a Boolean value indicating whether or not
            /// the navigation was successful
            /// </returns>
            distance = distance || 1;
            return go(distance, history.forwardStack, history.backStack, distance);
        },
        back: function(distance) {
            /// <summary locid="20">
            /// Navigate backwards
            /// </summary>
            /// <param name="distance" type="Number" optional="true" locid="21">
            /// The number of entries back into the history to go
            /// </param>
            /// <returns type="Promise" locid="19">
            /// Promise which is completed with a Boolean value indicating whether or not
            /// the navigation was successful
            /// </returns>
            distance = distance || 1;
            return go(distance, history.backStack, history.forwardStack, -distance);
        },
        navigate: function (location, initialState) {
            /// <summary locid="22">
            /// Navigate to a location
            /// </summary>
            /// <param name="location" locid="23">
            /// The location to navigate to. Generally the location is a string, but
            /// it may be anything.
            /// </param>
            /// <param name="initialState" locid="24">
            /// Navigation state which may be accessed through WinJS.Navigation.state
            /// </param>
            /// <returns type="Promise" locid="19">
            /// Promise which is completed with a Boolean value indicating whether or not
            /// the navigation was successful
            /// </returns>
            var proposed = { location:location, state: initialState };
            return raiseBeforeNavigate(proposed).
                then(function navBeforeCompleted(cancel) {
                    if (!cancel) {
                        if (!history.current.initialPlaceholder) {
                            history.backStack.push(history.current);
                        }
                        history.forwardStack = [];
                        history.current = proposed;
                
                        // error or no, we go from navigating -> navigated
                        // cancelation should be handled with "beforenavigate"
                        //
                        return raiseNavigating().then(
                            raiseNavigated, 
                            function (err) { 
                                raiseNavigated(undefined, err || true);
                                throw err; 
                            }).then(function () { return true; });
                    }
                    else {
                        return false;
                    }
                });
        },
        addEventListener: function (eventType, listener, capture) {
            /// <summary>
            /// Adds an event listener to the control.
            /// </summary>
            /// <param name='eventType'>
            /// The type (name) of the event.
            /// </param>
            /// <param name='listener'>
            /// The listener to invoke when the event gets raised.
            /// </param>
            /// <param name='capture'>
            /// Specifies whether or not to initiate capture.
            /// </param>
            listeners.addEventListener(eventType, listener, capture);
        },
        removeEventListener: function (eventType, listener, capture) {
            /// <summary>
            /// Removes an event listener from the control.
            /// </summary>
            /// <param name='eventType'>
            /// The type (name) of the event.
            /// </param>
            /// <param name='listener'>
            /// The listener to remove from the invoke list.
            /// </param>
            /// <param name='capture'>
            /// Specifies whether or not to initiate capture.
            /// </param>
            listeners.removeEventListener(eventType, listener, capture);
        }
    });
    
    Object.defineProperties(WinJS.Navigation, WinJS.Utilities.createEventProperties(navigatedEventName, navigatingEventName, beforenavigateEventName));
})(WinJS);



(function () {
    function initWithWinRT() {
        var sto = Windows.Storage;
        var local, temp, roaming;

        var IOHelper = WinJS.Class.define(
        function (folder) {
            this.folder = folder;
            this._path = folder.path;
        }, {
            exists: function (fileName) {
                /// <summary locid="25">
                /// Determines if the specified file exists in the container
                /// </summary>
                /// <param name="fileName" type="String" locid="26">
                /// The file which may exist within this folder
                /// </param>
                /// <returns locid="27">
                /// Promise with either true (file exists) or false.
                /// </returns>
                return this.folder.getFileAsync(fileName).
                        then(
                            function () { return true; }, 
                            function () { return false; }
                        );
            },
            remove: function (fileName) {
                /// <summary locid="28">
                /// Delets a file in the container
                /// </summary>
                /// <param name="fileName" type="String" locid="29">
                /// The file to be deleted
                /// </param>
                /// <returns locid="30">
                /// Promise which is fulfilled when the file has been deleted
                /// </returns>
                var that = this;
                return that.folder.getFileAsync(fileName).
                    then(
                        function (fileItem) {
                            return fileItem.deleteAsync();
                        }, 
                        function() { return false; }
                    );
            },
            writeText: function (fileName, str) {
                /// <summary locid="31">
                /// Writes a file to the container with the specified text
                /// </summary>
                /// <param name="fileName" type="String" locid="32">
                /// The file to write to
                /// </param>
                /// <param name="str" type="String" locid="33">
                /// Content to be written to the file
                /// </param>
                /// <returns locid="34">
                /// Promise with the count of characters written
                /// </returns>
                var that = this;
                return that.folder.createFileAsync(fileName, sto.CreationCollisionOption.replaceExisting).
                    then(function (fileItem) {
                    return fileItem.openAsync(sto.FileAccessMode.readWrite);
                }).then(function (randomAccessStream) {
                    var outputStream = randomAccessStream.getOutputStreamAt(0);
                    
                    var writer = new Windows.Storage.Streams.DataWriter(outputStream);
                    var count = writer.writeString(str);
                    return writer.storeAsync().then(function() {
                        return outputStream.flushAsync().then(function() {
                            return count;
                        });
                    });
                });
            },
            readText: function (fileName, def) {
                /// <summary locid="35">
                /// Reads the contents of a file from the container, if the file
                /// doesn't exist, def is returned.
                /// </summary>
                /// <param name="fileName" type="String" locid="36">
                /// The file to read from
                /// </param>
                /// <param name="def" type="String" locid="37">
                /// Default value to be returned if the file failed to open
                /// </param>
                /// <returns locid="38">
                /// Promise containing the contents of the file, or def.
                /// </returns>
                var that = this;
                function onerror() { return def; }

                return that.folder.getFileAsync(fileName).
                    then(function (fileItem) {
                    return fileItem.openAsync(sto.FileAccessMode.read).
                        then(function (randomAccessStream) {
                            var reader = new Windows.Storage.Streams.DataReader(randomAccessStream.getInputStreamAt(0));
                            var size = randomAccessStream.size;
                            return reader.loadAsync(size).then(function () {
                                var fileContents = reader.readString(size);
                                return (fileContents);
                            }, onerror);
                    }, onerror);
                }, onerror);
            }
        });

        WinJS.Namespace.define("WinJS.Application", {
            local: { get: function() {
                if (!local) { 
                    local = new IOHelper(sto.ApplicationData.current.localFolder);
                }
                return local;
            }},
            temp: { get: function() {
                if (!temp) { 
                    temp = new IOHelper(sto.ApplicationData.current.temporaryFolder);
                }
                return temp;
            }},
            roaming: { get: function() {
                if (!roaming) { 
                    roaming = new IOHelper(sto.ApplicationData.current.roamingFolder);
                }
                return roaming;
            }}
        });
    };
    
    function initWithStub() {
        var InMemoryHelper = WinJS.Class.define(
            function () {
            this.storage = {};
        }, {
            exists: function (fileName) {
                /// <summary locid="25">
                /// Determines if the specified file exists in the container
                /// </summary>
                /// <param name="fileName" type="String" locid="39">
                /// The filename which may exist within this folder
                /// </param>
                /// <returns locid="27">
                /// Promise with either true (file exists) or false.
                /// </returns>
                // force conversion to boolean
                // 
                return WinJS.Promise.as(this.storage[fileName] !== undefined);
            },
            remove: function (fileName) {
                /// <summary>
                /// Delets a file in the container
                /// </summary>
                /// <param name='fileName' type='String'>
                /// The file to be deleted
                /// </param>
                /// <returns>
                /// Promise which is fulfilled when the file has been deleted
                /// </returns>
                delete this.storage[fileName];
                return WinJS.Promise.as();
            },
            writeText: function (fileName, str) {
                /// <summary locid="31">
                /// Writes a file to the container with the specified text
                /// </summary>
                /// <param name="fileName" type="String" locid="40">
                /// The filename to write to
                /// </param>
                /// <param name="str" type="String" locid="33">
                /// Content to be written to the file
                /// </param>
                /// <returns locid="34">
                /// Promise with the count of characters written
                /// </returns>
                this.storage[fileName] = str;
                return WinJS.Promise.as(str.length);
            },
            readText: function (fileName, def) {
                /// <summary locid="35">
                /// Reads the contents of a file from the container, if the file
                /// doesn't exist, def is returned.
                /// </summary>
                /// <param name="fileName" type="String" locid="41">
                /// The filename to read from
                /// </param>
                /// <param name="def" type="String" locid="37">
                /// Default value to be returned if the file failed to open
                /// </param>
                /// <returns locid="38">
                /// Promise containing the contents of the file, or def.
                /// </returns>
                return WinJS.Promise.as(this.storage[fileName] || def);
            }
        }
        );

        WinJS.Namespace.define("WinJS.Application", {
            local: new InMemoryHelper(),
            temp: new InMemoryHelper(),
            roaming: new InMemoryHelper()
        });
    }
    
    if (window.Windows && Windows.Storage && Windows.Storage.ApplicationData) {
        initWithWinRT();
    }
    else {
        initWithStub();
    }
    

    WinJS.Namespace.define("WinJS.Application", {
        sessionState: { value: {}, writable: true, enumerable: true },
        _loadState: function (e) {
            var app = WinJS.Application;
            
            // we don't restore the state if we are already running, or if we are 
            // booting for the first time
            //
            if (e.previousExecutionState !== 0 /* ApplicationExecutionState.NotRunning */ && e.previousExecutionState !== 1 /* ApplicationExecutionState.CurrentlyRunning */) {
                return app.local.readText("_sessionState.json", "{}").
                    then(function (str) { 
                        app.sessionState = JSON.parse(str);
                    }).then(null, function() {});
            }
            else {
                return WinJS.Promise.as();
            }
        },
        _oncheckpoint: function (e) {
            var app = WinJS.Application;
            e.setPromise(app.local.writeText("_sessionState.json", JSON.stringify(app.sessionState)));
        }
    });    
})();

