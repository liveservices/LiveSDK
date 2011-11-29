/// <loc filename="metadata\base_loc_oam.xml" format="messagebundle" />
/// <reference path='base.js' />
 
/*
  © Microsoft. All rights reserved.

  This library is supported for use in Windows Tailored Apps only.

  Build: 6.2.8100.0 
  Version: 0.5 
*/
 


(function (global, undefined) {

    function initializeProperties(target, members) {
        var keys = Object.keys(members);
        var properties;
        var i, len;
        for (i = 0, len = keys.length; i < len; i++) {
            var key = keys[i];
            var enumerable = key.charCodeAt(0) !== /*_*/95;
            var member = members[key];
            if (member && typeof member === 'object') {
                if (member.value !== undefined || typeof member.get === 'function' || typeof member.set === 'function') {
                    if (member.enumerable === undefined) {
                        member.enumerable = enumerable;
                    }
                    properties = properties || {};
                    properties[key] = member;
                    continue;
                } 
            }
            if (!enumerable) {
                properties = properties || {};
                properties[key] = { value: member, enumerable: enumerable, configurable: true, writable: true }
                continue;
            }
            target[key] = member;
        }
        if (properties) {
            Object.defineProperties(target, properties);
        }
    }

    (function (rootNamespace) {

        // Create the rootNamespace in the global namespace
        if (!global[rootNamespace]) {
            global[rootNamespace] = Object.create(Object.prototype);
        }

        // Cache the rootNamespace we just created in a local variable
        var _rootNamespace = global[rootNamespace];
        if (!_rootNamespace.Namespace) {
            _rootNamespace.Namespace = Object.create(Object.prototype);
        }

        function defineWithParent(parentNamespace, name, members) {
            /// <summary locid="1">
            /// Defines a new namespace with the specified name, under the specified parent namespace.
            /// </summary>
            /// <param name="parentNamespace" type="Object" locid="2">
            /// The parent namespace which will contain the new namespace.
            /// </param>
            /// <param name="name" type="String" locid="3">
            /// Name of the new namespace.
            /// </param>
            /// <param name="members" type="Object" locid="4">
            /// Members in the new namespace.
            /// </param>
            /// <returns locid="5">
            /// The newly defined namespace.
            /// </returns>
            var currentNamespace = parentNamespace,
                namespaceFragments = name.split(".");

            for (var i = 0, len = namespaceFragments.length; i < len; i++) {
                var namespaceName = namespaceFragments[i];
                if (!currentNamespace[namespaceName]) {
                    Object.defineProperty(currentNamespace, namespaceName, 
                        { value: {}, writable: false, enumerable: true, configurable: true }
                    );
                }
                currentNamespace = currentNamespace[namespaceName];
            }

            if (members) {
                initializeProperties(currentNamespace, members);
            }

            return currentNamespace;
        };

        function define(name, members) {
            /// <summary locid="6">
            /// Defines a new namespace with the specified name.
            /// </summary>
            /// <param name="name" type="String" locid="7">
            /// Name of the namespace.  This could be a dot-separated nested name.
            /// </param>
            /// <param name="members" type="Object" locid="4">
            /// Members in the new namespace.
            /// </param>
            /// <returns locid="5">
            /// The newly defined namespace.
            /// </returns>
            return defineWithParent(global, name, members);
        }

        // Establish members of the "WinJS.Namespace" namespace
        Object.defineProperties(_rootNamespace.Namespace, {

            defineWithParent: { value: defineWithParent, writable: true, enumerable: true },

            define: { value: define, writable: true, enumerable: true }

        });

    })("WinJS");

    (function (WinJS) {

        function define(constructor, instanceMembers, staticMembers) {
            /// <summary locid="8">
            /// Defines a class using the given constructor and with the specified instance members.
            /// </summary>
            /// <param name="constructor" type="Function" locid="9">
            /// A constructor function that will be used to instantiate this class.
            /// </param>
            /// <param name="instanceMembers" type="Object" locid="10">
            /// The set of instance fields, properties and methods to be made available on the class.
            /// </param>
            /// <param name="staticMembers" type="Object" locid="11">
            /// The set of static fields, properties and methods to be made available on the class.
            /// </param>
            /// <returns type="Function" locid="12">
            /// The newly defined class.
            /// </returns>
            constructor = constructor || function () { };
            if (instanceMembers) {
                initializeProperties(constructor.prototype, instanceMembers);
            }
            if (staticMembers) {
                initializeProperties(constructor, staticMembers);
            }
            return constructor;
        }

        function derive(baseClass, constructor, instanceMembers, staticMembers) {
            /// <summary locid="13">
            /// Uses prototypal inheritance to create a sub-class based on the supplied baseClass parameter.
            /// </summary>
            /// <param name="baseClass" type="Function" locid="14">
            /// The class to inherit from.
            /// </param>
            /// <param name="constructor" type="Function" locid="9">
            /// A constructor function that will be used to instantiate this class.
            /// </param>
            /// <param name="instanceMembers" type="Object" locid="10">
            /// The set of instance fields, properties and methods to be made available on the class.
            /// </param>
            /// <param name="staticMembers" type="Object" locid="11">
            /// The set of static fields, properties and methods to be made available on the class.
            /// </param>
            /// <returns type="Function" locid="12">
            /// The newly defined class.
            /// </returns>
            if (baseClass) {
                constructor = constructor || function () { };
                var basePrototype = baseClass.prototype;
                constructor.prototype = Object.create(basePrototype);
                Object.defineProperty(constructor.prototype, "_super", { value: basePrototype });
                Object.defineProperty(constructor.prototype, "constructor", { value: constructor });
                if (instanceMembers) {
                    initializeProperties(constructor.prototype, instanceMembers);
                }
                if (staticMembers) {
                    initializeProperties(constructor, staticMembers);
                }
                return constructor;
            } else {
                return define(constructor, instanceMembers, staticMembers);
            }
        }

        function mix(constructor) {
            /// <summary locid="15">
            /// Defines a class using the given constructor and the union of the set of instance members
            /// specified by all the mixin objects.  The mixin parameter list can be of variable length.
            /// </summary>
            /// <param name="constructor" locid="9">
            /// A constructor function that will be used to instantiate this class.
            /// </param>
            /// <returns locid="12">
            /// The newly defined class.
            /// </returns>
            constructor = constructor || function () { };
            var i, len;
            for (i = 0, len = arguments.length; i < len; i++) {
                initializeProperties(constructor.prototype, arguments[i]);
            }
            return constructor;
        }

        // Establish members of "WinJS.Class" namespace
        WinJS.Namespace.define("WinJS.Class", {
            define: define,
            derive: derive,
            mix: mix
        });

    })(WinJS);

})(this);




(function (global, WinJS) {

    // Establish members of "WinJS.Utilities" namespace
    WinJS.Namespace.defineWithParent(WinJS, "Utilities", {
        getMember: function (name, root) {
            /// <summary locid="16">
            /// Gets the leaf-level type or namespace as specified by the name.
            /// </summary>
            /// <param name="name" locid="17">
            /// The name of the member.
            /// </param>
            /// <param name="root" locid="18">
            /// The root to start in, defaults to the global object.
            /// </param>
            /// <returns locid="19">
            /// The leaf-level type of namespace inside the specified parent namespace.
            /// </returns>
            root = root || global;
            if (!name) {
                return null;
            }

            return name.split(".").reduce(function (currentNamespace, name) {
                if (currentNamespace) {
                    return currentNamespace[name];
                }
                return null;
            }, root);
        },
        
        ready: function(callback, async) {
            /// <summary locid="20">
            /// Ensures the given function only executes after the DOMContentLoaded event has fired
            /// for the current page.
            /// </summary>
            /// <returns locid="21">Promise which completes after DOMContentLoaded has fired.</returns>
            /// <param name="callback" optional="true" locid="22">
            /// A JS Function to execute after DOMContentLoaded has fired.
            /// </param>
            /// <param name="async" optional="true" locid="23">
            /// If true then the callback should be asynchronously executed.
            /// </param>
            return new WinJS.Promise(function (c, e) {
                function complete() {
                    if (callback) { 
                        try {
                            callback(); 
                            c();
                        }
                        catch (err) {
                            e(err);
                        }
                    }
                    else {
                        c();
                    }
                };

                var readyState = this.testReadyState || document.readyState;
                if(readyState === "complete" || document.body !== null) {
                    if(async) {
                        msQueueCallback(complete);
                    }
                    else {
                        complete();
                    }
                }
                else {
                  window.addEventListener("DOMContentLoaded", complete, false);
                }
            });
        }
    });

    WinJS.Namespace.define("WinJS", {
        validation: { value: false, writable: true, enumerable: true, configurable: false }
    });
})(this, WinJS);




// This feature is intended to be replaced by a native implementation in IE10
//

(function (global) {
    if (global.msSetImmediate) {
        global.msQueueCallback = global.msSetImmediate;
    }
    else {
        // frameLen would ideally be snapped to the vblank of the monitor
        //
        var frameLen = 16;
        // We reserve 30% of each frame for IE to render, ideally this would
        // be tuned based on actual render time
        //
        var userFrameTime = frameLen * .7;

        var _work = [];
        var dispatchFrame = function () {
            var start = new Date();
            var end;

            var q = _work;
            while (q.length > 0) {
                q.shift()();
                end = new Date();
                var elapsed = end - start;
                if (elapsed >= userFrameTime) {
                    break;
                }
            }
        };

        // name is intentionally obscure, we want most people
        // to use the promise implementation until we get a 
        // final design from IE.
        //
        global.msQueueCallback = function (f) { 
            _work.push(f);
        };

        setInterval(dispatchFrame, frameLen);
    }
})(this);



(function (WinJS, undefined) {

    function createEventProperties(events) {
        /// <summary locid="24">
        /// Creates a object which has properties for each name passed to the function.
        /// The names are prefixed with 'on'.
        /// </summary>
        /// <param name="events" locid="25">
        /// Variable argument list of property names.
        /// </param>
        /// <returns locid="26">
        /// Object which has properties for each event name passed to the function.
        /// </returns>
        var props = {};
        for (var i = 0, len = arguments.length; i < len; i++) {
            (function (name) {
                var wrapperFunction;
                var userHandler;
            
                props["on" + name] = {
                    get: function () {
                        return userHandler;
                    },
                    set: function (handler) {
                        if (handler) {
                            if (!wrapperFunction) {
                                wrapperFunction = function (evt) {
                                    userHandler(evt);
                                };
                                this.addEventListener(name, wrapperFunction, false);
                            }
                            userHandler = handler;
                        } else {
                            this.removeEventListener(name, wrapperFunction, false);
                            wrapperFunction = null;
                            userHandler = null;
                        }
                    },
                    enumerable: true
                }
            })(arguments[i]);
        }
        return props;
    }

    var EventMixinEvent = WinJS.Class.define(
        function (type, detail, target) {
            this.detail = detail;
            this.target = target;
            this.timeStamp = Date.now();
            this.type = type;
        },
        {
            bubbles: { value: false, writable: false },
            cancelable: { value: false, writable: false },
            currentTarget: { 
                get: function () { return this.target; } 
            },
            defaultPrevented: {
                get: function () { return this._preventDefaultCalled; }
            },
            trusted: { value: false, writable: false },
            eventPhase: { value: 0, writable: false },
            target: null,
            timeStamp: null,
            type: null,

            preventDefault: function () {
                this._preventDefaultCalled = true;
            },
            stopImmediatePropagation: function () {
                this._stopImmediatePropagationCalled = true;
            },
            stopPropagation: function () {
            }
        }
    );

    var eventMixin = {
        _listeners: null,

        addEventListener: function (type, listener, useCapture) {
            /// <summary locid="27">
            /// Adds an event listener to the control.
            /// </summary>
            /// <param name="type" locid="28">
            /// The type (name) of the event.
            /// </param>
            /// <param name="listener" locid="29">
            /// The listener to invoke when the event gets raised.
            /// </param>
            /// <param name="useCapture" locid="30">
            /// Specifies whether or not to initiate capture.
            /// </param>
            useCapture = useCapture || false;
            this._listeners = this._listeners || {};
            var eventListeners = (this._listeners[type] = this._listeners[type] || []);
            for (var i = 0, len = eventListeners.length; i < len; i++) {
                var l = eventListeners[i];
                if (l.useCapture === useCapture && l.listener === listener) {
                    return;
                }
            }
            eventListeners.push({ listener: listener, useCapture: useCapture});
        },
        dispatchEvent: function (type, details) {
            /// <summary locid="31">
            /// Raises an event of the specified type and with additional properties.
            /// </summary>
            /// <param name="type" locid="28">
            /// The type (name) of the event.
            /// </param>
            /// <param name="details" locid="32">
            /// The set of additional properties to be attached to the event object when the event is raised.
            /// </param>
            /// <returns type="Boolean" locid="33">
            /// Boolean indicating whether preventDefault was called on the event.
            /// </returns>
            var eventValue = new EventMixinEvent(type, details, this);
            var listeners = this._listeners && this._listeners[type];
            if (listeners) {
                // Need to copy the array to protect against people unregistering while we are dispatching
                listeners = listeners.slice(0, listeners.length);
                for (var i = 0, len = listeners.length; i < len && !eventValue._stopImmediatePropagationCalled; i++) {
                    listeners[i].listener(eventValue);
                }
            }
            return eventValue.defaultPrevented || false;
        },
        removeEventListener: function (type, listener, useCapture) {
            /// <summary locid="34">
            /// Removes an event listener from the control.
            /// </summary>
            /// <param name="type" locid="28">
            /// The type (name) of the event.
            /// </param>
            /// <param name="listener" locid="35">
            /// The listener to remove from the invoke list.
            /// </param>
            /// <param name="useCapture" locid="30">
            /// Specifies whether or not to initiate capture.
            /// </param>
            useCapture = useCapture || false;
            var listeners = this._listeners && this._listeners[type];
            if (listeners) {
                for (var i = 0, len = listeners.length; i < len; i++) {
                    var l = listeners[i];
                    if (l.listener === listener && l.useCapture === useCapture) {
                        listeners.splice(i, 1);
                        if (listeners.length === 0) {
                            delete this._listeners[type];
                        }
                        // Only want to remove one element for each call to removeEventListener
                        break;
                    }
                }
            }
        }
    };

    WinJS.Namespace.defineWithParent(WinJS, "Utilities", {
        createEventProperties: createEventProperties,
        eventMixin: eventMixin
    });

})(WinJS);




(function (global, WinJS) {

    var ListenerType = WinJS.Class.mix(WinJS.Class.define(null), WinJS.Utilities.eventMixin);
    var listeners = new ListenerType();
    var errorET = "error";

    function isPromise(value) {
        return typeof value === "object" && value && typeof value.then === "function";
    }

    // Helper to notify listeners on successful fulfillment of a promise
    //
    function notifySuccess(notifier, listeners, value) {
        for (var i = 0, len = listeners.length; i < len; i++) {
            var listener = listeners[i];
            //
            // NOTE: promise here is always an instance of ThenPromise and we are OK
            //  reaching into its private members _complete and _error in order to
            //  notify it of fulfillment.
            //
            var promise = listener.promise;
            var onComplete = listener.onComplete;
            try {
                if (onComplete) {
                    // If we have a onComplete handler then the fulfillment value of the 
                    // ThenPromise is the result of calling the onComplete handler.
                    //
                    promise._complete(onComplete(value));
                } else {
                    // If we do not have an onComplete handler the ThenPromise is fulfilled
                    // by the current value.
                    //
                    promise._complete(value);
                }
            } catch (exception) {
                // If an error occurs while executing the users onComplete handler then the
                // ThenPromise is itself in error with the exception value as its fulfillment
                // value.
                //
                promise._exception(exception);
            }
        }
    }
    // Helper to notify listeners on error fulfillment of a promise
    //
    function notifyError(notifier, listeners, value) {
        for (var i = 0, len = listeners.length; i < len; i++) {
            var listener = listeners[i];
            //
            // NOTE: promise here is always an instance of ThenPromise and we are OK
            //  reaching into its private members _complete and _error in order to
            //  notify it of fulfillment.
            //
            var promise = listener.promise;
            var onError = listener.onError;
            try {
                if (onError) {
                    // If we have a onError handler then the fulfillment value of the 
                    // ThenPromise is the result of calling the onError handler
                    //
                    promise._handledError(value, notifier, onError);
                } else {
                    // If we do not have an onError handler the ThenPromise is in error
                    // and is fulfilled by the current error value.
                    //
                    promise._chainedError(value, notifier);
                }
            } catch (exception) {
                // If an exception occurs while executing the users onError handler then
                // the ThenPromise is in error with the exception value as its fulfillment
                // value.
                //
                promise._exception(exception);
            }
        }
    }

    // Global error counter, for each error which enters the system we increment this once and then 
    // the error number travels with the error as it traverses the tree of potential handlers.
    //
    var error_number = 0;

    var state_working = 0;
    var state_waiting = 1;
    var state_waiting_canceled = 2;
    var state_fulfilled_error = 3;
    var state_fulfilled_success = 4;

    var state_fulfilled_min = state_fulfilled_error;

    function generateErrorHandler(onerror) {
        return function (errorValue, context) {
            if (this._state !== state_working) {
                return;
            }

            this._value = errorValue;
            this._state = state_fulfilled_error;

            if (listeners._listeners && listeners._listeners[errorET]) {
                var details = onerror(this, errorValue, context);
                WinJS.Promise.dispatchEvent(errorET, details);
            }
            
            this._notify();

            // We have now entered a fulfilled state, cleanup anything which was
            // around as part of being async (async operation object, back pointer 
            // used for cancellation, etc).
            //
            this._cleanup();
        }
    }
    function onerrorForChainedError(promise, errorValue, context) {
        var exception = context._isException;
        var errorId = context._errorId;
        promise._isException = exception || false;
        promise._errorId = errorId;
        return {
            exception: exception ? errorValue : null,
            error: exception ? null : errorValue,
            promise: promise,
            id: errorId,
            parent: context
        }
    }
    function onerrorForError(promise, errorValue) {
        promise._isException = false;
        promise._errorId = ++error_number;
        return {
            error: errorValue,
            promise: promise,
            id: promise._errorId
        };
    }
    function onerrorForException(promise, exceptionValue) {
        promise._isException = true;
        promise._errorId = ++error_number;
        return {
            exception: exceptionValue,
            promise: promise,
            id: promise._errorId
        };
    }
    
    var PromiseBase = WinJS.Class.define(
        null,
        {
            _listeners: null,
            _state: state_working,
            _value: null,

            _cancel: function () {
                switch (this._state) {
                    case state_fulfilled_error:
                    case state_fulfilled_success:
                    case state_waiting_canceled:
                        return;

                    case state_working:
                        this._error(new Error("Canceled"));
                        break;

                    case state_waiting:
                        this._state = state_waiting_canceled;

                        // If this is waiting on a completed value which is a promise then
                        // request that value to cancel itself.
                        //
                        if (typeof this._value.cancel === "function") {
                            this._value.cancel();
                        }
                        break;
                }

                this._cleanup();
            },

            _complete: function (completeValue) {
                // If we are in any state that isn't state_working then we have already
                // commited to a realized value and any duplicate calls to _complete will
                // be ignored.
                //
                if (this._state !== state_working) {
                    return;
                }

                this._value = completeValue;

                if (isPromise(completeValue)) {

                    // If _complete was called with a value which is itself a promise then
                    // we block on that promise being fulfilled. If that promise is fulfilled
                    // with a success value then this Promise continues to be successful, but
                    // if that promise is fulfilled with an error value this promise will move
                    // to an error state as well.
                    //
                    this._state = state_waiting;

                    var that = this;
                    completeValue.then(
                        function (value) { that._state = state_working; that._complete(value); },
                        function (value) { 
                            that._state = state_working; 
                            if (completeValue instanceof PromiseBase) {
                                that._chainedError(value, completeValue);
                            } else {
                                that._error(value);
                            }
                        },
                        function (value) { that._progress(value); }
                    );
                } else {

                    this._state = state_fulfilled_success;

                    this._notify();
                }

                this._cleanup();
            },

            _handledError: function (errorValue, context, handler) {
                if (listeners._listeners && listeners._listeners[errorET]) {
                    WinJS.Promise.dispatchEvent(errorET, {
                        exception: context._isException ? errorValue : null,
                        error: context._isException ? null : errorValue,
                        promise: this,
                        handler: handler,
                        id: context._errorId,
                        parent: context
                    });
                }

                this._complete(handler(errorValue));
            },
            _chainedError: generateErrorHandler(onerrorForChainedError),
            _error: generateErrorHandler(onerrorForError),
            _exception: generateErrorHandler(onerrorForException),
            
            _notify: function () {
                // Take ownership of the list of listeners, we will notify them all
                // and then drop them on the floor for garbage collection.
                //
                var listeners = this._listeners;
                this._listeners = null;

                if (listeners) {
                    // If there are listeners and we are in a fulfilled state then we 
                    // notify those listeners of our value.
                    //
                    switch (this._state) {
                        case state_fulfilled_success:
                            notifySuccess(this, listeners, this._value);
                            break;

                        case state_fulfilled_error:
                            notifyError(this, listeners, this._value);
                            break;
                    }
                }
            },

            _progress: function (progressValue) {
                if (this._state >= state_fulfilled_min) {
                    return;
                }
                if (this._listeners) {
                    // If there are listeners walk through the list and notify any of them
                    // which are listening for progress with the progress value.
                    // 
                    for (var i = 0, len = this._listeners.length; i < len; i++) {
                        var listeners = this._listeners[i];
                        var onProgress = listeners.onProgress;
                        try {
                            if (onProgress) {
                                onProgress(progressValue);
                            }
                        } catch (e) {
                            //
                            // Swallow exception thrown from user progress handler
                            //
                        }
                        // Progress waterfalls through Promises which do not contain a 
                        // terminating clause (complete or error).
                        //
                        if (!(listeners.onComplete || listeners.onError)) {
                            listeners.promise._progress(progressValue);
                        }
                    }
                }
            },

            then: function (onComplete, onError, onProgress) {
                /// <summary locid="36">
                /// Allows specifying work to be done on the realization of the promised value,
                /// error handling to be performed in the event that the Promise fails to realize
                /// a value and handling of progress notifications along the way.
                /// </summary>
                /// <param name="onComplete" type="Function" locid="37">
                /// Function to be called if the Promise is fulfilled successfully with a value.
                /// The value will be passed as the single argument. If null then the Promise will
                /// provide a default implementation which simply returns the value. The value returned
                /// from the function will become the fulfilled value of the Promise returned by
                /// then(). If an exception is thrown while executing the function the Promise returned
                /// by then() will move into the error state.
                /// </param>
                /// <param name="onError" type="Function" optional="true" locid="38">
                /// Function to be called if the Promise is fulfilled with an error. The error
                /// will be passed as the single argument. If null then the Promise will provide a default
                /// implementation which simply forwards the error. The value returned from the function
                /// will become the fulfilled value of the Promise returned by then().
                /// </param>
                /// <param name="onProgress" type="Function" optional="true" locid="39">
                /// Function to be called if the Promise reports progress. Data about the progress
                /// will be passed as the single argument. Promises are not required to support
                /// progress.
                /// </param>
                /// <returns locid="40">
                /// Promise whose value will be the result of executing the provided complete or
                /// error function.
                /// </returns>

                // We have at least one callback to make, ensure we have a list to store it in
                //
                this._listeners = this._listeners || [];

                // Create the promise that will be the return value of the then() call. Pass it
                // ourselves so that if canceled it notify this instance.
                //
                var p = new ThenPromise(this);

                this._listeners.push({
                    promise: p,
                    onComplete: onComplete,
                    onError: onError,
                    onProgress: onProgress
                });

                // If we are already done then trigger notification immediately.
                //
                if (this._state >= state_fulfilled_min) {
                    this._notify();
                }

                return p;
            }
        }
    );

    // ThenPromise is the type of instances that are returned from calling .then() on a
    // PromiseBase. It is kind of strange because it doesn't setup anything in its 
    // constructor to call _complete or _error. PromiseBase's implementation reaches 
    // around to the private members to call _complete and _error as needed on a 
    // ThenPromise instance.
    //
    var ThenPromise = WinJS.Class.derive(PromiseBase,
        function (creator) {
            // 'creator' is the promise on which .then() was called resulting in this instance
            //
            this._creator = creator;
        },
        {
            _cleanup: function () {
                this._creator = null;
            },

            cancel: function () {
                if (this._creator) {
                    // When we are canceled we need to propagate that up the chain.
                    //
                    this._creator.cancel();
                }
                this._cancel();
            }
        }
    );

    var CompletePromise = WinJS.Class.derive(PromiseBase,
        function (value) {
            this._complete(value);
        },
        {
            _cleanup: function () { },
            cancel: function () { }
        }
    );

    var ErrorPromise = WinJS.Class.derive(PromiseBase,
        function (error) {
            this._error(error);
        },
        {
            _cleanup: function () { },
            cancel: function () { }
        }
    );

    // Promise implements the contract that we have checked into our libraries today.
    //
    var Promise = WinJS.Class.derive(PromiseBase,
        function (init, cancel) {
            /// <summary locid="41">
            /// A Promise provides a mechanism to schedule work to be done on a value that
            /// has not yet been computed. It is a very convinent abstraction for managing
            /// interactions with asynchronous APIs.
            /// </summary>
            /// <param name="init" type="Function" locid="42">
            /// Function which is called during construction of the  Promise. The function
            /// is given three arguments (complete, error, progress). Inside the function
            /// the creator of the Promise should wire up the notifications supported by
            /// this value.
            /// </param>
            /// <param name="cancel" optional="true" locid="43">
            /// Function to call if a down-stream consumer of this Promise wants to
            /// attempt to cancel its undone work. Promises are not required to be
            /// cancelable.
            /// </param>


            this._onCancel = cancel;

            try {
                var that = this;
                init(
                    function completeCallback(value) { that._complete(value); },
                    function errorCallback(value) { that._error(value); },
                    function progressCallback(value) { that._progress(value); }
                );
            } catch (e) {
                this._exception(e);
            }
        },
        {
            _cleanup: function () {
                this._onCancel = null;
            },

            cancel: function () {
                /// <summary locid="44">
                /// Attempts to cancel the realization of a promised value. If the Promise hasn't
                /// already been fulfilled and cancellation is supported the Promise will enter
                /// the error state with a value of new Error("Canceled").
                /// </summary>
                if (this._onCancel) {
                    this._onCancel();
                }
                this._cancel();
            }
        },
        {
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
            any: function (values) {
                /// <summary locid="45">
                /// Returns a Promise which is fulfilled when one of the input Promises
                /// has been fulfilled.
                /// </summary>
                /// <param name="values" type="Array" locid="46">
                /// Array of values including Promise objects or Object whose property
                /// values include Promise objects.
                /// </param>
                /// <returns locid="47">
                /// Promise which on fulfillment yields the value of the input which is
                /// complete or in error.
                /// </returns>
                var errorCount = 0;
                return new Promise(
                    function (c, e, p) {
                        var keys = Object.keys(values);
                        var len = keys.length;
                        var errors = Array.isArray(values) ? [] : {};
                        keys.forEach(function (key) {
                            Promise.as(values[key]).then(
                                function () { c({ key: key, value: values[key] }); },
                                function () { e({ key: key, value: values[key] }); }
                            );
                        });
                    },
                    function () {
                        var keys = Object.keys(values);
                        keys.forEach(function (key) {
                            var promise = Promise.as(values[key]);
                            if (typeof promise.cancel === "function") {
                                promise.cancel();
                            }
                        });
                    }
                );
            },
            as: function (value) {
                /// <summary locid="48">
                /// Returns a Promise, if the value is already a Promise it is returned
                /// otherwise the value is wrapped in a Promise.
                /// </summary>
                /// <param name="value" locid="49">
                /// Value to be treated as a Promise.
                /// </param>
                /// <returns locid="50">
                /// Promise.
                /// </returns>
                if (isPromise(value)) {
                    return value;
                }
                return new CompletePromise(value);
            },
            dispatchEvent: function (eventType, details) {
                /// <summary>
                /// Raises an event of the specified type and with additional properties.
                /// </summary>
                /// <param name='eventType'>
                /// The type (name) of the event.
                /// </param>
                /// <param name='details'>
                /// The set of additional properties to be attached to the event object when the event is raised.
                /// </param>
                /// <returns type='Boolean'>
                /// Boolean indicating whether preventDefault was called on the event.
                /// </returns>
                return listeners.dispatchEvent(eventType, details);
            },
            is: function (value) {
                /// <summary locid="51">
                /// Determine whether a value fulfills the Promise contract.
                /// </summary>
                /// <param name="value" locid="52">
                /// A value which may be a Promise.
                /// </param>
                /// <returns type="Boolean" locid="53">
                /// Whether or not the specified value is a Promise
                /// </returns>
                return isPromise(value);
            },
            join: function (values) {
                /// <summary locid="54">
                /// Creates a Promise that is fulfilled when all the values are realized.
                /// </summary>
                /// <param name="values" type="Object" locid="55">
                /// Record whose fields contains values, some of which may be Promises.
                /// </param>
                /// <returns locid="56">
                /// Promise whose value is a record with the same field names as the input where
                /// each field value is a realized value.
                /// </returns>
                return new Promise(
                    function (c, e, p) {
                        var keys = Object.keys(values);
                        var errors = Array.isArray(values) ? [] : {};
                        var results = Array.isArray(values) ? [] : {};
                        var pending = keys.length;
                        var argDone = function (key) {
                            if ((--pending) === 0) {
                                if (Object.keys(errors).length === 0) {
                                    c(results);
                                } else {
                                    e(errors);
                                }
                            } else {
                                p({ Key: key, Done: true });
                            }
                        };
                        keys.forEach(function (key) {
                            Promise.then(values[key],
                                function (value) { results[key] = value; argDone(key); },
                                function (value) { errors[key] = value; argDone(key); }
                            );
                        });
                    },
                    function () {
                        Object.keys(values).forEach(function (key) {
                            var promise = Promise.as(values[key]);
                            if (typeof promise.cancel === "function") {
                                promise.cancel();
                            }
                        });
                    });
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
            },
            then: function (value, complete, error, progress) {
                /// <summary locid="57">
                /// Static forwarder to the Promise instance method then().
                /// </summary>
                /// <param name="value" locid="49">
                /// Value to be treated as a Promise.
                /// </param>
                /// <param name="complete" type="Function" locid="58">
                /// Function to be called if the Promise is fulfilled successfully with a value.
                /// If null then the Promise will provide a default implementation which simply
                /// returns the value. The value will be passed as the single argument.
                /// </param>
                /// <param name="error" type="Function" optional="true" locid="59">
                /// Function to be called if the Promise is fulfilled with an error. The error
                /// will be passed as the single argument.
                /// </param>
                /// <param name="progress" type="Function" optional="true" locid="39">
                /// Function to be called if the Promise reports progress. Data about the progress
                /// will be passed as the single argument. Promises are not required to support
                /// progress.
                /// </param>
                /// <returns locid="60">
                /// Promise whose value will be the result of executing the provided complete function.
                /// </returns>
                return Promise.as(value).then(complete, error, progress);
            },
            thenEach: function (values, complete, error, progress) {
                /// <summary locid="61">
                /// Performs an operation on all of the input promises and returns a Promise
                /// which is in the shape of the input and contains the result of the operation
                /// having been performed on each input.
                /// </summary>
                /// <param name="values" locid="62">
                /// Values (array or record) of which some or all are promises.
                /// </param>
                /// <param name="complete" type="Function" locid="58">
                /// Function to be called if the Promise is fulfilled successfully with a value.
                /// If null then the Promise will provide a default implementation which simply
                /// returns the value. The value will be passed as the single argument.
                /// </param>
                /// <param name="error" type="Function" optional="true" locid="59">
                /// Function to be called if the Promise is fulfilled with an error. The error
                /// will be passed as the single argument.
                /// </param>
                /// <param name="progress" type="Function" optional="true" locid="39">
                /// Function to be called if the Promise reports progress. Data about the progress
                /// will be passed as the single argument. Promises are not required to support
                /// progress.
                /// </param>
                /// <returns locid="63">
                /// Promise that is the result of calling Promise.join on the parameter 'values'
                /// </returns>
                var result = Array.isArray(values) ? [] : {};
                Object.keys(values).forEach(function (key) {
                    result[key] = Promise.as(values[key]).then(complete, error, progress);
                });
                return Promise.join(result);
            },
            timeout: function (timeout) {
                /// <summary locid="64">
                /// Create a promise which is fulfilled after a timeout
                /// </summary>
                /// <param name="timeout" type="Number" optional="true" locid="65">
                /// Timeout period, if 0 or not specified this is implemented using
                /// msSetImmediate, otherwise using setTimeout.
                /// </param>
                /// <returns type="WinJS.Promise" locid="66">
                /// Promise which is completed asynchronously after 'timeout' milliseconds
                /// </returns>
                if (!timeout) {
                    return new WinJS.Promise(
                        function timeoutComplete(c) {
                            msQueueCallback(c);
                        }
                    );
                }
                else {
                    var id = 0;

                    return new WinJS.Promise(
                        function (c) {
                            id = setTimeout(c, timeout);
                        },
                        function () {
                            if (id) {
                                clearTimeout(id);
                            }
                        }
                    );
                }
            },
            wrap: function (value) {
                /// <summary locid="67">
                /// Wrap a non-Promise value in a promise, this is useful if you need
                /// to pass a value to a function which requires a Promise.
                /// </summary>
                /// <param name="value" locid="68">
                /// Some non-Promise value to be wrapped in a promise
                /// </param>
                /// <returns type="WinJS.Promise" locid="69">
                /// Promise which is successfully fulfilled with the specified value
                /// </returns>
                return new CompletePromise(value);
            },
            wrapError: function (error) {
                /// <summary locid="70">
                /// Wrap a non-Promise error value in a promise, this is useful if you need
                /// to pass an error to a function which requires a Promise.
                /// </summary>
                /// <param name="error" locid="71">
                /// Some non-Promise error value to be wrapped in a promise
                /// </param>
                /// <returns type="WinJS.Promise" locid="72">
                /// Promise which is fulfilled in an error state with the specified value
                /// </returns>
                return new ErrorPromise(error);
            }
        }
    );
    Object.defineProperties(Promise, WinJS.Utilities.createEventProperties(errorET));

    // Publish WinJS.Promise
    //
    WinJS.Namespace.define("WinJS", {
        Promise: Promise
    });

})(this, WinJS);



(function (global, WinJS) {

    WinJS.Namespace.define("WinJS", {
        // ErrorFromName establishes a simple pattern for returning error codes.
        //
        ErrorFromName: WinJS.Class.derive(Error, function (name, message) {
                this.name = name;
                this.message = message || name;
            }, {
            }
        )
    });

})(this, WinJS);




(function () {

    WinJS.Namespace.define("WinJS", {
        xhr: function (options) {
            /// <summary locid="73">
            /// Wraps calls to XMLHttpRequest in a Promise.
            /// </summary>
            /// <param name="options" type="Object" locid="74">
            /// Options which will be applied to the XMLHttpRequest object including type,
            /// url, user, password, headers and responseType.
            /// </param>
            /// <returns locid="75">
            /// Promise which will yield the XMLHttpRequest object when completed
            /// </returns>
            var req;
            return new WinJS.Promise(
                function (c, e, p) {
                    req = new XMLHttpRequest();
                    req.onreadystatechange = function () {
                        if (req.readyState === 4) {
                            if (req.status >= 200 && req.status < 300) {
                                c(req);
                            } else {
                                e(req);
                            }
                            req.onreadystatechange = function () { };
                        } else {
                            p(req);
                        }
                    };

                    req.open(
                        options.type || "GET",
                        options.url,
                        // Promise based XHR does not support sync.
                        //
                        true,
                        options.user,
                        options.password
                    );
                    req.responseType = options.responseType || "";

                    Object.keys(options.headers || {}).forEach(function (k) {
                        req.setRequestHeader(k, options.headers[k]);
                    });

                    req.send(options.data);
                },
                function () {
                    req.abort();
                }
            );
        }
    });

})();




(function (global, undefined) {

    var setInnerHTML = setInnerHTMLUnsafe = function (element, text) { 
        /// <summary locid="76">
        /// Sets the innerHTML property of a element to the provided text
        /// </summary>
        /// <param name="element" type="HTMLElement" locid="77">
        /// Element on which the innerHTML property is to be set
        /// </param>
        /// <param name="text" locid="78">
        /// Value to be set to the innerHTML property
        /// </param>
        element.innerHTML = text; 
    };
    var setOuterHTML = setOuterHTMLUnsafe = function (element, text) { 
        /// <summary locid="79">
        /// Sets the outerHTML property of a element to the provided text
        /// </summary>
        /// <param name="element" type="HTMLElement" locid="80">
        /// Element on which the outerHTML property is to be set
        /// </param>
        /// <param name="text" locid="81">
        /// Value to be set to the outerHTML property
        /// </param>
        element.outerHTML = text; 
    };
    var insertAdjacentHTML = insertAdjacentHTMLUnsafe = function (element, position, text) { 
        /// <summary locid="82">
        /// Calls insertAdjacentHTML on the element
        /// </summary>
        /// <param name="element" type="HTMLElement" locid="83">
        /// Element on which insertAdjacentHTML is to be called
        /// </param>
        /// <param name="position" locid="84">
        /// Position relative to the element to insert the HTML
        /// </param>
        /// <param name="text" locid="85">
        /// Value to be provided to insertAdjacentHTML
        /// </param>
        element.insertAdjacentHTML(position, text); 
    };

    var msWWA = global.msWWA;
    if (msWWA) {
        setInnerHTMLUnsafe = function (element, text) {
            /// <summary> 
            /// Sets the innerHTML property of a element to the provided text
            /// </summary>
            /// <param name='element' type='HTMLElement'>
            /// Element on which the innerHTML property is to be set
            /// </param>
            /// <param name='text'>
            /// Value to be set to the innerHTML property
            /// </param>
            msWWA.execUnsafeLocalFunction(function () {
                element.innerHTML = text;
            });
        };
        setOuterHTMLUnsafe = function (element, text) {
            /// <summary locid="86">
            /// Sets the outerHTML property of a element to the provided text
            /// under the context of msWWA.execUnsafeLocalFunction.
            /// </summary>
            /// <param name="element" type="HTMLElement" locid="80">
            /// Element on which the outerHTML property is to be set
            /// </param>
            /// <param name="text" locid="81">
            /// Value to be set to the outerHTML property
            /// </param>
            msWWA.execUnsafeLocalFunction(function () {
                element.outerHTML = text;
            });
        };
        insertAdjacentHTMLUnsafe = function (element, position, text) {
            /// <summary locid="87">
            /// Calls insertAdjacentHTML on the element under the context
            /// of msWWA.execUnsafeLocalFunction.
            /// </summary>
            /// <param name="element" type="HTMLElement" locid="83">
            /// Element on which insertAdjacentHTML is to be called
            /// </param>
            /// <param name="position" locid="84">
            /// Position relative to the element to insert the HTML
            /// </param>
            /// <param name="text" locid="85">
            /// Value to be provided to insertAdjacentHTML
            /// </param>
            msWWA.execUnsafeLocalFunction(function () {
                element.insertAdjacentHTML(position, text);
            });
        };
    } else if (global.toStaticHTML) {
        // If we ever get isStaticHTML we can attempt to recreate the behavior we have in the local
        // compartment, in the mean-time all we can do is sanitize the input.
        //
        setInnerHTML = function (element, text) { 
            /// <summary locid="88">
            /// Sets the innerHTML property of a element to the provided text
            /// while calling toStaticHTML on the input text to sanitize it.
            /// </summary>
            /// <param name="element" type="HTMLElement" locid="77">
            /// Element on which the innerHTML property is to be set
            /// </param>
            /// <param name="text" locid="78">
            /// Value to be set to the innerHTML property
            /// </param>
            element.innerHTML = global.toStaticHTML(text); 
        };
        setOuterHTML = function (element, text) { 
            /// <summary locid="89">
            /// Sets the outerHTML property of a element to the provided text
            /// while calling toStaticHTML on the input text to sanitize it.
            /// </summary>
            /// <param name="element" type="HTMLElement" locid="80">
            /// Element on which the outerHTML property is to be set
            /// </param>
            /// <param name="text" locid="81">
            /// Value to be set to the outerHTML property
            /// </param>
            element.outerHTML = global.toStaticHTML(text); 
        };
        insertAdjacentHTML = function (element, position, text) { 
            /// <summary locid="90">
            /// Calls insertAdjacentHTML on the element while calling toStaticHTML
            /// on the input text to sanitize it.
            /// </summary>
            /// <param name="element" type="HTMLElement" locid="83">
            /// Element on which insertAdjacentHTML is to be called
            /// </param>
            /// <param name="position" locid="84">
            /// Position relative to the element to insert the HTML
            /// </param>
            /// <param name="text" locid="85">
            /// Value to be provided to insertAdjacentHTML
            /// </param>
            element.insertAdjacentHTML(position, global.toStaticHTML(text)); 
        };
    }

    WinJS.Namespace.define("WinJS.Utilities", {
        setInnerHTML: setInnerHTML,
        setInnerHTMLUnsafe: setInnerHTMLUnsafe,
        setOuterHTML: setOuterHTML,
        setOuterHTMLUnsafe: setOuterHTMLUnsafe,
        insertAdjacentHTML: insertAdjacentHTML,
        insertAdjacentHTMLUnsafe: insertAdjacentHTMLUnsafe
    });

}(this));

