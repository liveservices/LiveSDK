/// <loc filename="metadata\ui_loc_oam.xml" format="messagebundle" />
/// <reference path='base.js' />
 
/*
  © Microsoft. All rights reserved.

  This library is supported for use in Windows Tailored Apps only.

  Build: 6.2.8100.0 
  Version: 0.5 
*/
 


(function (WinJS, undefined) {

    var DOMEventMixin = {
        _domElement: null,
        
        addEventListener: function (type, listener, useCapture) {
            /// <summary locid="1">
            /// Adds an event listener to the control.
            /// </summary>
            /// <param name="type" locid="2">
            /// The type (name) of the event.
            /// </param>
            /// <param name="listener" locid="3">
            /// The listener to invoke when the event gets raised.
            /// </param>
            /// <param name="useCapture" locid="4">
            /// Specifies whether or not to initiate capture.
            /// </param>
            this._domElement.addEventListener(type, listener, useCapture || false);
        },
        dispatchEvent: function (type, eventProperties) {
            /// <summary locid="5">
            /// Raises an event of the specified type and with additional properties.
            /// </summary>
            /// <param name="type" locid="2">
            /// The type (name) of the event.
            /// </param>
            /// <param name="eventProperties" locid="6">
            /// The set of additional properties to be attached to the event object when the event is raised.
            /// </param>
            /// <returns locid="7">
            /// Boolean indicating whether preventDefault was called on the event.
            /// </returns>
            var eventValue = document.createEvent("Event");
            eventValue.initEvent(type, false, false);
            eventValue.detail = eventProperties;
            // @TODO, remove this when we remove WinJS.UI.Control, it is a breaking change.
            //
            if (typeof eventProperties === "object") {
                Object.keys(eventProperties).forEach(function (key) {
                    eventValue[key] = eventProperties[key];
                });
            }
            this._domElement.dispatchEvent(eventValue);
        },
        removeEventListener: function (type, listener, useCapture) {
            /// <summary locid="8">
            /// Removes an event listener from the control.
            /// </summary>
            /// <param name="type" locid="2">
            /// The type (name) of the event.
            /// </param>
            /// <param name="listener" locid="9">
            /// The listener to remove from the invoke list.
            /// </param>
            /// <param name="useCapture" locid="4">
            /// Specifies whether or not to initiate capture.
            /// </param>
            this._domElement.removeEventListener(type, listener, useCapture || false);
        }
    };

    function setOptions(control, options) {
        /// <summary locid="10">
        /// Applies the set of declaratively specified options (properties and events) on the specified control.
        /// If the options property name begins with "on", the property value is a function and the control
        /// supports addEventListener setControl will call addEventListener on the control.
        /// </summary>
        /// <param name="control" domElement="false" locid="11">
        /// The control on which the properties and events are to be applied.
        /// </param>
        /// <param name="options" domElement="false" locid="12">
        /// The set of options that were specified declaratively.
        /// </param>
        if (typeof options === "object") {
            var keys = Object.keys(options);
            for (var i = 0, len = keys.length; i < len; i++) {
                var key = keys[i];
                var value = options[key];
                if (key.length > 2) {
                    var ch1 = key[0];
                    var ch2 = key[1];
                    if ((ch1 === 'o' || ch1 === 'O') && (ch2 === 'n' || ch2 === 'N')) {
                        if (typeof value === "function") {
                            if (control.addEventListener) {
                                control.addEventListener(key.substr(2), value);
                                continue;
                            }
                        }
                    }
                }
                control[key] = value;
            }
        }
    };

    WinJS.Namespace.defineWithParent(WinJS, "UI", {
        DOMEventMixin: DOMEventMixin,
        setOptions: setOptions
    });

})(WinJS);




var InvalidHandler = "Invalid data-win-control attribute";

(function (WinJS, undefined) {

    var processedAllCalled = false;

    function activate(element, handler) {
        return new WinJS.Promise(function (complete, error) {
            try {
                var options;
                var optionsAttribute = element.getAttribute("data-win-options");
                if (optionsAttribute) {
                    options = WinJS.UI._optionsParser(optionsAttribute);
                }

                var ctl;
                var count = 1;
                
                // handler is required to call complete if it takes that parameter
                //
                if (handler.length > 2) {
                    count++;
                }
                function checkComplete() {
                    count--;
                    if (count === 0) {
                        WinJS.UI.setControl(element, ctl);
                        complete(ctl);
                    }
                }
                
                // UNDONE: async exceptions from the handler get dropped on the floor... 
                //
                ctl = new handler(element, options, checkComplete);
                checkComplete();
            }
            catch (err) {
                error(err);
            }
        });
    }

    function processAllImpl(rootElement) {
        return new WinJS.Promise(function (complete, error) {
            msWriteProfilerMark("UI:processAll:S");

            msWriteProfilerMark("UI:processAll:setup:S");
            rootElement = rootElement || document.body;

            var pending = 0;
            var selector = "[data-win-control]";
            var allElements = rootElement.querySelectorAll(selector);
            var elements = [];
            if (getControlHandler(rootElement)) {
                elements.push(rootElement);
            }
            for (var i = 0, len = allElements.length; i < len; i++) {
                elements.push(allElements[i]);
            }

            // bail early if there is nothing to process
            //
            if (elements.length === 0) { complete(); return; }
            
            
            
            function checkAllComplete() { 
                pending = pending - 1;
                if (pending < 0) { 
                    complete(); 
                } 
            }

            msWriteProfilerMark("UI:processAll:setup:E");
            // First go through and determine which elements to activate
            //
            msWriteProfilerMark("UI:processAll:findControls:S");
            var controls = new Array(elements.length);
            for (var i = 0, len = elements.length; i < len; i++) {
                var element = elements[i];
                var control;
                var instance = WinJS.UI.getControl(element);
                if (instance) {
                    control = instance.constructor;
                    // already activated, don't need to add to controls array
                }
                else {
                    controls[i] = control = getControlHandler(element);
                }
                if (control && control.isDeclarativeControlContainer) {
                    i += element.querySelectorAll(selector).length;
                }
            }
            msWriteProfilerMark("UI:processAll:findControls:E");

            // Now go through and activate those
            //
            msWriteProfilerMark("UI:processAll:activateControls:S");
            for (var i = 0, len = elements.length; i < len; i++) {
                var ctl = controls[i];
                if (ctl) {
                    pending++;
                    activate(elements[i], ctl).then(checkAllComplete, function (err) { error(err); });
                }
            }
            msWriteProfilerMark("UI:processAll:activateControls:E");

            if (checkAllComplete) {
                checkAllComplete();
            }
            msWriteProfilerMark("UI:processAll:E");
        });
    }

    function getControlHandler(element) {
        if (element.getAttribute) {
            var evaluator = element.getAttribute("data-win-control");
            if (evaluator) {
                return WinJS.Utilities.getMember(evaluator.trim());
            }
        }
    }

    WinJS.Namespace.defineWithParent(WinJS, "UI", {

        getControl: function (element) {
            /// <summary locid="13">
            /// Given a DOM element, retrieves the associated Control.
            /// </summary>
            /// <param name="element" domElement="true" locid="14">
            /// Element whose associated Control is requested.
            /// </param>
            /// <returns locid="15">
            /// The control associated with the dom element.
            /// </returns>
            
            return element.winControl || element["data-win-control"];
        },

        processAll: function (rootElement) {
            /// <summary locid="16">
            /// Applies declarative control binding to all elements, starting optionally at rootElement.
            /// </summary>
            /// <param name="rootElement" domElement="true" locid="17">
            /// Element to start searching at, if not specified, the entire document is searched.
            /// </param>
            /// <returns locid="18">
            /// Promise which is fulfilled when all the controls have been ativated
            /// </returns>

            if (!processedAllCalled) {
                return WinJS.Utilities.ready().then(function () { 
                    processedAllCalled = true;
                    return processAllImpl(rootElement); 
                });
            }
            else {
                return processAllImpl(rootElement); 
            }
        },

        process: function (element) {
            /// <summary locid="19">
            /// Applies declarative control binding to the specified element.
            /// </summary>
            /// <param name="element" domElement="true" locid="20">
            /// Element to bind.
            /// </param>
            /// <returns locid="21">
            /// The control which was activated
            /// </returns>

            var handler = getControlHandler(element);
            if (!handler) {
                return WinJS.Promise.as(); // undefined, no handler
            }
            else {
                return activate(element, handler);
            }
        },

        setControl: function (element, control) {
            /// <summary locid="22">
            /// Given a DOM element and a control attaches the control to the element
            /// </summary>
            /// <param name="element" domElement="true" locid="23">
            /// Element to have control associated with.
            /// </param>
            /// <param name="control" locid="24">
            /// Control to attach to element.
            /// </param>
            element.winControl = control;
            element["data-win-control"] = control;
        }
    });
})(WinJS);



(function (WinJS, undefined) {

    
    var QueryCollection = WinJS.Class.derive(Array, function(items) {
            /// <summary locid="25">
            /// QueryCollection is the result of a query selector and provides
            /// various operations which perform actions over the elements of
            /// the collection.
            /// </summary>
            /// <param name="items" locid="26">
            /// Items to store in the collection.
            /// </param>
            if(items) {
                this.include(items);
            }
        }, {
            get: function(index) {
                /// <summary locid="27">
                /// Retrieve an item from the QueryCollection
                /// </summary>
                /// <param name="index" type="Number" locid="28">
                /// Index of the item to be returned
                /// </param>
                /// <returns locid="29">
                /// A single item from the collection
                /// </returns>
                return this[index];
            },
            setAttribute: function(name, value) {
                /// <summary locid="30">
                /// Set an attribute value on all the items in the collection.
                /// </summary>
                /// <param name="name" type="String" locid="31">
                /// Name of the attribute to be set
                /// </param>
                /// <param name="value" type="String" locid="32">
                /// Value of the attribute to be set
                /// </param>
                /// <returns locid="33">
                /// The QueryCollection instance to facilitate chaining
                /// </returns>
                this.forEach(function(item) {
                  item.setAttribute(name, value);
                });
                return this;
            },
            getAttribute: function(name) {
                /// <summary locid="34">
                /// Gets an attribute value from the first element in the collection
                /// </summary>
                /// <param name="name" type="String" locid="31">
                /// Name of the attribute to be set
                /// </param>
                /// <returns type="String" locid="35">
                /// The value of the specified attribute
                /// </returns>
                if(this.length > 0) {
                  return this[0].getAttribute(name);
                }
            },
            addClass: function(name) {
                /// <summary locid="36">
                /// Adds the specified class to all the elements in the collection
                /// </summary>
                /// <param name="name" type="String" locid="37">
                /// Name of the class to be added
                /// </param>
                /// <returns locid="33">
                /// The QueryCollection instance to facilitate chaining
                /// </returns>
                this.forEach(function(item) {
                  WinJS.Utilities.addClass(item, name);
                });
                return this;
            },
            hasClass: function(name) {
                /// <summary locid="38">
                /// Tests whether the specified class exists on the first element of the collection
                /// </summary>
                /// <param name="name" type="String" locid="39">
                /// Name of the desired class
                /// </param>
                /// <returns type="Boolean" locid="40">
                /// Whether or not the element has the specified class
                /// </returns>
                if(this.length > 0) {
                  return WinJS.Utilities.hasClass(this[0], name);
                }
                return false;
            },
            removeClass: function(name) {
                /// <summary locid="41">
                /// Removes the specified class to all the elements in the collection
                /// </summary>
                /// <param name="name" type="String" locid="42">
                /// Name of the class to be removed
                /// </param>
                /// <returns locid="33">
                /// The QueryCollection instance to facilitate chaining
                /// </returns>
                this.forEach(function(item) {
                  WinJS.Utilities.removeClass(item, name);
                });
                return this;
            },
            toggleClass: function(name) {
                /// <summary locid="43">
                /// Toggles the specified class on all the elements in the collection
                /// </summary>
                /// <param name="name" type="String" locid="44">
                /// Name of the class to be toggled
                /// </param>
                /// <returns locid="33">
                /// The QueryCollection instance to facilitate chaining
                /// </returns>
                this.forEach(function(item) {
                  WinJS.Utilities.toggleClass(item, name);
                });
                return this;
            },
            listen: function(eventType, listener, capture) {
                /// <summary locid="45">
                /// Registers the listener for the specified event on all the elements in the collection
                /// </summary>
                /// <param name="eventType" type="String" locid="46">
                /// Name of the event to be listened to
                /// </param>
                /// <param name="listener" type="Function" locid="47">
                /// Event handler function to be called when event is triggered
                /// </param>
                /// <param name="capture" type="Boolean" locid="48">
                /// Capture value to be passed to addEventListener
                /// </param>
                /// <returns locid="33">
                /// The QueryCollection instance to facilitate chaining
                /// </returns>
                this.forEach(function(item) {
                  item.addEventListener(eventType, listener, capture);
                });
                return this;
            },
            removeEventListener: function(eventType, listener, capture) {
                /// <summary locid="49">
                /// Unregisters the listener for the specified event on all the elements in the collection
                /// </summary>
                /// <param name="eventType" type="String" locid="50">
                /// Name of the event being listened to
                /// </param>
                /// <param name="listener" type="Function" locid="47">
                /// Event handler function to be called when event is triggered
                /// </param>
                /// <param name="capture" type="Boolean" locid="51">
                /// Capture value to be passed to removeEventListener
                /// </param>
                /// <returns locid="33">
                /// The QueryCollection instance to facilitate chaining
                /// </returns>
                this.forEach(function(item) {
                  item.removeEventListener(eventType, listener, capture);
                });
                return this;
            },
            setStyle: function(name, value) {
                /// <summary locid="52">
                /// Sets the specified style property for all the elements in the collection
                /// </summary>
                /// <param name="name" type="String" locid="53">
                /// Name of the property on the style object associated each element
                /// </param>
                /// <param name="value" type="String" locid="54">
                /// Value to be set to the specified property on the style object
                /// associated with each element
                /// </param>
                /// <returns locid="33">
                /// The QueryCollection instance to facilitate chaining
                /// </returns>
                this.forEach(function(item) {
                  item.style[name] = value;
                });
                return this;
            },
            clearStyle: function(name) {
                /// <summary locid="55">
                /// Clears the specified style property for all the elements in the collection.
                /// </summary>
                /// <param name="name" type="String" locid="56">
                /// Name of the property on the style object associated each element to be cleared
                /// </param>
                /// <returns locid="33">
                /// The QueryCollection instance to facilitate chaining
                /// </returns>
                this.forEach(function(item) {
                  item.style[name] = "";
                });
                return this;
            },
            query: function(query) {
                /// <summary locid="57">
                /// Executes a query selector against all the elements in the collection
                /// and aggregates the result.
                /// </summary>
                /// <param name="query" type="String" locid="58">
                /// Query selector string
                /// </param>
                /// <returns locid="59">
                /// QueryCollection instance containing the aggregate results of
                /// executing the query against all the elements in the collection
                /// </returns>
                 var newCollection = new WinJS.Utilities.QueryCollection();
                 this.forEach(function(item) {
                    newCollection.include(item.querySelectorAll(query)); 
                 });
                 return newCollection;
             },
             include: function(items) {
                /// <summary locid="60">
                /// Includes a set of items in this QueryCollection
                /// </summary>
                /// <param name="items" locid="61">
                /// The items to be included in the QueryCollection, may be an
                /// Array-like object, a document fragment or a single item.
                /// </param>
                if (typeof items.length === "number") {
                    for (var i = 0; i < items.length; i++) {
                        this.push(items[i]);
                    }
                } else if (items.DOCUMENT_FRAGMENT_NODE && items.nodeType === items.DOCUMENT_FRAGMENT_NODE) {
                    this.include(items.childNodes);
                } else {
                    this.push(items);
                }
             }
        });
   
    WinJS.Namespace.defineWithParent(WinJS, "Utilities", {
        QueryCollection: QueryCollection,
        query: function (query, element) {
            /// <summary locid="62">
            /// Execute a query selector against the specified element or the document
            /// </summary>
            /// <param name="query" type="String" locid="63">
            /// Query selector to be executed
            /// </param>
            /// <param name="element" optional="true" type="HTMLElement" locid="64">
            /// Element against which to execute the query. If not specified the
            /// query is executed against the document.
            /// </param>
            /// <returns locid="65">
            /// The QueryCollection instance containing the results of the query
            /// </returns>
            return new WinJS.Utilities.QueryCollection((element || document).querySelectorAll(query));
        },
        id: function (id) {
            /// <summary locid="66">
            /// Look up an element by id and wrap the result in a QueryCollection
            /// </summary>
            /// <param name="id" type="String" locid="67">
            /// Id of the element
            /// </param>
            /// <returns locid="68">
            /// QueryCollection instance containing the element if it was found
            /// </returns>
            var e = document.getElementById(id);
            return new WinJS.Utilities.QueryCollection(e ? [e] : []);
        },
        children: function (element) {
            /// <summary locid="69">
            /// Create a QueryCollection instance out of the specified element's children.
            /// </summary>
            /// <param name="element" type="HTMLElement" locid="70">
            /// Element whose children are wrapped in a QueryCollection
            /// </param>
            /// <returns locid="71">
            /// The QueryCollection instance
            /// </returns>
            return new WinJS.Utilities.QueryCollection(element.children);
        }
    });
})(WinJS);



(function (WinJS, undefined) {
    
    function getClassName(e) {
        var name = e.className || "";
        if (typeof(name) == "string") {
            return name;
        }
        else {
            return name.baseVal || "";
        }
    };
    function setClassName(e, value) {
        // SVG elements (which use e.className.baseVal) are never undefined, 
        // so this logic makes the comparison a bit more compact.
        //
        var name = e.className || "";
        if (typeof(name) == "string") {
            e.className = value;
        }
        else {
            e.className.baseVal = value;
        }
        return e;
    };
    function getDimension(element, property) {
        return WinJS.Utilities.convertToPixels(element, window.getComputedStyle(element, null)[property]);
    }

    WinJS.Namespace.defineWithParent(WinJS, "Utilities", {
        _dataKey: "_msDataKey",
        _pixelsRE: /^-?\d+(px)?$/i,
        _numberRE: /^-?\d+/i,

        Key: {
            backspace:        8,
            tab:              9,
            enter:           13,
            shift:           16,
            ctrl:            17,
            alt:             18,
            pause:           19,
            capsLock:        20,
            escape:          27,
            space:           32,
            pageUp:          33,
            pageDown:        34,
            end:             35,
            home:            36,
            leftArrow:       37,
            upArrow:         38,
            rightArrow:      39,
            downArrow:       40,
            insert:          45,
            deleteKey:       46,
            num0:            48,
            num1:            49,
            num2:            50,
            num3:            51,
            num4:            52,
            num5:            53,
            num6:            54,
            num7:            55,
            num8:            56,
            num9:            57,
            a:               65,
            b:               66,
            c:               67,
            d:               68,
            e:               69,
            f:               70,
            g:               71,
            h:               72,
            i:               73,
            j:               74,
            k:               75,
            l:               76,
            m:               77,
            n:               78,
            o:               79,
            p:               80,
            q:               81,
            r:               82,
            s:               83,
            t:               84,
            u:               85,
            v:               86,
            w:               87,
            x:               88,
            y:               89,
            z:               90,
            leftWindows:     91,
            rightWindows:    92,
            numPad0:         96,
            numPad1:         97,
            numPad2:         98,
            numPad3:         99,
            numPad4:        100,
            numPad5:        101,
            numPad6:        102,
            numPad7:        103,
            numPad8:        104,
            numPad9:        105,
            multiply:       106,
            add:            107,
            subtract:       109,
            decimalPoint:   110,
            divide:         111,
            F1:             112,
            F2:             113,
            F3:             114,
            F4:             115,
            F5:             116,
            F6:             117,
            F7:             118,
            F8:             119,
            F9:             120,
            F10:            121,
            F11:            122,
            F12:            123,
            numLock:        144,
            scrollLock:     145,
            semicolon:      186,
            equal:          187,
            comma:          188,
            dash:           189,
            period:         190,
            forwardSlash:   191,
            graveAccent:    192,
            openBracket:    219,
            backSlash:      220,
            closeBracket:   221,
            singleQuote:    222
        },

        data: function (element) {
            /// <summary locid="72">
            /// Get the data value associated with the specified element
            /// </summary>
            /// <param name="element" type="HTMLElement" locid="73">
            /// Element to which the data is associated.
            /// </param>
            /// <returns locid="74">
            /// Value assoicated with the element
            /// </returns>
            if (!element[WinJS.Utilities._dataKey]) {
                element[WinJS.Utilities._dataKey] = {};
            }
            return element[WinJS.Utilities._dataKey];
        },

        hasClass: function (e, name) {
            /// <summary locid="75">
            /// Test whether the given element has the specified class
            /// </summary>
            /// <param name="e" type="HTMLElement" locid="76">
            /// Element to test for the presence of the named class
            /// </param>
            /// <param name="name" type="String" locid="77">
            /// Name of the class to test for
            /// </param>
            /// <returns type="Boolean" locid="78">
            /// Whether or not the specified element is annotated with the specified class.
            /// </returns>
            var className = getClassName(e);
            var names = className.trim().split(" ");
            var l = names.length;
            for (var i = 0; i < l; i++) {
                if (names[i] == name) {
                    return true;
                }
            }
            return false;
        },

        addClass: function (e, name) {
            /// <summary locid="79">
            /// Add the specified class to the element
            /// </summary>
            /// <param name="e" type="HTMLElement" locid="80">
            /// Element to which to add the class
            /// </param>
            /// <param name="name" type="String" locid="81">
            /// Name of the class to add
            /// </param>
            /// <returns type="HTMLElement" locid="82">
            /// The input element
            /// </returns>
            var className = getClassName(e);
            var names = className.trim().split(" ");
            var l = names.length;
            var found = false;
            for (var i = 0; i < l; i++) {
                if (names[i] == name) {
                    found = true;
                }
            }
            if (!found) {
                if (l > 0 && names[0].length > 0) {
                    setClassName(e, className + " " + name);
                }
                else {
                    setClassName(e, className + name);
                }
            }
            return e;
        },

        removeClass: function (e, name) {
            /// <summary locid="83">
            /// Remove the specified class from the given element
            /// </summary>
            /// <param name="e" type="HTMLElement" locid="84">
            /// Element from which to remove the class
            /// </param>
            /// <param name="name" type="String" locid="85">
            /// Name of the class to remove
            /// </param>
            /// <returns type="HTMLElement" locid="82">
            /// The input element
            /// </returns>
            var names = getClassName(e).trim().split(" ");
            setClassName(e, names.reduce(function (r, e) {
                if (e == name) {
                    return r;
                }
                else if (r && r.length > 0) {
                    return r + " " + e;
                }
                else {
                    return e;
                }
            }, ""));
            return e;
        },

        toggleClass: function (e, name) {
            /// <summary locid="86">
            /// Toggle the specified class on the given element
            /// </summary>
            /// <param name="e" type="HTMLElement" locid="87">
            /// Element on which to toggle the class
            /// </param>
            /// <param name="name" type="String" locid="88">
            /// Name of the class to toggle
            /// </param>
            /// <returns type="HTMLElement" locid="82">
            /// The input element
            /// </returns>
            var className = getClassName(e);
            var names = className.trim().split(" ");
            var l = names.length;
            var found = false;
            for (var i = 0; i < l; i++) {
                if (names[i] == name) {
                    found = true;
                }
            }
            if (!found) {
                if (l > 0 && names[0].length > 0) {
                    setClassName(e, className + " " + name);
                }
                else {
                    setClassName(e, className + name);
                }
            }
            else {
                setClassName(e, names.reduce(function (r, e) {
                    if (e == name) {
                        return r;
                    }
                    else if (r && r.length > 0) {
                        return r + " " + e;
                    }
                    else {
                        return e;
                    }
                }, ""));
            }
            return e;
        },

        getRelativeLeft: function (element, parent) {
            /// <summary locid="89">
            /// Gets the left coordinate of the element relative to the specified parent.
            /// </summary>
            /// <param name="element" domElement="true" locid="90">
            /// Element whose relative coordinate is needed.
            /// </param>
            /// <param name="parent" domElement="true" locid="91">
            /// Element to which the coordinate will be relative to.
            /// </param>
            /// <returns locid="92">
            /// Relative left co-ordinate.
            /// </returns>
            if (element === null)
                return 0;

            var left = element.offsetLeft;
            var e = element.parentNode;
            while (e !== null) {
                left -= e.offsetLeft;

                if (e === parent)
                    break;
                e = e.parentNode;
            }

            return left;
        },

        getRelativeTop: function (element, parent) {
            /// <summary locid="93">
            /// Gets the top coordinate of the element relative to the specified parent.
            /// </summary>
            /// <param name="element" domElement="true" locid="90">
            /// Element whose relative coordinate is needed.
            /// </param>
            /// <param name="parent" domElement="true" locid="91">
            /// Element to which the coordinate will be relative to.
            /// </param>
            /// <returns locid="94">
            /// Relative top co-ordinate.
            /// </returns>
            if (element === null)
                return 0;

            var top = element.offsetTop;
            var e = element.parentNode;
            while (e !== null) {
                top -= e.offsetTop;

                if (e === parent)
                    break;
                e = e.parentNode;
            }

            return top;
        },

        empty: function (element) {
            /// <summary locid="95">
            /// Removes all the child nodes from the specified element.
            /// </summary>
            /// <param name="element" type="HTMLElement" domElement="true" locid="96">
            /// The element whose child nodes will be removed.
            /// </param>
            /// <returns type="HTMLElement" locid="82">
            /// The input element
            /// </returns>
            for (var i = element.childNodes.length - 1; i >= 0; i--) {
                element.removeChild(element.childNodes.item(i));
            }
            return element;
        },

        _isDOMElement: function (element) {
            return element &&
                typeof element === "object" &&
                typeof element.tagName === "string";
        },

        getContentWidth: function (element) {
            /// <summary locid="97">
            /// Get the width of the content of the element which does not include border and padding
            /// </summary>
            /// <param name="element" type="HTMLElement" locid="98">
            /// Element to compute the width of
            /// </param>
            /// <returns type="Number" locid="99">
            /// Width of the element's content
            /// </returns>
            var border = getDimension(element, "borderLeftWidth") + getDimension(element, "borderRightWidth"),
                padding = getDimension(element, "paddingLeft") + getDimension(element, "paddingRight");
            return element.offsetWidth - border - padding;
        },

        getTotalWidth: function (element) {
            /// <summary locid="100">
            /// Get the width of the element including margins
            /// </summary>
            /// <param name="element" type="HTMLElement" locid="98">
            /// Element to compute the width of
            /// </param>
            /// <returns type="Number" locid="101">
            /// Width of element including margins
            /// </returns>
            var margin = getDimension(element, "marginLeft") + getDimension(element, "marginRight");
            return element.offsetWidth + margin;
        },

        getContentHeight: function (element) {
            /// <summary locid="102">
            /// Get the height of the content of the element which does not include border and padding
            /// </summary>
            /// <param name="element" type="HTMLElement" locid="103">
            /// Element to compute the height of
            /// </param>
            /// <returns type="Integer" locid="104">
            /// Height of the element's content
            /// </returns>
            var border = getDimension(element, "borderTopWidth") + getDimension(element, "borderBottomWidth"),
                padding = getDimension(element, "paddingTop") + getDimension(element, "paddingBottom");
            return element.offsetHeight - border - padding;
        },

        getTotalHeight: function (element) {
            /// <summary locid="105">
            /// Get the height of the element including its margins
            /// </summary>
            /// <param name="element" type="HTMLElement" locid="103">
            /// Element to compute the height of
            /// </param>
            /// <returns type="Number" locid="106">
            /// Height of element including margins
            /// </returns>
            var margin = getDimension(element, "marginTop") + getDimension(element, "marginBottom");
            return element.offsetHeight + margin;
        },

        getPosition: function (element) {
            /// <summary locid="107">
            /// Get the position of the specified element
            /// </summary>
            /// <param name="element" type="HTMLElement" locid="108">
            /// Element for which the position is to be calculated
            /// </param>
            /// <returns type="Object" locid="109">
            /// Object containing left, top, width and height properties for the element.
            /// </returns>
            var fromElement = element,
                offsetParent = element.offsetParent,
                top = element.offsetTop,
                left = element.offsetLeft;

            while ((element = element.parentNode) !== null &&
                    element !== document.body &&
                    element !== document.documentElement) {
                top -= element.scrollTop;
                left -= element.scrollLeft;

                if (element === offsetParent) {
                    top += element.offsetTop;
                    left += element.offsetLeft;

                    offsetParent = element.offsetParent;
                }
            }

            return {
                left: left,
                top: top,
                width: fromElement.offsetWidth,
                height: fromElement.offsetHeight
            };
        },

        convertToPixels: function (element, value) {
            /// <summary locid="110">
            /// Convert a css positioning string to pixels
            /// </summary>
            /// <param name="element" type="HTMLElement" locid="111">
            /// Element to use for conversion
            /// </param>
            /// <param name="value" type="String" locid="112">
            /// Css positioning string to be converted
            /// </param>
            /// <returns type="Number" locid="113">
            /// Input as pixels
            /// </returns>
            if (!this._pixelsRE.test(value) && this._numberRE.test(value)) {
                var previousValue = element.style.left;

                element.style.left = value;
                value = element.style.pixelLeft;

                element.style.left = previousValue;

                return value;
            } else {
                return parseInt(value, 10) || 0;
            }
        },

        generateID: function (idBase) {
            /// <summary locid="114">
            /// Generates a unique id for an element
            /// </summary>
            /// <param name="idBase" type="String" locid="115">
            /// Prefix value
            /// </param>
            /// <returns type="String" locid="116">
            /// Unique id string
            /// </returns>
            var id = idBase + (new Date()).getTime() + "-";
            var rand = Math.random() + "";
            id += rand.substring(2, rand.length);
            return id;
        }

    });
})(WinJS);



(function (WinJS, globalObj, undefined) {
    var loaderStateProp = "-ms-fragmentLoader-state";

    // UNDONE: should we hoist this to a shared location?
    //
    var forEach = function (arrayLikeValue, action) {
        for (var i = 0, l = arrayLikeValue.length; i < l; i++) {
            action(arrayLikeValue[i], i);
        }
    };
    var head = document.head || document.getElementsByTagName("head")[0];
    var nextFragmentId = 1;
    var scripts = {};
    var styles = {};
    var links = {};
    var states = {};
    var initialized = false;

    function idFromHref(href) {
        if (typeof (href) == "string") {
            return href.toLowerCase();
        }
        else {
            var id = WinJS.Utilities.data(href).fragmentId;
            if (!id) { 
                id = nextFragmentId++;
                WinJS.Utilities.data(href).fragmentId = id;
            }
            return id;
        }
    };

    function addScript(scriptTag, fragmentHref, position) {
        // We synthesize a name for inline scripts because today we put the 
        // inline scripts in the same processing pipeline as src scripts. If
        // we seperated inline scripts into their own logic, we could simplify
        // this somewhat.
        //
        var src = scriptTag.src;
        if (!src) {
            src = fragmentHref + "script[" + position + "]";
        }
        src = src.toLowerCase();

        if (!(src in scripts)) {
            scripts[src] = true;
            var n = document.createElement("script");
            if (scriptTag.language) {
                n.setAttribute("language", "javascript");
            }
            if (scriptTag.type == "ms-deferred/javascript") {
                n.setAttribute("type", "text/javascript");
            }
            else {
                n.setAttribute("type", scriptTag.type);
            }
            if (scriptTag.id) {
                n.setAttribute("id", scriptTag.id);
            }
            if (scriptTag.src) {
                n.setAttribute("src", scriptTag.src);
            }
            else {
                n.text = scriptTag.text;
            }
            head.appendChild(n);
        }
    };

    function addStyle(styleTag, fragmentHref, position) {
        var src = (fragmentHref + "script[" + position + "]").toLowerCase();
        if (!(src in styles)) {
            styles[src] = true;
            head.appendChild(styleTag.cloneNode(true));
        }
    };

    function addLink(styleTag) {
        var src = styleTag.href.toLowerCase();
        if (!(src in links)) {
            links[src] = true;
            var n = styleTag.cloneNode(false);
            n.href = styleTag.href;
            head.appendChild(n);
        }
    };

    function controlStaticState(href) {
        /// <summary locid="117">
        /// PRIVATE METHOD: retrieves the static (not per-instance) state for a fragment at the
        /// URL "href". Will complete either synchronously (for an already loaded
        /// fragment) or asynchronously when the fragment is loaded and ready to be used.
        /// </summary>

        // UNDONE: cancellation
        //
        return new WinJS.Promise(function (c,e,p) {
            var fragmentId = idFromHref(href);

            var state = states[fragmentId];

            var intervalId;
            var tryCount = 4;
            var callback = function () {
                if (state.docfrag) {
                    if (state.loadScript) {
                        var load = WinJS.Utilities.getMember(state.loadScript);
                        if (load) {
                            msWriteProfilerMark("Fragment:cSS:makeDocFragNoHref:E");
                            c({load:load,state:states[fragmentId]});
                            if (intervalId) { clearInterval(intervalId); }
                            return true;
                        }
                        else if (!(tryCount--)) {
                            if (WinJS.validation) {
                                e("Unable to find function '" + state.loadScript + "'");
                            }
                            else {
                                c({state:states[fragmentId]});
                            }
                            if (intervalId) { clearInterval(intervalId); }
                        }
                    }
                    else {
                        msWriteProfilerMark("Fragment:cSS:makeDocFragNoHref:E");
                        c({state:states[fragmentId]});
                        if (intervalId) { clearInterval(intervalId); }
                        return true;
                    }
                }
                msWriteProfilerMark("Fragment:cSS:makeDocFragNoHref:E");
                return false;
            };


            // If the state record was found, then we either are ready to 
            // roll immediately (everything is loaded & parsed) or are in
            // process of loading. If possible, we want to directly invoke
            // to avoid any flickering, however if we are still loading
            // the content, we must wait.
            //
            if (state) {
                if (!callback()) {
                    intervalId = setInterval(callback, 20);
                }

                return;
            }
            else {
                states[fragmentId] = state = {};
            }

            if (typeof (href) === "string") {
                msWriteProfilerMark("Fragment:cSS:makeDocFrag:S");

                var temp = document.createElement('iframe');
                document[loaderStateProp] = "loading";
                temp.src = href;
                temp.style.display = 'none';
                
                var domContentLoaded = null;

                var complete = function (load) {
                    // This is to work around a weird bug where removing the 
                    // IFrame from the DOM triggers DOMContentLoaded a second time.
                    temp.contentDocument.removeEventListener("DOMContentLoaded", domContentLoaded, false);
                    temp.parentNode.removeChild(temp);
                    temp = null;
                    delete document[loaderStateProp];
                    msWriteProfilerMark("Fragment:cSS:makeDocFrag:E");

                    c({load:load, state:state});
                };
                
                domContentLoaded = function () {
                    controlStaticStateLoaded(href, temp, state).then(complete);
                };
                

                document.body.appendChild(temp);
                temp.contentDocument.addEventListener("DOMContentLoaded", domContentLoaded, false);                
            }
            else {
                msWriteProfilerMark("Fragment:cSS:makeDocFragNoHref:S");
                state.loadScript = href.getAttribute('data-win-fragmentLoad') || state.loadScript;
                var fragment = document.createDocumentFragment();
                while (href.childNodes.length > 0) {
                    fragment.appendChild(href.childNodes[0]);
                };
                state.docfrag = fragment;
                if (!callback()) {
                    intervalId = setInterval(callback, 20);
                }
            }
        });
    };

    function controlStaticStateLoaded(href, temp, state) {
        /// <summary locid="118">
        /// PRIVATE METHOD: Once the control's static state has been loaded in the temporary iframe,
        /// this method spelunks the iframe's document to retrieve all relevant information. Also,
        /// this performs any needed fixups on the DOM (like adjusting relative URLs).
        /// </summary>

        // UNDONE: cancelation
        //
        return new WinJS.Promise(function (c,e,p) {
            var cd = temp.contentDocument;

            var links = cd.querySelectorAll('link[rel="stylesheet"], link[type="text/css"]');
            state.styles = links;
            forEach(links, addLink);

            // NOTE: no need to cache the style objects, as they are unique per fragment
            //
            forEach(cd.querySelectorAll('style'), function (e,i) { addStyle(e, href, i); });

            var localScripts = cd.getElementsByTagName('script');
            state.scripts = localScripts;

            forEach(localScripts, function (e,i) {
                addScript(e, href, i);
            });

            var load;
            var loadTags = cd.querySelectorAll('[data-win-fragmentLoad]');
            if (loadTags && loadTags.length > 0) {
                for (var i=0, l=loadTags.length; i<l; i++) {
                    if (loadTags[i].nodeName !== "BODY") {
                        load = loadTags[i].getAttribute('data-win-fragmentLoad');
                        break;
                    }
                }
            }
            state.loadScript = load || state.loadScript
            
            // UNDONE: figure out all the elements we should do URI fixups for
            //
            forEach(cd.body.getElementsByTagName('img'), function (e) {
                e.src = e.href;
            });
            forEach(cd.body.getElementsByTagName('a'), function (e) {
                // UNDONE: for # only anchor tags, we don't update the href... good design?
                //
                if (e.href !== "") {
                    var href = e.getAttribute("href");
                    if (href && href[0] != "#") {
                        e.href = e.href;
                    }
                }
            });

            // strip inline scripts from the body, they got copied to the 
            // host document with the rest of the scripts above... 
            //
            var localScripts = cd.body.getElementsByTagName("script");
            while (localScripts.length > 0) {
                localScripts[0].parentNode.removeChild(localScripts[0]);
            }

            var fragment = document.createDocumentFragment();
            var imported = document.importNode(temp.contentDocument.body, true);
            while(imported.childNodes.length > 0) {
                fragment.appendChild(imported.childNodes[0]);
            }
            state.docfrag = fragment;

            // huge ugly kludge
            if (state.loadScript) {
                var intervalId = setInterval(function () {
                    var load =  WinJS.Utilities.getMember(state.loadScript);
                    if (load) {
                        c(load);
                        clearInterval(intervalId);
                    }
                }, 20);
            }
            else {
                c();
            }
        });
    };

    function initialize() {
        /// <summary locid="119">
        /// PRIVATE METHOD: Initializes the fragment loader with the list of scripts and
        /// styles already present in the host document
        /// </summary>
        msWriteProfilerMark("Fragment:initialize:S");
        if (initialized) { return; }

        initialized = true;

        msWriteProfilerMark("Fragment:initialize:getScripts:S");
        var localScripts = head.querySelectorAll("script");
        for (var i = 0, l = localScripts.length; i < l; i++) {
            scripts[localScripts[i].src.toLowerCase()] = true;
        }
        msWriteProfilerMark("Fragment:initialize:getScripts:E");


        msWriteProfilerMark("Fragment:initialize:getStylesheets:S");
        var csss = head.querySelectorAll('link[rel="stylesheet"], link[type="text/css"]');
        for (var i = 0, l = csss.length; i < l; i++) {
            links[csss[i].href.toLowerCase()] = true;
        }
        msWriteProfilerMark("Fragment:initialize:getStylesheets:E");

        msWriteProfilerMark("Fragment:initialize:E");
    };

    function renderFragment(href, options) {
        /// <summary locid="120">
        /// Returns the content of the fragment specified by "href"
        /// The "options" record is optionally passed to the load handler for the fragment.
        /// </summary>
        /// <param name="href" type="String" locid="121">
        /// URI for fragment
        /// </param>
        /// <param name="options" locid="122">
        /// Fragment load options
        /// </param>
        /// <returns locid="123">
        /// Promise which is completed when the fragment has been loaded.
        /// If a target element was not specified the cloned fragment is the
        /// completed value.
        /// </returns>
        return renderFragmentTo(href, options);
    };
    
    function renderFragmentTo(href, options, target) {
        /// <summary locid="124">
        /// Clones the contents of href into target.
        /// The "options" record is optionally passed to the load handler for the fragment.
        /// </summary>
        /// <param name="href" type="String" locid="121">
        /// URI for fragment
        /// </param>
        /// <param name="options" locid="122">
        /// Fragment load options
        /// </param>
        /// <param name="target" type="HTMLElement" optional="true" locid="125">
        /// Element which the fragment will be appended to
        /// </param>
        /// <returns locid="123">
        /// Promise which is completed when the fragment has been loaded.
        /// If a target element was not specified the cloned fragment is the
        /// completed value.
        /// </returns>

        // UNDONE: support cancellation, route errors
        //
        msWriteProfilerMark("Fragment:clone:S");
        initialize();

        return controlStaticState(href).then(function (v) {
            var load = v.load;
            var state = v.state;

            msWriteProfilerMark("Fragment:clone:cloneChildren:S");
            var clonedFrag = state.docfrag.cloneNode(true);
            msWriteProfilerMark("Fragment:clone:cloneChildren:E");
            
            if (load) {
                load(clonedFrag, options);
            }

            if (target) {
                target.appendChild(clonedFrag);
                msWriteProfilerMark("Fragment:clone:E");
            }
            else {
                msWriteProfilerMark("Fragment:clone:E");
                return clonedFrag;
            }
        });
    };

    function prepareFragment(href) {
        /// <summary locid="126">
        /// Starts loading the fragment at the specified location, returned promise will complete
        /// when the fragment is ready to be cloned.
        /// </summary>
        /// <param name="href" type="String" locid="121">
        /// URI for fragment
        /// </param>
        /// <returns locid="127">
        /// Promise which is completed when the fragment has been prepared
        /// </returns>
        initialize();
        return controlStaticState(href).then(function() { return; });
    };

    function unprepareFragment(href) {
        /// <summary locid="128">
        /// Removes any cached information about the fragment, this will not unload scripts
        /// or styles referenced by the fragment.
        /// </summary>
        /// <param name="href" type="String" locid="121">
        /// URI for fragment
        /// </param>
        delete states[idFromHref(href)];
    };

    function selfhost(load) {
        /// <summary locid="129">
        /// This is used in the fragment definition markup to allow a fragment to
        /// be loaded as a stand alone page.
        /// </summary>
        /// <param name="load" type="Function" locid="130">
        /// Function to be called when the fragment has loaded
        /// </param>
        if (globalObj.parent) {
            if (globalObj.parent.document[loaderStateProp] != "loading") {
                forEach(globalObj.document.querySelectorAll('head > script[type="ms-deferred/javascript"]'),
                    function (e) {
                        addScript(e);
                    });

                globalObj.addEventListener("DOMContentLoaded", function (event) {
                    load(globalObj.document.body);
                }, false);
            }
        }
    };

    WinJS.Namespace.defineWithParent(WinJS, "UI.Fragments", {
        clone: renderFragment,
        cloneTo: renderFragmentTo,
        load: prepareFragment,
        unload: unprepareFragment,
        fragmentAsDocumentReady: selfhost
    });
})(WinJS, this);



/*

    Lexical grammar is defined in ECMA-262-5, section 7.

    Lexical productions used in this grammar defined in ECMA-262-5:

        Production          Section
        --------------------------------
        Identifier          7.6
        NullLiteral         7.8.1
        BooleanLiteral      7.8.2
        NumberLiteral       7.8.3
        StringLiteral       7.8.4

*/

(function (global, undefined) {

    var tokenType = {
        leftBrace: 1,           // {
        rightBrace: 2,          // }
        leftBracket: 3,         // [
        rightBracket: 4,        // ]
        separator: 5,           // ECMA-262-5, 7.2
        colon: 6,               // :
        semicolon: 7,           // ;
        comma: 8,               // ,
        dot: 9,                 // .
        nullLiteral: 10,        // ECMA-262-5, 7.8.1 (null)
        trueLiteral: 11,        // ECMA-262-5, 7.8.2 (true)
        falseLiteral: 12,       // ECMA-262-5, 7.8.2 (false)
        numberLiteral: 13,      // ECMA-262-5, 7.8.3
        stringLiteral: 14,      // ECMA-262-5, 7.8.4
        identifier: 15,         // ECMA-262-5, 7.6
        reservedWord: 16,

        eof: 17,
        error: 18
    };
    // debugging - this costs something like 20%
    //
    //Object.keys(tokenType).forEach(function (key) {
    //    tokenType[key] = key.toString();
    //});
    var tokens = {
        leftBrace: { type: tokenType.leftBrace, length: 1 },
        rightBrace: { type: tokenType.rightBrace, length: 1 },
        leftBracket: { type: tokenType.leftBracket, length: 1 },
        rightBracket: { type: tokenType.rightBracket, length: 1 },
        colon: { type: tokenType.colon, length: 1 },
        semicolon: { type: tokenType.semicolon, length: 1},
        comma: { type: tokenType.comma, length: 1 },
        dot: { type: tokenType.dot, length: 1 },
        nullLiteral: { type: tokenType.nullLiteral, length: 4, value: null },
        trueLiteral: { type: tokenType.trueLiteral, length: 4, value: true },
        falseLiteral: { type: tokenType.falseLiteral, length: 5, value: false },
        eof: { type: tokenType.eof, length: 0 }
    };

    function reservedWord(word) {
        return { type: tokenType.reservedWord, length: word.length };
    }
    function reservedWordLookup(identifier) {
        // Moving from a simple object literal lookup for reserved words to this 
        // switch was worth a non-trivial performance increase (5-7%) as this path
        // gets taken for any identifier.
        //
        switch (identifier.charCodeAt(0)) {
            case /*b*/98:
                switch (identifier) {
                    case 'break':
                        return reservedWord(identifier);
                }
                break;

            case /*c*/99:
                switch (identifier) {
                    case 'case':
                    case 'catch':
                    case 'class':
                    case 'const':
                    case 'continue':
                        return reservedWord(identifier);
                }
                break;

            case /*d*/100:
                switch (identifier) {
                    case 'debugger':
                    case 'default':
                    case 'delete':
                    case 'do':
                        return reservedWord(identifier);
                }
                break;

            case /*e*/101:
                switch (identifier) {
                    case 'else':
                    case 'enum':
                    case 'export':
                    case 'extends':
                        return reservedWord(identifier);
                }
                break;

            case /*f*/102:
                switch (identifier) {
                    case 'false':
                        return tokens.falseLiteral;

                    case 'finally':
                    case 'for':
                    case 'function':
                        return reservedWord(identifier);
                }

                break;
            case /*i*/105:
                switch (identifier) {
                    case 'if':
                    case 'import':
                    case 'in':
                    case 'instanceof':
                        return reservedWord(identifier);
                }
                break;

            case /*n*/110:
                switch (identifier) {
                    case 'null':
                        return tokens.nullLiteral;

                    case 'new':
                        return reservedWord(identifier);
                }
                break;

            case /*r*/114:
                switch (identifier) {
                    case 'return':
                        return reservedWord(identifier);
                }
                break;

            case /*s*/115:
                switch (identifier) {
                    case 'super':
                    case 'switch':
                        return reservedWord(identifier);
                }
                break;

            case /*t*/116:
                switch (identifier) {
                    case 'true':
                        return tokens.trueLiteral;

                    case 'this':
                    case 'throw':
                    case 'try':
                    case 'typeof':
                        return reservedWord(identifier);
                }
                break;

            case /*v*/118:
                switch (identifier) {
                    case 'var':
                    case 'void':
                        return reservedWord(identifier);
                }
                break;

            case /*w*/119:
                switch (identifier) {
                    case 'while':
                    case 'with':
                        return reservedWord(identifier);
                }
                break;
        }
        return;
    }

    var lexer = (function () {
        function isIdentifierStartCharacter(code, text, offset, limit) {
            // The ES5 spec decalares that identifiers consist of a bunch of unicode classes, without
            // WinRT support for determining unicode class membership we are looking at 2500+ lines of
            // javascript code to encode the relevant class tables. Instead we look for everything 
            // which is legal and < 0x7f, we exclude whitespace and line terminators, and then accept
            // everything > 0x7f.
            //
            // Here's the ES5 production:
            //
            //  Lu | Ll | Lt | Lm | Lo | Nl
            //  $
            //  _
            //  \ UnicodeEscapeSequence
            //
            switch (code) {
                case (code >= /*a*/97 && code <= /*z*/122) && code:
                case (code >= /*A*/65 && code <= /*Z*/90) && code:
                case /*$*/36:
                case /*_*/95:
                    return true;

                case isWhitespace(code) && code:
                case isLineTerminator(code) && code:
                    return false;

                case (code > 0x7f) && code:
                    return true;

                case /*\*/92:
                    if (offset + 4 < limit) {
                        if (text.charCodeAt(offset) === /*u*/117 &&
                            isHexDigit(text.charCodeAt(offset + 1)) &&
                            isHexDigit(text.charCodeAt(offset + 2)) &&
                            isHexDigit(text.charCodeAt(offset + 3)) &&
                            isHexDigit(text.charCodeAt(offset + 4))) {
                            return true;
                        }
                    }
                    return false;

                default:
                    return false;
            }
        }
        /*
        // Hand-inlined into readIdentifierPart
        function isIdentifierPartCharacter(code) {
            // See comment in isIdentifierStartCharacter.
            //
            // Mn | Mc | Nd | Pc
            // <ZWNJ> | <ZWJ>
            //
            switch (code) {
                case isIdentifierStartCharacter(code) && code:
                case isDecimalDigit(code) && code:
                    return true;

                default:
                    return false;
            }
        }
        */
        function readIdentifierPart(text, offset, limit) {
            var hasEscape = false;
            while (offset < limit) {
                var code = text.charCodeAt(offset);
                switch (code) {
                    //case isIdentifierStartCharacter(code) && code:
                    case (code >= /*a*/97 && code <= /*z*/122) && code:
                    case (code >= /*A*/65 && code <= /*Z*/90) && code:
                    case /*$*/36:
                    case /*_*/95:
                        break;

                    case isWhitespace(code) && code:
                    case isLineTerminator(code) && code:
                        return hasEscape ? -offset : offset;

                    case (code > 0x7f) && code:
                        break;

                    //case isDecimalDigit(code) && code:
                    case (code >= /*0*/48 && code <= /*9*/57) && code: 
                        break;

                    case /*\*/92:
                        if (offset + 5 < limit) {
                            if (text.charCodeAt(offset + 1) === /*u*/117 &&
                                isHexDigit(text.charCodeAt(offset + 2)) &&
                                isHexDigit(text.charCodeAt(offset + 3)) &&
                                isHexDigit(text.charCodeAt(offset + 4)) &&
                                isHexDigit(text.charCodeAt(offset + 5))) {
                                offset += 5;
                                hasEscape = true;
                                break;
                            }
                        }
                        return hasEscape ? -offset : offset;

                    default:
                        return hasEscape ? -offset : offset;
                }
                offset++;
            }
            return hasEscape ? -offset : offset;
        }
        function readIdentifierToken(text, offset, limit) {
            var startOffset = offset;
            offset = readIdentifierPart(text, offset, limit);
            var hasEscape = false;
            if (offset < 0) {
                offset = -offset;
                hasEscape = true;
            }
            var identifier = text.substr(startOffset, offset - startOffset);
            if (hasEscape) {
                identifier = eval('"' + identifier + '"');
            }
            var wordToken = reservedWordLookup(identifier);
            if (wordToken) {
                return wordToken;
            }
            return { 
                type: tokenType.identifier, 
                length: offset - startOffset, 
                value: identifier
            };
        }
        function isHexDigit(code) {
            switch (code) {
                case (code >= /*0*/48 && code <= /*9*/57) && code:
                case (code >= /*a*/97 && code <= /*f*/102) && code:
                case (code >= /*A*/65 && code <= /*F*/70) && code:
                    return true;

                default:
                    return false;
            }
        }
        function readHexIntegerLiteral(text, offset, limit) {
            while (offset < limit && isHexDigit(text.charCodeAt(offset))) {
                offset++;
            }
            return offset;
        }
        function isDecimalDigit(code) {
            switch (code) {
                case (code >= /*0*/48 && code <= /*9*/57) && code: 
                    return true;

                default:
                    return false;
            }
        }
        function readDecimalDigits(text, offset, limit) {
            while (offset < limit && isDecimalDigit(text.charCodeAt(offset))) {
                offset++;
            }
            return offset;
        }
        function readDecimalLiteral(text, offset, limit) {
            offset = readDecimalDigits(text, offset, limit);
            if (offset < limit && text.charCodeAt(offset) === /*.*/46 && offset + 1 < limit && isDecimalDigit(text.charCodeAt(offset + 1))) {
                offset = readDecimalDigits(text, offset + 2, limit);
            }
            if (offset < limit) {
                var code = text.charCodeAt(offset);
                if (code === /*e*/101 || code === /*E*/69) {
                    var tempOffset = offset + 1;
                    if (tempOffset < limit) {
                        code = text.charCodeAt(tempOffset);
                        if (code === /*+*/43 || code === /*-*/45) {
                            tempOffset++;
                        }
                        offset = readDecimalDigits(text, tempOffset, limit);
                    }
                }
            }
            return offset;
        }
        function readDecimalLiteralToken(text, start, offset, limit) {
            var offset = readDecimalLiteral(text, offset, limit);
            var length = offset - start;
            return {
                type: tokenType.numberLiteral,
                length: length,
                value: +text.substr(start, length)
            };
        }
        function isLineTerminator(code) {
            switch (code) {
                case 0x000A:    // line feed
                case 0x000D:    // carriage return
                case 0x2028:    // line separator
                case 0x2029:    // paragraph separator
                    return true;

                default:
                    return false;
            }
        }
        function readStringLiteralToken(text, offset, limit) {
            var startOffset = offset;
            var quoteCharCode = text.charCodeAt(offset);
            var hasEscape = false;
            offset++;
            while (offset < limit && !isLineTerminator(text.charCodeAt(offset))) {
                if (offset + 1 < limit && text.charCodeAt(offset) === /*\*/92) {
                    hasEscape = true;

                    switch (text.charCodeAt(offset + 1)) {
                        case quoteCharCode:
                        case 0x000A:    // line feed
                        case 0x2028:    // line separator
                        case 0x2029:    // paragraph separator
                            offset += 2;
                            continue;

                        case 0x000D:    // carriage return
                            if (offset + 2 < limit && text.charCodeAt(offset + 2) === 0x000A) {
                                // Skip \r\n
                                offset += 3;
                            } else {
                                offset += 2;
                            }
                            continue;
                    }
                }
                offset++;
                if (text.charCodeAt(offset - 1) === quoteCharCode) {
                    break;
                }
            }
            var length = offset - startOffset;
            // If we don't have a terminating quote go through the escape path.
            hasEscape = hasEscape || length === 1 || text.charCodeAt(offset - 1) !== quoteCharCode;
            return {
                type: tokenType.stringLiteral,
                length: length,
                value: (hasEscape 
                    ? eval(text.substr(startOffset, length))
                    : text.substr(startOffset + 1, length - 2))
            };
        }
        function isWhitespace(code) {
            switch (code) {
                case 0x0009:    // tab
                case 0x000B:    // vertical tab
                case 0x000C:    // form feed
                case 0x0020:    // space
                case 0x00A0:    // no-breaking space
                case 0xFEFF:    // BOM
                    return true;

                // There are no category Zs between 0x00A0 and 0x1680.
                //
                case (code < 0x1680) && code:
                    return false;

                // Unicode category Zs
                //
                case 0x1680:
                case 0x180e:
                case (code >= 0x2000 && code <= 0x200a) && code:
                case 0x202f:
                case 0x205f:
                case 0x3000:
                    return true;

                default:
                    return false;
            }
        }
        // Hand-inlined isWhitespace.
        function readWhitespace(text, offset, limit) {
            while (offset < limit) {
                var code = text.charCodeAt(offset);
                switch (code) {
                    case 0x0009:    // tab
                    case 0x000B:    // vertical tab
                    case 0x000C:    // form feed
                    case 0x0020:    // space
                    case 0x00A0:    // no-breaking space
                    case 0xFEFF:    // BOM
                        break;

                    // There are no category Zs between 0x00A0 and 0x1680.
                    //
                    case (code < 0x1680) && code:
                        return offset;

                    // Unicode category Zs
                    //
                    case 0x1680:
                    case 0x180e:
                    case (code >= 0x2000 && code <= 0x200a) && code:
                    case 0x202f:
                    case 0x205f:
                    case 0x3000:
                        break;

                    default:
                        return offset;
                }
                offset++;
            }
            return offset;
        }
        function lex(result, text, offset, limit) {
            while (offset < limit) {
                var startOffset = offset;
                var code = text.charCodeAt(offset++);
                var type = undefined;
                var token = undefined;
                switch (code) {
                    case isWhitespace(code) && code:
                    case isLineTerminator(code) && code:
                        type = tokenType.separator;
                        offset = readWhitespace(text, offset, limit);
                        // don't include whitespace in the token stream.
                        continue;

                    case /*"*/34:
                    case /*'*/39:
                        token = readStringLiteralToken(text, offset - 1, limit);
                        break;

                    case /*+*/43:
                    case /*-*/45:
                        if (offset < limit) {
                            var afterSign = text.charCodeAt(offset);
                            if (afterSign === /*.*/46) {
                                var signOffset = offset + 1;
                                if (signOffset < limit && isDecimalDigit(text.charCodeAt(signOffset))) {
                                    token = readDecimalLiteralToken(text, startOffset, signOffset, limit);
                                    break;
                                }
                            } else if (isDecimalDigit(afterSign)) {
                                token = readDecimalLiteralToken(text, startOffset, offset, limit);
                                break;
                            }
                        }
                        type = tokenType.error;
                        break;

                    case /*,*/44: 
                        token = tokens.comma; 
                        break;

                    case /*.*/46:
                        token = tokens.dot;
                        if (offset < limit && isDecimalDigit(text.charCodeAt(offset))) {
                            token = readDecimalLiteralToken(text, startOffset, offset, limit);
                        }
                        break;

                    case /*0*/48:
                        var ch2 = (offset < limit ? text.charCodeAt(offset) : 0);
                        if (ch2 === /*x*/120 || ch2 === /*X*/88) {
                            var hexOffset = readHexIntegerLiteral(text, offset + 1, limit);
                            token = {
                                type: tokenType.numberLiteral,
                                length: hexOffset - startOffset,
                                value: +text.substr(startOffset, hexOffset - startOffset)
                            };
                        } else {
                            token = readDecimalLiteralToken(text, startOffset, offset, limit);
                        }
                        break;

                    case (code >= /*1*/49 && code <= /*9*/57) && code:
                        token = readDecimalLiteralToken(text, startOffset, offset, limit);
                        break;

                    case /*:*/58: 
                        token = tokens.colon;
                        break;

                    case /*;*/59:
                        token = tokens.semicolon;
                        break;

                    case /*[*/91:
                        token = tokens.leftBracket; 
                        break;

                    case /*]*/93:
                        token = tokens.rightBracket;
                        break;

                    case /*{*/123:
                        token = tokens.leftBrace;
                        break;

                    case /*}*/125:
                        token = tokens.rightBrace;
                        break;

                    default:
                        if (isIdentifierStartCharacter(code, text, offset, limit)) {
                            token = readIdentifierToken(text, offset - 1, limit);
                            break;
                        }
                        type = tokenType.error;
                        break;
                }

                if (token) {
                    offset += (token.length - 1);
                } else {
                    token = { type: type, length: offset - startOffset };
                }
                result.push(token);
            }
        }
        return function (text) {
            var result = [];
            lex(result, text, 0, text.length);
            result.push(tokens.eof);
            return result;
        };
    })();
    lexer.tokenType = tokenType;
    
    WinJS.Namespace.defineWithParent(WinJS, "UI", {
        _optionsLexer: lexer
    });
})(this);


/*
    Notation is described in ECMA-262-5 (ECMAScript Language Specification, 5th edition) section 5.

    Lexical grammar is defined in ECMA-262-5, section 7.

    Lexical productions used in this grammar defined in ECMA-262-5:

        Production          Section
        --------------------------------
        Identifier          7.6
        NullLiteral         7.8.1
        BooleanLiteral      7.8.2
        NumberLiteral       7.8.3
        StringLiteral       7.8.4

    Syntactic grammar for the value of the data-win-options attribute.

        OptionsLiteral:
            ObjectLiteral

        ObjectLiteral:
            { }
            { ObjectProperties }

        ObjectProperties:
            ObjectProperty
            ObjectProperties, ObjectProperty

        ObjectProperty:
            PropertyName : Value

        PropertyName:                       (from ECMA-262-6, 11.1.5)
            StringLiteral
            NumberLiteral
            Identifier

        ArrayLiteral:
            [ ]
            [ ArrayElements ]

        ArrayElements:
            Value
            ArrayElements , Value

        Value:
            NullLiteral
            NumberLiteral
            BooleanLiteral
            StringLiteral
            ArrayLiteral
            ObjectLiteral
            IdentifierExpression

        AccessExpression:
            [ Value ]
            . Identifier

        AccessExpressions:
            AccessExpression
            AccessExpressions AccessExpression

        IdentifierExpression:
            Identifier
            Identifier AccessExpressions


    NOTE: We have factored the above grammar to allow the infrastructure to be used
          by the BindingInterpreter as well. The BaseInterpreter does NOT provide an 
          implementation of _evaluateValue(), this is expected to be provided by the
          derived class since right now the two have different grammars for Value

        AccessExpression:
            [ Value ]
            . Identifier

        AccessExpressions:
            AccessExpression
            AccessExpressions AccessExpression

        Identifier:
            Identifier                      (from ECMA-262-6, 7.6)

        IdentifierExpression:
            Identifier
            Identifier AccessExpressions

        Value:
            *** Provided by concrete interpreter ***

*/

(function (global, undefined) {

    var lexer = WinJS.UI._optionsLexer;
    var tokenType = lexer.tokenType;

    function tokenTypeName(type) {
        var keys = Object.keys(tokenType);
        for (var i = 0, len = keys.length; i < len; i++) {
            if (type === tokenType[keys[i]]) {
                return keys[i];
            }
        }
        return "<unknown>";
    }

    var BaseInterpreter = WinJS.Class.define(null,
        {
            _error: function (message) {
                var error = new Error(message);
                error.name = "WinJS.UI.ParseError";
                throw error;
            },
            _evaluateAccessExpression: function (value) {
                switch (this._current.type) {
                    case tokenType.dot:
                        this._read();
                        return this._evaluateIdentifier(true, value);

                    case tokenType.leftBracket:
                        this._read();
                        var index = this._evaluateValue();
                        this._read(tokenType.rightBracket);
                        return value[index];

                    // default: is unreachable because all the callers are conditional on
                    // the next token being either a . or {
                    //
                }
            },
            _evaluateAccessExpressions: function (value) {
                while (true) {
                    switch (this._current.type) {
                        case tokenType.dot:
                        case tokenType.leftBracket:
                            value = this._evaluateAccessExpression(value);
                            break;

                        default:
                            return value;
                    }
                }
            },
            _evaluateIdentifier: function (nested, value) {
                var id = this._readIdentifier();
                value = nested ? value[id] : (this._context[id] || global[id]);
                return value;
            },
            _evaluateIdentifierExpression: function () {
                var value = this._evaluateIdentifier(false);

                switch (this._current.type) {
                    case tokenType.dot:
                    case tokenType.leftBracket:
                        return this._evaluateAccessExpressions(value);

                    default:
                        return value;
                }
            },
            _initialize: function (tokens, context) {
                this._tokens = tokens;
                this._context = context;
                this._pos = 0;
                this._current = this._tokens[0];
            },
            _read: function (expected) {
                if (expected && this._current.type !== expected) {
                    this._unexpectedToken(expected);
                }
                if (this._current !== tokenType.eof) {
                    this._current = this._tokens[++this._pos];
                }
            },
            _readAccessExpression: function (parts) {
                switch (this._current.type) {
                    case tokenType.dot:
                        this._read();
                        parts.push(this._readIdentifier());
                        return;

                    case tokenType.leftBracket:
                        this._read();
                        parts.push(this._evaluateValue());
                        this._read(tokenType.rightBracket);
                        return;

                    // default: is unreachable because all the callers are conditional on
                    // the next token being either a . or {
                    //
                }
            },
            _readAccessExpressions: function (parts) {
                while (true) {
                    switch (this._current.type) {
                        case tokenType.dot:
                        case tokenType.leftBracket:
                            this._readAccessExpression(parts);
                            break;

                        default:
                            return;
                    }
                }
            },
            _readIdentifier: function () {
                var id = this._current.value;
                this._read(tokenType.identifier);
                return id;
            },
            _readIdentifierExpression: function () {
                var parts = [];
                parts.push(this._readIdentifier());

                switch (this._current.type) {
                    case tokenType.dot:
                    case tokenType.leftBracket:
                        this._readAccessExpressions(parts);
                        break;
                }
                
                return parts;
            },
            _unexpectedToken: function (expected) {
                if (expected) {
                    if (arguments.length == 1) {
                        this._error("Unexpected token: "
                            + tokenTypeName(this._current.type)
                            + ", expected token: "
                            + tokenTypeName(expected)
                        );
                    } else {
                        var names = [];
                        for (var i = 0, len = arguments.length; i < len; i++) {
                            names.push(tokenTypeName(arguments[i]));
                        }
                        this._error("Unexpected token: "
                            + tokenTypeName(this._current.type)
                            + ", expected one of: "
                            + names.join(", ")
                        );
                    }
                } else {
                    this._error("Unexpected token: " + tokenTypeName(this._current.type));
                }
            }
        }
    );

    var OptionsInterpreter = WinJS.Class.derive(BaseInterpreter,
        function (tokens, context) {
            this._initialize(tokens, context);
        },
        {
            _error: function (message) {
                var error = new Error("Invalid options record, expected to be in the format of an object literal. " + message);
                error.name = "WinJS.UI.ParseError";
                throw error;
            },
            _evaluateArrayLiteral: function () {
                var a = [];
                this._read(tokenType.leftBracket);
                this._readArrayElements(a);
                this._read(tokenType.rightBracket);
                return a;
            },
            _evaluateObjectLiteral: function () {
                var o = {};
                this._read(tokenType.leftBrace);
                this._readObjectProperties(o);
                this._read(tokenType.rightBrace);
                return o;
            },
            _evaluateOptionsLiteral: function () {
                var value = this._evaluateValue();
                if (this._current.type !== tokenType.eof) {
                    this._unexpectedToken(tokenType.eof);
                }
                return value;
            },
            _evaluateValue: function () {
                switch (this._current.type) {
                    case tokenType.falseLiteral:
                    case tokenType.nullLiteral:
                    case tokenType.stringLiteral:
                    case tokenType.trueLiteral:
                    case tokenType.numberLiteral:
                        var value = this._current.value;
                        this._read();
                        return value;

                    case tokenType.leftBrace:
                        return this._evaluateObjectLiteral();

                    case tokenType.leftBracket:
                        return this._evaluateArrayLiteral();

                    case tokenType.identifier:
                        return this._evaluateIdentifierExpression();
                        
                    default:
                        this._unexpectedToken(tokenType.falseLiteral, tokenType.nullLiteral, tokenType.stringLiteral,
                            tokenType.trueLiteral, tokenType.numberLiteral, tokenType.leftBrace, tokenType.leftBracket,
                            tokenType.identifier);
                        break;
                }
            },
            _readArrayElements: function (a) {
                var first = true;
                var index = 0;
                while (this._current.type !== tokenType.eof && this._current.type !== tokenType.rightBracket) {
                    if (!first) { this._read(tokenType.comma); }
                    a[index++] = this._evaluateValue();
                    first = false;
                }
            },
            _readObjectProperties: function (o) {
                var first = true;
                while (this._current.type !== tokenType.eof && this._current.type !== tokenType.rightBrace) {
                    if (!first) { this._read(tokenType.comma); }
                    this._readObjectProperty(o);
                    first = false;
                }
            },
            _readObjectProperty: function (o) {
                switch (this._current.type) {
                    case tokenType.numberLiteral:
                    case tokenType.stringLiteral:
                    case tokenType.identifier:
                        var propertyName = this._current.value;
                        this._read();
                        this._read(tokenType.colon);
                        o[propertyName] = this._evaluateValue();
                        break;

                    default:
                        this._unexpectedToken(tokenType.numberLiteral, tokenType.stringLiteral, tokenType.identifier);
                        break;
                }
            },

            run: function () {
                return this._evaluateOptionsLiteral();
            }
        }
    );

    var parser = function (text, context) {
        var tokens = lexer(text);
        var interpreter = new OptionsInterpreter(tokens, context || {});
        return interpreter.run();
    };
    parser._BaseInterpreter = BaseInterpreter;

    WinJS.Namespace.defineWithParent(WinJS, "UI", {
        _optionsParser: parser
    });

})(this);




(function (WinJS, undefined) {
    function isSelectable(elem) {
        var name = elem.tagName;
        if (name === 'TEXTAREA' || name === 'INPUT') { 
            return true;
        }  
 
        while (elem) {
            if (elem.hasAttribute('data-win-selectable')
                || elem.contentEditable === 'true') { 
                return true; 
            }
            elem = elem.parentElement;
        }
        return false;
    }

    function selectionHandler(e) {
        if (!WinJS.UI._isSelectable(e.srcElement)) {
            e.preventDefault();
        }
    }

    document.addEventListener('DOMContentLoaded', function() {
        document.body.addEventListener('selectstart', selectionHandler, false);
    }, false);

    WinJS.Namespace.defineWithParent(WinJS, "UI", {
        _isSelectable: {value:isSelectable, writable:true, enumerable:true}
    });

})(WinJS);




(function (WinJS, undefined) {

    function fireEvent(element, name) {
        var event = document.createEvent('UIEvent');
        event.initUIEvent(name, false, false, window, 1);
        element.dispatchEvent(event);
    }

    function onBeforeActivate(e, element, hasFocus) {
        fireEvent(element, hasFocus ? "onTabExit" : "onTabEnter");
        e.cancelBubble = true;
        return false;
    }

    function prefixBeforeActivateHandler(e) {
        return onBeforeActivate(e, e.srcElement.nextSibling, e.shiftKey);
    }

    function postfixBeforeActivateHandler(e) {
        return onBeforeActivate(e, e.srcElement.previousSibling, !e.shiftKey);
    }

    function TabHelperObject(element) {
        function createCatcher(beforeActivateHandler) {
            var fragment = document.createElement("DIV");
            fragment.tabIndex = 0;
            fragment.attachEvent("onbeforeactivate", beforeActivateHandler);
            return fragment;
        };

        var parent = element.parentNode;

        // Insert prefix focus catcher
        var catcherBegin = createCatcher(prefixBeforeActivateHandler);
        parent.insertBefore(catcherBegin, element);

        // Insert postfix focus catcher
        var catcherEnd = createCatcher(postfixBeforeActivateHandler);
        parent.insertBefore(catcherEnd, element.nextSibling);

        var refCount = 1;
        this.addRef = function () {
            refCount++;
        };
        this.release = function () {
            if (--refCount === 0) {
                if (catcherBegin.parentElement) {
                    parent.removeChild(catcherBegin);
                }
                if (catcherEnd.parentElement) {
                    parent.removeChild(catcherEnd);
                }
            }
            return refCount;
        };
    }

    WinJS.Namespace.define("WinJS.UI.TrackTabBehavior", {
        attach: function (element) {
            if (!element["win-trackTabHelperObject"]) {
                element["win-trackTabHelperObject"] = new TabHelperObject(element);
            } else {
                element["win-trackTabHelperObject"].addRef();
            }
        },

        detach: function (element) {
            if (!element["win-trackTabHelperObject"].release()) {
                delete element["win-trackTabHelperObject"];
            }
        }
    });

    WinJS.Namespace.defineWithParent(WinJS, "UI", {
        TabContainer: WinJS.Class.define(function (element, options) {
            // TabContainer uses 2 TrackTabBehavior for its implementation: one for itself, another one for the active element.
            // When onTabEnter is caught on TabContainer, it directly set focus on the active element.
            // When onTabExit is caught on the active element (_tabExitHandler), it first prevents focus from being set on any element,
            // effectively letting the focus skip any remaining items in the TabContainer. Then, when onTabExit is caught on
            // TabContainer, it turns back on the possibility to receive focus on child elements.
            this._element = element;

            var that = this;
            this._tabExitHandler = function () {
                that._canFocus(false);
            };

            element.addEventListener("onTabEnter", function () {
                if (that.childFocus) {
                    that.childFocus.focus();
                } else {
                    that._canFocus(false);
                }
            });

            element.addEventListener("onTabExit", function () {
                that._canFocus(true);
            });

            WinJS.UI.TrackTabBehavior.attach(element);
        }, {

            // Public members

            childFocus: {
                /// <summary locid="131">
                /// Specifies the active element under this container
                /// </summary>
                set: function (e) {
                    if (e != this._focusElement) {
                        if (this._focusElement) {
                            WinJS.UI.TrackTabBehavior.detach(this._focusElement);
                            this._focusElement.removeEventListener("onTabExit", this._tabExitHandler);
                        }
                        this._focusElement = e;
                        if (e) {
                            WinJS.UI.TrackTabBehavior.attach(e);
                            this._focusElement.addEventListener("onTabExit", this._tabExitHandler);
                        }
                    }
                },
                get: function () {
                    return this._focusElement;
                }
            },

            // Private members

            _element: null,
            _skipper: function (e) {
                e.cancelBubble = true;
                return false;
            },
            _canFocus: function (canfocus) {
                if (canfocus) {
                    this._element.detachEvent("onbeforeactivate", this._skipper);
                } else {
                    this._element.attachEvent("onbeforeactivate", this._skipper);
                }
            },

            _focusElement: null

        })
    });
})(WinJS);


(function (WinJS, undefined) {
    var transitionRef = "WinJS.Animations.transition";
    var styleRef = "WinJS.Animations.style";
    function makeArray(elements) {
        if (elements instanceof Array || elements instanceof NodeList || elements instanceof HTMLCollection) {
            return elements;
        } else if (elements) {
            return [elements];
        } else {
            return [];
        }
    }

    function addrefPVLAnimation(element, attrib) {
        var ref;
        if (element.getAttribute) {
            ref = element.getAttribute(attrib);
            if (!ref) {
                ref = 1;
            } else {
                ref = parseInt(ref) + 1;
            }
            element.setAttribute(attrib, ref);
        }
        return ref;
    }

    function releasePVLAnimation(element, attrib) {
        var ref;
        if (element.getAttribute) {
            ref = element.getAttribute(attrib);
            if (!ref) {
                ref = 0;
            } else {
                ref = parseInt(ref) - 1;
            }
            if (ref === 0) {
                element.removeAttribute(attrib);
            } else {
                element.setAttribute(attrib, ref);
            }
        }
        return ref;
    }

    var keyframeCounter = 0;
    function getUniqueKeyframeName() {
        return "WinJSUIAnimation" + ++keyframeCounter;
    }

    function getAnimationStaggerOffset(element, animArray, iElem) {
        for (var i = 0; i < animArray.length; i++) {
            if (iElem === 0) {
                animArray[i].initialDelay = animArray[i].delay;
            }
            animArray[i].keyframe = getUniqueKeyframeName();
            if (typeof animArray[i].stagger === "function") {
                animArray[i].delay = animArray[i].stagger(iElem, animArray[i].initialDelay);
            }
            if (typeof animArray[i].fromCallback === "function") {
                animArray[i].from = animArray[i].fromCallback(iElem);
            }
            if (typeof animArray[i].toCallback === "function") {
                animArray[i].to = animArray[i].toCallback(iElem);
            }
        }
    }

    function getTransitionStaggerTransform(transArray, iElem) {
        for (var i = 0; i < transArray.length; i++) {
            if (iElem === 0) {
                transArray[i].initialDelay = transArray[i].delay;
            }
            if (typeof transArray[i].stagger === "function") {
                transArray[i].delay = transArray[i].stagger(iElem, transArray[i].initialDelay);
            }
            if (typeof transArray[i].transitionCallback === "function") {
                transArray[i].transition = transArray[i].transitionCallback(iElem);
            }
        }
    }

    function execElementTransition(elem, transitionArray) {
        elem.style.msTransitionProperty = transitionArray.map(function (t) { return t.name; }).join(",");
        elem.style.msTransitionDelay = transitionArray.map(function (t) { return t.delay + "ms"; }).join(",");
        elem.style.msTransitionDuration = transitionArray.map(function (t) { return t.duration + "ms"; }).join(",");
        elem.style.msTransitionTimingFunction = transitionArray.map(function (t) { return t.timing; }).join(",");

        var promise = new WinJS.Promise(function (c, e, p) {
            var onexecuteTransitionEnd = function (event) {
                if (event.srcElement === elem) {
                    if (clearTransitionProperty(elem)) {
                        elem.removeEventListener(event.type, onexecuteTransitionEnd, false);
                        c(event); // complete after cleaning up the old transition
                    } else {
                        p(event);
                    }
                }
            };

            var waitForTransitionEnd = false;
            for (i = 0; i < transitionArray.length; i++) {
                if (transitionArray[i].transition(elem)) {
                    waitForTransitionEnd = true;
                    addrefPVLAnimation(elem, transitionRef);
                }
            }
            if (waitForTransitionEnd) {
                elem.addEventListener("MSTransitionEnd", onexecuteTransitionEnd, false);
            } else {
                clearTransitionProperty(elem);
                c();
            }
        });
        return promise;
    }

    function clearAnimation(element) {
        element.style.msAnimationName = null;
        element.style.msAnimationDelay = null;
        element.style.msAnimationDuration = null;
        element.style.msAnimationTimingFunction = null;
        element.style.msAnimationFillMode = "none";
    }

    function clearTransitionProperty(elem) {
        if (releasePVLAnimation(elem, transitionRef) === 0) {
            elem.style.msTransitionProperty = null;
            elem.style.msTransitionDelay = null;
            elem.style.msTransitionDuration = null;
            elem.style.msTransitionTimingFunction = null;
            return true;
        }
        return false;
    }

    function executeElementAnimation(elem, animArray, styleelm) {
        var sheet = styleelm.sheet;
        for (var i = 0; i < animArray.length; i++) {
            var kf = "@-ms-keyframes " + animArray[i].keyframe + " { from {" + animArray[i].from + ";} to {" + animArray[i].to + ";}}";
            sheet.insertRule(kf, sheet.cssRules.length);
            addrefPVLAnimation(styleelm, styleRef);
        }
        elem.style.msAnimationDelay = animArray.map(function (a) { return a.delay + "ms"; }).join(",");
        elem.style.msAnimationDuration = animArray.map(function (a) { return a.duration + "ms"; }).join(",");
        elem.style.msAnimationTimingFunction = animArray.map(function (a) { return a.timing; }).join(",");
        elem.style.msAnimationName = animArray.map(function (a) { return a.keyframe; }).join(",");
        elem.style.msAnimationFillMode = "both";

        var promise = new WinJS.Promise(function (c, e, p) {
            var executeAnimationEnd = function (event) {
                if (event.srcElement === elem) {
                    if ((releasePVLAnimation(styleelm, styleRef) === 0) && styleelm.parentElement) {
                        styleelm.parentElement.removeChild(styleelm);
                    }
                    promise._cEvents -= 1;
                    if (promise._cEvents === 0) {
                        clearAnimation(event.srcElement);
                        document.removeEventListener(event.type, executeAnimationEnd, false);
                        c(event); // complete after cleaning up the old animation
                    } else {
                        p(event);
                    }
                }
            };
            document.addEventListener("MSAnimationEnd", executeAnimationEnd, false);
        });
        promise._cEvents = animArray.length;
        return promise;
    }

    WinJS.Namespace.defineWithParent(WinJS, "UI", {
        executeAnimation: function (element, animation) {
            try {
                var promiseArray = [];
                var animArray = makeArray(animation);
                var elemArray = makeArray(element);
                var styleelm = document.createElement("STYLE");
                document.documentElement.firstChild.appendChild(styleelm);

                if (elemArray.length !== 0) {
                    for (var i = 0; i < elemArray.length; i++) {
                        if (elemArray[i] instanceof Array) {
                            for (var j = 0; j < elemArray[i].length; j++) {
                                getAnimationStaggerOffset(elemArray[i][j], animArray, i);
                                promiseArray.push(executeElementAnimation(elemArray[i][j], animArray, styleelm));
                            }
                        } else {
                            getAnimationStaggerOffset(elemArray[i], animArray, i);
                            promiseArray.push(executeElementAnimation(elemArray[i], animArray, styleelm));
                        }
                    }
                } else {
                    return WinJS.Promise.wrap();
                }
                return WinJS.Promise.join(promiseArray);
            } catch (e) {
                return WinJS.Promise.wrapError(e);
            }
        },

        executeTransition: function (element, transition) {
            try {
                var promiseArray = [];
                var elemArray = makeArray(element);
                var transArray = makeArray(transition);
                if (elemArray.length !== 0) {
                    for (var i = 0; i < elemArray.length; i++) {
                        if (elemArray[i] instanceof Array) {
                            for (var j = 0; j < elemArray[i].length; j++) {
                                getTransitionStaggerTransform(transArray, i);
                                promiseArray.push(execElementTransition(elemArray[i][j], transArray));
                            }
                        } else {
                            getTransitionStaggerTransform(transArray, i);
                            promiseArray.push(execElementTransition(elemArray[i], transArray));
                        }
                    }
                    return WinJS.Promise.join(promiseArray);
                } else {
                    return WinJS.Promise.wrap();
                }
            } catch (e) {
                return WinJS.Promise.wrapError(e);
            }
        }
    });
})(WinJS);

