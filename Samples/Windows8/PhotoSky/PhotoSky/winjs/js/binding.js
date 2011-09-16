/// <loc filename="metadata\binding_loc_oam.xml" format="messagebundle" />
/// <reference path='base.js' />
/// <reference path='ui.js' />
/// <reference path='binding.js' />
 
/*
  © Microsoft. All rights reserved.

  This library is supported for use in Windows Tailored Apps only.

  Build: 6.2.8100.0 
  Version: 0.5 
*/
 


(function (global, undefined) {

/*
    See comment for data-win-options attribute grammar for context.

    Syntactic grammar for the value of the data-win-bind attribute.

        BindDeclarations:
            BindDeclaration
            BindDeclarations ; BindDeclaration

        BindDeclaration:
            DestinationPropertyName : SourcePropertyName
            DestinationPropertyName : SourcePropertyName ActionName

        DestinationPropertyName:
            IdentifierExpression

        SourcePropertyName:
            IdentifierExpression

        ActionName:
            IdentifierExpression

        Value:
            NumberLiteral
            StringLiteral

        AccessExpression:
            [ Value ]
            . Identifier

        AccessExpressions:
            AccessExpression
            AccessExpressions AccessExpression

        IdentifierExpression:
            Identifier
            Identifier AccessExpressions

*/
    var lexer = WinJS.UI._optionsLexer;
    var tokenType = lexer.tokenType;

    var BindingInterpreter = WinJS.Class.derive(WinJS.UI._optionsParser._BaseInterpreter,
        function (tokens, context) {
            this._initialize(tokens, context);
        },
        {
            _error: function (message) {
                var error = new Error("Invalid binding, expected to be <destProp>:<sourceProp>;. " + message);
                error.name = "WinJS.Binding.ParseError";
                throw error;
            },
            _evaluateActionName: function () {
                if (this._current.type === tokenType.identifier) {
                    return this._evaluateIdentifierExpression();
                }
                return;
            },
            _evaluateValue: function () {
                switch (this._current.type) {
                    case tokenType.stringLiteral:
                    case tokenType.numberLiteral:
                        var value = this._current.value;
                        this._read();
                        return value;

                    default:
                        this._unexpectedToken(tokenType.stringLiteral, tokenType.numberLiteral);
                        return;
                }
            },
            _readBindDeclarations: function () {
                var bindings = [];
                while (true) {
                    switch (this._current.type) {
                        case tokenType.identifier:
                            bindings.push(this._readBindDeclaration());
                            break;

                        case tokenType.semicolon:
                            this._read();
                            break;

                        case tokenType.eof:
                            return bindings;

                        default:
                            this._unexpectedToken(tokenType.identifier, tokenType.semicolon, tokenType.eof);
                            return;
                    }
                }
            },
            _readBindDeclaration: function () {
                var dest = this._readDestinationPropertyName();
                this._read(tokenType.colon);
                var src = this._readSourcePropertyName();
                var action = this._evaluateActionName();
                return { 
                    destination: dest, 
                    source: src, 
                    action: action 
                };
            },
            _readDestinationPropertyName: function () {
                return this._readIdentifierExpression();
            },
            _readSourcePropertyName: function () { 
                return this._readIdentifierExpression();
            },
            run: function () {
                return this._readBindDeclarations();
            }
        }
    );

    function parser(text, context) {
        msWriteProfilerMark("BindingParser:parse:S");
        var tokens = lexer(text);
        var interpreter = new BindingInterpreter(tokens, context || {});
        var res = interpreter.run();
        msWriteProfilerMark("BindingParser:parse:E");
        return res;
    }

    WinJS.Namespace.define("WinJS.Binding", {
        _bindingParser: parser
    });

})(this);



(function (WinJS, undefined) {
    var mixin = {
        _listeners: null,
        _updatedValues: null,
        _backingData: null,

        _initObservable: function(data) {
            this._backingData = data || {};
            this._listeners = {};
        },

        _getObservable: function () {
            return this;
        },

        _cancel: function (name) {
            var pending = this._updatedValues && this._updatedValues[name];
            if (pending) {
                // If the work started, we tag the job as finished, which will avoid
                // adding more work to the queue, and then cancel the promise if 
                // present
                //
                pending.finished = true;
                if (pending.promise) { 
                    pending.promise.cancel(); 

                    // cleanup if the promise didn't correctly cleanup
                    //
                    if (this._updatedValues[name]) {
                        this._updatedValues[name].promise = null;
                        delete this._updatedValues[name];
                    }
                };
            }
        },

        _notifyListeners: function (name, newValue, oldValue) {
            var listeners = this._listeners[name];
            if (listeners) {
                var that = this;
                that._updatedValues = that._updatedValues || {};

                // Handle the case where we are updating a value that is currently updating
                //
                var pending = that._updatedValues[name];
                if (pending) {

                    // If the work hasn't started, we just update the new target value
                    //
                    if (!pending.started) {
                        pending.newValue = newValue;
                        return pending.promise;
                    }
                    else {
                        that._cancel(name);
                    }
                }

                // Starting new work, we cache the work description and queue up to do the notifications
                //
                var cap = that._updatedValues[name] = { newValue: newValue, oldValue: oldValue, started: false };

                // Binding guarantees async notification, so we do timeout()
                //
                cap.promise = WinJS.Promise.timeout().
                    then(function() { 
                        cap.started = true;
                        var join;
                        listeners.forEach(function (l) {
                            if (!cap.finished) { 
                                var value = l(cap.newValue, cap.oldValue);

                                // We sniff for promise return values to avoid creating a complex
                                // join later if not needed
                                //
                                if (typeof value === "object" && typeof value.then === "function") {
                                    join = join || [];
                                    join.push(value); 
                                }
                            }
                        });
                        function cleanup() {
                            cap.finished = true; 
                            if (cap === that._updatedValues[name]) { delete that._updatedValues[name]; } 
                        }
                        if (join) {
                            return WinJS.Promise.join(join).then(cleanup, cleanup).then(function() { return cap.newValue; });
                        }
                        else {
                            cleanup();
                        }
                    });

                return cap.promise;
            }
            
            return WinJS.Promise.as();
        },

        // UNDONE: maybe "listen" for the name?
        bind: function (name, action) {
            /// <summary locid="8">
            /// action will be invoked when the value of the property specified by name may have changed.
            /// It is not guaranteed that action will be called only when a value has actually changed,
            /// nor is it guaranteed that action will be called for every value change. The implementation
            /// of bind will coalesce change notificaiton such that multiple updates to a property
            /// value may result in only a single call to action.
            /// </summary>
            /// <param name="name" type="String" locid="9">
            /// Name of property to listen to change notification for.
            /// </param>
            /// <param name="action" type="function" locid="10">
            /// Function to invoke asynchronously when the property specified by name may have changed.
            /// </param>
            /// <returns locid="11">
            /// this object is returned (enabling fluent calling style)
            /// </returns>

            var listeners = this._listeners[name] = this._listeners[name] || [];
            var found = false;
            for (var i = 0, l = listeners.length; i < l; i++) {
                if (listeners[i] === action) {
                    found = true;
                    break;
                }
            }
            if (!found) {
                listeners.push(action);

                // UNDONE: this will notify all listeners when any listener is added, that's bad,
                // however we need to use _notifyListeners to make sure that the notification is
                // async and cancelable (i.e. fast calls to bind/unbind should cancel even the 
                // initial notification
                //
                this._notifyListeners(name, unwrap(this.getProperty(name)));
            }
            return this;
        },

        unbind: function (name, action) {
            /// <summary locid="12">
            /// Removes one or more listeners from the notification list for a given property.
            /// </summary>
            /// <param name="name" type="String" optional="true" locid="13">
            /// Name of property to stop listening for change notifications. If name is omitted, all listeners
            /// for all events are removed.
            /// </param>
            /// <param name="action" type="function" optional="true" locid="14">
            /// Function to remove from the listener list for the specified property, if omitted all listeners
            /// are removed for the specific property.
            /// </param>
            /// <returns locid="11">
            /// this object is returned (enabling fluent calling style)
            /// </returns>

            if (name && action) {
                // this assumes we rarely have more than one
                // listener, so we optimize to not do a lot of
                // array manipulation, although it means we 
                // may do some extra GC churn in the other cases... 
                //
                var listeners = this._listeners[name];
                var removed = false;
                if (listeners) {
                    var nl;
                    for (var i=0,l=listeners.length; i<l; i++) {
                        if (listeners[i] !== action) {
                            (nl = nl || []).push(listeners[i]);
                        }
                        else {
                            removed = true;
                        }
                    }
                    this._listeners[name] = nl;
                }
                // UNDONE: right now we have to cancel the notification,
                // or else dangling async work for the specific listener
                // may run... however, this means we end up canceling 
                // work for the listeners that still exist... bad.
                //
                if (removed && this._updatedValues[name]) {
                    this._cancel(name);
                    // Requeue the notification for any remaining listeners
                    //
                    if (this._listeners[name]) {
                        this._notifyListeners(name, unwrap(this.getProperty(name)));
                    }
                }
            }
            else if (name) {
                this._cancel(name);
                delete this._listeners[name];
            }
            else {
                var that = this;
                if (that._updatedValues) {
                    Object.keys(that._updatedValues).forEach(function (n) { that._cancel(n); });
                }
                this._listeners = {};
            }
            return this;
        },

        getProperty: function (name) {
            /// <summary locid="15">
            /// Retrieves a property value by name,
            /// </summary>
            /// <param name="name" type="String" locid="16">
            /// Name of property to retrieve
            /// </param>
            /// <returns locid="17">
            /// value of the property as an observable object.
            /// </returns>
            return as(this._backingData[name]);
        },

        setProperty: function (name, value) {
            /// <summary locid="18">
            /// Updates a property value and notifies any listeners.
            /// </summary>
            /// <param name="name" type="String" locid="19">
            /// Name of property to update
            /// </param>
            /// <param name="value" locid="20">
            /// Value to update the property to.
            /// </param>
            /// <returns locid="11">
            /// this object is returned (enabling fluent calling style)
            /// </returns>

            this.updateProperty(name, value);
            return this;
        },

        addProperty: function (name, value) {
            /// <summary locid="21">
            /// Adds a property with change notificaiton to this object, including a ES5 property definition
            /// </summary>
            /// <param name="name" type="String" locid="22">
            /// Name of property to add
            /// </param>
            /// <param name="value" locid="20">
            /// Value to update the property to.
            /// </param>
            /// <returns locid="11">
            /// this object is returned (enabling fluent calling style)
            /// </returns>

            // we could walk Object.keys to more deterministically determine this,
            // however in the normal case this avoids a bunch of string compares
            //
            if (!this[name]) {
                Object.defineProperty(this, 
                    name, {
                        get: function () { return this.getProperty(name); },
                        set: function (value) { this.setProperty(name, value); },
                        enumerable: true, 
                        configurable: true
                    }
                );
            }
            return this.setProperty(name, value);
        },

        updateProperty: function (name, value) {
            /// <summary locid="18">
            /// Updates a property value and notifies any listeners.
            /// </summary>
            /// <param name="name" type="String" locid="19">
            /// Name of property to update
            /// </param>
            /// <param name="value" locid="20">
            /// Value to update the property to.
            /// </param>
            /// <returns locid="23">
            /// Promise is returned which will complete when the notifications for
            /// this property change have been processed. In the case of coalescing
            /// the promise may be canceled, or the value of the promise may be updated.
            /// The value of the promise will be the new value of the property for
            /// which the notificaitons have been completed.
            /// </returns>

            var oldValue = this._backingData[name];
            var newValue = unwrap(value);
            if (oldValue !== newValue) {
                this._backingData[name] = newValue;
                
                // UNDONE: what is the expecation of this promise? Right now
                // this will complete when the listeners are notified, even
                // if a new value is used. The only time this promise will fail
                // (cancel) will be if we start notifying and then have to
                // cancel in the middle of processing it. That's a pretty
                // subtle contract.
                //
                return this._notifyListeners(name, newValue, oldValue);
            }
            return WinJS.Promise.as();
        },

        removeProperty: function (name) {
            /// <summary locid="24">
            /// Removes a property value
            /// </summary>
            /// <param name="name" type="String" locid="25">
            /// Name of property to remove
            /// </param>
            /// <returns locid="11">
            /// this object is returned (enabling fluent calling style)
            /// </returns>

            var oldValue = this._backingData[name];
            var value; // capture "undefined"
            delete this._backingData[name];
            delete this[name];
            this._notifyListeners(name, value, oldValue);
            return this;
        }
    };


    var bind = function (observable, bindingDescriptor) {
        /// <summary locid="26">
        /// Binds to one or more properties on the observable object or child values
        /// of that object.
        /// </summary>
        /// <param name="observable" type="object" locid="27">
        /// Object to bind to
        /// </param>
        /// <param name="bindingDescriptor" type="object" locid="28">
        /// Object literal containing the binding declarations. This is of the form:
        /// { propertyName: (function | bindingDeclaration), ... }
        /// 
        /// So, for example, you can bind to a nested member of an object:
        /// bind(someObject, { address: { street: function(v) { ... } } });
        /// </param>
        /// <returns locid="29">
        /// Object is returned which contains at least a field "cancel" which is
        /// a function that will remove all bindings associated with this bind
        /// request.
        /// </returns>

        observable = WinJS.Binding.as(observable);
        
        // UNDONE: this makes each binding fairly expensive... we have 
        // + 2 closures (cancelSimple & cancelComplex) 
        // + 1 closure per nested binding (propChanged)
        // + 2 object slots (complexLast, simpleLast)
        // + 1 object (complexLast)
        //
        // We should profile and determine if creating a constructor+prototype 
        // could lighten this up
        //
        var complexLast = {};
        var simpleLast = null;

        function cancelSimple() {
            if (simpleLast) {
                simpleLast.forEach(function (e) {
                    e.source.unbind(e.prop, e.listener);
                });
            }
            simpleLast = null;
        };
        
        function cancelComplex(k) {
            if (complexLast[k]) {
                complexLast[k].complexBind.cancel();
                delete complexLast[k];
            }
        };

        Object.keys(bindingDescriptor).forEach(function (k) {
            var listener = bindingDescriptor[k];
            if (listener instanceof Function) {
                simpleLast = simpleLast || [];
                simpleLast.push({source:observable,prop:k,listener:listener});
                observable.bind(k, listener);
            }
            else {
                var propChanged = function (v) {
                    cancelComplex(k);
                    complexBind = bind(as(v), listener);
                    complexLast[k] = {source:v,complexBind:complexBind};
                };

                observable.bind(k, propChanged);
            }
        });

        return {
            cancel: function () { 
                cancelSimple();
                Object.keys(complexLast).forEach(function (k) { cancelComplex(k); });
            }
        }
    };


    var ObservableProxy = WinJS.Class.mix(function (data) {
        this._initObservable(data);
        Object.defineProperties(this, expandProperties(data));
    }, mixin);

    var expandProperties = function(shape) {
        /// <summary locid="30">
        /// Given an object produce an object which has properties which
        /// are instrumented for binding. This is meant to be used in
        /// conjunction with the binding mixin.
        /// </summary>
        /// <param name="shape" type="Object" locid="31">
        /// Specification for the bindable object.
        /// </param>
        /// <returns locid="32">
        /// Object with a set of properties all of which are wired for binding
        /// </returns>
        var props = {};
        while (shape && shape !== Object.prototype) {
            Object.keys(shape).forEach(function (k) {
                props[k] = {
                    get: function () { return this.getProperty(k); },
                    set: function (value) { this.setProperty(k, value); },
                    enumerable: true, 
                    configurable: true // enables delete
                };
            });
            shape = Object.getPrototypeOf(shape);
        }
        return props;
    };

    var define = function (data) {
        /// <summary locid="33">
        /// Creates a new constructor function which supports observability and
        /// the set of properties defined in data.
        /// </summary>
        /// <param name="data" type="object" locid="34">
        /// Object to use as the pattern for defining the set of properties, for example:
        /// var MyPointClass = define({x:0,y:0});
        /// </param>
        /// <returns locid="35">
        /// Constructor function with 1 optional argument that is the initial state of
        /// the properties.
        /// </returns>

        // Common unsupported types, we just coerce to be an empty record
        //
        if (!data || typeof(data) !== "object" || (data instanceof Date) || (data instanceof Array)) {
            if (WinJS.validation) {
                throw "Unsupported data type";
            }
            else {
                return;
            }
        }
        
        return WinJS.Class.mix(
            function(init) { 
                /// <summary locid="36">
                /// Creates a new observable object.
                /// </summary>
                /// <param name="init" type="object" locid="37">
                /// Initial values for properties
                /// </param>

                // UNDONE: how should we get the defaults from "data"... by copy?
                //
                this._initObservable(init || Object.create(data)); 
            },  
            WinJS.Binding.mixin, 
            WinJS.Binding.expandProperties(data)
        );
    };

    var as = function (data) {
        /// <summary locid="38">
        /// Either creates an observable proxy for data, returns an existing proxy, or
        /// returns data in the case that data directly supports observability.
        /// </summary>
        /// <param name="data" type="object" locid="39">
        /// Object to provide observability for.
        /// </param>
        /// <returns locid="40">
        /// Observable object
        /// </returns>

        if (!data) {
            return data;
        }
        
        var type = typeof data;
        if (type === "object" 
            && !(data instanceof Date)
            && !(data instanceof Array)) {
            if (data._getObservable) {
                return data._getObservable();
            }

            var observable = new ObservableProxy(data);
            observable.backingData = data;
            Object.defineProperty(
                data, 
                "_getObservable", 
                { 
                    value: function() { return observable; }, 
                    enumerable: false, 
                    writable: false 
                }
            );
            return observable;
        }
        else {
            return data;
        }
    };

    var unwrap = function (data) {
        /// <summary locid="41">
        /// If data is an observable proxy, the original object is returned, otherwise data is returned.
        /// </summary>
        /// <param name="data" type="object" locid="42">
        /// Object to retrieve the original value for.
        /// </param>
        /// <returns locid="41">
        /// If data is an observable proxy, the original object is returned, otherwise data is returned.
        /// </returns>
        if (data && data.backingData)
            return data.backingData;
        else
            return data;
    };

    WinJS.Namespace.defineWithParent(WinJS, "Binding", {
        // must use long form because mixin has "get" and "set" as members, so the define
        // method thinks it's a property
        mixin: {value: mixin, enumerable:true, writable:true, configurable:true},
        expandProperties: expandProperties,
        define: define,
        as: as,
        unwrap: unwrap,
        bind: bind
    });
})(WinJS);



(function (WinJS, undefined) {
    WinJS.Namespace.defineWithParent(WinJS, "Binding", {
        Template: WinJS.Class.define(
            function (element, options) {
                /// <summary locid="1">
                /// Creates a Template which allows for a reusable declarative binding element.
                /// </summary>
                /// <param name="element" type="DOMElement" locid="2">
                /// DOM Element to convert to a template.
                /// </param>
                /// <param name="options" type="{href:String}" optional="true" locid="3">
                /// If the href is supplied, the template is loaded from that URI using the FragmentLoader, and
                /// the content of element is ignored.
                /// </param>
                
                msWriteProfilerMark("Template:new:S");

                this.element = element;
                var that = this;
                if (element) {
                    element.renderItem = function (item, recycled) {
                        // we only enable element cache when we are trying
                        // to recycle. Otherwise our element cache would 
                        // grow unbounded.
                        //
                        if (that.enableRecycling && !that.bindingCache.elements) { 
                            that.bindingCache.elements = {};
                        }

                        if (that.enableRecycling 
                            && recycled 
                            && recycled.msOriginalTemplate === that) {

                            // If we are asked to recycle, we cleanup any old work no matter what
                            //
                            if (recycled.msRendererPromise) { recycled.msRendererPromise.cancel(); }
                            var cacheEntry = that.bindingCache.elements[recycled.id];
                            var okToReuse = true;
                            if (cacheEntry) {
                                cacheEntry.bindings.forEach(function (v) { v(); });
                                cacheEntry.bindings = [];
                                okToReuse = !cacheEntry.nocache;
                            }
                            
                            // If our cache indicates that we hit a non-cancelable thing, then we are
                            // in an unknown state, so we actually can't recycle the tree. We have
                            // cleaned up what we can, but at this point we need to reset and create 
                            // a new tree.
                            //
                            if (okToReuse) {
                                // Element recycling requires that there be no other content in "recycled" other than this
                                // templates' output.
                                //
                                recycled.msRendererPromise = WinJS.Binding.processAll(recycled, item.data, true, that.bindingCache);
                                return recycled;
                            }
                        }

                        var d = document.createElement("div");
                        d.msOriginalTemplate = that;
                        d.msRendererPromise = that.render(item.data, d);
                        return d;
                    };
                }
                if (options) {
                    this.href = options.href;
                    this.enableRecycling = !!options.enableRecycling;
                    if (options.processTimeout) {
                        this.processTimeout = options.processTimeout;
                    }
                }
                if (!this.href) {
                    this.element.style.display = "none";
                }
                this.bindingCache = { expressions: {} };

                msWriteProfilerMark("Template:new:E");
            },
            {
                processTimeout: 0,
                
                render: function (dataContext, container) {
                    /// <summary locid="4">
                    /// Binds values from the dataContext to elements which are descendents of rootElement
                    /// which have the declarative binding attributes specified (data-win-bind and data-win-bindsource).
                    /// </summary>
                    /// <param name="dataContext" type="object" optional="true" locid="5">
                    /// Object to use for default data binding. Each element (or sub tree) may contain
                    /// a data-win-bindsource attribute which will override the dataContext.
                    /// </param>
                    /// <param name="container" type="DOMElement" optional="true" locid="6">
                    /// Element to add this rendered template to. If omited a new DIV is created.
                    /// </param>
                    /// <returns locid="7">
                    /// Promise which will be completed after binding has finished, the value will be
                    /// either container or the created DIV.
                    /// </returns>
                    msWriteProfilerMark("Template:render:S");

                    var d = container;
                    var tempParent;
                    if (!d) {
                        d = document.createElement("div");
                        tempParent = document.createElement("div");
                        tempParent.style.display = "none";
                        document.body.appendChild(tempParent);
                        tempParent.appendChild(d);
                    }
                    WinJS.Utilities.addClass(d, "win-template");
                    WinJS.Utilities.addClass(d, "win-loading");
                    var that = this;
                    function done() {
                        if (tempParent) {
                            tempParent.removeChild(d);
                            document.body.removeChild(tempParent);
                        }
                        WinJS.Utilities.removeClass(d, "win-loading");
                        msWriteProfilerMark("Template:render:E");
                        return d;   
                    };
                    var initial = d.children.length;
                    return WinJS.UI.Fragments.cloneTo(that.href || that.element, undefined, d).
                        then(function () { 
                            var work;
                            // If no existing children, we can do the faster path of just calling
                            // on the root element...
                            //
                            if (initial === 0) {
                                work = function (f,a,b,c) { return f(d,a,b,c); };
                            }
                            // We only grab the newly added nodes (always at the end)
                            // and in the common case of only adding a single new element
                            // we avoid the "join" overhead
                            // 
                            else {
                                var all = d.children;
                                if (all.length === initial + 1) { 
                                    work = function (f,a,b,c) { return f(all[initial],a,b,c); };
                                }
                                else {
                                    // we have to capture the elements first, in case
                                    // doing the work affects the children order/content
                                    //
                                    var elements = [];
                                    for (var i=initial, l=all.length; i<l; i++) {
                                        elements.push(all[o]);
                                    }
                                    work = function (f,a,b,c) {
                                        var join = [];
                                        elements.forEach(function (e) {
                                            join.push(f(e,a,b,c));
                                        });
                                        return WinJS.Promise.join(join);
                                    };
                                }
                            }                            
                            
                            // This allows "0" to mean no timeout (at all) and negative values
                            // mean msQueueCallback (no setTimeout). Since Promise.timeout uses
                            // zero to mean msQueueCallback, we have to coerce.
                            //
                            var timeout = that.processTimeout;
                            function complete() {
                                return work(WinJS.UI.processAll).
                                    then(function () {
                                      // !initial -- skipRoot when we do process on the container
                                      return work(WinJS.Binding.processAll, dataContext, !initial, that.bindingCache); 
                                    });
                            }
                            if (timeout) {
                                if (timeout < 0) { timeout = 0; }
                                return WinJS.Promise.timeout(timeout).then(complete);
                            }
                            else {
                                return complete();
                            }
                        }).then(done, function(err) { done(); throw err; });
                }
            }
        )
    });
    Object.defineProperties(WinJS.Binding.Template, {
        isDeclarativeControlContainer: { value: true, writable: false, configurable: false },
        render: { value: function (href, dataContext, container) {
            /// <summary locid="43">
            /// Renders a template based on a URI.
            /// </summary>
            /// <param name="href" type="String" locid="44">
            /// URI to load the template from.
            /// </param>
            /// <param name="dataContext" type="object" optional="true" locid="5">
            /// Object to use for default data binding. Each element (or sub tree) may contain
            /// a data-win-bindsource attribute which will override the dataContext.
            /// </param>
            /// <param name="container" type="DOMElement" optional="true" locid="6">
            /// Element to add this rendered template to. If omited a new DIV is created.
            /// </param>
            /// <returns locid="7">
            /// Promise which will be completed after binding has finished, the value will be
            /// either container or the created DIV.
            /// </returns>
            return new WinJS.Binding.Template(null, { href:href }).render(dataContext, container);
        }}
    });
})(WinJS);



(function (WinJS, undefined) {
    var uid = 0;
    
    function buildContext(element, baseElement, skipRoot) {
        var context;

        while (element && !context) {
            if (element.getAttribute) {
                context = element.getAttribute("data-win-bindsource");
            }

            if (element === baseElement || (skipRoot && element.parentNode === baseElement)) {
                break;
            }
            element = element.parentNode;
        }
        return context;
    };

    function inContainer(baseElement, control, start) {
        if (control && control.constructor.isDeclarativeControlContainer) { return true; }
        if (start !== baseElement && start.parentNode && start.parentNode !== baseElement) {
            start = start.parentNode;
            return inContainer(baseElement, WinJS.UI.getControl(start), start);
        }
        return false;
    };
    
    function actionOneBinding(bind, ref, source, e, pend, cacheEntry) { 
        var action = bind.action;
        if (action) {
            action = action.winControl || action["data-win-control"] || action;
        }
        if (action instanceof Function) {
            var result = action(source, bind.source, e, bind.destination);

            if (cacheEntry) {
                if (result && result.cancel) {
                    cacheEntry.bindings.push(function() { result.cancel(); });
                }
                else {
                    // notify the cache that we encountered an uncancellable thing
                    //
                    cacheEntry.nocache = true;
                }
            }
        }
        else if (action && action.render) {
            pend.count++;
            
            // notify the cache that we encountered an uncancellable thing
            //
            if (cacheEntry) {
                cacheEntry.nocache = true;
            }

            // UNDONE: should nested templates bind to the source property?
            //
            action.render(getValue(source, bind.source), e).
                then(function() { 
                    return WinJS.UI.processAll(e); 
                }).then(function() {
                    pend.checkComplete(); 
                });
        }
    };
    
    function sourceOneBinding(bind, ref, source, e, pend, cacheEntry) { 
        var bindable;
        if (source._getObservable) { 
            bindable = source._getObservable();
        }
        if (bindable) { 
            var first = true;
            pend.count++;
            var bindResult;
            
            // declarative binding must use a weak ref to the target element
            //
            function bindingAction(v) { 
                var found = WinJS.Utilities._getWeakRefElement(ref);
                if (found) {
                    nestedSet(found, bind.destination, v);
                }
                else if (bindResult) {
                    bindResult.cancel();
                }
                if (first) {
                    pend.checkComplete();
                    first = false;
                }
            }
                
            bindResult = bindWorker(bindable, bind.source, bindingAction);

            if (cacheEntry) {
                cacheEntry.bindings.push(function() { bindResult.cancel(); });
            }
        }
        else {
            nestedSet(e, bind.destination, getValue(source,bind.source));
        }
    };
    function calcBinding(bindingStr, bindingCache) {
        if (bindingCache) {
            var declBindCache = bindingCache.expressions[bindingStr];
            var declBind;
            if (!declBindCache) {
                declBind = WinJS.Binding._bindingParser(bindingStr);
                bindingCache.expressions[bindingStr] = declBind;
            }
            if (!declBind) {
                declBind = declBindCache;
            }
            return declBind;
        }
        else {
            return WinJS.Binding._bindingParser(bindingStr);
        }
    }
    function declarativeBindImpl(rootElement, dataContext, skipRoot, bindingCache, c, e, p) {
        msWriteProfilerMark("Binding:processAll:S");

        var pend = {
            count: 0,
            checkComplete: function checkComplete() {
                this.count--;
                if (this.count == 0) {
                    msWriteProfilerMark("Binding:processAll:E");
                    c();
                }
            }
        };
        var baseElement = (rootElement || document.body);
        var attr = "data-win-bind"
        var elements = baseElement.querySelectorAll("[" + attr + "]");
        var neg;
        if (!skipRoot && baseElement.getAttribute(attr)) {
            neg = baseElement;
        }

        pend.count++;

        for (var i=(neg?-1:0),l=elements.length; i<l; i++) {
            var element = i<0?neg:elements[i];
            
            if (inContainer(baseElement, WinJS.UI.getControl(element), element)) {
                return;
            }
            var original = element.getAttribute(attr);
            var declBind = calcBinding(original, bindingCache);
            var source = buildContext(element, baseElement, skipRoot);

            if (!declBind.implemented) {
                for(var bindIndex=0,bindLen=declBind.length; bindIndex<bindLen; bindIndex++) {
                    var bind = declBind[bindIndex];
                    if (bind.action) { 
                        bind.implementation = actionOneBinding; 
                    }
                    else { 
                        bind.implementation = sourceOneBinding; 
                    }
                }
                declBind.implemented = true;
            }
            
            // UNDONE: prescedence of declarative vs. specified... right
            // now the declarative version wins
            //
            source = source ? WinJS.Utilities.getMember(source) : source;
            source = WinJS.Binding.as(source || dataContext);
            pend.count++;

            var ref = element.id;
            if (!ref) { 
                // We use our own counter here, as the IE "uniqueId" is only
                // global to a document, which means that binding against
                // unparented DOM elements would get duplicate IDs.
                //
                // The elements may not be parented at this point, but they
                // will be parented by the time the binding action is fired.
                //
                uid++;
                element.id = ref = "_win_bind" + uid; 
                WinJS.Utilities._createWeakRef(element, ref);
            }
            var cacheEntry;
            if (bindingCache && bindingCache.elements) {
                cacheEntry = bindingCache.elements[ref];
                if (!cacheEntry) {
                    bindingCache.elements[ref] = cacheEntry = { bindings: [] };
                }
            }
            
            for(var bindIndex=0,bindLen=declBind.length; bindIndex<bindLen; bindIndex++) {
                var bind = declBind[bindIndex];
                bind.implementation(bind, ref, source, element, pend, cacheEntry);
            }
            pend.count--;
        }

        pend.checkComplete();
    }
        
    function declarativeBind(rootElement, dataContext, skipRoot, bindingCache) {
        /// <summary locid="4">
        /// Binds values from the dataContext to elements which are descendents of rootElement
        /// which have the declarative binding attributes specified (data-win-bind and data-win-bindsource).
        /// </summary>
        /// <param name="dataContext" type="object" optional="true" locid="5">
        /// Object to use for default data binding. Each element (or sub tree) may contain
        /// a data-win-bindsource attribute which will override the dataContext.
        /// </param>
        /// <param name="rootElement" type="DOMElement" optional="true" locid="45">
        /// Element to start traversing for elements to bind to. If omited, the entire document
        /// is searched.
        /// </param>
        /// <param name="skipRoot" type="Boolean" optional="true" locid="46">
        /// Determines if rootElement should be bound, or only it's children
        /// </param>
        /// <param name="bindingCache" locid="47">
        /// Cached binding data
        /// </param>
        /// <returns locid="48">
        /// Promise which will complete when each item that contains binding declarations has
        /// been processed and the update has started.
        /// </returns>

        return new WinJS.Promise(function(c,e,p) { 
            declarativeBindImpl(rootElement, dataContext, skipRoot, bindingCache, c, e, p); 
        });
    }


    function converter(convert) {
        /// <summary locid="49">
        /// Creates a default binding action for a binding between a source
        /// property and a destination property with a provided converter function
        /// which is executed on the value of the source property.
        /// </summary>
        /// <param name="convert" type="Function" locid="50">
        /// Conversion which operates over the result of the source property
        /// to produce a value which is set to the destination property
        /// </param>
        /// <returns type="Function" locid="51">
        /// Binding action
        /// </returns>
        return function(source, sourceProperties, dest, destProperties) {
            return bindWorker(source, sourceProperties, function(v) { 
                nestedSet(dest, destProperties, convert(v));
            });
        };
    }
    
    function getValue(obj, path) {
        if (path) {
            for (var i = 0, len = path.length; i < len; i++) {
                obj = obj[path[i]];
            }
        }
        return obj;
    }

    function nestedSet(dest, destProperties, v) {
        for (var i = 0, len = (destProperties.length - 1); i < len; i++) {
            dest = dest[destProperties[i]];
        }
        dest[destProperties[destProperties.length - 1]] = v;
    }

    function defaultBind(source, sourceProperties, dest, destProperties) {
        /// <summary locid="52">
        /// Creates a one-way binding between the source property and
        /// the destination property
        /// </summary>
        /// <param name="source" type="Object" locid="53">
        /// Source object
        /// </param>
        /// <param name="sourceProperties" type="Array" locid="54">
        /// Path on source object to source property
        /// </param>
        /// <param name="dest" type="Object" locid="55">
        /// Destination object
        /// </param>
        /// <param name="destProperties" type="Array" locid="56">
        /// Path on destination object to destination property
        /// </param>
        /// <returns locid="57">
        /// Object with a cancel method which is used by binding for coalescing bindings
        /// </returns>
        return bindWorker(source, sourceProperties, 
            function(v) { 
                nestedSet(dest, destProperties, v);
            });
    }
    function bindWorker(bindable, sourceProperties, func) {
        if (sourceProperties.length > 1) {
            // @TODO, Better names maybe?
            //
            var s = sourceProperties;
            var r = {};
            var c = r;
            for (var i=0,l=s.length-1; i<l; i++) {
                c = c[s[i]] = {};
            }
            c[s[s.length-1]] = func;

            return WinJS.Binding.bind(bindable, r);
        }
        else {
            bindable.bind(sourceProperties[0], func);
            return { 
                cancel: function() { 
                    bindable.unbind(sourceProperties[0], func); 
                    this.cancel = noop; 
                } 
            };
        }        
    }
    function noop() { }
    function oneTime(source, sourceProperties, dest, destProperties) {
        /// <summary locid="58">
        /// Sets the destination property to the value of the source property
        /// </summary>
        /// <param name="source" type="Object" locid="53">
        /// Source object
        /// </param>
        /// <param name="sourceProperties" type="Array" locid="54">
        /// Path on source object to source property
        /// </param>
        /// <param name="dest" type="Object" locid="55">
        /// Destination object
        /// </param>
        /// <param name="destProperties" type="Array" locid="56">
        /// Path on destination object to destination property
        /// </param>
        /// <returns locid="57">
        /// Object with a cancel method which is used by binding for coalescing bindings
        /// </returns>
        for (var i = 0, len = (destProperties.length - 1); i < len; i++) {
            dest = dest[destProperties[i]];
        }
        dest[destProperties[destProperties.length - 1]] = getValue(source, sourceProperties);
        return { cancel: noop };
    }

    WinJS.Namespace.defineWithParent(WinJS, "Binding", {
        processAll: declarativeBind,
        oneTime: oneTime,
        defaultBind: defaultBind,
        converter: converter
    });
})(WinJS);



(function (global, undefined) {
    var U = WinJS.Utilities;
    
    // Defaults 
    var SWEEP_PERIOD = 500;
    var TIMEOUT = 1000;
    var table = {};
    var cleanupToken;

    function cleanup() {
        if (U._DOMWeakRefTable_sweepPeriod === 0) {     // If we're using post
            cleanupToken = 0;                           // indicate that cleanup has run
        }
        var keys = Object.keys(table);
        var time = Date.now() - U._DOMWeakRefTable_timeout;
        var i, len;
        for (i = 0, len = keys.length; i < len; i++) {
            var id = keys[i];
            if (table[id].time < time) {
                delete table[id];
            }
        }
        unscheduleCleanupIfNeeded();
    };
    function scheduleCleanupIfNeeded() {
        if ((global.Debug && U._DOMWeakRefTable_noTimeoutUnderDebugger) || cleanupToken) {
            return;
        }
        var period = U._DOMWeakRefTable_sweepPeriod;
        if (period === 0) {
            msQueueCallback(cleanup);
            cleanupToken = 1;
        } else {
            cleanupToken = setInterval(cleanup, U._DOMWeakRefTable_sweepPeriod);
        }
    };
    function unscheduleCleanupIfNeeded() {
        if (global.Debug && U._DOMWeakRefTable_noTimeoutUnderDebugger) {
            return;
        }
        var period = U._DOMWeakRefTable_sweepPeriod;
        if (period === 0) {                             // if we're using post
            if (!cleanupToken) {                        // and there isn't already one scheduled
                if (Object.keys(table).length !== 0) {  // and there are items in the table
                    msQueueCallback(cleanup);           // schedule another call to cleanup
                    cleanupToken = 1;                   // and protect against overscheduling
                }
            }
        } else if (cleanupToken) {
            if (Object.keys(table).length === 0) {
                clearInterval(cleanupToken);
                cleanupToken = 0;
            }
        }
    };
    
    function createWeakRef(element, id) {
        table[id] = { element: element, time: Date.now() };
        scheduleCleanupIfNeeded();
        return id;
    }
    function getWeakRefElement(id) {
        var element = document.getElementById(id);
        if (element) {
            delete table[id];
            unscheduleCleanupIfNeeded();
        } else {
            var entry = table[id];
            if (entry) {
                entry.time = Date.now();
                element = entry.element;
            }
        }
        return element;
    }

    WinJS.Namespace.defineWithParent(WinJS, "Utilities", {
        _DOMWeakRefTable_noTimeoutUnderDebugger: true,
        _DOMWeakRefTable_sweepPeriod: SWEEP_PERIOD,
        _DOMWeakRefTable_timeout: TIMEOUT,
        _DOMWeakRefTable_tableSize: { get: function () { return Object.keys(table).length; } },

        _createWeakRef: createWeakRef,
        _getWeakRefElement: getWeakRefElement
    });

}(this));

