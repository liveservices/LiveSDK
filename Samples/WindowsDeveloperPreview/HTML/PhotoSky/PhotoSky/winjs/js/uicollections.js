/// <loc filename="metadata\uicollections_loc_oam.xml" format="messagebundle" />
/// <reference path='uicollections.js' />
 
/*
  © Microsoft. All rights reserved.

  This library is supported for use in Windows Tailored Apps only.

  Build: 6.2.8100.0 
  Version: 0.5 
*/
 

WinJS.UI._setTimeout = function (callback, delay) { 
    return window.setTimeout(callback, delay);
};


(function (WinJS) {
    var thisWinUI = WinJS.UI;
    var utilities = WinJS.Utilities;
    var animation = WinJS.UI.Animation;

    // Class names
    var navButtonClass = "win-navbutton",
        flipViewClass = "win-flipView",
        navButtonLeftClass = "win-navleft",
        navButtonRightClass = "win-navright",
        navButtonTopClass = "win-navtop",
        navButtonBottomClass = "win-navbottom",
        placeholderContainerClass = "win-progresscontainer",
        placeholderProgressBarClass = "win-progressbar";

    // Aria labels
    var horizontalFlipViewLabel = "HorizontalFlipView",
        verticalFlipViewLabel = "VerticalFlipView",
        previousButtonLabel = "Previous",
        nextButtonLabel = "Next";

    var buttonFadeDelay = 3000,
        leftArrowGlyph = "&#57358",
        rightArrowGlyph = "&#57359",
        topArrowGlyph = "&#57360",
        bottomArrowGlyph = "&#57361",
        jumpAnimationMoveDelta = 40;

    // Default renderers for FlipView
    function trivialHtmlRenderer(item) {
        return thisWinUI.ensureElement(item.data);
    }

    function trivialPlaceholderRenderer(item) {
        var placeholderDiv = document.createElement("div");
        placeholderDiv.className = placeholderContainerClass;
        var progressElement = document.createElement("progress");
        progressElement.max = "100";
        progressElement.className = placeholderProgressBarClass;
        placeholderDiv.appendChild(progressElement);
        return placeholderDiv;
    }

    // TODO: This function will be replaced by validation and then removed
    function isNonNegativeNumber(n) {
        return (typeof n === "number") && n >= 0;
    }

    // TODO: This function will be replaced by validation and then removed
    function isNonNegativeInteger(n) {
        return isNonNegativeNumber(n) && n === Math.floor(n);
    }

    WinJS.Namespace.defineWithParent(WinJS, "UI", {

        /// <summary locid="1">
        /// The FlipView control displays a single item at a time
        /// </summary>
        /// <htmlSnippet><![CDATA[<div data-win-control="WinJS.UI.FlipView"></div>]]></htmlSnippet>
        /// <event name="datasourcecountchanged" bubbles="true" locid="2">Raised when the FlipView's datasource's count changes</event>
        /// <event name="pagevisibilitychanged" bubbles="true" locid="3">Raised when a FlipView page becomes visible or invisible</event>
        /// <event name="pageselected" bubbles="true" locid="4">Raised when the FlipView settles on a single item</event>
        /// <part name="flipView" class="win-flipView" locid="5">The FlipView itself</part>
        /// <part name="navigationButton" class="win-navbutton" locid="6">The general class for all FlipView navigation buttons</part>
        /// <part name="leftNavigationButton" class="win-navleft" locid="7">The left navigation button</part>
        /// <part name="rightNavigationButton" class="win-navright" locid="8">The right navigation button</part>
        /// <part name="topNavigationButton" class="win-navtop" locid="9">The top navigation button</part>
        /// <part name="bottomNavigationButton" class="win-navbottom" locid="10">The bottom navigation button</part>
        /// <part name="progressBarContainer" class="win-progresscontainer" locid="11">The element that contains a placeholder progress bar</part>
        /// <part name="progressBar" class="win-progressbar" locid="12">The loading progressbar displayed inside a placeholder element</part>
        /// <resource type="javascript" src="/winjs/js/base.js" shared="true" />
        /// <resource type="javascript" src="/winjs/js/ui.js" shared="true" />
        /// <resource type="javascript" src="/winjs/js/animations.js" shared="true" />
        /// <resource type="javascript" src="/winjs/js/uicollections.js" shared="true" />
        /// <resource type="css" src="/winjs/css/ui-dark.css" shared="true" />
        FlipView: WinJS.Class.define(function (element, options) {
            /// <summary locid="13">
            /// Constructs the FlipView
            /// </summary>
            /// <param name="element" domElement="true" locid="14">
            /// The DOM element to be associated with the FlipView control.
            /// </param>
            /// <param name="options" type="object" locid="15">
            /// The set of options to be applied initially to the FlipView control.
            /// </param>
            /// <returns type="WinJS.UI.FlipView" locid="16">
            /// A FlipView control.
            /// </returns>
            if (!element) {
                throw new Error(thisWinUI.FlipView.noElement);
            }

            if (this === window || this === thisWinUI) {
                var flipview = WinJS.UI.getControl(element);
                if (flipview) {
                    return flipview;
                } else {
                    return new thisWinUI.FlipView(element, options);
                }
            }

            var horizontal = true,
                dataSource = null,
                itemRenderer = trivialHtmlRenderer,
                placeholderRenderer = null,
                initialIndex = 0,
                keepInMemory = false,
                itemSpacing = 0;

            if (options) {
                // flipAxis parameter checking. Must be a string, either "horizontal" or "vertical"
                if (options.orientation) {
                    if (typeof options.orientation === "string") {
                        switch (options.orientation.toLowerCase()) {
                            case "horizontal":
                                horizontal = true;
                                break;

                            case "vertical":
                                horizontal = false;
                                break;

                            default:
                                throw new Error(thisWinUI.FlipView.badAxis);
                        }
                    } else {
                        throw new Error(thisWinUI.FlipView.badAxis);
                    }
                }

                // currentPage. Should be a number >= 0. If it's negative, we can throw an error now. If it's positive, we might throw an error later when it turns out that number's out of bounds
                if (options.currentPage) {
                    if (isNonNegativeInteger(options.currentPage)) {
                        initialIndex = Math.floor(options.currentPage); // A number isn't necessarily an int, so we'll force it to be so here.
                    } else {
                        throw new Error(thisWinUI.FlipView.badCurrentPage);
                    }
                }

                if (options.dataSource) {
                    dataSource = options.dataSource;
                }

                if (options.itemRenderer) {
                    if (typeof options.itemRenderer === "function") {
                        itemRenderer = options.itemRenderer;
                    } else if (typeof options.itemRenderer === "object") {
                        itemRenderer = options.itemRenderer.renderItem;
                    }
                }

                placeholderRenderer = (options.placeholderRenderer ? options.placeholderRenderer : trivialPlaceholderRenderer);

                if (options.itemSpacing) {
                    if (isNonNegativeInteger(options.itemSpacing)) {
                        itemSpacing = Math.floor(options.itemSpacing);
                    } else {
                        throw new Error(thisWinUI.FlipView.badItemSpacingAmount);
                    }
                }
            }

            var countToLoad = 0;
            if (!dataSource) {
                var childElements = utilities.children(element);
                if (childElements.length > 0) {
                    dataSource = new thisWinUI.ArrayDataSource(childElements.slice(0), { compareByIdentity: true });
                    keepInMemory = true;
                    countToLoad = childElements.length;
                } else {
                    dataSource = new thisWinUI.ArrayDataSource([], { compareByIdentity: true });
                }
            }
            utilities.empty(element);

            this._initializeFlipView(element, horizontal, dataSource, itemRenderer, placeholderRenderer, initialIndex, keepInMemory, countToLoad, itemSpacing);

            WinJS.UI.setControl(element, this);
        }, {

            // Public methods

            next: function () {
                /// <summary locid="17">
                /// Makes the FlipView navigate to its next page
                /// </summary>
                /// <returns type="Boolean" locid="18">
                /// Returns true if the navigation started, false if it couldn't move next or is in the middle of another navigation animation
                /// </returns>

                // TODO: Given the similarity between next and prev, look into refactoring the two to use a common code path
                if (this._animating) {
                    return false;
                }

                var animation = (this._nextAnimation ? this._nextAnimation : this._defaultNextAnimation.bind(this));
                var elements = this._pageManager.startAnimatedNext();
                if (elements) {
                    this._animationsStarted();
                    var currElement = elements.curr.div,
                        nextElement = elements.next.div;
                    this._contentDiv.appendChild(currElement);
                    this._contentDiv.appendChild(nextElement);

                    var that = this;

                    animation(currElement, nextElement).then(function () {
                        if (currElement.parentNode) {
                            currElement.parentNode.removeChild(currElement);
                        }
                        if (nextElement.parentNode) {
                            nextElement.parentNode.removeChild(nextElement);
                        }
                        that._pageManager.endAnimatedNext(elements.curr, elements.next);
                        that._animationsFinished();
                    });
                    return true;
                } else {
                    return false;
                }
            },

            previous: function () {
                /// <summary locid="19">
                /// Makes the FlipView navigate to its previous page
                /// </summary>
                /// <returns type="Boolean" locid="20">
                /// Returns true if the navigation started, false if it couldn't move previous or is in the middle of another navigation animation
                /// </returns>

                if (this._animating) {
                    return false;
                }

                var animation = (this._prevAnimation ? this._prevAnimation : this._defaultPrevAnimation.bind(this));
                var elements = this._pageManager.startAnimatedPrevious();
                if (elements) {
                    this._animationsStarted();
                    var currElement = elements.curr.div,
                        prevElement = elements.prev.div;
                    this._contentDiv.appendChild(currElement);
                    this._contentDiv.appendChild(prevElement);

                    var that = this;

                    animation(currElement, prevElement).then(function () {
                        if (currElement.parentNode) {
                            currElement.parentNode.removeChild(currElement);
                        }
                        if (prevElement.parentNode) {
                            prevElement.parentNode.removeChild(prevElement);
                        }
                        that._pageManager.endAnimatedPrevious(elements.curr, elements.prev);
                        that._animationsFinished();
                    });
                    return true;
                } else {
                    return false;
                }
            },

            /// <field type="Number" integer="true" locid="21">
            /// Gets or sets the FlipView's currentPage index
            /// </field>
            currentPage: {
                get: function () {
                    return this._getCurrentIndex();
                },
                set: function (index) {
                    if (this._animating) {
                        return;
                    }

                    var jumpAnimation = (this._jumpAnimation ? this._jumpAnimation : this._defaultJumpAnimation.bind(this));
                    var elements = this._pageManager.startAnimatedJump(index);
                    if (elements) {
                        this._animationsStarted();
                        var currElement = elements.oldPage.div,
                            newCurrElement = elements.newPage.div;
                        this._contentDiv.appendChild(currElement);
                        this._contentDiv.appendChild(newCurrElement);

                        var that = this;

                        jumpAnimation(currElement, newCurrElement).then(function () {
                            if (currElement.parentNode) {
                                currElement.parentNode.removeChild(currElement);
                            }
                            if (newCurrElement.parentNode) {
                                newCurrElement.parentNode.removeChild(newCurrElement);
                            }
                            that._pageManager.endAnimatedJump(elements.oldPage, elements.newPage);
                            that._animationsFinished();
                        });
                    }
                }
            },

            /// <field type="String" locid="22">
            /// Gets or sets the FlipView's orientation
            /// </field>
            orientation: {
                get: function () {
                    return this._axisAsString();
                },
                set: function (orientation) {
                    var horizontal = orientation === "horizontal";
                    if (horizontal !== this._horizontal) {
                        this._horizontal = horizontal;
                        this._setupOrientation();
                        this._pageManager.setOrientation(this._horizontal);
                    }
                }
            },

            /// <field type="object" locid="23">
            /// The datasource that provides the FlipView with items to display
            /// </field>
            dataSource: {
                get: function () {
                    return this._dataSource;
                },

                set: function (dataSource) {
                    this._setDatasource(dataSource, this._itemRenderer, this._placeholderRenderer, 0);
                }
            },

            /// <field locid="24">
            /// A function responsible for generating a tree of DOM elements to represent each item
            /// </field>
            itemRenderer: {
                get: function () {
                    return this._itemRenderer;
                },

                set: function (itemRenderer) {
                    this._setDatasource(this._dataSource, (typeof itemRenderer === "object" ? itemRenderer.renderItem : itemRenderer), this._placeholderRenderer, 0);
                }
            },

            /// <field locid="25">
            /// A function responsible for generating a tree of DOM elements to represent a placeholder item while the real item is being realized
            /// </field>
            placeholderRenderer: {
                get: function () {
                    return this._placeholderRenderer;
                },

                set: function (placeholderRenderer) {
                    this._setDatasource(this._dataSource, this._itemRenderer, (typeof placeholderRenderer === "object" ? placeholderRenderer.renderItem : placeholderRenderer), 0);
                }
            },

            itemSpacing: {
                get: function () {
                    return this._pageManager.getItemSpacing();
                },

                set: function (spacing) {
                    this._pageManager.setItemSpacing(spacing);
                }
            },

            count: function () {
                /// <summary locid="26">
                /// Gets the count of items in the FlipView's datasource.
                /// </summary>
                /// <returns type="WinJS.Promise" locid="27">
                /// A Promise for the count, which may return WinJS.UI.CountResult.unknown when no count is available
                /// </returns>

                var that = this;
                return new WinJS.Promise(function (complete, error) {
                    if (that._itemsManager) {
                        if (that._cachedSize === WinJS.UI.CountResult.unknown || that._cachedSize >= 0) {
                            complete(that._cachedSize);
                        } else {
                            that._dataSource.getCount().then(function (count) {
                                that._cachedSize = count;
                                complete(count);
                            });
                        }
                    } else {
                        error(thisWinUI.FlipView.noitemsManagerForCount);
                    }
                });
            },

            addEventListener: function (eventName, eventHandler, useCapture) {
                /// <summary locid="28">
                /// Adds an event listener
                /// </summary>
                /// <param name="eventName" type="String" locid="29">Event name</param>
                /// <param name="eventHandler" type="Function" locid="30">The event handler function to associate with this event</param>
                /// <param name="useCapture" type="Boolean" locid="31">Whether event handler should be called during the capturing phase</param>

                return this._flipviewDiv.addEventListener(eventName, eventHandler, useCapture);
            },

            removeEventListener: function (eventName, eventHandler, useCapture) {
                /// <summary locid="32">
                /// Removes an event listener
                /// </summary>
                /// <param name="eventName" type="String" locid="29">Event name</param>
                /// <param name="eventHandler" type="Function" locid="30">The event handler function to associate with this event</param>
                /// <param name="useCapture" type="Boolean" locid="31">Whether event handler should be called during the capturing phase</param>

                return this._flipviewDiv.removeEventListener(eventName, eventHandler, useCapture);
            },

            setCustomAnimations: function (animations) {
                /// <summary locid="33">
                /// Sets custom animations for the FlipView to use for navigations
                /// </summary>
                /// <param name="animations" type="Object" locid="34">
                /// An object containing at most three fields: next, previous, and jump
                /// Each of those fields must be a function with the signature: function (outgoingPage, incomingPage).
                /// This function should return a WinJS.Promise object that completes once the animations are finished.
                /// If a field is null, the FlipView will revert to its default animation for that action.
                /// </param>

                if (animations.next !== undefined) {
                    this._nextAnimation = animations.next;
                }
                if (animations.previous !== undefined) {
                    this._prevAnimation = animations.previous;
                }
                if (animations.jump !== undefined) {
                    this._jumpAnimation = animations.jump;
                }
            },

            refresh: function () {
                /// <summary locid="35">
                /// Forces the FlipView to show its content.
                /// This function is useful for resetting a FlipView when using style.display = "none".
                /// </summary>

                this._pageManager.resized();
            },

            // Private members

            _initializeFlipView: function (element, horizontal, dataSource, itemRenderer, placeholderRenderer, initialIndex, keepInMemory, countToLoad, itemSpacing) {
                this._flipviewDiv = element;
                utilities.addClass(this._flipviewDiv, flipViewClass);
                this._contentDiv = document.createElement("div");
                this._panningDivContainer = document.createElement("div");
                this._panningDiv = document.createElement("div");
                this._prevButton = document.createElement("button");
                this._nextButton = document.createElement("button");
                this._horizontal = horizontal;
                this._dataSource = dataSource;
                this._itemRenderer = itemRenderer;
                this._itemsManager = null;
                this._pageManager = null;
                this._cachedSize = -1;
                this._placeholderRenderer = placeholderRenderer;

                if (!this._flipviewDiv.getAttribute("tabindex")) {
                    this._flipviewDiv.setAttribute("tabindex", -1);
                }
                this._flipviewDiv.setAttribute("role", "listbox");
                if (!this._flipviewDiv.style.overflow) {
                    this._flipviewDiv.style.overflow = "hidden";
                }
                this._contentDiv.style.position = "relative";
                this._contentDiv.style.width = "100%";
                this._contentDiv.style.height = "100%";
                this._panningDiv.style.position = "relative";
                this._panningDiv.style.zIndex = 0;
                this._panningDivContainer.style.position = "relative";
                this._panningDivContainer.style.width = "100%";
                this._panningDivContainer.style.height = "100%";


                this._contentDiv.appendChild(this._panningDivContainer);
                this._flipviewDiv.appendChild(this._contentDiv);

                this._panningDiv.style.width = "100%";
                this._panningDiv.style.height = "100%";
                this._setupOrientation();
                function setUpButton(button) {
                    button.setAttribute("aria-hidden", true);
                    button.style.visibility = "hidden";
                    button.style.opacity = 0.0;
                    button.tabIndex = -1;
                }
                setUpButton(this._prevButton);
                setUpButton(this._nextButton);
                this._prevButton.setAttribute("aria-label", previousButtonLabel);
                this._nextButton.setAttribute("aria-label", nextButtonLabel);
                this._panningDivContainer.appendChild(this._panningDiv);
                this._contentDiv.appendChild(this._prevButton);
                this._contentDiv.appendChild(this._nextButton);

                var that = this;

                this._itemsManagerCallback = {
                    // Callbacks for itemsManager
                    inserted: function (element, prev, next) {
                        that._pageManager.inserted(element, prev, next, true);
                    },

                    countChanged: function (newCount, oldCount) {
                        that._cachedSize = newCount;
                        that._fireDatasourceCountChangedEvent();
                    },

                    changed: function (newElement, oldElement) {
                        that._pageManager.changed(newElement, oldElement);
                    },

                    moved: function (element, prev, next) {
                        that._pageManager.moved(element, prev, next);
                    },

                    removed: function (element, mirage) {
                        that._pageManager.removed(element, mirage, true);
                    },

                    knownUpdatesComplete: function () {
                    },

                    beginNotifications: function () {
                        that._pageManager.notificationsStarted();
                    },

                    endNotifications: function () {
                        that._pageManager.notificationsEnded();
                    },

                    itemAvailable: function (real, placeholder) {
                        that._pageManager.itemRetrieved(real, placeholder);
                    }
                };

                if (this._dataSource) {
                    this._itemsManager = thisWinUI.createItemsManager(this._dataSource, this._itemRenderer, this._itemsManagerCallback, {
                        placeholderRenderer: this._placeholderRenderer,
                        ownerElement: this._flipviewDiv
                    });
                    // The FlipView can be passed an array as a datasource that the IM will convert into an ArrayDataSource.
                    // To make sure the FlipView is keeping track of the right datasource, we'll get the datasource back from the IM.
                    this._dataSource = this._itemsManager.dataSource;
                }

                this._pageManager = new thisWinUI._FlipPageManager(this._flipviewDiv, this._panningDiv, this._panningDivContainer, this._itemsManager, keepInMemory, itemSpacing,
                {
                    hidePreviousButton: function () {
                        that._hasPrevContent = false;
                        that._fadeOutButton("prev").then(function () {
                            that._prevButton.style.visibility = "hidden";
                        });
                        that._prevButton.setAttribute("aria-hidden", true);
                    },

                    showPreviousButton: function () {
                        that._hasPrevContent = true;
                        that._fadeInButton("prev");
                        that._prevButton.style.visibility = "visible";
                        that._prevButton.setAttribute("aria-hidden", false);
                    },

                    hideNextButton: function () {
                        that._hasNextContent = false;
                        that._fadeOutButton("next").then(function () {
                            that._nextButton.style.visibility = "hidden";
                        });
                        that._nextButton.setAttribute("aria-hidden", true);
                    },

                    showNextButton: function () {
                        that._hasNextContent = true;
                        that._fadeInButton("next");
                        that._nextButton.style.visibility = "visible";
                        that._nextButton.setAttribute("aria-hidden", false);
                    }
                });

                this._pageManager.initialize(initialIndex, countToLoad, this._horizontal);

                this._dataSource.getCount().then(function (count) {
                    that._cachedSize = count;
                });

                this._prevButton.addEventListener("click", function () {
                    that.previous();
                }, false);

                this._nextButton.addEventListener("click", function () {
                    that.next();
                }, false);

                // resize / onresize doesn't get hit with addEventListener, but it does get hit via attachEvent, so we'll use that here.
                this._flipviewDiv.attachEvent("onresize", function () {
                    that._resize();
                });

                this._contentDiv.addEventListener("mouseenter", function () {
                    that._mouseInViewport = true;
                    if (that._buttonFadePromise) {
                        that._buttonFadePromise.cancel();
                        that._buttonFadePromise = null;
                    }
                    that._fadeInButton("prev");
                    that._fadeInButton("next");
                }, false);

                this._contentDiv.addEventListener("mouseleave", function () {
                    that._mouseInViewport = false;
                    that._buttonFadePromise = WinJS.Promise.timeout(buttonFadeDelay).then(function () {
                        that._fadeOutButton("prev");
                        that._fadeOutButton("next");
                        that._buttonFadePromise = null;
                    });
                }, false);

                this._panningDivContainer.addEventListener("scroll", function () {
                    that._scrollPosChanged();
                }, false);

                // When an element is removed and inserted, its scroll position gets reset to 0 (and no onscroll event is generated). This is a major problem
                // for the flipview thanks to the fact that we 1) Do a lot of inserts/removes of child elements, and 2) Depend on our scroll location being right to
                // display the right stuff. The page manager preserves scroll location. When a flipview element is reinserted, it'll fire DOMNodeInserted and we can reset
                // its scroll location there.
                // This event handler won't be hit in IE8. 
                this._flipviewDiv.addEventListener("DOMNodeInserted", function (event) {
                    if (event.target === that._flipviewDiv) {
                        that._pageManager.resized();
                    }
                }, false);

                this._flipviewDiv.addEventListener("keydown", function (event) {
                    if (!that._animating) {
                        var Key = utilities.Key,
                            handled = false;
                        if (that._horizontal) {
                            switch (event.keyCode) {
                                case Key.leftArrow:
                                    (that._rtl ? that.next() : that.previous());
                                    break;

                                case Key.rightArrow:
                                    (that._rtl ? that.previous() : that.next());
                                    break;
                            }
                        } else {
                            switch (event.keyCode) {
                                case Key.upArrow:
                                    that.previous();
                                    break;

                                case Key.downArrow:
                                    that.next();
                                    break;
                            }
                        }

                        if (handled) {
                            event.preventDefault();
                            event.cancelBubble();
                            return true;
                        }
                    }
                }, false);
            },

            _resize: function () {
                this._pageManager.resized();
            },

            _setCurrentIndex: function (index) {
                return this._pageManager.jumpToIndex(index);
            },

            _getCurrentIndex: function () {
                return this._pageManager.currentIndex();
            },

            _setDatasource: function (source, template, placeholderRenderer, index) {
                var initialIndex = 0;
                if (index !== undefined) {
                    initialIndex = index;
                }
                this._dataSource = source;
                this._itemRenderer = template;
                this._placeholderRenderer = placeholderRenderer;
                this._itemsManager = thisWinUI.createItemsManager(this._dataSource, this._itemRenderer, this._itemsManagerCallback, {
                    placeholderRenderer: this._placeholderRenderer,
                    ownerElement: this._flipviewDiv
                });

                var that = this;
                this._dataSource.getCount().then(function (count) {
                    that._cachedSize = count;
                });
                this._pageManager.setNewItemsManager(this._itemsManager, initialIndex);
            },

            _fireDatasourceCountChangedEvent: function () {
                var event = document.createEvent("Event");
                event.initEvent(thisWinUI.FlipView.datasourceCountChangedEvent, true, true);
                this._flipviewDiv.dispatchEvent(event);
            },

            _scrollPosChanged: function () {
                this._pageManager.scrollPosChanged();
            },

            _axisAsString: function () {
                return (this._horizontal ? "horizontal" : "vertical");
            },

            _setupOrientation: function () {
                if (this._horizontal) {
                    this._panningDivContainer.style["overflow-x"] = "scroll";
                    this._panningDivContainer.style["overflow-y"] = "hidden";
                    this._flipviewDiv.setAttribute("aria-label", horizontalFlipViewLabel);
                    var rtl = window.getComputedStyle(this._flipviewDiv, null).direction === "rtl";
                    this._rtl = rtl;
                    if (rtl) {
                        this._prevButton.className = navButtonClass + " " + navButtonRightClass;
                        this._nextButton.className = navButtonClass + " " + navButtonLeftClass;
                    } else {
                        this._prevButton.className = navButtonClass + " " + navButtonLeftClass;
                        this._nextButton.className = navButtonClass + " " + navButtonRightClass;
                    }
                    this._prevButton.innerHTML = (rtl ? rightArrowGlyph : leftArrowGlyph);
                    this._nextButton.innerHTML = (rtl ? leftArrowGlyph : rightArrowGlyph);
                } else {
                    this._flipviewDiv.setAttribute("aria-label", verticalFlipViewLabel);
                    this._panningDivContainer.style["overflow-y"] = "scroll";
                    this._panningDivContainer.style["overflow-x"] = "hidden";
                    this._prevButton.className = navButtonClass + " " + navButtonTopClass;
                    this._nextButton.className = navButtonClass + " " + navButtonBottomClass;
                    this._prevButton.innerHTML = topArrowGlyph;
                    this._nextButton.innerHTML = bottomArrowGlyph;
                }
                this._panningDivContainer.style["-ms-overflow-style"] = "none";
            },

            _fadeInButton: function (button) {
                if (this._mouseInViewport) {
                    if (button === "next" && this._hasNextContent) {
                        if (this._nextButtonAnimation) {
                            this._nextButtonAnimation.cancel();
                            this._nextButtonAnimation = null;
                        }

                        this._nextButtonAnimation = animation.fadeIn(this._nextButton);
                    } else if (button === "prev" && this._hasPrevContent) {
                        if (this._prevButtonAnimation) {
                            this._prevButtonAnimation.cancel();
                            this._prevButtonAnimation = null;
                        }

                        this._prevButtonAnimation = animation.fadeIn(this._prevButton);
                    }
                }
            },

            _fadeOutButton: function (button) {
                if (button === "next") {
                    if (this._nextButtonAnimation) {
                        this._nextButtonAnimation.cancel();
                        this._nextButtonAnimation = null;
                    }

                    this._nextButtonAnimation = animation.fadeOut(this._nextButton);
                    return this._nextButtonAnimation;
                } else {
                    if (this._prevButtonAnimation) {
                        this._prevButtonAnimation.cancel();
                        this._prevButtonAnimation = null;
                    }

                    this._prevButtonAnimation = animation.fadeOut(this._prevButton);
                    return this._prevButtonAnimation;
                }
            },

            _animationsStarted: function () {
                this._animating = true;
            },

            _animationsFinished: function () {
                this._animating = false;
            },

            _defaultJumpAnimation: function (curr, next) {
                var incomingPageMove = {};
                incomingPageMove.left = (this._horizontal ? (this._rtl ? -jumpAnimationMoveDelta : jumpAnimationMoveDelta) + "px" : "0px");
                incomingPageMove.top = (this._horizontal ? "0px" : jumpAnimationMoveDelta + "px");
                animation.fadeOut(curr);
                // Ideally, the animation.fadeOut + animation.transitionContent promises should be joined.
                // Unfortunately a recent regression in IE has made animation.fadeOut's promise never return, so a joined promise would be bad.
                // For now, we'll return the promise for transitionContent alone (which is okay, since it's the longer animation).
                // When bug 373009 is fixed, we can probably join the two.
                return animation.transitionContent(next, [incomingPageMove]);
            },

            _defaultNextAnimation: function (curr, next) {
                var locationProp = (this._horizontal ? "left" : "top"),
                    sizeProp = (this._horizontal ? "offsetWidth" : "offsetHeight"),
                    offset = next[sizeProp];

                offset += this.itemSpacing
                if (this._horizontal && this._rtl) {
                    offset = -offset;
                }
                next.style[locationProp] = offset + "px";

                return this._customMoveTransition([curr, next], -offset);
            },

            _defaultPrevAnimation: function (curr, prev) {
                var locationProp = (this._horizontal ? "left" : "top"),
                    sizeProp = (this._horizontal ? "offsetWidth" : "offsetHeight"),
                    offset = prev[sizeProp];

                offset += this.itemSpacing
                if (this._horizontal && this._rtl) {
                    offset = -offset;
                }
                prev.style[locationProp] = -offset + "px";

                return this._customMoveTransition([curr, prev], offset);
            },

            _customMoveTransition: function (elements, offset) {
                var transitionInfo = {
                    name: "-ms-transform",
                    delay: 0,
                    duration: 733,
                    timing: "ease-out",
                    transition: function (element) {
                        return true;
                    }
                };

                for (var i = 0, len = elements.length; i < len; i++) {
                    elements[i].style.msTransform = (this._horizontal ? "translateX(" + offset + "px)" : "translateY(" + offset + "px)");
                }

                return thisWinUI.executeTransition(elements, transitionInfo);
            }
        })
    });

    // Statics

    // Events
    thisWinUI.FlipView.datasourceCountChangedEvent = "datasourcecountchanged";
    thisWinUI.FlipView.pageVisibilityChangedEvent = "pagevisibilitychanged";
    thisWinUI.FlipView.pageSelectedEvent = "pageselected";

    // Errors
    thisWinUI.FlipView.noElement = "Invalid argument: A FlipView requires a DOM element passed in as its first parameter"; // TODO: it seems like noElement should be a UI namespace error instead of a dedicated flipview one
    thisWinUI.FlipView.badAxis = "Invalid argument: orientation must be a string, either 'horizontal' or 'vertical'";
    thisWinUI.FlipView.badCurrentPage = "Invalid argument: currentPage must be a number greater than or equal to zero and be within the bounds of the datasource";
    thisWinUI.FlipView.noitemsManagerForCount = "Invalid operation: can't get count if no dataSource has been set";
    thisWinUI.FlipView.badItemSpacingAmount = "Invalid argument: itemSpacing must be a number greater than or equal to zero";
})(WinJS);


(function (WinJS) {
    var thisWinUI = WinJS.UI;

    // Utilities are private and global pointer will be deleted so we need to cache it locally
    var utilities = WinJS.Utilities;

    var animations = WinJS.UI.Animation;

    var leftBufferAmount = 500,
        itemSelectedEventDelay = 250;

    function isFlipper(element) {
        var control = thisWinUI.getControl(element);
        if (control && control instanceof WinJS.UI.FlipView) {
            return true;
        }

        return false;
    }

    WinJS.Namespace.defineWithParent(WinJS, "UI", {

        // Definition of our private utility
        _FlipPageManager: WinJS.Class.define(
            function (flipperDiv, panningDiv, panningDivContainer, itemsManager, keepInMemory, itemSpacing, buttonVisibilityHandler) {
                // Construction
                this._visibleElements = [];
                this._flipperDiv = flipperDiv;
                this._panningDiv = panningDiv;
                this._panningDivContainer = panningDivContainer;
                this._buttonVisibilityHandler = buttonVisibilityHandler;
                this._keepItemsInMemory = keepInMemory;
                this._currentPage = null;
                this._rtl = window.getComputedStyle(this._flipperDiv, null).direction === "rtl";
                this._itemsManager = itemsManager;
                this._itemSpacing = itemSpacing;
                this._tabManager = new WinJS.UI.TabContainer(this._panningDivContainer);
                this._lastTimeoutRequest = null;
                this._lastSelectedPage = null;
                this._lastSelectedElement = null;
                this._bufferSize = thisWinUI._FlipPageManager.flipPageBufferCount;

                var that = this;
                this._panningDiv.addEventListener("keydown", function (event) {
                    if (that._blockTabs && event.keyCode === utilities.Key.tab) {
                        event.stopImmediatePropagation();
                        event.preventDefault();
                    }
                }, true);
                this._flipperDiv.addEventListener("focus", function (event) {
                    if (event.srcElement === that._flipperDiv) {
                        if (that._currentPage.element) {
                            that._currentPage.element.focus();
                        }
                    }
                }, false);
                this._panningDiv.addEventListener("activate", function (event) {
                    that._hasFocus = true;
                }, true);
                this._panningDiv.addEventListener("deactivate", function (event) {
                    that._hasFocus = false;
                }, true);
            },
            {
                // Public Methods

                initialize: function (initialIndex, countToLoad, horizontal) {
                    var currPage = null;

                    this._horizontal = horizontal;
                    if (!this._currentPage) {
                        this._currentPage = this._createFlipPage(null, this);
                        currPage = this._currentPage;
                        this._panningDiv.appendChild(currPage.div);

                        // flipPageBufferCount is added here twice. 
                        // Once for the buffer prior to the current item, and once for the buffer ahead of the current item.
                        var pagesToInit = (countToLoad > 0 ? countToLoad - 1 : 0) + 2 * this._bufferSize;
                        for (var i = 0; i < pagesToInit; i++) {
                            currPage = this._createFlipPage(currPage, this);
                            this._panningDiv.appendChild(currPage.div);
                        }
                    }

                    this._prevMarker = this._currentPage.prev;

                    if (this._itemsManager) {
                        // Use 0 here just to load a currentPage up. We'll be prefetching a bunch of items down below if countToLoad > 0
                        // so we'll load, prefetch, then jumpToPage.
                        this.setNewItemsManager(this._itemsManager, 0);
                    }

                    if (countToLoad > 0) {
                        var curr = this._currentPage,
                            alreadyLoaded = 0;
                        while (curr.element && curr !== this._prevMarker) {
                            alreadyLoaded++;
                            curr = curr.next;
                        }

                        countToLoad -= alreadyLoaded;
                        for (var j = 0; j < countToLoad && curr !== this._prevMarker; j++) {
                            curr.setElement(this._itemsManager.nextItem(curr.prev.element));
                            curr = curr.next;
                        }
                    }

                    if (initialIndex > 0) {
                        if (!this.jumpToIndex(initialIndex)) {
                            throw new Error(thisWinUI.FlipView.badCurrentPage);
                        }
                    } else {
                        this._timeoutPageSelection();
                    }

                    this._ensureCentered();
                    this._setupSnapPoints();
                    this._setListEnds();
                },

                setOrientation: function (horizontal) {
                    if (horizontal !== this._horizontal) {
                        this._horizontal = horizontal;
                        this._forEachPage(function (curr) {
                            var currStyle = curr.div.style;
                            currStyle.left = "0px";
                            currStyle.top = "0px";
                        });
                        this._panningDivContainer.scrollLeft = 0;
                        this._panningDivContainer.scrollTop = 0;

                        this._ensureCentered();
                        this._setupSnapPoints();
                    }
                },

                setNewItemsManager: function (manager, initialIndex) {
                    this._resetBuffer(null);
                    this._itemsManager = manager;
                    if (this._itemsManager) {
                        this._currentPage.setElement(this._itemsManager.firstItem());
                        this._fetchPreviousItems(true);
                        this._fetchNextItems();
                        if (this._currentPage.element) {
                            if (initialIndex !== 0 && !this.jumpToIndex(initialIndex)) {
                                throw new Error(thisWinUI.FlipView.badCurrentPage);
                            }
                        }

                        this._setButtonStates();
                    }
                    this._tabManager.childFocus = this._currentPage.div;
                    this._ensureCentered();
                },

                currentIndex: function () {
                    if (!this._itemsManager) {
                        return 0;
                    }

                    var element = (this._navigationAnimationRecord ? this._navigationAnimationRecord.newCurrentElement : this._currentPage.element);
                    return (element ? this._itemsManager.itemIndex(element) : 0);
                },

                resetScrollPos: function () {
                    this._ensureCentered();
                },

                scrollPosChanged: function () {
                    if (!this._itemsManager || !this._currentPage.element) {
                        return;
                    }

                    var newPos = this._viewportStart(),
                        bufferEnd = (this._lastScrollPos > newPos ? this._getTailOfBuffer() : this._getHeadOfBuffer());

                    if (newPos === this._lastScrollPos) {
                        return;
                    }

                    while (this._currentPage.element && this._itemStart(this._currentPage) > newPos) {
                        if (this._currentPage.prev.element) {
                            this._currentPage = this._currentPage.prev;
                            this._fetchOnePrevious(bufferEnd.prev);
                        } else {
                            // TODO: When virtual bounds work, this is unneccessary. Replace this code with a break statement
                            if (this._currentPage.element) {
                                this._viewportStart(this._itemStart(this._currentPage));
                                var containerStyle = this._panningDivContainer.style;

                                containerStyle["overflow-x"] = "hidden";
                                containerStyle["overflow-y"] = "hidden";

                                var that = this;
                                msSetImmediate(function () {
                                    containerStyle["overflow-x"] = that._horizontal ? "scroll" : "hidden";
                                    containerStyle["overflow-y"] = that._horizontal ? "hidden" : "scroll";
                                });
                                return;
                            }
                        }
                    }

                    while (this._currentPage.element && this._itemEnd(this._currentPage) <= newPos) {
                        if (this._currentPage.next.element) {
                            this._currentPage = this._currentPage.next;
                            this._fetchOneNext(bufferEnd.next);
                        } else {
                            break;
                        }
                    }
                    this._setButtonStates();
                    this._checkElementVisibility(false);
                    this._blockTabs = true;
                    this._lastScrollPos = newPos;
                    if (this._tabManager.childFocus !== this._currentPage.div) {
                        this._tabManager.childFocus = this._currentPage.div;
                    }

                    if (this._viewportOnItemStart()) {
                        this._timeoutPageSelection();
                    }
                    this._setListEnds();
                },

                itemRetrieved: function (real, placeholder) {
                    var that = this;
                    this._forEachPage(function (curr) {
                        if (curr.element === placeholder) {
                            if (curr === that._currentPage || curr === that._currentPage.next) {
                                that._changeFlipPage(curr, placeholder, real);
                            } else {
                                curr.setElement(real, true);
                            }
                            return true;
                        }
                    });
                    if (this._navigationAnimationRecord) {
                        var animatingElements = this._navigationAnimationRecord.elementContainers;
                        for (var i = 0, len = animatingElements.length; i < len; i++) {
                            if (animatingElements[i].element === placeholder) {
                                that._changeFlipPage(animatingElements[i], placeholder, real);
                                animatingElements[i].element = real;
                                real.style.position = "absolute";
                                animatingElements[i].centerElement();
                            }
                        }
                    }
                    this._checkElementVisibility(false);
                },

                resized: function () {
                    var newWidth = this._panningDivContainer.offsetWidth,
                        newHeight = this._panningDivContainer.offsetHeight;
                    this._forEachPage(function (curr) {
                        curr.div.style.width = newWidth + "px";
                        curr.div.style.height = newHeight + "px";
                        curr.centerElement();
                    });
                    this._ensureCentered();
                    this._setupSnapPoints();
                    this._setListEnds();
                },

                jumpToIndex: function (index) {
                    if (!this._itemsManager || !this._currentPage.element || index < 0) {
                        return false;
                    }

                    // If we've got to keep our pages in memory, we need to iterate through every single item from our current position to the desired target
                    var i,
                        currIndex = this._itemsManager.itemIndex(this._currentPage.element),
                        distance = Math.abs(index - currIndex);

                    if (distance === 0) {
                        return false;
                    }

                    if (this._keepItemsInMemory) {
                        var newCurrent = this._currentPage;
                        if (index > currIndex) {
                            for (i = 0; i < distance && newCurrent.element; i++) {
                                if (newCurrent.next === this._prevMarker) {
                                    this._fetchOneNext(newCurrent.next);
                                }
                                newCurrent = newCurrent.next;
                                if (!newCurrent.element) {
                                    newCurrent.setElement(this._itemsManager.nextItem(newCurrent.prev.element));
                                }
                            }
                        } else {
                            for (i = 0; i < distance && newCurrent.element; i++) {
                                if (newCurrent.prev === this._prevMarker.prev) {
                                    this._fetchOnePrevious(newCurrent.prev);
                                }
                                newCurrent = newCurrent.prev;
                                if (!newCurrent.element) {
                                    newCurrent.setElement(this._itemsManager.previousItem(newCurrent.next.element));
                                }
                            }
                        }

                        if (!newCurrent.element) {
                            return false;
                        } else {
                            this._currentPage = newCurrent;
                            this._fetchNextItems();
                            this._fetchPreviousItems(false);
                        }

                    } else {
                        var elementAtIndex = this._itemsManager.itemAtIndex(index);
                        if (!elementAtIndex) {
                            return false;
                        }

                        this._resetBuffer(elementAtIndex);
                        this._currentPage.setElement(elementAtIndex);
                        this._fetchNextItems();
                        this._fetchPreviousItems(true);
                    }
                    this._setButtonStates();
                    if (this._tabManager.childFocus !== this._currentPage.div) {
                        this._tabManager.childFocus = this._currentPage.div;
                    }
                    return true;
                },

                startAnimatedNext: function () {
                    if (this._currentPage.element && this._currentPage.next.element) {
                        this._navigationAnimationRecord = {};
                        this._navigationAnimationRecord.oldCurrentPage = this._currentPage;
                        this._navigationAnimationRecord.newCurrentPage = this._currentPage.next;
                        var currElement = this._currentPage.element;
                        var nextElement = this._currentPage.next.element;
                        this._navigationAnimationRecord.newCurrentElement = nextElement;

                        this._currentPage.setElement(null, true);
                        this._currentPage.next.setElement(null, true);

                        var elements = {
                            curr: this._createDiscardablePage(currElement),
                            next: this._createDiscardablePage(nextElement)
                        };
                        elements.curr.div.style.position = "absolute";
                        elements.next.div.style.position = "absolute";
                        this._itemStart(elements.curr, 0, 0);
                        this._itemStart(elements.next, 0, 0);
                        this._blockTabs = true;
                        this._visibleElements.push(nextElement);
                        this._announceElementVisible(nextElement);
                        this._navigationAnimationRecord.elementContainers = [elements.curr, elements.next];
                        return elements;
                    }

                    return null;
                },

                endAnimatedNext: function (curr, next) {
                    this._navigationAnimationRecord.oldCurrentPage.setElement(curr.element, true);
                    this._navigationAnimationRecord.newCurrentPage.setElement(next.element, true);
                    this._viewportStart(this._itemStart(this._currentPage.next));
                    this._navigationAnimationRecord = null;
                    this._timeoutPageSelection();
                },

                startAnimatedPrevious: function () {
                    if (this._currentPage.element && this._currentPage.prev.element) {
                        this._navigationAnimationRecord = {};
                        this._navigationAnimationRecord.oldCurrentPage = this._currentPage;
                        this._navigationAnimationRecord.newCurrentPage = this._currentPage.prev;
                        var currElement = this._currentPage.element;
                        var prevElement = this._currentPage.prev.element;
                        this._navigationAnimationRecord.newCurrentElement = prevElement;

                        this._currentPage.setElement(null, true);
                        this._currentPage.prev.setElement(null, true);

                        var elements = {
                            curr: this._createDiscardablePage(currElement),
                            prev: this._createDiscardablePage(prevElement)
                        };
                        elements.curr.div.style.position = "absolute";
                        elements.prev.div.style.position = "absolute";
                        this._itemStart(elements.curr, 0, 0);
                        this._itemStart(elements.prev, 0, 0);
                        this._blockTabs = true;
                        this._visibleElements.push(prevElement);
                        this._announceElementVisible(prevElement);
                        this._navigationAnimationRecord.elementContainers = [elements.curr, elements.prev];
                        return elements;
                    }

                    return null;
                },

                endAnimatedPrevious: function (curr, prev) {
                    this._navigationAnimationRecord.oldCurrentPage.setElement(curr.element, true);
                    this._navigationAnimationRecord.newCurrentPage.setElement(prev.element, true);
                    this._viewportStart(this._itemStart(this._currentPage.prev));
                    this._navigationAnimationRecord = null;
                    this._timeoutPageSelection();
                },

                startAnimatedJump: function (index) {
                    if (this._currentPage.element) {
                        var oldElement = this._currentPage.element;
                        if (!this.jumpToIndex(index)) {
                            return null;
                        }
                        this._navigationAnimationRecord = {};
                        this._navigationAnimationRecord.oldCurrentPage = null;
                        var that = this;
                        this._forEachPage(function (curr) {
                            if (curr.element === oldElement) {
                                that._navigationAnimationRecord.oldCurrentPage = curr;
                                return true;
                            }
                        });
                        this._navigationAnimationRecord.newCurrentPage = this._currentPage;
                        if (this._navigationAnimationRecord.newCurrentPage === this._navigationAnimationRecord.oldCurrentPage) {
                            return null;
                        }
                        var newElement = this._currentPage.element;
                        this._navigationAnimationRecord.newCurrentElement = newElement;

                        this._currentPage.setElement(null, true);
                        if (this._navigationAnimationRecord.oldCurrentPage) {
                            this._navigationAnimationRecord.oldCurrentPage.setElement(null, true);
                        }

                        var elements = {
                            oldPage: this._createDiscardablePage(oldElement),
                            newPage: this._createDiscardablePage(newElement)
                        };
                        elements.oldPage.div.style.position = "absolute";
                        elements.newPage.div.style.position = "absolute";
                        this._itemStart(elements.oldPage, 0, 0);
                        this._itemStart(elements.newPage, 0, 0);
                        this._visibleElements.push(newElement);
                        this._announceElementVisible(newElement);
                        this._navigationAnimationRecord.elementContainers = [elements.oldPage, elements.newPage];
                        this._blockTabs = true;
                        return elements;
                    }

                    return null;
                },

                endAnimatedJump: function (oldCurr, newCurr) {
                    if (this._navigationAnimationRecord.oldCurrentPage) {
                        this._navigationAnimationRecord.oldCurrentPage.setElement(oldCurr.element, true);
                    }
                    this._navigationAnimationRecord.newCurrentPage.setElement(newCurr.element, true);
                    this._navigationAnimationRecord = null;
                    this._ensureCentered();
                    this._timeoutPageSelection();
                },

                inserted: function (element, prev, next, animateInsertion) {
                    var curr = this._prevMarker,
                        passedCurrent = false,
                        elementSuccessfullyPlaced = false;

                    if (animateInsertion) {
                        this._createAnimationRecord(element, null);
                        this._getAnimationRecord(element).inserted = true;
                    }

                    if (next && next === this._prevMarker.element) {
                        if (this._keepItemsInMemory) {
                            this._prevMarker = this._insertNewFlipPage(this._prevMarker.prev);
                            this._prevMarker.setElement(element);
                            elementSuccessfullyPlaced = true;
                        }
                    } else if (!prev) {
                        if (!next) {
                            this._currentPage.setElement(element);
                        } else {
                            while (curr.next !== this._prevMarker && curr.element !== next) {
                                if (curr === this._currentPage) {
                                    passedCurrent = true;
                                }
                                curr = curr.next;
                            }

                            // We never should go past current if prev is null/undefined.

                            if (curr.element === next && curr !== this._prevMarker) {
                                curr.prev.setElement(element);
                                elementSuccessfullyPlaced = true;
                            } else {
                                this._itemsManager.releaseItem(element);
                            }
                        }
                    } else {
                        do {
                            if (curr === this._currentPage) {
                                passedCurrent = true;
                            }
                            if (curr.element === prev) {
                                elementSuccessfullyPlaced = true;
                                if (this._keepItemsInMemory) {
                                    var newPage = this._insertNewFlipPage(curr);
                                    newPage.setElement(element);
                                } else {
                                    var pageShifted = curr,
                                        lastElementMoved = element,
                                        temp;
                                    if (passedCurrent) {
                                        while (pageShifted.next !== this._prevMarker) {
                                            temp = pageShifted.next.element;
                                            pageShifted.next.setElement(lastElementMoved, true);
                                            lastElementMoved = temp;
                                            pageShifted = pageShifted.next;
                                        }
                                    } else {
                                        while (pageShifted.next !== this._prevMarker) {
                                            temp = pageShifted.element;
                                            pageShifted.setElement(lastElementMoved, true);
                                            lastElementMoved = temp;
                                            pageShifted = pageShifted.prev;
                                        }
                                    }
                                    if (lastElementMoved) {
                                        this._itemsManager.releaseItem(lastElementMoved);
                                    }
                                }
                                break;
                            }
                            curr = curr.next;
                        } while (curr !== this._prevMarker);
                    }

                    this._getAnimationRecord(element).successfullyMoved = elementSuccessfullyPlaced;
                    this._setButtonStates();
                },

                changed: function (newVal, element) {
                    var curr = this._prevMarker;
                    var that = this;
                    this._forEachPage(function (curr) {
                        if (curr.element === element) {
                            var record = that._getAnimationRecord(element);
                            record.changed = true;
                            record.oldElement = element;
                            record.newElement = newVal;
                            curr.element = newVal; // We set curr's element field here so that next/prev works, but we won't update the visual until endNotifications
                            return true;
                        }
                    });
                    this._checkElementVisibility(false);
                },

                moved: function (element, prev, next) {
                    var record = this._getAnimationRecord(element);

                    if (!record) {
                        record = this._createAnimationRecord(element);
                    }

                    record.moved = true;
                    this.removed(element, false, false);
                    if (prev || next) {
                        this.inserted(element, prev, next, false);
                    } else {
                        record.successfullyMoved = false;
                    }
                },

                removed: function (element, mirage, animateRemoval) {
                    var elementRemoved = false,
                        prevMarker = this._prevMarker;

                    if (animateRemoval) {
                        this._getAnimationRecord(element).removed = true;
                    }
                    if (this._currentPage.element === element) {
                        if (this._currentPage.next.element) {
                            this._shiftLeft(this._currentPage);
                        } else if (this._currentPage.prev.element) {
                            this._shiftRight(this._currentPage);
                        } else {
                            this._currentPage.setElement(null, true);
                        }
                        elementRemoved = true;
                    } else if (prevMarker.element === element) {
                        prevMarker.setElement(this._itemsManager.previousItem(element));
                        elementRemoved = true;
                    } else if (prevMarker.prev.element === element) {
                        prevMarker.prev.setElement(this._itemsManager.nextItem(element));
                        elementRemoved = true;
                    } else {
                        var curr = this._currentPage.prev,
                            handled = false;
                        while (curr !== prevMarker && !handled) {
                            if (curr.element === element) {
                                this._shiftRight(curr);
                                elementRemoved = true;
                                handled = true;
                            }

                            curr = curr.prev;
                        }

                        curr = this._currentPage.next;
                        while (curr !== prevMarker && !handled) {
                            if (curr.element === element) {
                                this._shiftLeft(curr);
                                elementRemoved = true;
                                handled = true;
                            }

                            curr = curr.next;
                        }
                    }

                    // TODO: if currentPage is null, try not to get into a mirage loop
                    this._setButtonStates();
                },

                getItemSpacing: function () {
                    return this._itemSpacing;
                },

                setItemSpacing: function (space) {
                    this._itemSpacing = space;
                    this._ensureCentered();
                    this._setupSnapPoints();
                },

                notificationsStarted: function () {
                    this._temporaryKeys = [];
                    this._animationRecords = {};
                    var that = this;
                    this._forEachPage(function (curr) {
                        that._createAnimationRecord(curr.element, curr);
                    });

                    // Since the current item is defined as the left-most item in the view, the only possible elements that can be in view at any time are
                    // the current item and the item proceeding it. We'll save these two elements for animations during the notificationsEnded cycle
                    this._animationRecords.currentPage = this._currentPage.element;
                    this._animationRecords.nextPage = this._currentPage.next.element;
                },

                notificationsEnded: function () {
                    // The animations are broken down into three parts.
                    // First, we move everything back to where it was before the changes happened. Elements that were inserted between two pages won't have their flip pages moved.
                    // Next, we figure out what happened to the two elements that used to be in view. If they were removed/moved, they get animated as appropriate in this order:
                    // removed, moved
                    // Finally, we figure out how the items that are now in view got there, and animate them as necessary, in this order: moved, inserted.
                    // The moved animation of the last part is joined with the moved animation of the previous part, so in the end it is:
                    // removed -> moved items in view + moved items not in view -> inserted.
                    var that = this;
                    var animationPromises = [];
                    this._forEachPage(function (curr) {
                        var record = that._getAnimationRecord(curr.element);
                        if (record) {
                            if (record.changed) {
                                // We don't need to know when the change animation completes, so the promise returned here is ignored
                                that._changeFlipPage(curr, record.oldElement, record.newElement);
                            }
                            record.newLocation = curr.location;
                            that._itemStart(curr, record.originalLocation);
                            if (record.inserted) {
                                curr.div.style.opacity = 0.0;
                            }
                        }
                    });

                    function flipPageFromElement(element) {
                        var flipPage = null;
                        that._forEachPage(function (curr) {
                            if (curr.element === element) {
                                flipPage = curr;
                                return true;
                            }
                        });
                        return flipPage;
                    }

                    function animateOldViewportItemRemoved(record, item) {
                        var removedPage = that._createDiscardablePage(item);
                        that._itemStart(removedPage, record.originalLocation);
                        animationPromises.push(that._deleteFlipPage(removedPage));
                    }

                    function animateOldViewportItemMoved(record, item) {
                        var newLocation = record.originalLocation,
                            movedPage;
                        if (!record.successfullyMoved) {
                            // If the old visible item got moved, but the next/prev of that item don't match up with anything
                            // currently in our flip page buffer, we need to figure out in which direction it moved.
                            // The exact location doesn't matter since we'll be deleting it anyways, but we do need to
                            // animate it going in the right direction.
                            movedPage = that._createDiscardablePage(item);
                            var indexMovedTo = that._itemsManager.itemIndex(item);
                            var newCurrentIndex = (that._currentPage.element ? that._itemsManager.itemIndex(that._currentPage.element) : 0);
                            newLocation += (newCurrentIndex > indexMovedTo ? -100 * that._bufferSize : 100 * that._bufferSize);
                        } else {
                            movedPage = flipPageFromElement(item);
                            newLocation = record.newLocation;
                        }
                        that._itemStart(movedPage, record.originalLocation);
                        animationPromises.push(that._moveFlipPage(movedPage, function () {
                            that._itemStart(movedPage, newLocation);
                        }));
                    }

                    var oldCurrent = this._animationRecords.currentPage,
                        oldCurrentRecord = this._getAnimationRecord(oldCurrent),
                        oldNext = this._animationRecords.nextPage,
                        oldNextRecord = this._getAnimationRecord(oldNext);
                    if (oldCurrentRecord && oldCurrentRecord.changed) {
                        oldCurrent = oldCurrentRecord.newElement;
                    }
                    if (oldNextRecord && oldNextRecord.changed) {
                        oldNext = oldNextRecord.newElement;
                    }

                    if (oldCurrent !== this._currentPage.element || oldNext !== this._currentPage.next.element) {
                        if (oldCurrentRecord && oldCurrentRecord.removed) {
                            animateOldViewportItemRemoved(oldCurrentRecord, oldCurrent);
                        }
                        if (oldNextRecord && oldNextRecord.removed) {
                            animateOldViewportItemRemoved(oldNextRecord, oldNext);
                        }
                    }

                    function joinAnimationPromises() {
                        if (animationPromises.length === 0) {
                            animationPromises.push(WinJS.Promise.wrap());
                        }

                        return WinJS.Promise.join(animationPromises);
                    }
                    this._blockTabs = true;
                    joinAnimationPromises().then(function () {
                        animationPromises = [];
                        if (oldCurrentRecord && oldCurrentRecord.moved) {
                            animateOldViewportItemMoved(oldCurrentRecord, oldCurrent);
                        }
                        if (oldNextRecord && oldNextRecord.moved) {
                            animateOldViewportItemMoved(oldNextRecord, oldNext);
                        }
                        var newCurrRecord = that._getAnimationRecord(that._currentPage.element),
                            newNextRecord = that._getAnimationRecord(that._currentPage.next.element);
                        that._forEachPage(function (curr) {
                            var record = that._getAnimationRecord(curr.element);
                            if (record) {
                                if (!record.inserted) {
                                    if (record.originalLocation !== record.newLocation) {
                                        if ((record !== oldCurrentRecord && record !== oldNextRecord) ||
                                            (record === oldCurrentRecord && !oldCurrentRecord.moved) ||
                                            (record === oldNextRecord && !oldNextRecord.moved)) {
                                            animationPromises.push(that._moveFlipPage(curr, function () {
                                                that._itemStart(curr, record.newLocation);
                                            }));
                                        }
                                    }
                                } else if (record !== newCurrRecord && record !== newNextRecord) {
                                    curr.div.style.opacity = 1.0;
                                }
                            }
                        });
                        joinAnimationPromises().then(function () {
                            animationPromises = [];
                            if (newCurrRecord && newCurrRecord.inserted) {
                                animationPromises.push(that._insertFlipPage(that._currentPage));
                            }
                            if (newNextRecord && newNextRecord.inserted) {
                                animationPromises.push(that._insertFlipPage(that._currentPage.next));
                            }
                            joinAnimationPromises().then(function () {
                                that._checkElementVisibility(false);
                                that._timeoutPageSelection();
                                that._setListEnds();
                            });
                        });
                    });
                },

                // Private methods

                _timeoutPageSelection: function () {
                    var that = this;
                    if (this._lastTimeoutRequest) {
                        this._lastTimeoutRequest.cancel();
                    }
                    this._lastTimeoutRequest = WinJS.Promise.timeout(itemSelectedEventDelay);
                    this._lastTimeoutRequest.then(function () {
                        that._itemSettledOn();
                    });
                },

                _getTemporaryKey: function (e) {
                    var key = null;
                    for (var i = 0; i < this._temporaryKeys.length; i++) {
                        if (this._temporaryKeys[i].element === e) {
                            key = this._temporaryKeys[i].key;
                            return true;
                        }
                    }

                    if (!key) {
                        key = "tempFlipViewAnimationKey" + this._temporaryKeys.length;
                        this._temporaryKeys.push({ key: key, element: e });
                    }

                    return key;
                },

                _getElementKey: function (element) {
                    return (element.msDataItem ? element.msDataItem.key : this._getTemporaryKey(element));
                },

                _getAnimationRecord: function (element) {
                    return (element ? this._animationRecords[this._getElementKey(element)] : null);
                },

                _createAnimationRecord: function (element, flipPage) {
                    if (element) {
                        var record = this._animationRecords[this._getElementKey(element)] = {
                            removed: false,
                            changed: false,
                            inserted: false
                        };

                        if (flipPage) {
                            record.originalLocation = flipPage.location;
                        }

                        return record;
                    }
                },

                _resetBuffer: function (elementToSave) {
                    var head = this._currentPage,
                        curr = head;
                    do {
                        if (curr.element && curr.element === elementToSave) {
                            curr.setElement(null, true);
                        } else {
                            curr.setElement(null);
                        }
                        curr = curr.next;
                    } while (curr !== head);
                },

                _getHeadOfBuffer: function () {
                    return this._prevMarker.prev;
                },

                _getTailOfBuffer: function () {
                    return this._prevMarker;
                },

                _insertNewFlipPage: function (prevElement) {
                    var newPage = this._createFlipPage(prevElement, this);
                    this._panningDiv.appendChild(newPage.div);
                    return newPage;
                },

                _fetchNextItems: function () {
                    var curr = this._currentPage;
                    for (var i = 0; i < this._bufferSize; i++) {
                        if (curr.next === this._prevMarker) {
                            this._insertNewFlipPage(curr);
                        }
                        if (curr.element) {
                            curr.next.setElement(this._itemsManager.nextItem(curr.element));
                        } else {
                            curr.next.setElement(null);
                        }
                        curr = curr.next;
                    }
                },

                _fetchOneNext: function (target) {
                    var prevElement = target.prev.element;
                    // If the target we want to fill with the next item is the end of the circular buffer but we want to keep everything in memory, we've got to increase the buffer size
                    // so that we don't reuse prevMarker.
                    if (this._prevMarker === target) {
                        if (this._keepItemsInMemory) {
                            if (!prevElement) {
                                return; // If there's no previous element, there's no sense in us creating a new flip page for something that will be blank
                            }
                            target = this._insertNewFlipPage(target.prev);
                        } else {
                            this._prevMarker = this._prevMarker.next;
                        }
                    }
                    if (!prevElement) {
                        target.setElement(null);
                        return;
                    }
                    target.setElement(this._itemsManager.nextItem(prevElement));
                    this._movePageAhead(target.prev, target);
                },

                _fetchPreviousItems: function (setPrevMarker) {
                    var curr = this._currentPage;
                    for (var i = 0; i < this._bufferSize; i++) {
                        if (curr.element) {
                            curr.prev.setElement(this._itemsManager.previousItem(curr.element));
                        } else {
                            curr.prev.setElement(null);
                        }
                        curr = curr.prev;
                    }

                    if (setPrevMarker) {
                        this._prevMarker = curr;
                    }
                },

                _fetchOnePrevious: function (target) {
                    var nextElement = target.next.element;

                    // If the target we want to fill with the previous item is the end of the circular buffer but we want to keep everything in memory, we've got to increase the buffer size
                    // so that we don't reuse prevMarker. We'll add a new element to be prevMarker's prev, then set prevMarker to point to that new element.
                    if (this._prevMarker === target.next) {
                        if (this._keepItemsInMemory) {
                            if (!nextElement) {
                                return; // If there's no next element, there's no sense in us creating a new flip page for something that will be blank
                            }
                            target = this._insertNewFlipPage(target.prev);
                            this._prevMarker = target;
                        } else {
                            this._prevMarker = this._prevMarker.prev;
                        }
                    }
                    if (!nextElement) {
                        target.setElement(null);
                        return;
                    }
                    target.setElement(this._itemsManager.previousItem(nextElement));
                    this._movePageBehind(target.next, target);
                },

                _setButtonStates: function () {
                    if (this._currentPage.prev.element) {
                        this._buttonVisibilityHandler.showPreviousButton();
                    } else {
                        this._buttonVisibilityHandler.hidePreviousButton();
                    }

                    if (this._currentPage.next.element) {
                        this._buttonVisibilityHandler.showNextButton();
                    } else {
                        this._buttonVisibilityHandler.hideNextButton();
                    }
                },

                _ensureCentered: function () {
                    var center = leftBufferAmount * this._viewportSize();
                    var offsetAtMid = leftBufferAmount * this._itemSpacing;

                    this._itemStart(this._currentPage, center + offsetAtMid);
                    var curr = this._currentPage;
                    while (curr !== this._prevMarker) {
                        this._movePageBehind(curr, curr.prev);
                        curr = curr.prev;
                    }

                    curr = this._currentPage;
                    while (curr.next !== this._prevMarker) {
                        this._movePageAhead(curr, curr.next);
                        curr = curr.next;
                    }
                    this._lastScrollPos = this._itemStart(this._currentPage);
                    this._viewportStart(this._lastScrollPos);
                    this._checkElementVisibility(true);
                    this._setListEnds();
                },

                _shiftLeft: function (startingPoint) {
                    var curr = startingPoint,
                        nextEl = null;
                    while (curr !== this._prevMarker && curr.next !== this._prevMarker) {
                        nextEl = curr.next.element;
                        curr.next.setElement(null, true);
                        curr.setElement(nextEl, true);
                        curr = curr.next;
                    }
                    if (curr !== this._prevMarker && curr.prev.element) {
                        curr.setElement(this._itemsManager.nextItem(curr.prev.element));
                        this._createAnimationRecord(curr.element, curr);
                    }
                },

                _shiftRight: function (startingPoint) {
                    var curr = startingPoint,
                        prevEl = null;
                    while (curr !== this._prevMarker) {
                        prevEl = curr.prev.element;
                        curr.prev.setElement(null, true);
                        curr.setElement(prevEl, true);
                        curr = curr.prev;
                    }
                    if (curr.next.element) {
                        curr.setElement(this._itemsManager.previousItem(curr.next.element));
                        this._createAnimationRecord(curr.element, curr);
                    }
                },

                _checkElementVisibility: function (viewWasReset) {
                    var i,
                        len;
                    if (viewWasReset) {
                        var currentElement = this._currentPage.element;
                        for (i = 0, len = this._visibleElements.length; i < len; i++) {
                            if (this._visibleElements[i] !== currentElement) {
                                this._announceElementInvisible(this._visibleElements[i]);
                            }
                        }

                        this._visibleElements = [];
                        if (currentElement) {
                            this._visibleElements.push(currentElement);
                            this._announceElementVisible(currentElement);
                        }
                    } else {
                        // Elements that have been removed completely from the flipper still need to raise pageVisibilityChangedEvents if they were visible prior to being removed,
                        // so before going through all the elements we go through the ones that we knew were visible and see if they're missing a parentNode. If they are,
                        // the elements were removed and we announce them as invisible.
                        for (i = 0, len = this._visibleElements.length; i < len; i++) {
                            if (!this._visibleElements[i].parentNode) {
                                this._announceElementInvisible(this._visibleElements[i]);
                            }
                        }
                        this._visibleElements = [];
                        var that = this;
                        this._forEachPage(function (curr) {
                            var element = curr.element;
                            if (element) {
                                if (that._itemInView(curr)) {
                                    that._visibleElements.push(element);
                                    that._announceElementVisible(element);
                                } else {
                                    that._announceElementInvisible(element);
                                }
                            }
                        });
                    }
                },

                _announceElementVisible: function (element) {
                    if (element && !element.visible) {
                        element.visible = true;

                        var event = document.createEvent("CustomEvent");
                        event.initCustomEvent(thisWinUI.FlipView.pageVisibilityChangedEvent, true, true, { source: this._flipperDiv, visible: true });

                        element.dispatchEvent(event);
                    }
                },

                _announceElementInvisible: function (element) {
                    if (element && element.visible) {
                        element.visible = false;

                        // Elements that have been removed from the flipper still need to fire invisible events, but they can't do that without being in the DOM.
                        // To fix that, we add the element back into the flipper, fire the event, then remove it.
                        var addedToDomForEvent = false;
                        if (!element.parentNode) {
                            addedToDomForEvent = true;
                            this._panningDivContainer.appendChild(element);
                        }

                        var event = document.createEvent("CustomEvent");
                        event.initCustomEvent(thisWinUI.FlipView.pageVisibilityChangedEvent, true, true, { source: this._flipperDiv, visible: false });

                        element.dispatchEvent(event);
                        if (addedToDomForEvent) {
                            this._panningDivContainer.removeChild(element);
                        }
                    }
                },

                _createDiscardablePage: function (content) {
                    var page = { div: document.createElement("div") },
                        div = page.div,
                        currentPage = this._currentPage.div,
                        divStyle = div.style;
                    divStyle.width = currentPage.offsetWidth + "px";
                    divStyle.height = currentPage.offsetHeight + "px";
                    divStyle.position = "absolute";
                    divStyle.zIndez = 1;
                    divStyle.top = "0px";
                    page.discardable = true;
                    page.element = content;
                    div.appendChild(content);
                    content.style.position = "absolute";
                    this._panningDiv.appendChild(page.div);
                    page.centerElement = function () {
                        page.element.style.left = Math.max((page.div.offsetWidth - page.element.offsetWidth) / 2, 0) + "px";
                        page.element.style.top = Math.max((page.div.offsetHeight - page.element.offsetHeight) / 2, 0) + "px";
                    };
                    page.centerElement();
                    return page;
                },

                _createFlipPage: function (prev, manager) {
                    var page = {},
                        width = this._panningDivContainer.offsetWidth,
                        height = this._panningDivContainer.offsetHeight;
                    page.element = null;

                    // The flip pages are managed as a circular doubly-linked list. this.currentItem should always refer to the current item in view, and this._prevMarker marks the point 
                    // in the list where the last previous item is stored. Why a circular linked list?
                    // The virtualized flipper reuses its flip pages. When a new item is requested, the flipper needs to reuse an old item from the buffer. In the case of previous items,
                    // the flipper has to go all the way back to the farthest next item in the buffer and recycle it (which is why having a .prev pointer on the farthest previous item is really useful),
                    // and in the case of the next-most item, it needs to recycle next's next (ie, the this._prevMarker). The linked structure comes in really handy when iterating through the list
                    // and separating out prev items from next items (like removed and ensureCentered do). If we were to use a structure like an array it would be pretty messy to do that and still
                    // maintain a buffer of recyclable items.
                    if (!prev) {
                        page.next = page;
                        page.prev = page;
                    } else {
                        page.prev = prev;
                        page.next = prev.next;
                        page.next.prev = page;
                        prev.next = page;
                    }

                    page.div = document.createElement("div");
                    var pageStyle = page.div.style;
                    pageStyle.position = "absolute";
                    pageStyle.overflow = "hidden";
                    pageStyle.width = width + "px";
                    pageStyle.height = height + "px";

                    // Simple function to center the element contained in the page div. Also serves as the callback for page.div.onresize + hosted element.onresize.
                    page.centerElement = function () {
                        if (page.element && page.element.style) {
                            var x = 0,
                                y = 0;
                            if (page.element.offsetWidth < page.div.offsetWidth) {
                                x = Math.floor((page.div.offsetWidth - page.element.offsetWidth) / 2);
                            }

                            if (page.element.offsetHeight < page.div.offsetHeight) {
                                y = Math.floor((page.div.offsetHeight - page.element.offsetHeight) / 2);
                            }
                            page.element.style.left = x + "px";
                            page.element.style.top = y + "px";
                        }
                    };

                    // Sets the element to display in this flip page
                    page.setElement = function (element, isReplacement) {
                        if (element === undefined) {
                            element = null;
                        }
                        if (element === page.element) {
                            return;
                        }
                        if (page.element) {
                            if (!isReplacement) {
                                manager._itemsManager.releaseItem(page.element);
                            }
                            page.element.detachEvent("onresize", page.centerElement);
                            page.element.flipperResizeHandlerSet = false;
                        }
                        page.element = element;
                        utilities.empty(page.div);

                        if (page.element) {
                            if (!isFlipper(page.element)) {
                                page.element.tabIndex = 0;
                                page.element.setAttribute("role", "option");
                                page.element.setAttribute("aria-selected", false);
                            }
                            page.div.appendChild(page.element);
                            if (page.element.style) {
                                page.element.style.position = "absolute";
                            }
                            if (!page.element.flipperResizeHandlerSet) {
                                page.element.attachEvent("onresize", page.centerElement);
                                page.element.flipperResizeHandlerSet = true;
                            }
                            page.centerElement();
                        }
                    };

                    page.div.attachEvent("onresize", page.centerElement);
                    return page;
                },

                _itemInView: function (flipPage) {
                    return this._itemEnd(flipPage) > this._viewportStart() && this._itemStart(flipPage) < this._viewportEnd();
                },

                _viewportStart: function (newValue) {
                    if (this._horizontal) {
                        if (newValue === undefined) {
                            return this._panningDivContainer.scrollLeft;
                        }

                        this._panningDivContainer.scrollLeft = newValue;
                    } else {
                        if (newValue === undefined) {
                            return this._panningDivContainer.scrollTop;
                        }

                        this._panningDivContainer.scrollTop = newValue;
                    }
                },

                _viewportEnd: function () {
                    var element = this._panningDivContainer;
                    if (this._horizontal) {
                        if (this._rtl) {
                            return this._viewportStart() + this._panningDivContainer.offsetWidth;
                        } else {
                            return element.scrollLeft + element.offsetWidth;
                        }
                    } else {
                        return element.scrollTop + element.offsetHeight;
                    }
                },

                _viewportSize: function () {
                    return this._viewportEnd() - this._viewportStart();
                },

                _itemStart: function (flipPage, newValue) {
                    if (newValue === undefined) {
                        return flipPage.location;
                    }

                    if (this._horizontal) {
                        flipPage.div.style.left = (this._rtl ? -newValue : newValue) + "px";
                    } else {
                        flipPage.div.style.top = newValue + "px";
                    }

                    flipPage.location = newValue;
                },

                _itemEnd: function (flipPage) {
                    var div = flipPage.div;
                    return (this._horizontal ? flipPage.location + div.offsetWidth : flipPage.location + div.offsetHeight) + this._itemSpacing;
                },

                _itemSize: function (flipPage) {
                    return (this._horizontal ? flipPage.div.offsetWidth : flipPage.div.offsetHeight);
                },

                _panningDivEnd: function () {
                    return (this._horizontal ? this._panningDiv.offsetWidth : this._panningDiv.offsetHeight);
                },

                _movePageAhead: function (referencePage, pageToPlace) {
                    // TODO: When virtual bounds work, remove this condition.
                    if (pageToPlace.element) {
                        var delta = this._itemSize(referencePage) + this._itemSpacing;
                        this._itemStart(pageToPlace, this._itemStart(referencePage) + delta);
                    }
                },

                _movePageBehind: function (referencePage, pageToPlace) {
                    var delta = this._itemSize(referencePage) + this._itemSpacing;
                    this._itemStart(pageToPlace, this._itemStart(referencePage) - delta);
                },

                _setupSnapPoints: function () {
                    var containerStyle = this._panningDivContainer.style;
                    containerStyle["-ms-scroll-snap-type"] = "mandatory";
                    var snapInterval = this._viewportSize() + this._itemSpacing;
                    var propertyName = "-ms-scroll-snap-points";
                    containerStyle[(this._horizontal ? propertyName + "-x" : propertyName + "-y")] = "snapInterval(0px, " + snapInterval + "px)";
                },

                _setListEnds: function () {
                    // TODO: Post-PDC, put the virtual bounds logic back in here
                },

                _viewportOnItemStart: function () {
                    return this._itemStart(this._currentPage) === this._viewportStart();
                },

                _itemSettledOn: function () {
                    this._lastTimeoutRequest = null;
                    if (this._viewportOnItemStart()) {
                        this._blockTabs = false;
                        if (this._hasFocus && this._currentPage.element) {
                            this._currentPage.element.focus();
                        }
                        if (this._lastSelectedElement !== this._currentPage.element) {
                            if (this._lastSelectedPage && this._lastSelectedPage.element && !isFlipper(this._lastSelectedPage.element)) {
                                this._lastSelectedPage.element.setAttribute("aria-selected", false);
                            }
                            this._lastSelectedPage = this._currentPage;
                            this._lastSelectedElement = this._currentPage.element;
                            if (this._currentPage.element) {
                                if (!isFlipper(this._currentPage.element)) {
                                    this._currentPage.element.setAttribute("aria-selected", true);
                                }
                                var event = document.createEvent("CustomEvent");
                                event.initCustomEvent(thisWinUI.FlipView.pageSelectedEvent, true, true, { source: this._flipperDiv });
                                this._currentPage.element.dispatchEvent(event);
                            }
                        }
                    }
                },

                _forEachPage: function (callback) {
                    var curr = this._prevMarker;
                    do {
                        if (callback(curr)) {
                            break;
                        }

                        curr = curr.next;
                    } while (curr !== this._prevMarker);
                },

                _changeFlipPage: function (page, oldElement, newElement) {
                    page.element = null;
                    if (page.setElement) {
                        page.setElement(newElement, true);
                    } else {
                        // Discardable pages that are created for animations aren't full fleged pages, and won't have some of the functions a normal page would.
                        // changeFlipPage will be called on them when an item that's animating gets fetched. When that happens, we need to replace its element
                        // manually, then center it.
                        oldElement.parentNode.removeChild(oldElement);
                        page.div.appendChild(newElement);
                    }

                    var style = oldElement.style;
                    style.position = "absolute";
                    style.left = "0px";
                    style.top = "0px";
                    style.opacity = 1.0;

                    page.div.appendChild(oldElement);


                    return WinJS.Promise.timeout().then(function () {
                        animations.fadeOut(oldElement).then(function () {
                            page.div.removeChild(oldElement);
                        });
                    });
                },

                _deleteFlipPage: function (page) {
                    page.div.style.opacity = 1.0;
                    var animation = animations.createDeleteFromListAnimation([page.div]);


                    return WinJS.Promise.timeout().then(function () {
                        return animation.execute().then(function () {
                            if (page.discardable) {
                                page.div.parentNode.removeChild(page.div);
                                page.div.removeChild(page.element);
                            }
                        });
                    });
                },

                _insertFlipPage: function (page) {
                    page.div.style.opacity = 0.0;
                    var animation = animations.createAddToListAnimation([page.div]);

                    return WinJS.Promise.timeout().then(function () {
                        return animation.execute().then(function () {
                            if (page.discardable) {
                                page.div.parentNode.removeChild(page.div);
                                page.div.removeChild(page.element);
                            }
                        });
                    });
                },

                _moveFlipPage: function (page, move) {
                    var animation = animations.createRepositionAnimation(page.div);

                    return WinJS.Promise.timeout().then(function () {
                        move();
                        return animation.execute().then(function () {
                            if (page.discardable) {
                                page.div.parentNode.removeChild(page.div);
                                page.div.removeChild(page.element);
                            }
                        });
                    });
                }
            }
        )
    });

    thisWinUI._FlipPageManager.flipPageBufferCount = 2; // The number of items that should surround the current item as a buffer at any time
})(WinJS);

// Array Data Source and Iterator Data Source

(function (global) {

WinJS.Namespace.define("WinJS.UI", {});

var UI = WinJS.UI;
var Promise = WinJS.Promise;

WinJS._PerfMeasurement_Promise = Promise;

// Private statics

function errorDoesNotExist() {
    return Promise.wrapError(new WinJS.ErrorFromName(UI.FetchError.doesNotExist));
}

function errorNoLongerMeaningful() {
    return Promise.wrapError(new WinJS.ErrorFromName(UI.EditError.noLongerMeaningful));
}

var keySearchRange = 5;

var ArrayDataAdaptor = WinJS.Class.define(function (array, options) {
    // Constructor

    // Assume a string is JSON text
    var inputJSON = (typeof array === "string");
    if (inputJSON) {
        array = JSON.parse(array);
    }

    // Allow a single value to be passed in, and wrap it in an array
    if (!Array.isArray(array) && !array.getAt) {
        array = [array];
    }

    this._array = array;
        
    if (options) {
        if (options.keyOf) {
            this._keyOf = options.keyOf;
        }
        if (options.compareByIdentity) {
            this.compareByIdentity = true;
        }
    }

    if (this._keyOf) {
        this._keyMap = {};
    } else {
        this._items = new Array(array.length);
    }
}, {
    // Public members

    setNotificationHandler: function (notificationHandler) {
        // If the array implements IObservableVector, make any notification trigger a refresh
        if (this._array.onvectorchanged !== undefined) {
            var CollectionChange = Windows.Foundation.Collections.CollectionChange;
            this._array.addEventListener("vectorchanged", function (ev) {
                var index = ev.index;
                switch (ev.collectionChange) {
                    case CollectionChange.reset:
                        notificationHandler.invalidateAll();
                        break;

                    case CollectionChange.itemInserted:
                        notificationHandler.inserted(this._item(index), this._itemKey(index - 1), this._itemKey(index + 1), index);
                        break;

                    case CollectionChange.itemChanged:
                        notificationHandler.changed(this._item(index));
                        break;

                    case CollectionChange.itemRemoved:
                        notificationHandler.removed(null, index);
                        break;
                }
            });
        }
    },

    // compareByIdentity: set in constructor

    // itemsFromStart: not implemented

    itemsFromEnd: function (count) {
        var len = this._array.length;
        return (
            len === 0 ?
                errorDoesNotExist() :
                this.itemsFromIndex(len - 1, Math.min(count - 1, len - 1), 0)
        );
    },

    // itemsFromKey: not implemented

    itemsFromIndex: function (index, countBefore, countAfter) {
        var len = this._array.length;
        if (index >= len) {
            return errorDoesNotExist();
        } else {
            var first = index - countBefore,
                last = Math.min(index + countAfter, len - 1),
                items = new Array(last - first + 1);

            for (var i = first; i <= last; i++) {
                items[i - first] = this._item(i);
            }

            return WinJS._PerfMeasurement_Promise.wrap({
                items: items,
                offset: countBefore,
                totalCount: len,
                absoluteIndex: index
            });
        }
    },

    // itemsFromDescription: not implemented

    getCount: function () {
        return Promise.wrap(this._array.length);
    },

    insertAtStart: function (key, data) {
        // key parameter is ignored, as keys are part of data or are generated
        return this._insert(0, data);
    },

    insertBefore: function (key, data, nextKey, nextIndexHint) {
        // key parameter is ignored, as keys are part of data or are generated
        return this._insert(this._indexFromKeyAndHint(nextKey, nextIndexHint), data);
    },

    insertAfter: function (key, data, previousKey, previousIndexHint) {
        // key parameter is ignored, as keys are part of data or are generated
        return this._insert(this._indexFromKeyAndHint(previousKey, previousIndexHint) + 1, data);
    },

    insertAtEnd: function (key, data) {
        // key parameter is ignored, as keys are part of data or are generated
        return this._insert(this._array.length, data);
    },

    change: function (key, newData, indexHint) {
        var index = this._indexFromKeyAndHint(key, indexHint);

        if (isNaN(index)) {
            return errorNoLongerMeaningful();
        }

        this._setAt(index, this._validateData(newData));

        return Promise.wrap();
    },

    moveToStart: function (key, indexHint) {
        return this._move(this._indexFromKeyAndHint(key, indexHint), 0);
    },

    moveBefore: function (key, nextKey, indexHint, nextIndexHint) {
        return this._move(this._indexFromKeyAndHint(key, indexHint), this._indexFromKeyAndHint(nextKey, nextIndexHint));
    },

    moveAfter: function (key, previousKey, indexHint, previousIndexHint) {
        return this._move(this._indexFromKeyAndHint(key, indexHint), this._indexFromKeyAndHint(previousKey, previousIndexHint) + 1);
    },

    moveToEnd: function (key, indexHint) {
        return this._move(this._indexFromKeyAndHint(key, indexHint), this._array.length);
    },

    remove: function (key, indexHint) {
        var index = this._indexFromKeyAndHint(key, indexHint);

        if (isNaN(index)) {
            return errorNoLongerMeaningful();
        }

        if (!this._keyOf) {
            this._ensureItems();
            this._items.splice(index, 1);
        }

        this._removeAt(index);

        if (this._keyOf) {
            delete this._keyMap[key];
        }

        return Promise.wrap();
    },

    // Private members

    _validateData: function (data) {
        // Check if the identity of the objects must be preserved, or if copies can be stored
        return this.compareByIdentity ? data : UI._validateData(data);
    },

    _itemKey: function (index) {
        if (index < 0 || index >= this._array.length) {
            return null;
        } else if (this._keyOf) {
            return this._keyOf(this._array[index]);
        } else {
            var item = this._items[index];
            if (item) {
                return item.key;
            } else {
                // Use the indices as keys until there is an edit
                return index.toString();
            }
        }
    },

    _newItem: function (index) {
        return {
            key: this._itemKey(index),
            data: this._array[index]
        };
    },

    _ensureItems: function () {
        // Once an edit occurs, it is necessary to create all items so their keys can be tracked
        if (typeof this._nextAvailableKey !== "number") {
            var len = this._array.length;
            for (var i = 0; i < len; i++) {
                if (!this._items[i]) {
                    this._items[i] = this._newItem(i);
                }
            }

            this._nextAvailableKey = len;
        }
    },

    _item: function (index) {
        // Create the items on-demand
        var item;
        if (this._keyOf) {
            var data = this._array[index],
                key = this._keyOf(data);
            item = this._keyMap[key];
            if (!item) {
                item = this._keyMap[key] = {
                    key: key,
                    data: data
                };
            }
        } else {
            item = this._items[index];
            if (!item) {
                item = this._items[index] = this._newItem(index);
            }
        }
        return item;
    },

    _indexFromKeyAndHint: function (key, indexHint) {
        var i,
            min,
            max;

        // Search a small distance in either direction for the item
        for (i = indexHint, max = Math.min(i + keySearchRange, this._array.length - 1); i <= max; i++) {
            if (this._itemKey(i) === key) {
                return i;
            }
        }
        for (i = indexHint - 1, min = Math.max(indexHint - keySearchRange, 0); i >= min; i--) {
            if (this._itemKey(i) === key) {
                return i;
            }
        }
        return NaN;
    },

    _insert: function (index, data) {
        if (isNaN(index)) {
            return errorNoLongerMeaningful();
        }

        if (!this._keyOf) {
            this._ensureItems();
        }

        var data = this._validateData(data);

        this._insertAt(index, data);

        var item;
        if (this._keyOf) {
            var key = this._keyOf(data);
            item = {
                key: key,
                data: data
            };
            this._keyMap[key] = item;
        } else {
            item = {
                key: (this._nextAvailableKey++).toString(),
                data: data
            };
            this._items.splice(index, 0, item);
        }

        return Promise.wrap(item);
    },

    _move: function (indexFrom, indexTo) {
        if (isNaN(indexFrom) || isNaN(indexTo)) {
            return errorNoLongerMeaningful();
        }

        var item,
            data;

        if (this._keyOf) {
            data = this._array[indexFrom];
        } else {
            this._ensureItems();
            item = this._items.splice(indexFrom, 1)[0];
            data = item.data;
        }

        this._removeAt(indexFrom);

        if (indexFrom < indexTo) {
            indexTo--;
        }

        this._insertAt(indexTo, data);

        if (!this._keyOf) {
            this._items.splice(indexTo, 0, item);
        }

        return Promise.wrap();
    },

    _insertAt: function (index, data) {
        if (this._array.insertAt) {
            this._array.insertAt(index, data);
        } else {
            this._array.splice(index, 0, data);
        }
    },

    _setAt: function (index, data) {
        if (this._array.setAt) {
            this._array.setAt(index, data);
        } else {
            this._array[index] = data;
        }
    },

    _removeAt: function (index) {
        if (this._array.removeAt) {
            this._array.removeAt(index);
        } else {
            this._array.splice(index, 1);
        }
    }
});

var IteratorDataAdaptor = WinJS.Class.define(function (iterator, options) {
    // Constructor

    // Iterable object is also accepted - call the "first" method to obtain the iterator
    if (!iterator.current) {
        iterator = iterator.first();

        // TODO: Validate that iterator is now valid iterator
    }

    this._iterator = iterator;
    
    // Use an ArrayDataAdaptor as a cache
    this._arrayDataAdaptor = new ArrayDataAdaptor([], options);
    
    this._countRead = 0;
}, {
    // Public members

    // setNotificationHandler: not implemented

    // compareByIdentity: set in constructor

    // itemsFromStart: not implemented

    // itemsFromEnd: not implemented

    itemsFromIndex: function (index, countBefore, countAfter) {
        var indexLast = index + countAfter;

        // Read as many items as needed and append them to the cache
        while (this._iterator.hasCurrent() && this._countRead <= indexLast) {
            this._arrayDataAdaptor.insertAtEnd(null, this._iterator.read());
            this._countRead++;
            this._iterator.moveNext();
        }

        return this._arrayDataAdaptor.itemsFromIndex(index, countBefore, countAfter);
    }

    // itemsFromDescription: not implemented

    // getCount: not implemented

    // Editing methods not implemented
});

// Public definitions

WinJS.Namespace.define("WinJS.UI", {

    /// <summary locid="108">
    /// Returns a data source that enumerates a given array
    /// </summary>
    /// <param name="array" type="Array" locid="109">
    /// The array to enumerate.
    /// </param>
    /// <param name="options" mayBeNull="true" optional="true" type="Object" locid="110">
    /// Options for the array data source.  Properties on this object may include:
    /// 
    /// keyOf (type="Function"):
    /// Function that returns the key of an element in the array.
    /// 
    /// compareByIdentity (type="Boolean"):
    /// True if the items in the array should be compared only by their identity, when detecting changes.
    /// 
    /// </param>
    ArrayDataSource: function (array, options) {
        return new UI.ListDataSource(new ArrayDataAdaptor(array, options));
    },

    /// <summary locid="108">
    /// Returns a data source that enumerates a given array
    /// </summary>
    /// <param name="iterator" type="Object" locid="111">
    /// An object that supports either IIterator or IIterable.
    /// </param>
    /// <param name="options" mayBeNull="true" optional="true" type="Object" locid="110">
    /// Options for the array data source.  Properties on this object may include:
    /// 
    /// keyOf (type="Function"):
    /// Function that returns the key of an element in the array.
    /// 
    /// compareByIdentity (type="Boolean"):
    /// True if the items in the array should be compared only by their identity, when detecting changes.
    /// 
    /// </param>
    IteratorDataSource: function (iterator, options) {
        return new UI.ListDataSource(new IteratorDataAdaptor(iterator, options));
    }

});

})();


// Group Data Source

(function () {

WinJS.Namespace.define("WinJS.UI", {});

var UI = WinJS.UI;
var Promise = WinJS.Promise;

// Private statics

function errorDoesNotExist() {
    return new WinJS.ErrorFromName(UI.FetchError.doesNotExist);
}

var fetchBefore = 50,
    fetchAfter = fetchBefore,
    fetchBatchSize = fetchBefore + 1 + fetchAfter;

function groupReady(group) {
    return group && group.firstReached && group.lastReached;
}

var ListNotificationHandler = WinJS.Class.define(function (groupDataAdaptor) {
    // Constructor

    this._groupDataAdaptor = groupDataAdaptor;
}, {
    // Public methods

    // beginNotifications: not implemented

    itemAvailable: function (item) {
        this._groupDataAdaptor._itemAvailable(item);
    },

    inserted: function (item, previousHandle, nextHandle) {
        this._groupDataAdaptor._inserted(item, previousHandle, nextHandle);
    },

    changed: function (newItem, oldItem) {
        this._groupDataAdaptor._changed(newItem, oldItem);
    },

    moved: function (item, previousHandle, nextHandle) {
        this._groupDataAdaptor._moved(item, previousHandle, nextHandle);
    },

    removed: function (handle, mirage) {
        this._groupDataAdaptor._removed(handle, mirage);
    },

    // countChanged: not implemented

    indexChanged: function (handle, newIndex, oldIndex) {
        this._groupDataAdaptor._indexChanged(handle, newIndex, oldIndex);
    }

    // endNotifications: not implemented
});

var GroupDataAdaptor = WinJS.Class.define(function (listDataSource, groupOf) {
    // Constructor

    if (Array.isArray(listDataSource) || listDataSource.getAt) {
        listDataSource = new WinJS.UI.ArrayDataSource(listDataSource, null);
    }

    this._listBinding = listDataSource.createListBinding(new ListNotificationHandler(this));
    this._groupOf = groupOf;

    this._count = null;
    this._indexMax = null;

    this._keyMap = {};
    this._indexMap = {};
    this._lastGroup = null;
    this._handleMap = {};

    this._fetchQueue = [];

    this._itemBatch = null;
    this._itemsToFetch = 0;

    if (this._listBinding.last) {
        this.itemsFromEnd = function (count) {
            var that = this;
            return this._fetchItems(
                // getGroup
                function () {
                    return that._lastGroup;
                },

                // mayExist
                function () {
                    return typeof that._count !== "number" || that._count > 0;
                },

                // fetchInitialBatch
                function () {
                    that._fetchBatch(that._listBinding.last(), fetchBatchSize - 1, 0);
                },

                count - 1, 0
            );
        };
    }
}, {
    // Public members

    setNotificationHandler: function (notificationHandler) {
        this._listDataNotificationHandler = notificationHandler;
    },
    
    // The Items Manager should always compare these items by identity; in rare cases, it will do some unnecessary
    // rerendering, but at least fetching will not stringify items we already know to be valid and that we know
    // have not changed.
    compareByIdentity: true,

    // itemsFromStart: not implemented

    // itemsFromEnd: implemented in constructor

    itemsFromKey: function (key, countBefore, countAfter, hints) {
        var mayExist = true,
            that = this;
        return this._fetchItems(
            // getGroup
            function () {
                return that._keyMap[key];
            },

            // mayExist
            function () {
                return mayExist;
            },

            // fetchInitialBatch
            function () {
                var itemPromise = that._listBinding.fromKey(hints.itemKey);

                itemPromise.then(function (item) {
                    if (!item) {
                        mayExist = false;
                    }
                });

                that._fetchBatch(itemPromise, fetchBefore, fetchAfter);
            },

            countBefore, countAfter
        );
    },
    
    itemsFromIndex: function (index, countBefore, countAfter) {
        var that = this;
        return this._fetchItems(
            // getGroup
            function () {
                return that._indexMap[index];
            },

            // mayExist
            function () {
                return typeof that._count !== "number" || index < that._count;
            },

            // fetchInitialBatch
            function () {
                that._fetchNextIndex();
            },

            countBefore, countAfter
        );
    },

    // itemsFromDescription: not implemented

    getCount: function () {
        if (typeof this._count === "number") {
            return Promise.wrap(this._count);
        } else {
            var that = this;
            return new WinJS.Promise(function (complete) {
                var fetch = {
                    initialBatch: function () {
                        that._fetchNextIndex();
                    },
                    getGroup: function () { return null; },
                    countBefore: 0,
                    countAfter: 0,
                    complete: function () {
                        var count = that._count;
                        if (typeof count === "number") {
                            complete(count);
                            return true;
                        } else {
                            return false;
                        }
                    }
                };

                that._fetchQueue.push(fetch);

                if (!that._itemBatch) {
                    that._beginFetch(fetch);
                }
            });
        }
    },

    // Editing methods not implemented

    // Private members

    _releaseItem: function (item) {
        delete this._handleMap[item.handle];
        this._listBinding.releaseItem(item);
    },

    _processBatch: function () {
        var previousItem = null,
            previousGroup = null,
            firstItemInGroup = null,
            itemsSinceStart = 0;
        for (var i = 0; i < fetchBatchSize; i++) {
            var item = this._itemBatch[i],
                groupInfo = (item ? this._groupOf(item) : null);

            if (item && this._count === 0) {
                this._count = null;
            }

            if (previousGroup && groupInfo && groupInfo.key === previousGroup.key) {
                // This item is in the same group as the last item.  The only thing to do is advance the group's
                // lastItem if this is definitely the last item that has been processed for the group.
                itemsSinceStart++;
                if (previousGroup.lastItem === previousItem) {
                    if (previousGroup.lastItem.handle !== previousGroup.firstItem.handle) {
                        this._releaseItem(previousGroup.lastItem);
                    }
                    previousGroup.lastItem = item;
                    this._handleMap[item.handle] = previousGroup;

                    previousGroup.size++;
                } else if (previousGroup.firstItem === item) {
                    if (previousGroup.firstItem.handle !== previousGroup.lastItem.handle) {
                        this._releaseItem(previousGroup.firstItem);
                    }
                    previousGroup.firstItem = firstItemInGroup;
                    this._handleMap[firstItemInGroup.handle] = previousGroup;
                    
                    previousGroup.size += itemsSinceStart;
                }
            } else {
                var index = null;

                if (previousGroup) {
                    previousGroup.lastReached = true;

                    if (typeof previousGroup.index === "number") {
                        index = previousGroup.index + 1;
                    }
                }

                if (groupInfo) {
                    // See if the current group has already been processed
                    var group = this._keyMap[groupInfo.key];

                    if (!group) {
                        group = {
                            key: groupInfo.key,
                            data: groupInfo.data,
                            firstItem: item,
                            lastItem: item,
                            size: 1
                        };
                        this._keyMap[group.key] = group;
                        this._handleMap[item.handle] = group;
                    } else if (i > 0) {
                        if (group.firstItem.handle !== group.lastItem.handle) {
                            this._releaseItem(group.firstItem);
                        }
                        group.firstItem = item;
                        this._handleMap[item.handle] = group;
                    }

                    if (i > 0) {
                        group.firstReached = true;

                        if (!previousGroup) {
                            index = 0;
                        }
                    }

                    if (typeof group.index !== "number" && typeof index === "number") {
                        // Set the indices of as many groups as possible
                        for (var group2 = group; group2; group2 = this._nextGroup(group2)) {
                            group2.index = index;
                            this._indexMap[index] = group2;

                            index++;
                        }

                        this._indexMax = index;
                    }

                    firstItemInGroup = item;
                    itemsSinceStart = 0;

                    previousGroup = group;
                } else {
                    if (previousGroup) {
                        this._lastGroup = previousGroup;

                        if (typeof this._indexMax === "number") {
                            this._count = this._indexMax;
                        }

                        previousGroup = null;
                    }
                }
            }

            previousItem = item;
        }

        // See how many fetches have now completed
        var fetch;
        for (fetch = this._fetchQueue[0]; fetch && fetch.complete(); fetch = this._fetchQueue[0]) {
            this._fetchQueue.splice(0, 1);
        }

        // Continue work on the next fetch, if any
        if (fetch) {
            var that = this;
            WinJS.Promise.timeout().then(function () {
                that._beginFetch(fetch);
            });
        } else {
            this._itemBatch = null;
        }
    },

    _processPromise: function (itemPromise, batchIndex) {
        itemPromise.retain();

        this._itemBatch[batchIndex] = itemPromise;

        var that = this;
        itemPromise.then(function (item) {
            that._itemBatch[batchIndex] = item;
            if (--that._itemsToFetch === 0) {
                that._processBatch();
            }
        });
    },

    _fetchBatch: function (itemPromise, countBefore, countAfter) {
        this._itemBatch = new Array(fetchBatchSize);
        this._itemsToFetch = fetchBatchSize;

        this._processPromise(itemPromise, countBefore);

        var batchIndex;

        this._listBinding.jumpToItem(itemPromise);
        for (batchIndex = countBefore - 1; batchIndex >= 0; batchIndex--) {
            this._processPromise(this._listBinding.previous(), batchIndex);
        }

        this._listBinding.jumpToItem(itemPromise);
        for (batchIndex = countBefore + 1; batchIndex < fetchBatchSize; batchIndex++) {
            this._processPromise(this._listBinding.next(), batchIndex);
        }
    },

    _fetchAdjacent: function (item, after) {
        this._fetchBatch(this._listBinding.fromKey(item.key), (after ? 0 : fetchBatchSize - 1), (after ? fetchBatchSize - 1 : 0));
    },

    _fetchNextIndex: function () {
        var groupHighestIndex = this._indexMap[this._indexMax - 1];
        if (groupHighestIndex) {
            // We've already fetched some of the first items, so continue where we left off
            this._fetchAdjacent(groupHighestIndex.lastItem, true);
        } else {
            var itemPromise = this._listBinding.first();

            itemPromise.then(function (item) {
                if (!item) {
                    // If the first item can't be fetched, then the count must be zero
                    this._count = 0;
                }
            });

            // Fetch one non-existent item before the list so _processBatch knows the start was reached
            this._fetchBatch(itemPromise, 1, fetchBatchSize - 2);
        }
    },

    _fetchNextBatch: function (group, countBefore, countAfter) {
        if (group) {
            var groupPrev,
                groupNext;

            if (!group.firstReached) {
                this._fetchAdjacent(group.firstItem, false);
            } else if (!group.lastReached) {
                this._fetchAdjacent(group.lastItem, true);
            } else if (countBefore > 0 && !groupReady(groupPrev = this._previousGroup(group))) {
                this._fetchAdjacent((groupPrev.lastReached ? groupPrev.firstItem : group.firstItem), false);
            } else {
                groupNext = this._nextGroup(group);
                this._fetchAdjacent((groupNext.firstReached ? groupNext.lastItem : group.lastItem), true);
            }
        } else {
            // Assume an index or the count is being searched for
            this._fetchNextIndex();
        }
    },

    _fetchComplete: function (group, countBefore, countAfter, firstRequest, complete, error) {
        if (groupReady(group)) {
            // Check if the minimal requirements for the request are met
            var groupPrev = this._previousGroup(group);
            if (firstRequest || groupReady(groupPrev) || group.index === 0 || countBefore === 0) {
                var groupNext = this._nextGroup(group);
                if (firstRequest || groupReady(groupNext) || this._lastGroup === group || countAfter === 0) {
                    // Time to return the fetch results
                    
                    // Find the first available group to return (don't return more than asked for)
                    var countAvailableBefore = 0,
                        groupFirst = group;
                    while (countAvailableBefore < countBefore) {
                        groupPrev = this._previousGroup(groupFirst);

                        if (!groupReady(groupPrev)) {
                            break;
                        }

                        groupFirst = groupPrev;
                        countAvailableBefore++;
                    }

                    // Find the last available group to return
                    var countAvailableAfter = 0,
                        groupLast = group;
                    while (countAvailableAfter < countAfter) {
                        groupNext = this._nextGroup(groupLast);

                        if (!groupReady(groupNext)) {
                            break;
                        }

                        groupLast = groupNext;
                        countAvailableAfter++;
                    }

                    // Now create the items to return
                    var len = countAvailableBefore + 1 + countAvailableAfter,
                        items = new Array(len);

                    for (var i = 0; i < len; i++) {
                        var item = {
                            key: groupFirst.key,
                            data: groupFirst.data,
                            firstItemKey: groupFirst.firstItem.key,
                            groupSize: group.size
                        };

                        var firstItemIndex = groupFirst.firstItem.index; 
                        if (typeof firstItemIndex === "number") {
                            item.firstItemIndexHint = firstItemIndex;
                        }

                        items[i] = item;

                        groupFirst = this._nextGroup(groupFirst);
                    }

                    var result = {
                        items: items,
                        offset: countAvailableBefore
                    };

                    result.totalCount = (
                        typeof this._count === "number" ?
                            this._count :
                            UI.CountResult.unknown
                    );

                    if (typeof group.index === "number") {
                        result.absoluteIndex = group.index;
                    }

                    if (groupLast === this._lastGroup) {
                        result.atEnd = true;
                    }

                    complete(result);
                    return true;
                }
            }
        }

        return false;
    },

    _beginFetch: function (fetch) {
        if (fetch.initialBatch) {
            fetch.initialBatch();
            fetch.initialBatch = null;
        } else {
            this._fetchNextBatch(fetch.getGroup(), fetch.countBefore, fetch.countAfter);
        }
    },

    _fetchItems: function (getGroup, mayExist, fetchInitialBatch, countBefore, countAfter) {
        var that = this;
        return new Promise(function (complete, error) {
            var group = getGroup(),
                firstRequest = !group;

            function fetchComplete() {
                if (!mayExist()) {
                    error(errorDoesNotExist());
                    return true;
                }

                var group2 = getGroup();
                return group2 && that._fetchComplete(group2, countBefore, countAfter, firstRequest, complete, error);
            }

            if (!fetchComplete()) {
                var fetch = {
                    initialBatch: firstRequest ? fetchInitialBatch : null,
                    getGroup: getGroup,
                    countBefore: countBefore,
                    countAfter: countAfter,
                    complete: fetchComplete
                };

                that._fetchQueue.push(fetch);

                if (!that._itemBatch) {
                    that._beginFetch(fetch);
                }
            }
        });
    },

    _previousGroup: function (group) {
        if (group && group.firstReached) {
            this._listBinding.jumpToItem(group.firstItem);

            var itemPromise = this._listBinding.previous();

            return this._handleMap[itemPromise.handle];
        } else {
            return null;
        }
    },

    _nextGroup: function (group) {
        if (group && group.lastReached) {
            this._listBinding.jumpToItem(group.lastItem);

            var itemPromise = this._listBinding.next();

            return this._handleMap[itemPromise.handle];
        } else {
            return null;
        }
    },

    _releaseGroup: function (group) {
        delete this._keyMap[group.key];

        this._count = null;

        if (typeof group.index === "number") {
            this._indexMax = (group.index > 0 ? group.index : null);
        }

        // Delete the indices of this and all subsequent groups
        for (var group2 = group; typeof group2.index === "number"; group2 = this._nextGroup(group2)) {
            delete this._indexMap[group2.index];
            group2.index = null;
        }

        if (this._lastGroup === group) {
            this._lastGroup = null;
        }

        if (group.firstItem !== group.lastItem) {
            this._releaseItem(group.firstItem);
        }
        this._releaseItem(group.lastItem);
    },

    _beginRefresh: function () {
        // Abandon all current fetches
        
        this._fetchQueue = [];

        for (var i = 0; i < fetchBatchSize; i++) {
            var item = this._itemBatch[i];
            if (item) {
                this._listBinding.releaseItem(item);
            }
        }

        this._itemBatch = null;
        this._itemsToFetch = 0;

        this._listDataNotificationHandler.invalidateAll();
    },

    _processInsertion: function (item, previousHandle, nextHandle) {
        var groupPrev = this._handleMap[previousHandle],
            groupNext = this._handleMap[nextHandle],
            groupInfo = null;
            
        if (groupPrev) {
            // If an item in a different group from groupPrev is being inserted after it, no need to discard groupPrev
            if (!groupPrev.lastReached || previousHandle !== groupPrev.lastItem.handle || (groupInfo = this._groupOf(item)).key === groupPrev.key) {
                this._releaseGroup(groupPrev);
            }
            this._beginRefresh();
        }

        if (groupNext) {
            // If an item in a different group from groupNext is being inserted after it, no need to discard groupNext
            if (!groupNext.firstReached || nextHandle !== groupNext.firstItem.handle || (groupInfo || this._groupOf(item)).key === groupNext.key) {
                this._releaseGroup(groupPrev);
            }
            this._beginRefresh();
        }
    },

    _processRemoval: function (handle) {
        var group = this._handleMap[handle];

        if (group) {
            if (handle === group.firstItem.handle || handle === group.lastItem.handle) {
                this._releaseGroup(group);
                this._beginRefresh();
            }
        }
    },

    _itemAvailable: function (item) {
    },

    _inserted: function (item, previousHandle, nextHandle) {
        this._processInsertion(item, previousHandle, nextHandle);
    },

    _changed: function (newItem, oldItem) {
        if (this._groupOf(newItem).key !== this._groupOf(oldItem).key) {
            // Treat a group change as a move
            this._listBinding.jumpToItem(newItem);
            var previousHandle = this._listBinding.previous();
            this._listBinding.jumpToItem(newItem);
            var nextHandle = this._listBinding.next();

            this._moved(newItem, previousHandle, nextHandle);
        }
    },

    _moved: function (item, previousHandle, nextHandle) {
        this._processRemoval(item.handle);
        this._processInsertion(item, previousHandle, nextHandle);
    },

    _removed: function (handle, mirage) {
        // Mirage removals will just result in null items, which can be ignored
        if (!mirage) {
            this._processRemoval(handle);
        }
    },

    _indexChanged: function (handle, newIndex, oldIndex) {
        this._beginRefresh();
    }
});

// Class definition

WinJS.Namespace.define("WinJS.UI", {

    /// <summary locid="108">
    /// Returns a data source that enumerates a given array
    /// </summary>
    /// <param name="listDataSource" type="ListDataSource" locid="112">
    /// The data source for the individual items that are to be grouped.
    /// </param>
    /// <param name="groupOf" type="Function" locid="113">
    /// Callback function that annotates a given item with group information.  Function's signature should match that
    /// of groupOfCallback.
    /// </param>
    GroupDataSource: function (listDataSource, groupOf) {
        return new UI.ListDataSource(new GroupDataAdaptor(listDataSource, groupOf));
    }

});

})();


// Grouped Item Data Source

(function () {

WinJS.Namespace.define("WinJS.UI", {});

var UI = WinJS.UI;
var Promise = WinJS.Promise;

// Class definition

WinJS.Namespace.define("WinJS.UI", {

    /// <summary>
    /// Returns a data source that enumerates a given array
    /// </summary>
    /// <param name="listDataSource" type="ListDataSource">
    /// The data source for the individual items that are to be grouped.
    /// </param>
    /// <param name="groupOf" type="Function">
    /// Callback function that annotates a given item with group information.  Function's signature should match that
    /// of groupOfCallback.
    /// </param>
    GroupedItemDataSource: function (listDataSource, groupOf) {
        if (Array.isArray(listDataSource) || listDataSource.getAt) {
            listDataSource = new WinJS.UI.ArrayDataSource(listDataSource, null);
        }

        var groupedItemDataSource = Object.create(listDataSource);

        function createGroupedItemPromise(itemPromise) {
            var groupedItemPromise = Object.create(itemPromise);

            groupedItemPromise.then = function (onComplete, onError, onCancel) {
                return itemPromise.then(function (item) {
                    var groupInfo = groupOf(item),
                        groupedItem = Object.create(item);
                    
                    groupedItem.groupKey = groupInfo.key;
                    groupedItem.groupData = groupInfo.data;

                    if (typeof groupInfo.index === "number") {
                        item.groupIndexHint = groupInfo.index;
                    }

                    if (groupInfo.description !== undefined) {
                        groupedItem.groupDescription = groupInfo.description;
                    }

                    return onComplete(groupedItem);
                }, onError, onCancel);
            };

            return groupedItemPromise;
        }

        groupedItemDataSource.createListBinding = function (notificationHandler) {
            var listBinding = listDataSource.createListBinding(notificationHandler),
                groupedItemListBinding = Object.create(listBinding);

            if (listBinding.first) {
                groupedItemListBinding.first = function (prefetchAfter) {
                    return createGroupedItemPromise(listBinding.first(prefetchAfter));
                };
            }

            if (listBinding.last) {
                groupedItemListBinding.last = function (prefetchBefore) {
                    return createGroupedItemPromise(listBinding.last(prefetchBefore));
                };
            }

            if (listBinding.fromKey) {
                groupedItemListBinding.fromKey = function (key, prefetchBefore, prefetchAfter) {
                    return createGroupedItemPromise(listBinding.fromKey(key, prefetchBefore, prefetchAfter));
                };
            }

            if (listBinding.fromIndex) {
                groupedItemListBinding.fromIndex = function (index, prefetchBefore, prefetchAfter) {
                    return createGroupedItemPromise(listBinding.fromIndex(index, prefetchBefore, prefetchAfter));
                };
            }

            if (listBinding.fromDescription) {
                groupedItemListBinding.fromDescription = function (description, prefetchBefore, prefetchAfter) {
                    return createGroupedItemPromise(listBinding.fromDescription(description, prefetchBefore, prefetchAfter));
                };
            }

            groupedItemListBinding.jumpToItem = function (item) {
                return createGroupedItemPromise(listBinding.jumpToItem(item));
            };

            groupedItemListBinding.current = function () {
                return createGroupedItemPromise(listBinding.current());
            };

            groupedItemListBinding.prev = function () {
                return createGroupedItemPromise(listBinding.prev());
            };

            groupedItemListBinding.next = function () {
                return createGroupedItemPromise(listBinding.next());
            };

            return groupedItemListBinding;
        };

        return groupedItemDataSource;
    }

});

})();



// Items Manager

(function (global) {

WinJS.Namespace.define("WinJS.UI", {});

var Promise = WinJS.Promise;
var UI = WinJS.UI;

// Private statics

var listDataSourceIsInvalid = "Invalid argument: dataSource must be an object.";
var itemRendererIsInvalid = "Invalid argument: itemRenderer must be a function.";
var callbackIsInvalid1 = "Invalid argument: ";
var callbackIsInvalid2 = " must be a function.";
var priorityIsInvalid = "Invalid argument: priority must be one of following values: Priority.high or Priority.medium.";
var itemIsInvalid = "Invalid argument: item must be a DOM element that was returned by the Items Manager, and has not been replaced or released.";

function defaultRenderer(item) {
    return document.createElement("div");
}

// Type-checks a callback parameter, since a failure will be hard to diagnose when it occurs
function checkCallback(callback, name) {
    if (typeof callback !== "function") {
        throw new Error(callbackIsInvalid1 + name + callbackIsInvalid2);
    }
}

var ListNotificationHandler = WinJS.Class.define(function (itemsManager) {
    // Constructor

    this._itemsManager = itemsManager;
}, {
    // Public methods

    beginNotifications: function () {
        // The ItemsManager will generate these notifications itself, but it is necessary to handle this, so it can
        // receive endNotifications.
    },

    // itemAvailable: not implemented

    inserted: function (item, previousHandle, nextHandle) {
        this._itemsManager._inserted(item, previousHandle, nextHandle);
    },

    changed: function (newItem, oldItem) {
        this._itemsManager._changed(newItem, oldItem);
    },

    moved: function (handle, previousHandle, nextHandle) {
        this._itemsManager._moved(handle, previousHandle, nextHandle);
    },

    removed: function (handle, mirage) {
        this._itemsManager._removed(handle, mirage);
    },

    countChanged: function (newCount, oldCount) {
        this._itemsManager._countChanged(newCount, oldCount);
    },

    indexChanged: function (handle, newIndex, oldIndex) {
        this._itemsManager._indexChanged(handle, newIndex, oldIndex);
    },

    endNotifications: function () {
        this._itemsManager._endNotifications();
    }
});

var ItemsManager = WinJS.Class.define(function (listDataSource, itemRenderer, elementNotificationHandler, options) {
    // Constructor

    if (!listDataSource) {
        throw new Error(listDataSourceIsInvalid);
    }
    if (!itemRenderer) {
        throw new Error(itemRendererIsInvalid);
    }

    if (Array.isArray(listDataSource) || listDataSource.getAt) {
        listDataSource = new WinJS.UI.ArrayDataSource(listDataSource, null);
    }

    this._listDataSource = listDataSource;

    // Expose the data source as a public property on the ItemsManager -- TODO: Review this
    this.dataSource = this._listDataSource;

    this._elementNotificationHandler = elementNotificationHandler;

    this._listBinding = this._listDataSource.createListBinding(new ListNotificationHandler(this));

    this._placeholderRenderer = defaultRenderer;

    this._itemNotificationHandler = {};   // Dummy object so it's always defined

    if (options) {
        if (options.placeholderRenderer) {
            this._placeholderRenderer = options.placeholderRenderer;
        }
        if (options.itemNotificationHandler) {
            this._itemNotificationHandler = options.itemNotificationHandler;
        }
        if (options.ownerElement) {
            this._ownerElement = options.ownerElement;
        }
    }

    this._renderManager = new UI.RenderManager(itemRenderer, function (item) { return item.key; });

    // Map of (the uniqueIDs of) elements to records for items
    this._elementMap = {};

    // Map of handles to records for items
    this._handleMap = {};

    // Boolean to track whether endNotifications needs to be called on the ElementNotificationHandler
    this._notificationsSent = false;

    // Boolean to coalesce calls to _postEndNotifications
    this._endNotificationsPosted = false;

    this._initializePriorities();

    // Only enable the lastItem method if the data source implements the itemsFromEnd method
    if (this._listBinding.last) {
        this.lastItem = function () {
            /// <summary locid="36">
            /// Returns an element representing the last item.  This may be a placeholder, a rendering of a
            /// successfully fetched item, or an indicator that the attempt to fetch the item failed.
            /// </summary>
            /// <returns type="Object" mayBeNull="true" domElement="true" locid="37" />

            return this._elementForItem(this._listBinding.last());
        };
    }
}, {
    // Public members

    firstItem: function () {
        /// <summary locid="114">
        /// Returns an element representing the first item.  This may be a placeholder, a rendering of a
        /// successfully fetched item, or an indicator that the attempt to fetch the item failed.
        /// </summary>
        /// <returns type="Object" mayBeNull="true" domElement="true" locid="37" />

        return this._elementForItem(this._listBinding.first());
    },

    previousItem: function (item) {
        /// <summary locid="115">
        /// Returns an element representing the item immediately before a given item.  This may be a placeholder,
        /// a rendering of a successfully fetched item, or an indicator that the attempt to fetch the item failed.
        /// </summary>
        /// <param name="item" type="Object" domElement="true" locid="116">
        /// The element representing the item immediately after the requested item.
        /// </param>
        /// <returns type="Object" mayBeNull="true" domElement="true" locid="37" />

        this._listBinding.jumpToItem(this._itemFromElement(item));
        return this._elementForItem(this._listBinding.previous());
    },

    nextItem: function (item) {
        /// <summary locid="117">
        /// Returns an element representing the item immediately after a given item.  This may be a placeholder,
        /// a rendering of a successfully fetched item, or an indicator that the attempt to fetch the item failed.
        /// </summary>
        /// <param name="item" type="Object" domElement="true" locid="118">
        /// The element representing the item immediately before the requested item.
        /// </param>
        /// <returns type="Object" mayBeNull="true" domElement="true" locid="37" />

        this._listBinding.jumpToItem(this._itemFromElement(item));
        return this._elementForItem(this._listBinding.next());
    },

    itemFromKey: function (key) {
        /// <summary locid="119">
        /// Returns an element representing the item with the given key.  This may be a placeholder or a rendering
        /// of a successfully fetched item.
        /// </summary>
        /// <param name="key" type="String" locid="120">
        /// The key of the requested item.
        /// </param>
        /// <returns type="Object" mayBeNull="true" domElement="true" locid="37" />

        return this._elementForItem(this._listBinding.fromKey(key));
    },

    itemAtIndex: function (index) {
        /// <summary locid="121">
        /// Returns an element representing the item at the given index.  This may be a placeholder or a rendering
        /// of a successfully fetched item.
        /// </summary>
        /// <param name="index" type="Number" integer="true" locid="122">
        /// The index of the requested item.
        /// </param>
        /// <returns type="Object" mayBeNull="true" domElement="true" locid="37" />

        return this._elementForItem(this._listBinding.fromIndex(index));
    },

    itemFromDescription: function (description) {
        /// <summary locid="123">
        /// Returns an element representing the first item with a description matching or after the given one, as
        /// interpreted by the data source.  This may be a placeholder or a rendering of a successfully fetched
        /// item.  This method may only be called when there are no instantiated items in the list.
        /// </summary>
        /// <param name="description" locid="124">
        /// The description of the requested item, to be interpreted by the data source.
        /// </param>
        /// <returns type="Object" mayBeNull="true" domElement="true" locid="37" />

        return this._elementForItem(this._listBinding.fromDescription(description));
    },

    prioritize: function (first, last, priority) {
        /// <summary locid="125">
        /// Directs the Items Manager to prioritize the loading of a given range of items, including their
        /// resources.
        /// </summary>
        /// <param name="first" type="Object" domElement="true" locid="126">
        /// The element representing the first item in the range.
        /// </param>
        /// <param name="last" type="Object" domElement="true" locid="127">
        /// The element representing the last item in the range.
        /// </param>
        /// <param name="priority" optional="true" type="Priority" locid="128">
        /// The priority level at which to load the given range of items.  Legal values are Priority.high and
        /// Priority.medium.  By default, all items load at low-priority.  Calling this method with a priority of
        /// Priority.high resets all items outside the given range to low-priority.  Calling this method with a
        /// priority of Priority.medium does not affect items outside the given range.  If the priority parameter
        /// is undefined, Priority.high will be assumed.
        /// </param>

        if (UI._PerfMeasurement_disablePrioritize) {
            return;
        }

        var Priority = UI.Priority;

        if (priority !== undefined && priority !== null && priority !== Priority.high && priority !== Priority.medium) {
            throw new Error(priorityIsInvalid);
        }

        if (priority === undefined || priority === null) {
            priority = Priority.high;
        }

        var itemFirst = this._itemFromElement(first),
            itemLast = this._itemFromElement(last);

        if (priority === Priority.high) {
            this._deprioritizeAll();
            this._renderManager.deprioritizeAll();
        }

        for (var itemPromise = this._listBinding.jumpToItem(itemFirst); true; itemPromise = this._listBinding.next()) {
            var record = this._handleMap[itemPromise.handle];

            this._setRecordPriority(record, priority);

            if (record.item.key) {
                this._renderManager.prioritize(record.item, priority);
            }

            if (itemPromise.handle === itemLast.handle) {
                break;
            }
        }
    },

    isPlaceholder: function (item) {
        /// <summary locid="129">
        /// Returns a value indicating whether the element representing a given item is a placeholder, a
        /// rendering of a successfully fetched item, or an indicator that the attempt to fetch the item
        /// failed.
        /// </summary>
        /// <param name="item" type="Object" domElement="true" locid="130">
        /// The element representing the item.
        /// </param>
        /// <returns type="Boolean" locid="131">
        /// True if the item is a placeholder.
        /// </returns>

        return !!this._recordFromElement(item).elementIsPlaceholder;
    },

    itemIndex: function (item) {
        /// <summary locid="132">
        /// Returns the index of the given item, if available.
        /// </summary>
        /// <param name="item" type="Object" domElement="true" locid="130">
        /// The element representing the item.
        /// </param>
        /// <returns type="Number" integer="true" locid="37" />

        return this._itemFromElement(item).index;       // TODO: Replace with itemObject everywhere?
    },

    itemObject: function (item) {
        return this._itemFromElement(item);
    },

    releaseItem: function (item) {
        /// <summary locid="133">
        /// Notifies the Items Manager that the element representing a given item no longer needs to be
        /// retained.
        /// </summary>
        /// <param name="item" type="Object" domElement="true" locid="130">
        /// The element representing the item.
        /// </param>

        // TODO: Must do ref-counting of our own

        var itemObject = this._itemFromElement(item);

        this._releaseElement(item);

        this._listBinding.releaseItem(itemObject);
    },

    refresh: function () {
        /// <summary locid="134">
        /// Directs the Items Manager to communicate with the data source to determine if any aspects of the
        /// instantiated items have changed.
        /// </summary>

        this._listDataSource.refresh();
    },

    // Private members

    _handlerToNotify: function () {
        if (!this._notificationsSent) {
            this._notificationsSent = true;

            if (this._elementNotificationHandler.beginNotifications) {
                this._elementNotificationHandler.beginNotifications();
            }
        }
        return this._elementNotificationHandler;
    },

    _initializePriorities: function () {
        // ID for items with high priority; items with medium priority have this value + 1.  Allows all items to be set
        // to low priority by increasing this counter.
        this._highPriorityID = 0;
    },

    _deprioritizeAll: function () {
        this._highPriorityID += 2;
    },

    _setRecordPriority: function (record, priority) {
        var Priority = UI.Priority;


        record.priorityID = this._highPriorityID;

        if (priority === Priority.medium) {
            record.priorityID++;
        }
    },

    _getRecordPriority: function (record) {
        var Priority = UI.Priority;

        switch (record.priorityID) {
            case this._highPriorityID:
                return Priority.high;

            case this._highPriorityID + 1:
                return Priority.medium;
            
            default:
                return Priority.low;
        }
    },

    _defineIndexProperty: function (itemForRenderer, item) {
        var record = this._handleMap[item.handle];

        record.indexObserved = false;

        Object.defineProperty(itemForRenderer, "index", {
            get: function () {
                record.indexObserved = true;

                var index = item.index;
                return (typeof index === "number" ? index : null);
            }
        });
    },

    _defineIDProperty: function (itemForRenderer) {
        var that = this;
        Object.defineProperty(itemForRenderer, "id", {
            get: function () {
                return UI.RenderManager.itemID(that._ownerElement, itemForRenderer.key);
            }
        });
    },

    _renderPlaceholder: function (record) {
        var itemForRenderer = {};
        this._defineIndexProperty(itemForRenderer, record.item);
        var elementPlaceholder = this._placeholderRenderer(itemForRenderer);

        record.elementIsPlaceholder = true;

        return elementPlaceholder;
    },

    _renderItem: function (item, priority) {
        // Derive a new item and override its index property, to track whether it is read
        var itemForRenderer = Object.create(item);
        this._defineIndexProperty(itemForRenderer, item);
        this._defineIDProperty(itemForRenderer);

        return this._renderManager.render(itemForRenderer, priority);
    },

    _replaceElement: function (record, elementNew) {
        delete this._elementMap[record.element.uniqueID];
        record.element = elementNew;
        this._elementMap[elementNew.uniqueID] = record;
    },

    _changeElement: function (record, elementNew, elementNewIsPlaceholder) {
        record.renderPromise = null;
        var elementOld = record.element;

        this._saveElementState(record);

        if (record.newItem) {
            record.item = record.newItem;
            record.newItem = null;
        }

        this._replaceElement(record, elementNew);

        if (record.item && record.elementIsPlaceholder && !elementNewIsPlaceholder) {
            record.elementDelayed = null;
            record.elementIsPlaceholder = false;
            this._handlerToNotify().itemAvailable(record.element, elementOld);
        } else {
            this._handlerToNotify().changed(elementNew, elementOld);
        }
    },

    _saveElementState: function (record) {
        if (this._itemNotificationHandler.saveState && record.stateRestored) {
            var key = record.item.key;
            if (key) {
                this._itemNotificationHandler.saveState(key, record.element);
            }
        }
    },

    _restoreElementState: function (record) {
        if (this._itemNotificationHandler.restoreState) {
            this._itemNotificationHandler.restoreState(record.item.key, record.element);
        }

        record.stateRestored = true;
    },

    _elementForItem: function (itemPromise) {
        var handle = itemPromise.handle,
            record = this._handleMap[handle],
            element;

        if (!handle) {
            return null;
        }

        if (record) {
            element = record.element;
        } else {
            // Create a new record for this item
            record = this._handleMap[handle] = {
                item: itemPromise
            };
            
            var that = this,
                mirage = false,
                synchronous = false,
                renderPromise = itemPromise.
                    then(function (item) {
                        if (!item) {
                            mirage = true;
                            return null;
                        }

                        record.item = item;

                        return that._renderItem(item, that._getRecordPriority(record));
                    }).
                    then(function (elementNew) {
                        if (mirage) {

                            // Make sure we return null
                            element = null;
                        } else {
                    
                            synchronous = true;
                            record.renderPromise = null;

                            if (element) {
                                that._presentElements(record, elementNew);
                            } else {
                                element = elementNew;
                                that._restoreElementState(record);
                            }
                        }
                    });

            if (!mirage) {
                if (!synchronous) {
                    record.renderPromise = renderPromise;
                }

                if (!element) {
                    element = this._renderPlaceholder(record);
                }

                record.element = element;
                this._elementMap[element.uniqueID] = record;

                // TODO:  Unconditionally retain until we sort out client code
                itemPromise.retain();
            }
        }
        
        return element;
    },

    _recordFromElement: function (element) {
        var record = this._elementMap[element.uniqueID];
        if (!record) {
            throw new Error(itemIsInvalid);
        }

        return record;
    },

    _itemFromElement: function (element) {
        return this._recordFromElement(element).item;
    },

    _elementFromHandle: function (handle) {
        if (handle) {
            var record = this._handleMap[handle];

            if (record && record.element) {
                return record.element;
            }
        }

        return null;
    },

    _inserted: function (item, previousHandle, nextHandle) {
        var element = this.itemFromKey(item.key),
            previous = this._elementFromHandle(previousHandle),
            next = this._elementFromHandle(nextHandle);

        this._handlerToNotify().inserted(element, previous, next);
        this._presentAllElements();
    },

    _changed: function (newItem, oldItem) {
        var Priority = UI.Priority;

        var record = this._handleMap[oldItem.handle];

        if (record.renderPromise) {
            record.renderPromise.cancel();
        }
        
        record.newItem = newItem;

        var that = this;
        record.renderPromise = this._renderItem(newItem, Priority.immediate).
            then(function (elementNew) {
                that._changeElement(record, elementNew, false);
                that._presentElements(record);
            });
    },

    _moved: function (item, previousHandle, nextHandle) {
        var element = this._elementFromHandle(item.handle),
            previous = this._elementFromHandle(previousHandle),
            next = this._elementFromHandle(nextHandle);

        // If we haven't instantiated this item yet, do so now
        if (!element) {
            element = this.itemFromKey(item.key);
        }

        this._handlerToNotify().moved(element, previous, next);
        this._presentAllElements();
    },

    _removed: function (handle, mirage) {
        var element = this._elementFromHandle(handle);

        this._handlerToNotify().removed(element, mirage);
        this._releaseElement(element);
        this._presentAllElements();
    },

    _countChanged: function (newCount, oldCount) {
        if (this._elementNotificationHandler.countChanged) {
            this._handlerToNotify().countChanged(newCount, oldCount);
        }
    },

    _indexChanged: function (handle, newIndex, oldIndex) {
        var Priority = UI.Priority;

        var record = this._handleMap[handle];

        if (record.indexObserved) {
            if (!record.elementIsPlaceholder) {
                if (record.item.index !== newIndex) {
                    if (record.renderPromise) {
                        record.renderPromise.cancel();
                    }

                    var itemToRender = record.newItem || record.item;
                    itemToRender.index = newIndex;

                    var that = this;
                    record.renderPromise = this._renderItem(itemToRender, Priority.immediate).
                        then(function (elementNew) {
                            that._changeElement(record, elementNew, false);
                            that._presentElements(record);
                        });
                }
            } else {
                this._changeElement(record, this._renderPlaceholder(record), true);
            }
        }

        if (this._elementNotificationHandler.indexChanged) {
            this._handlerToNotify().indexChanged(record.element, newIndex, oldIndex);
        }
    },

    _endNotifications: function () {
        if (this._notificationsSent) {
            this._notificationsSent = false;

            if (this._elementNotificationHandler.endNotifications) {
                this._elementNotificationHandler.endNotifications();
            }
        }
    },

    // Some functions may be called synchronously or asynchronously, so it's best to post _endNotifications to avoid
    // calling it prematurely.
    _postEndNotifications: function () {
        if (!this._endNotificationsPosted) {
            this._endNotificationsPosted = true;
            var that = this;
            WinJS.UI._setTimeout(function () {
                that._endNotificationsPosted = false;
                that._endNotifications();
            }, 0);
        }
    },

    _releaseElement: function (element) {
        var record = this._recordFromElement(element);

        if (record.renderPromise) {
            record.renderPromise.cancel();
        }

        this._saveElementState(record);

        delete this._elementMap[element.uniqueID];
        delete this._handleMap[record.item.handle];
    },

    _presentElement: function (record) {
        var elementOld = record.element;

        // There should be no state to save

        // Finish modifying the slot before calling back into user code, in case there is a reentrant call
        this._replaceElement(record, record.elementDelayed);
        record.elementDelayed = null;

        record.elementIsPlaceholder = false;
        this._handlerToNotify().itemAvailable(record.element, elementOld);
    },

    _presentElements: function (record, elementDelayed) {
        var Priority = UI.Priority,
            highPriorityItemInstantiated = false;

        // Do not instantiate a high-priority item if there is an uninstantiated high priority item before it
        if (elementDelayed) {
            // Treat all newly available items as delayed, even if they're about to be rendered
            record.elementDelayed = elementDelayed;

            if (this._getRecordPriority(record) === Priority.high) {
                var index = record.item.index;
                if (typeof index !== "number" || index > 0) {
                    this._listBinding.jumpToItem(record.item);
                    var recordPrev = this._handleMap[this._listBinding.previous().handle];
                    if (recordPrev && this._getRecordPriority(record) === Priority.high && recordPrev.renderPromise) {
                        return;
                    }
                }

                // This high-priority item is about to be instantiated, which might unblock others after it
                highPriorityItemInstantiated = true;
            }
        }

        this._listBinding.jumpToItem(record.item);
        do {
            if (record.elementDelayed) {
                this._presentElement(record);
            }

            this._restoreElementState(record);

            // If no new high-priority items have been instantiated, there's no need to look further
            if (!highPriorityItemInstantiated) {
                break;
            }

            // If the next item is a high priority and ready to instantiate, do so now
            record = this._handleMap[this._listBinding.next().handle];
        } while (record && this._getRecordPriority(record) === Priority.high && record.elementDelayed);

        this._postEndNotifications();
    },

    // Presents all delayed elements
    _presentAllElements: function () {
        var records = this._handleMap;
        for (var property in records) {
            var record = records[property];

            if (record.elementDelayed) {
                this._presentElement(record);
            }
        }
    }
});

// Public definitions

WinJS.Namespace.define("WinJS.UI", {

    // TODO:  Remove this once all client code is fixed up
    createItemsManager: function (dataSource, itemRenderer, elementNotificationHandler, options) {
        /// <summary locid="135">
        /// Creates an Items Manager object bound to the given data source.
        /// </summary>
        /// <param name="dataSource" type="DataSource" locid="136">
        /// The data source object that serves as the intermediary between the Items Manager and the actual data
        /// source.  Object must implement the DataSource interface.
        /// </param>
        /// <param name="itemRenderer" mayBeNull="true" type="Function" locid="137">
        /// Callback for rendering fetched items.  Function's signature should match that of itemRendererCallback.
        /// </param>
        /// <param name="elementNotificationHandler" type="ElementNotificationHandler" locid="138">
        /// A notification handler object that the Items Manager will call when the instantiated items
        /// change in the data source.  Object must implement the ElementNotificationHandler interface.
        /// </param>
        /// <param name="options" mayBeNull="true" optional="true" type="Object" locid="139">
        /// Options for the Items Manager.  Properties on this object may include:
        /// 
        /// placeholderRenderer (type="Object"):
        /// Callback for rendering placeholder elements while items are fetched.  Function's signature should match
        /// that of placeholderRendererCallback.
        /// 
        /// itemNotificationHandler (type="ItemNotificationHandler"):
        /// A notification handler object that the Items Manager will call to signal various state changes.  Object
        /// must implement the ItemNotificationHandler interface.
        /// 
        /// ownerElement (type="Object", domElement="true"):
        /// The DOM element for the owner control; the Items Manager will fire events on this node, and will make
        /// use of its ID, if it has one.
        /// 
        /// </param>
        /// <returns type="ItemsManager" locid="37" />

        return new ItemsManager(dataSource, itemRenderer, elementNotificationHandler, options);
    }
});

})(this);



// List Data Source

(function (global) {

WinJS.Namespace.define("WinJS.UI", {});

var Promise = WinJS.Promise;
var Utilities = WinJS.Utilities;
var UI = WinJS.UI;

// Private statics

var listDataAdaptorIsInvalid = "Invalid argument: listDataAdaptor must be an object or an array.";
var indexIsInvalid = "Invalid argument: index must be a non-negative integer.";
var keyIsInvalid = "Invalid argument: key must be a string.";
var undefinedItemReturned = "Error: data adaptor returned undefined item.";
var invalidKeyReturned = "Error: data adaptor returned item with undefined or null key.";
var invalidIndexReturned = "Error: data adaptor should return undefined, null or a non-negative integer for the index.";
var invalidCountReturned = "Error: data adaptor should return undefined, null, CountResult.unknown, or a non-negative integer for the count.";
var invalidRequestedCountReturned = "Error: data adaptor should return CountResult.unknown, CountResult.failure, or a non-negative integer for the count.";

UI._validateData = function (data) {
    if (data === undefined) {
        return data;
    } else {
        // Convert the data object to JSON and back to enforce the constraints we want.  For example, we don't want
        // functions, arrays with extra properties, DOM objects, cyclic or acyclic graphs, or undefined values.
        var dataValidated = JSON.parse(JSON.stringify(data));

        if (dataValidated === undefined) {
            throw new Error(objectIsNotValidJson);
        }

        return dataValidated;
    }
};

function ListDataSource(listDataAdaptor) {
    // Private members

    var compareByIdentity,
        listDataNotificationHandler,
        status,
        nextListBindingID,
        bindingMap,
        nextHandle,
        requestedSlots,
        getCountPromise,
        getCountPromisesReturned,
        releaseSlotsPosted,
        finishNotificationsPosted,
        editsInProgress,
        editQueue,
        editsQueued,
        synchronousEdit,
        waitForRefresh,
        dataNotificationsInProgress,
        countDelta,
        indexUpdateDeferred,
        nextTempKey,
        currentRefreshID,
        nextFetchID,
        fetchesInProgress,
        startMarker,
        endMarker,
        knownCount,
        slotsStart,
        slotsEnd,
        handleMap,
        keyMap,
        indexMap,
        releasedSlots,
        releasedSlotsMax,
        lastSlotReleased,
        releasedSlotReductionInProgress,
        refreshRequested,
        refreshInProgress,
        refreshFetchesInProgress,
        refreshItemsFetched,
        refreshCount,
        refreshStart,
        refreshEnd,
        keyFetchIDs,
        refreshKeyMap,
        refreshIndexMap,
        deletedKeys,
        synchronousProgress,
        reentrantContinue,
        synchronousRefresh,
        reentrantRefresh;


    function setStatus(statusNew) {
        if (status !== statusNew) {
            status = statusNew;
            // TODO:  Fire statusChange event
        }
    }

    function forEachBindingRecord(callback) {
        for (var property in bindingMap) {
            callback(bindingMap[property]);
        }
    }

    function forEachBindingRecordOfSlot(slot, callback) {
        for (var property in slot.bindingMap) {
            callback(slot.bindingMap[property].bindingRecord);
        }
    }

    function handlerToNotify(bindingRecord) {

        if (!bindingRecord.notificationsSent) {
            bindingRecord.notificationsSent = true;

            if (bindingRecord.notificationHandler.beginNotifications) {
                bindingRecord.notificationHandler.beginNotifications();
            }
        }
        return bindingRecord.notificationHandler;
    }

    function finishNotifications() {
        if (!editsInProgress && !dataNotificationsInProgress) {
            forEachBindingRecord(function (bindingRecord) {
                if (bindingRecord.notificationsSent) {

                    bindingRecord.notificationsSent = false;

                    if (bindingRecord.notificationHandler.endNotifications) {
                        bindingRecord.notificationHandler.endNotifications();
                    }
                }
            });
        }
    }

    function changeCount(count) {
        var oldCount = knownCount;
        knownCount = count;

        forEachBindingRecord(function (bindingRecord) {
            if (bindingRecord.notificationHandler && bindingRecord.notificationHandler.countChanged) {
                handlerToNotify(bindingRecord).countChanged(knownCount, oldCount);
            }
        });
    }

    // Returns the slot after the last insertion point between sequences
    function lastInsertionPoint(listStart, listEnd) {
        var slotNext = listEnd;
        while (!slotNext.firstInSequence) {
            slotNext = slotNext.prev;

            if (slotNext === listStart) {
                return null;
            }
        }

        return slotNext;
    }

    function successorFromIndex(index, indexMapForSlot, listStart, listEnd) {

        // Try the previous index
        var slotNext = indexMapForSlot[index - 1];
        if (slotNext !== undefined) {
            // We want the successor
            slotNext = slotNext.next;
        } else {
            // Try the next index
            slotNext = indexMapForSlot[index + 1];
            if (slotNext === undefined) {
                // Resort to a linear search
                slotNext = listStart.next;
                var lastSequenceStart;
                while (true) {

                    if (slotNext.firstInSequence) {
                        lastSequenceStart = slotNext;
                    }

                    if (index < slotNext.index || slotNext === listEnd) {
                        break;
                    }

                    slotNext = slotNext.next;
                }

                if (slotNext === listEnd && !listEnd.firstInSequence) {
                    // Return the last insertion point between sequences, or undefined if none
                    slotNext = (lastSequenceStart && lastSequenceStart.index === undefined ? lastSequenceStart : undefined);
                }
            }
        }

        return slotNext;
    }

    function setSlotKey(slot, key) {
        slot.key = key;

        // Add the slot to the keyMap, so it is possible to quickly find the slot given its key.

        keyMap[slot.key] = slot;
    }

    function setSlotIndex(slot, index, indexMapForSlot) {

        // Tolerate NaN, so clients can pass (undefined - 1) or (undefined + 1)
        if (typeof index === "number" && !isNaN(index)) {
            slot.index = index;

            // Add the slot to the indexMap, so it is possible to quickly find the slot given its index.
            indexMapForSlot[index] = slot;
        }
    }

    function changeSlotIndex(slot, index, indexMapForSlot) {

        if (slot.index !== undefined && indexMapForSlot[slot.index] === slot) {
            // Remove the slot's old index from the indexMap
            delete indexMapForSlot[slot.index];
        }

        if (index === undefined) {
            delete slot.index;
        } else {
            slot.index = index;

            // Add the slot to the indexMap, so it is possible to quickly find the slot given its index.
            indexMapForSlot[index] = slot;
        }
    }

    function insertSlot(slot, slotNext) {

        slot.prev = slotNext.prev;
        slot.next = slotNext;

        slot.prev.next = slot;
        slotNext.prev = slot;
    }

    function createSlot() {
        var handle = (nextHandle++).toString(), 
            slotNew = {
                handle: handle,
                fetchPromise: null,
                fetchPromisesReturned: 0,
                fetchComplete: null,
                cursorCount: 0,
                bindingMap: null
            };
        handleMap[handle] = slotNew;

        return slotNew;
    }

    function retainSlotForCursor(slot) {
        if (slot) {
            slot.cursorCount++;
        }
    }

    function releaseSlotForCursor(slot) {
        if (slot) {
            slot.cursorCount--;
            releaseSlotIfUnrequested(slot);
        }
    }

    // Creates a new slot and adds it to the slot list before slotNext
    function createAndAddSlot(slotNext, index, indexMapForSlot) {
        var slotNew = createSlot();

        setSlotIndex(slotNew, index, indexMapForSlot);
        insertSlot(slotNew, slotNext);

        return slotNew;
    }

    function createSlotSequence(slotNext, index, indexMapForSlot) {
        var slotNew = createAndAddSlot(slotNext, index, indexMapForSlot);

        slotNew.firstInSequence = true;
        slotNew.lastInSequence = true;

        return slotNew;
    }

    function addSlotBefore(slotNext, indexMapForSlot) {
        var slotNew = createAndAddSlot(slotNext, slotNext.index - 1, indexMapForSlot);
        delete slotNext.firstInSequence;

        // See if we've bumped into the previous sequence
        if (slotNew.prev.index === slotNew.index - 1) {
            delete slotNew.prev.lastInSequence;
        } else {
            slotNew.firstInSequence = true;
        }

        return slotNew;
    }

    function addSlotAfter(slotPrev, indexMapForSlot) {
        var slotNew = createAndAddSlot(slotPrev.next, slotPrev.index + 1, indexMapForSlot);
        delete slotPrev.lastInSequence;

        // See if we've bumped into the next sequence
        if (slotNew.next.index === slotNew.index + 1) {
            delete slotNew.next.firstInSequence;
        } else {
            slotNew.lastInSequence = true;
        }

        return slotNew;
    }

    // Inserts a slot in the middle of a sequence or between sequences.  If the latter, mergeWithPrev and
    // mergeWithNext parameters specify whether to merge the slow with the previous sequence, or next, or neither.
    function insertAndMergeSlot(slot, slotNext, mergeWithPrev, mergeWithNext) {
        insertSlot(slot, slotNext);

        var slotPrev = slot.prev;

        if (slotPrev.lastInSequence) {

            if (mergeWithPrev) {
                delete slotPrev.lastInSequence;
                slot.lastInSequence = true;
            } else {
                slot.firstInSequence = true;
            }

            if (mergeWithNext) {
                delete slotNext.firstInSequence;
                slot.firstInSequence = true;
            } else {
                slot.lastInSequence = true;
            }
        }
    }

    function reinsertSlot(slot, slotNext, mergeWithPrev, mergeWithNext) {
        insertAndMergeSlot(slot, slotNext, !firstInSequence, !lastInSequence);
        keyMap[slot.key] = slot;
        var index = slot.index;
        if (slot.index !== undefined) {
            indexMap[slot.index] = slot;
        }
    }

    function mergeSequences(slotPrev) {
        delete slotPrev.lastInSequence;
        delete slotPrev.next.firstInSequence;
    }

    function splitSequences(slotPrev) {
        var slotNext = slotPrev.next;

        slotPrev.lastInSequence = true;
        slotNext.firstInSequence = true;

        if (slotNext === slotsEnd) {
            // Clear slotsEnd's index, as that's now unknown
            changeSlotIndex(slotsEnd, undefined, indexMap);
        }
    }

    function setSlotKind(slot, kind) {
        if (slot.kind === "placeholder") {
            requestedSlots--;
        }

        slot.kind = kind;

        if (kind === "placeholder") {
            requestedSlots++;
        }
    }

    function removeSlot(slot) {
        if (slot.lastInSequence) {
            delete slot.lastInSequence;
            slot.prev.lastInSequence = true;
        }
        if (slot.firstInSequence) {
            delete slot.firstInSequence;
            slot.next.firstInSequence = true;
        }
        slot.prev.next = slot.next;
        slot.next.prev = slot.prev;
    }

    function removeSlotPermanently(slot) {
        setSlotKind(slot, null);

        removeSlot(slot);

        if (slot.key !== undefined) {
            delete keyMap[slot.key];
        }
        if (slot.index !== undefined) {
            delete indexMap[slot.index];
        }
        delete handleMap[slot.handle];
    }

    function deleteUnrequestedSlot(slot) {
        splitSequences(slot);
        removeSlotPermanently(slot);
    }

    function sendItemAvailableNotification(slot) {
        forEachBindingRecordOfSlot(slot, function (bindingRecord) {
            if (bindingRecord.notificationHandler.itemAvailable) {
                handlerToNotify(bindingRecord).itemAvailable(slot.item);
            }
        });
    }

    function sendInsertedNotification(slot) {
        var slotPrev = slot.prev,
            slotNext = slot.next,
            bindingMapUnion = {},
            property;

        if (slotPrev === slotsStart && slotNext === slotsEnd) {
            // Special case - if the list was empty, broadcast the insertion to all ListBindings with notificationHandlers
            for (property in bindingMap) {
                bindingMapUnion[property] = bindingMap[property];
            }
        } else {
            // Take the union of the bindings for the slots on either side
            for (property in slotPrev.bindingMap) {
                bindingMapUnion[property] = bindingMap[property];
            }
            for (property in slotNext.bindingMap) {
                bindingMapUnion[property] = bindingMap[property];
            }
        }

        for (property in bindingMapUnion) {
            var bindingRecord = bindingMapUnion[property];
            if (bindingRecord.notificationHandler) {
                handlerToNotify(bindingRecord).inserted(slot.item,
                    slotPrev.lastInSequence || slotPrev === slotsStart ? null : slotPrev.handle,
                    slotNext.firstInSequence || slotNext === slotsEnd ? null : slotNext.handle
                );
            }
        }
    }

    function sendChangedNotification(slot, itemOld) {
        forEachBindingRecordOfSlot(slot, function (bindingRecord) {
            handlerToNotify(bindingRecord).changed(slot.item, itemOld);
        });
    }

    function changeSlot(slot) {
        var itemOld = slot.item;
        prepareSlotItem(slot);
        sendChangedNotification(slot, itemOld);
    }

    function moveSlot(slot, slotMoveBefore, mergeWithPrev, mergeWithNext) {
        var slotMoveAfter = slotMoveBefore.prev,
            bindingMapUnion = {},
            property;

        // If the slot is being moved before or after itself, adjust slotMoveAfter or slotMoveBefore accordingly
        if (slotMoveBefore === slot) {
            slotMoveBefore = slot.next;
        } else if (slotMoveAfter === slot) {
            slotMoveAfter = slot.prev;
        }

        // Take the union of the bindings for the three slots involved
        for (property in slot.bindingMap) {
            bindingMapUnion[property] = bindingMap[property];
        }
        for (property in slotMoveBefore.bindingMap) {
            bindingMapUnion[property] = bindingMap[property];
        }
        for (property in slotMoveAfter.bindingMap) {
            bindingMapUnion[property] = bindingMap[property];
        }

        // Send the notification before the move
        for (property in bindingMapUnion) {
            var bindingRecord = bindingMapUnion[property];
            handlerToNotify(bindingRecord).moved(slot.item,
                (slotMoveAfter.lastInSequence && !mergeWithPrev) || slotMoveAfter === slotsStart ? null : slotMoveAfter.handle,
                (slotMoveBefore.firstInSequence && !mergeWithNext) || slotMoveBefore === slotsEnd ? null : slotMoveBefore.handle
            );
        }

        // If a ListBinding cursor is at the slot that's moving, adjust the cursor
        forEachBindingRecordOfSlot(slot, function (bindingRecord) {
            bindingRecord.adjustCurrentSlot();
        });

        removeSlot(slot);
        insertAndMergeSlot(slot, slotMoveBefore, mergeWithPrev, mergeWithNext);
    }

    function deleteSlot(slot, mirage) {
        forEachBindingRecordOfSlot(slot, function (bindingRecord) {
            handlerToNotify(bindingRecord).removed(slot.handle, mirage);

            // If a ListBinding cursor is at the slot that's being removed, adjust the cursor
            bindingRecord.adjustCurrentSlot();
        });

        removeSlotPermanently(slot);
    }

    function createPlaceholder(slot) {
        setSlotKind(slot, "placeholder");

        if (slot.prev === slotsStart && !slot.firstInSequence && !indexUpdateDeferred) {
            slot.indexRequested = true;
            if (slot.index === undefined) {
                setSlotIndex(slot, 0, indexMap);
            }
        }
    }

    function slotRequested(slot) {
        return slot.fetchPromise || slot.cursorCount > 0 || slot.bindingMap;
    }

    function defineCommonItemProperties(item, slot) {
        Object.defineProperty(item, "handle", {
            value: slot.handle,
            writable: false,
            enumerable: false,
            configurable: true
        });

        Object.defineProperty(item, "requestID", { // DEPRECATED: requestID has been replaced by handle
            value: slot.handle,
            writable: false,
            enumerable: false,
            configurable: true
        });

        Object.defineProperty(item, "index", {
            get: function () {
                return slot.index;
            },
            enumerable: false,
            configurable: true
        });
    }

    function prepareSlotItem(slot) {
        // TODO: Get to the point where we can assert(slot.itemNew)
        if (slot.itemNew) {
            var item = slot.itemNew;
            slot.itemNew = null;

            defineCommonItemProperties(item, slot);
        
            // Store a copy of the data if we're comparing by value
            if (!compareByIdentity) {
                slot.data = validateData(item.data);
            }

            slot.item = item;
        }

        setSlotKind(slot, "item");

        delete slot.indexRequested;

        var fetchComplete = slot.fetchComplete;
        if (fetchComplete) {
            slot.fetchComplete = null;
            fetchComplete();
        }
    }

    function requestSlot(slot) {
        if (slot.kind !== "item" && !slotRequested(slot)) {
            if (slot.released) {
                releasedSlots--;
                delete slot.released;
            }

            // If the item has already been fetched, prepare it now to be returned to the client
            if (slot.item || slot.itemNew) {
                prepareSlotItem(slot);
            }
        }
    }

    function slotCreated(slot) {
        if (slot.kind !== "item") {
            if (slot.kind === "mirage") {
                return null;
            }

            createPlaceholder(slot);
        }

        return slot;
    }

    function fetchItemsForNewSlot(fetchItems, slot) {
        // Ensure that the new slot appears to be requested if the fetch completes synchronously
        slot.fetchRequested = true;
        fetchItems(slot);
        slot.fetchRequested = false;
    }

    function requestSlotBefore(slotNext, fetchItems) {
        // First, see if the previous slot already exists
        if (!slotNext.firstInSequence) {
            var slotPrev = slotNext.prev;

            // Next, see if the item is known to not exist
            if (slotPrev === slotsStart) {
                return null;
            } else {
                requestSlot(slotPrev);
                return slotPrev;
            }
        }

        // Create a new slot and start a request for it
        var slotNew = addSlotBefore(slotNext, indexMap);
        fetchItemsForNewSlot(fetchItems, slotNew);

        return slotCreated(slotNew);
    }

    function requestSlotAfter(slotPrev, fetchItems) {
        // First, see if the next slot already exists
        if (!slotPrev.lastInSequence) {
            var slotNext = slotPrev.next;

            // Next, see if the item is known to not exist
            if (slotNext === slotsEnd) {
                return null;
            } else {
                requestSlot(slotNext);
                return slotNext;
            }
        }

        // Create a new slot and start a request for it
        var slotNew = addSlotAfter(slotPrev, indexMap);
        fetchItemsForNewSlot(fetchItems, slotNew);

        return slotCreated(slotNew);
    }

    function slotFetchInProgress(slot) {
        var fetchID = slot.fetchID;
        return fetchID && fetchesInProgress[fetchID];
    }

    function slotReadyForFetch(slot) {
        return !slot.item && !slot.itemNew && !slotFetchInProgress(slot);
    }

    function slotShouldBeFetched(slot) {
        return slotRequested(slot) && slotReadyForFetch(slot);
    }

    function setFetchID(slot, fetchID) {
        slot.fetchID = fetchID;
    }

    function newFetchID() {
        var fetchID = nextFetchID;
        nextFetchID++;

        fetchesInProgress[fetchID] = true;

        return fetchID;
    }

    function setFetchIDs(slot, countBefore, countAfter) {
        var fetchID = newFetchID();
        setFetchID(slot, fetchID);

        var slotBefore = slot;
        while (!slotBefore.firstInSequence && countBefore > 0) {
            slotBefore = slotBefore.prev;
            countBefore--;
            setFetchID(slotBefore, fetchID);
        }

        var slotAfter = slot;
        while (!slotAfter.lastInSequence && countAfter > 0) {
            slotAfter = slotAfter.next;
            countAfter--;
            setFetchID(slotAfter, fetchID);
        }

        return fetchID;
    }

    function fetchItems(slot, fetchID, promiseItems) {
        var refreshID = currentRefreshID;
        promiseItems.then(
            function (fetchResult) {
                addMarkers(fetchResult);
                processResults(slot, refreshID, fetchID, fetchResult.items, fetchResult.offset, fetchResult.totalCount, fetchResult.absoluteIndex);
            },
            function (error) {
                processResults(slot, refreshID, fetchID, error.name);
            }
        );
    }

    function fetchItemsForIndex(indexRequested, slot, promiseItems) {
        var refreshID = currentRefreshID;
        promiseItems.then(
            function (fetchResult) {
                addMarkers(fetchResult);
                processResultsForIndex(indexRequested, slot, refreshID, fetchResult.items, fetchResult.offset, fetchResult.totalCount, fetchResult.absoluteIndex);
            },
            function (error) {
                processResultsForIndex(indexRequested, slot, refreshID, error.name);
            }
        );
    }

    function fetchItemsFromStart(slot, count) {
        if (!refreshInProgress && !slotFetchInProgress(slot)) {
            var fetchID = setFetchIDs(slot, 0, count - 1);

            if (listDataAdaptor.itemsFromStart) {
                fetchItems(slot, fetchID, listDataAdaptor.itemsFromStart(count));
            } else {
                fetchItems(slot, fetchID, listDataAdaptor.itemsFromIndex(0, 0, count - 1));
            }
        }
    }

    function fetchItemsFromEnd(slot, count) {
        if (!refreshInProgress && !slotFetchInProgress(slot)) {
            var fetchID = setFetchIDs(slot, 0, count - 1);

            fetchItems(slot, fetchID, listDataAdaptor.itemsFromEnd(count));
        }
    }

    function fetchItemsFromIdentity(slot, countBefore, countAfter) {
        if (!refreshInProgress && !slotFetchInProgress(slot)) {
            var fetchID = setFetchIDs(slot, countBefore, countAfter);

            if (listDataAdaptor.itemsFromKey && slot.key !== undefined) {
                fetchItems(slot, fetchID, listDataAdaptor.itemsFromKey(slot.key, countBefore, countAfter));
            } else {
                // Don't ask for items with negative indices
                var index = slot.index;
                fetchItems(slot, fetchID, listDataAdaptor.itemsFromIndex(index, Math.min(countBefore, index), countAfter));
            }
        }
    }

    function fetchItemsFromIndex(slot, countBefore, countAfter) {

        if (!refreshInProgress && !slotFetchInProgress(slot)) {
            var index = slot.index;

            // Don't ask for items with negative indices
            if (countBefore > index) {
                countBefore = index;
            }

            if (listDataAdaptor.itemsFromIndex) {
                var fetchID = setFetchIDs(slot, countBefore, countAfter);

                fetchItems(slot, fetchID, listDataAdaptor.itemsFromIndex(index, countBefore, countAfter));
            } else {
                // If the slot key is known, we just need to request the surrounding items
                if (slot.key !== undefined) {
                    fetchItemsFromIdentity(slot, countBefore, countAfter);
                } else {
                    // Search for the slot with the closest index that has a known key (using the start of the list as
                    // a last resort).
                    var slotClosest = slotsStart,
                        closestDelta = index + 1,
                        slotSearch,
                        delta;

                    // First search backwards
                    for (slotSearch = slot.prev; slotSearch !== slotsStart; slotSearch = slotSearch.prev) {
                        if (slotSearch.index !== undefined && slotSearch.key !== undefined) {
                            delta = index - slotSearch.index;
                            if (closestDelta > delta) {
                                closestDelta = delta;
                                slotClosest = slotSearch;
                            }
                            break;
                        }
                    }

                    // Then search forwards
                    for (slotSearch = slot.next; slotSearch !== slotsEnd; slotSearch = slotSearch.next) {
                        if (slotSearch.index !== undefined && slotSearch.key !== undefined) {
                            delta = slotSearch.index - index;
                            if (closestDelta > delta) {
                                closestDelta = delta;
                                slotClosest = slotSearch;
                            }
                            break;
                        }
                    }

                    if (slotClosest === slotsStart) {
                        fetchItemsForIndex(0, slot, listDataAdaptor.itemsFromStart(index + 1));
                    } else if (slotSearch.index !== undefined && slotSearch.key !== undefined) {
                        fetchItemsForIndex(slotSearch.index, slot, listDataAdaptor.itemsFromKey(
                            slotSearch.key,
                            Math.max(slotSearch.index - index, 0),
                            Math.max(index - slotSearch.index, 0)
                        ));
                    }
                }
            }
        }
    }

    function fetchItemsFromDescription(slot, description, countBefore, countAfter) {
        if (!refreshInProgress && !slotFetchInProgress(slot)) {
            var fetchID = setFetchIDs(slot, countBefore, countAfter);

            fetchItems(slot, fetchID, listDataAdaptor.itemsFromDescription(description, countBefore, countAfter));
        }
    }

    function queueFetchFromStart(queue, slot, count) {
        queue.push(function () {
            fetchItemsFromStart(slot, count);
        });
    }

    function queueFetchFromEnd(queue, slot, count) {
        queue.push(function () {
            fetchItemsFromEnd(slot, count);
        });
    }

    function queueFetchFromIdentity(queue, slot, countBefore, countAfter) {
        queue.push(function () {
            fetchItemsFromIdentity(slot, countBefore, countAfter);
        });
    }

    function queueFetchFromIndex(queue, slot, countBefore, countAfter) {
        queue.push(function () {
            fetchItemsFromIndex(slot, countBefore, countAfter);
        });
    }

    function resetRefreshState() {
        // Give the start sentinel an index so we can always use predecessor + 1
        refreshStart = {
            firstInSequence: true,
            lastInSequence: true,
            index: -1
        };
        refreshEnd = {
            firstInSequence: true,
            lastInSequence: true
        };
        refreshStart.next = refreshEnd;
        refreshEnd.prev = refreshStart;


        refreshItemsFetched = false;
        refreshCount = undefined;
        keyFetchIDs = {};
        refreshKeyMap = {};
        refreshIndexMap = {};
        refreshIndexMap[-1] = refreshStart;
        deletedKeys = {};
    }

    function beginRefresh() {
        if (refreshRequested) {
            // There's already a refresh that has yet to start
            return;
        }

        refreshRequested = true;

        // TODO: Actually set this to waiting, and ready once all fetches have finished
        setStatus(UI.ItemsManagerStatus.ready);

        if (waitForRefresh) {
            waitForRefresh = false;

            // The edit queue has been paused until the next refresh - resume it now
            if (editsQueued) {
                applyNextEdit();

                // This code is a little subtle.  If applyNextEdit emptied the queue, it will have cleared editsQueued
                // and called beginRefresh.  However, since refreshRequested is true, the latter will be a no-op, so
                // execution must fall through to the test for editsQueued below.
            }
        } 
        
        if (editsQueued) {
            // The refresh will be started once the edit queue empties out
            return;
        }

        currentRefreshID++;
        refreshInProgress = true;
        refreshFetchesInProgress = 0;

        resetRefreshState();

        // Do the rest of the work asynchronously
        msSetImmediate(function () {
            refreshRequested = false;
            startRefreshFetches();
        });
    }

    function fetchItemsForRefresh(key, fetchID, promiseItems) {
        var refreshID = currentRefreshID;
        promiseItems.then(
            function (fetchResult) {
                addMarkers(fetchResult);
                processRefreshResults(key, refreshID, fetchID, fetchResult.items, fetchResult.offset, fetchResult.totalCount, fetchResult.absoluteIndex);
            },
            function (error) {
                processRefreshResults(key, refreshID, fetchID, error.name);
            }
        );
    }

    function refreshRange(slot, fetchID, countBefore, countAfter) {
        var searchDelta = 20;

        refreshFetchesInProgress++;

        if (listDataAdaptor.itemsFromKey) {
            // Keys are the preferred identifiers when the item might have moved

            // Fetch at least one item before and after, just to verify item's position in list
            fetchItemsForRefresh(slot.key, fetchID, listDataAdaptor.itemsFromKey(slot.key, countBefore + 1, countAfter + 1));
        } else {
            // Request additional items to try to locate items that have moved (but don't ask for items with negative
            // indices).
            var index = slot.index;
            fetchItemsForRefresh(slot.key, fetchID, listDataAdaptor.itemsFromIndex(index, Math.min(countBefore + searchDelta, index), countAfter + searchDelta));
        }
    }

    function refreshFirstItem(fetchID) {
        refreshFetchesInProgress++;

        if (listDataAdaptor.itemsFromStart) {
            fetchItemsForRefresh(null, fetchID, listDataAdaptor.itemsFromStart(1));
        } else if (listDataAdaptor.itemsFromIndex) {
            fetchItemsForRefresh(null, fetchID, listDataAdaptor.itemsFromIndex(0, 0, 0));
        }
    }

    function keyFetchInProgress(key) {
        return fetchesInProgress[keyFetchIDs[key]];
    }

    function refreshRanges(slotFirst, allRanges) {
        // Fetch a few extra items each time, to catch insertions without requiring an extra fetch
        var refreshFetchExtra = 3;

        var refreshID = currentRefreshID;

        var slotFetchFirst,
            fetchCount = 0,
            fetchID;

        // Walk through the slot list looking for keys we haven't fetched or attempted to fetch yet.
        // Rely on the heuristic that items that were close together before the refresh are likely to remain so after,
        // so batched fetches will locate most of the previously fetched items.
        for (var slot = slotFirst; slot !== slotsEnd; slot = slot.next) {
            if (slotFetchFirst === undefined && slot.kind === "item" && !deletedKeys[slot.key] && !keyFetchInProgress(slot.key)) {
                var slotRefresh = refreshKeyMap[slot.key];

                // Keep attempting to fetch an item until at least one item on either side of it has been observed, so
                // we can determine its position relative to others.
                if (!slotRefresh || slotRefresh.firstInSequence || slotRefresh.lastInSequence) {
                    slotFetchFirst = slot;
                    fetchID = newFetchID();
                }
            }

            if (slotFetchFirst === undefined) {
                // Also attempt to fetch placeholders for requests for specific keys, just in case those items no
                // longer exist.
                if (slot.kind === "placeholder") {
                    if (slot.key !== undefined && !slot.item && !deletedKeys[slot.key]) {
                        // Fulfill each "itemFromKey" request
                        if (!refreshKeyMap[slot.key]) {
                            // Fetch at least one item before and after, just to verify item's position in list
                            refreshFetchesInProgress++;
                            fetchItemsForRefresh(slot.key, newFetchID(), listDataAdaptor.itemsFromKey(slot.key, 1, 1));
                        }
                    }
                }
            } else {
                var keyAlreadyFetched = keyFetchInProgress(slot.key);

                if (!deletedKeys[slot.key] && !refreshKeyMap[slot.key] && !keyAlreadyFetched) {
                    if (slot.kind === "item") {
                        keyFetchIDs[slot.key] = fetchID;
                    }
                    fetchCount++;
                }

                if (slot.lastInSequence || slot.next === slotsEnd || keyAlreadyFetched) {
                    // TODO: fetch a random item from the middle of the list, rather than the first one?
                    refreshRange(slotFetchFirst, fetchID, 0, fetchCount - 1 + refreshFetchExtra);


                    if (!allRanges) {
                        break;
                    }

                    slotFetchFirst = undefined;
                    fetchCount = 0;
                }
            }
        }

        if (refreshFetchesInProgress === 0 && !refreshItemsFetched && currentRefreshID === refreshID) {
            // If nothing was successfully fetched, try fetching the first item, to detect an empty list
            refreshFirstItem(newFetchID());
        }

    }

    function startRefreshFetches() {
        var refreshID = currentRefreshID;

        do {
            synchronousProgress = false;
            reentrantContinue = true;
            refreshRanges(slotsStart.next, true);
            reentrantContinue = false;
        } while (refreshFetchesInProgress === 0 && synchronousProgress && currentRefreshID === refreshID);

        if (refreshFetchesInProgress === 0 && currentRefreshID === refreshID) {
            concludeRefresh();
        }
    }

    function continueRefresh(key) {
        var refreshID = currentRefreshID;

        // If the key is undefined, then the attempt to fetch the first item just completed, and there is nothing else
        // to fetch.
        if (key !== undefined) {
            var slotContinue = keyMap[key];
            if (!slotContinue) {
                // In a rare case, the slot might have been deleted; just start scanning from the beginning again
                slotContinue = slotsStart.next;
            }

            do {
                synchronousRefresh = false;
                reentrantRefresh = true;
                refreshRanges(slotContinue, false);
                reentrantRefresh = false;
            } while (synchronousRefresh && currentRefreshID === refreshID);
        }

        if (reentrantContinue) {
            synchronousProgress = true;
        } else {
            if (refreshFetchesInProgress === 0 && currentRefreshID === refreshID) {
                // Walk through the entire list one more time, in case any edits were made during the refresh
                startRefreshFetches();
            }
        }
    }

    // TODO: This function will be replaced by validation and then removed
    function isNonNegativeNumber(n) {
        return (typeof n === "number") && n >= 0;
    }

    // TODO: This function will be replaced by validation and then removed
    function isNonNegativeInteger(n) {
        return isNonNegativeNumber(n) && n === Math.floor(n);
    }

    // Adds markers on behalf of the data adaptor if their presence can be deduced
    function addMarkers(fetchResult) {
        var items = fetchResult.items,
            offset = fetchResult.offset,
            totalCount = fetchResult.totalCount,
            absoluteIndex = fetchResult.absoluteIndex,
            atStart = fetchResult.atStart,
            atEnd = fetchResult.atEnd;

        if (isNonNegativeNumber(absoluteIndex)) {
            if (isNonNegativeNumber(totalCount)) {
                var itemsLength = items.length;
                if (absoluteIndex - offset + itemsLength === totalCount) {
                    atEnd = true;
                }
            }

            if (offset === absoluteIndex) {
                atStart = true;
            }
        }

        if (atStart) {
            items.unshift(startMarker);
            fetchResult.offset++;
        }

        if (atEnd) {
            items.push(endMarker);
        }
    }

    function slotRefreshFromResult(result) {
        if (result === undefined) {
            throw new Error(undefinedItemReturned);
        } else if (result === startMarker) {
            return refreshStart;
        } else if (result === endMarker) {
            return refreshEnd;
        } else if (result.key === undefined || result.key === null) {
            throw new Error(invalidKeyReturned);
        } else {
            return refreshKeyMap[result.key];
        }
    }

    function processRefreshSlotIndex(slot, expectedIndex) {
        while (slot.index === undefined) {
            setSlotIndex(slot, expectedIndex, refreshIndexMap);

            if (slot.firstInSequence) {
                return true;
            }

            slot = slot.prev;
            expectedIndex--;
        }

        if (slot.index !== expectedIndex) {
            // Something has changed since the refresh began; start again
            beginRefresh();
            return false;
        }

        return true;
    }

    function copyRefreshSlotData(slotRefresh, slot) {
        setSlotKey(slot, slotRefresh.key);
        slot.itemNew = slotRefresh.item;
    }

    function validateIndexReturned(index) {
        if (index === null) {
            index = undefined;
        } else if (index !== undefined && !isNonNegativeInteger(index)) {
            throw new Error(invalidIndexReturned);
        }

        return index;
    }

    function validateCountReturned(count) {
        if (count === null) {
            count = undefined;
        } else if (count !== undefined && !isNonNegativeInteger(count) && count !== UI.CountResult.unknown) {
            throw new Error(invalidCountReturned);
        }

        return count;
    }

    function validateData(data) {
        return compareByIdentity ? data : UI._validateData(data);
    }

    function setRefreshSlotResult(slotRefresh, result) {
        slotRefresh.key = result.key;
        refreshKeyMap[slotRefresh.key] = slotRefresh;

        slotRefresh.item = result;
    }

    function processRefreshResults(key, refreshID, fetchID, results, offset, count, index) {
        // This fetch has completed, whatever it has returned
        delete fetchesInProgress[fetchID];
        refreshFetchesInProgress--;

        if (refreshID !== currentRefreshID) {
            // This information is out of date.  Ignore it.
            return;
        }

        index = validateIndexReturned(index);
        count = validateCountReturned(count);


        // Check if an error result was returned
        if (results === UI.FetchError.noResponse) {
            setStatus(UI.ItemsManagerStatus.failure);
            return;
        } else if (results === UI.FetchError.doesNotExist) {
            if (typeof key !== "string") {
                // The attempt to fetch the first item failed, so the list must be empty

                mergeSequences(refreshStart);
                refreshEnd.index = 0;

                refreshItemsFetched = true;
            } else {
                deletedKeys[key] = true;
            }
        } else {
            var keyPresent = false;

            refreshItemsFetched = true;

            var indexFirst = index - offset,
                result = results[0];

            if (result.key === key) {
                keyPresent = true;
            }

            var slot = slotRefreshFromResult(result);
            if (slot === undefined) {
                if (refreshIndexMap[indexFirst]) {
                    // Something has changed since the refresh began; start again
                    beginRefresh();
                    return;
                }

                // See if these results should be appended to an existing sequence
                var slotPrev;
                if (index !== undefined && (slotPrev = refreshIndexMap[indexFirst - 1])) {
                    if (!slotPrev.lastInSequence) {
                        // Something has changed since the refresh began; start again
                        beginRefresh();
                        return;
                    }
                    slot = addSlotAfter(slotPrev, refreshIndexMap);
                } else {
                    // Create a new sequence
                    var slotSuccessor = indexFirst === undefined ?
                            lastInsertionPoint(refreshStart, refreshEnd) :
                            successorFromIndex(indexFirst, refreshIndexMap, refreshStart, refreshEnd);

                    if (!slotSuccessor) {
                        // Something has changed since the refresh began; start again
                        beginRefresh();
                        return;
                    }

                    slot = createSlotSequence(slotSuccessor, indexFirst, refreshIndexMap);
                }

                setRefreshSlotResult(slot, results[0]);
            } else {
                if (indexFirst !== undefined) {
                    if (!processRefreshSlotIndex(slot, indexFirst)) {
                        return;
                    }
                }
            }

            var resultsCount = results.length;
            for (var i = 1; i < resultsCount; i++) {
                result = results[i];

                if (result.key === key) {
                    keyPresent = true;
                }

                var slotNext = slotRefreshFromResult(result);

                if (slotNext === undefined) {
                    if (!slot.lastInSequence) {
                        // Something has changed since the refresh began; start again
                        beginRefresh();
                        return;
                    }
                    slotNext = addSlotAfter(slot, refreshIndexMap);
                    setRefreshSlotResult(slotNext, result);
                } else {
                    if (slot.index !== undefined && !processRefreshSlotIndex(slotNext, slot.index + 1)) {
                        return;
                    }

                    // If the slots aren't adjacent, see if it's possible to reorder sequences to make them so
                    if (slotNext !== slot.next) {
                        if (!slot.lastInSequence || !slotNext.firstInSequence) {
                            // Something has changed since the refresh began; start again
                            beginRefresh();
                            return;
                        }

                        var slotLast = sequenceEnd(slotNext);
                        if (slotLast !== refreshEnd) {
                            moveSequenceAfter(slot, slotNext, slotLast);
                        } else {
                            var slotFirst = sequenceStart(slot);
                            if (slotFirst !== refreshStart) {
                                moveSequenceBefore(slotNext, slotFirst, slot);
                            } else {
                                // Something has changed since the refresh began; start again
                                beginRefresh();
                                return;
                            }
                        }

                        mergeSequences(slot);
                    } else if (slot.lastInSequence) {

                        mergeSequences(slot);
                    }
                }

                slot = slotNext;
            }

            if (!keyPresent) {
                deletedKeys[key] = true;
            }
        }

        // If the count wasn't provided, see if it can be determined from the end of the list.
        if (!isNonNegativeNumber(count) && !refreshEnd.firstInSequence) {
            var indexLast = refreshEnd.prev.index;
            if (indexLast !== undefined) {
                count = indexLast + 1;
            }
        }

        if (isNonNegativeNumber(count) || count === UI.CountResult.unknown) {
            if (isNonNegativeNumber(refreshCount)) {
                if (count !== refreshCount) {
                    // Something has changed since the refresh began; start again
                    beginRefresh();
                    return;
                }
            } else {
                refreshCount = count;
            }
        }


        if (reentrantRefresh) {
            synchronousRefresh = true;
        } else {
            continueRefresh(key);
        }
    }

    function slotFromSlotRefresh(slotRefresh) {
        if (slotRefresh === refreshStart) {
            return slotsStart;
        } else if (slotRefresh === refreshEnd) {
            return slotsEnd;
        } else {
            return keyMap[slotRefresh.key];
        }
    }

    function slotRefreshFromSlot(slot) {
        if (slot === slotsStart) {
            return refreshStart;
        } else if (slot === slotsEnd) {
            return refreshEnd;
        } else {
            return refreshKeyMap[slot.key];
        }
    }

    function potentialRefreshMirage(slot) {
        return slot.kind === "placeholder" && !slot.indexRequested;
    }

    function mergeSequencesForRefresh(slotPrev) {
        mergeSequences(slotPrev);

        // Mark placeholders at the merge point as potential mirages
        var slot;
        for (slot = slotPrev; potentialRefreshMirage(slot); slot = slot.prev) {
            slot.potentialMirage = true;
        }
        for (slot = slotPrev.next; potentialRefreshMirage(slot); slot = slot.next) {
            slot.potentialMirage = true;
        }

        // Mark the merge point, so we can distinguish insertions from unrequested items
        slotPrev.next.mergedForRefresh = true;
    }

    function addNewSlot(slotRefresh, slotNext, insertAfter) {
        var slotNew = createSlot();

        copyRefreshSlotData(slotRefresh, slotNew);
        setSlotIndex(slotNew, slotRefresh.index, indexMap);
        insertAndMergeSlot(slotNew, slotNext, insertAfter, !insertAfter);

        return slotNew;
    }

    function concludeRefresh() {
        keyFetchIDs = {};

        var i,
            j,
            slot,
            slotPrev,
            slotNext,
            slotRefresh,
            slotsAvailable = [],
            slotFirstInSequence,
            sequenceCountOld,
            sequencesOld = [],
            sequenceOld,
            sequenceOldPrev,
            sequenceOldBestMatch,
            sequenceCountNew,
            sequencesNew = [],
            sequenceNew;


        // Assign a sequence number and slot number to each refresh slot
        var slotNumberNew = 0;
        sequenceCountNew = 0;
        for (slotRefresh = refreshStart; slotRefresh; slotRefresh = slotRefresh.next) {
            slotRefresh.sequenceNumber = sequenceCountNew;
            slotRefresh.number = slotNumberNew;
            slotNumberNew++;

            if (slotRefresh.firstInSequence) {
                slotFirstInSequence = slotRefresh;
            }

            if (slotRefresh.lastInSequence) {
                sequencesNew[sequenceCountNew] = {
                    first: slotFirstInSequence,
                    last: slotRefresh,
                    matchingItems: 0
                };
                sequenceCountNew++;
            }
        }

        // If the count is known, see if there are any placeholders with requested indices that exceed it
        if (isNonNegativeNumber(refreshCount)) {
            removeMirageIndices(refreshCount);
        }

        // Remove unnecessary information from main slot list, and update the items
        lastSlotReleased = undefined;
        releasedSlots = 0;
        for (slot = slotsStart.next; slot !== slotsEnd; ) {
            slotRefresh = refreshKeyMap[slot.key];
            slotNext = slot.next;
            if (!slotRequested(slot)) {
                // Strip unrequested items from the main slot list, as they'll just get in the way from now on.
                // Since we're discarding these, but don't know if they're actually going away, split the sequence
                // as our starting assumption must be that the items on either side are in separate sequences.
                deleteUnrequestedSlot(slot);
            } else if (slot.key !== undefined && !slotRefresh) {
                // Remove items that have been deleted (or moved far away) and send removed notifications
                deleteSlot(slot, false);
            } else {
                // Clear keys and items that have never been observed by client
                if (slot.kind === "placeholder" && slot.key !== undefined && !slot.keyRequested) {
                    delete keyMap[slot.key];
                    delete slot.key;
                    delete slot.item;
                }

                if (slotRefresh) {
                    // Store the new item; this value will be compared with that stored in slot.item later
                    slot.itemNew = slotRefresh.item;
                }
            }

            slot = slotNext;
        }


        // Placeholders generated by itemsAtIndex, and adjacent placeholders, should not move.
        // Match these to items now if possible, or remove conflicting ones as mirages.
        for (slot = slotsStart.next; slot !== slotsEnd; ) {
            slotNext = slot.next;


            if (slot.indexRequested) {

                slotRefresh = refreshIndexMap[slot.index];
                if (slotRefresh) {
                    if (slotFromSlotRefresh(slotRefresh)) {
                        deleteSlot(slot, true);
                    } else {
                        setSlotKey(slot, slotRefresh.key);
                        slot.itemNew = slotRefresh.item;
                    }
                }
            }

            slot = slotNext;
        }


        // Match old sequences to new sequences
        var bestMatch,
            bestMatchCount,
            newSequenceCounts = [],
            sequenceIndexRequested,
            slotIndexRequested;

        sequenceCountOld = 0;
        for (slot = slotsStart; slot; slot = slot.next) {
            if (slot.firstInSequence) {
                slotFirstInSequence = slot;
                sequenceIndexRequested = false;
                for (i = 0; i < sequenceCountNew; i++) {
                    newSequenceCounts[i] = 0;
                }
            }

            if (slot.indexRequested) {
                sequenceIndexRequested = true;
                slotIndexRequested = slot;
            }

            slotRefresh = slotRefreshFromSlot(slot);
            if (slotRefresh) {
                newSequenceCounts[slotRefresh.sequenceNumber]++;
            }

            if (slot.lastInSequence) {
                // Determine which new sequence is the best match for this old one
                bestMatchCount = 0;
                for (i = 0; i < sequenceCountNew; i++) {
                    if (bestMatchCount < newSequenceCounts[i]) {
                        bestMatchCount = newSequenceCounts[i];
                        bestMatch = i;
                    }
                }

                sequenceOld = {
                    first: slotFirstInSequence,
                    last: slot,
                    sequenceNew: (bestMatchCount > 0 ? sequencesNew[bestMatch] : undefined),
                    matchingItems: bestMatchCount
                };

                if (sequenceIndexRequested) {
                    sequenceOld.indexRequested = true;
                    sequenceOld.stationarySlot = slotIndexRequested;
                }

                sequencesOld[sequenceCountOld] = sequenceOld;

                sequenceCountOld++;
            }
        }

        // Special case: split the old start into a separate sequence if the new start isn't its best match
        if (sequencesOld[0].sequenceNew !== sequencesNew[0]) {
            splitSequences(slotsStart);
            sequencesOld[0].first = slotsStart.next;
            sequencesOld.unshift({
                first: slotsStart,
                last: slotsStart,
                sequenceNew: sequencesNew[0],
                matchingItems: 1
            });
            sequenceCountOld++;
        }

        // Special case: split the old end into a separate sequence if the new end isn't its best match
        if (sequencesOld[sequenceCountOld - 1].sequenceNew !== sequencesNew[sequenceCountNew - 1]) {
            splitSequences(slotsEnd.prev);
            sequencesOld[sequenceCountOld - 1].last = slotsEnd.prev;
            sequencesOld[sequenceCountOld] = {
                first: slotsEnd,
                last: slotsEnd,
                sequenceNew: sequencesNew[sequenceCountNew - 1],
                matchingItems: 1
            };
            sequenceCountOld++;
        }

        // Map new sequences to old sequences
        for (i = 0; i < sequenceCountOld; i++) {
            sequenceNew = sequencesOld[i].sequenceNew;
            if (sequenceNew && sequenceNew.matchingItems < sequencesOld[i].matchingItems) {
                sequenceNew.matchingItems = sequencesOld[i].matchingItems;
                sequenceNew.sequenceOld = sequencesOld[i];
            }
        }

        // The old start must always be the best match for the new start
        sequencesNew[0].sequenceOld = sequencesOld[0];
        sequencesOld[0].stationarySlot = slotsStart;

        // The old end must always be the best match for the new end (if the new end is also the new start, they will
        // be merged below).
        sequencesNew[sequenceCountNew - 1].sequenceOld = sequencesOld[sequenceCountOld - 1];
        sequencesOld[sequenceCountOld - 1].stationarySlot = slotsEnd;


        // Merge additional old sequences when possible

        // First do a forward pass
        for (i = 0; i < sequenceCountOld; i++) {
            sequenceOld = sequencesOld[i];
            if (sequenceOld.sequenceNew && (sequenceOldBestMatch = sequenceOld.sequenceNew.sequenceOld) === sequenceOldPrev &&
                    (sequenceOld.last.next !== slotsEnd || !refreshEnd.firstInSequence)) {
                mergeSequencesForRefresh(sequenceOldBestMatch.last, sequenceOld.first);
                sequenceOldBestMatch.last = sequenceOld.last;
                delete sequencesOld[i];
            } else {
                sequenceOldPrev = sequenceOld;
            }
        }

        // Now do a reverse pass
        sequenceOldPrev = undefined;
        for (i = sequenceCountOld; i--; ) {
            sequenceOld = sequencesOld[i];
            // From this point onwards, some members of sequencesOld may be undefined
            if (sequenceOld) {
                if (sequenceOld.sequenceNew && (sequenceOldBestMatch = sequenceOld.sequenceNew.sequenceOld) === sequenceOldPrev &&
                        (sequenceOld.last.next !== slotsEnd || !refreshEnd.firstInSequence)) {
                    mergeSequencesForRefresh(sequenceOld.last, sequenceOldBestMatch.first);
                    sequenceOldBestMatch.first = sequenceOld.first;
                    delete sequencesOld[i];
                } else {
                    sequenceOldPrev = sequenceOld;
                }
            }
        }

        // Remove placeholders in old sequences that don't map to new sequences (and don't contain requests for a
        // specific index), as they no longer have meaning.
        for (i = 0; i < sequenceCountOld; i++) {
            sequenceOld = sequencesOld[i];
            if (sequenceOld && !sequenceOld.indexRequested && (!sequenceOld.sequenceNew || sequenceOld.sequenceNew.sequenceOld !== sequenceOld)) {
                sequenceOld.sequenceNew = undefined;

                slot = sequenceOld.first;
                while (true) {
                    slotNext = slot.next;

                    if (slot.kind === "placeholder") {
                        deleteSlot(slot, true);
                        if (sequenceOld.first === slot) {
                            if (sequenceOld.last === slot) {
                                delete sequencesOld[i];
                                break;
                            } else {
                                sequenceOld.first = slot.next;
                            }
                        } else if (sequenceOld.last === slot) {
                            sequenceOld.last = slot.prev;
                        }
                    }

                    if (slot === sequenceOld.last) {
                        break;
                    }

                    slot = slotNext;
                }
            }
        }


        // Locate boundaries of new items in new sequences
        for (i = 0; i < sequenceCountNew; i++) {
            sequenceNew = sequencesNew[i];
            for (slotRefresh = sequenceNew.first; !slotFromSlotRefresh(slotRefresh) && !slotRefresh.lastInSequence; slotRefresh = slotRefresh.next) {
                /*@empty*/
            }
            if (slotRefresh.lastInSequence && !slotFromSlotRefresh(slotRefresh)) {
                sequenceNew.firstInner = sequenceNew.lastInner = undefined;
            } else {
                sequenceNew.firstInner = slotRefresh;
                for (slotRefresh = sequenceNew.last; !slotFromSlotRefresh(slotRefresh); slotRefresh = slotRefresh.prev) {
                    /*@empty*/
                }
                sequenceNew.lastInner = slotRefresh;
            }
        }

        // Determine which items to move
        for (i = 0; i < sequenceCountOld; i++) {
            sequenceOld = sequencesOld[i];
            if (sequenceOld) {
                sequenceNew = sequenceOld.sequenceNew;
                if (sequenceNew !== undefined && sequenceNew.firstInner !== undefined) {
                    // Number the slots in each new sequence with their offset in the corresponding old sequence (or undefined
                    // if in a different old sequence).
                    var ordinal = 0;
                    for (slot = sequenceOld.first; true; slot = slot.next, ordinal++) {
                        slotRefresh = slotRefreshFromSlot(slot);
                        if (slotRefresh && slotRefresh.sequenceNumber === sequenceNew.firstInner.sequenceNumber) {
                            slotRefresh.ordinal = ordinal;
                        }

                        if (slot.lastInSequence) {
                            break;
                        }
                    }

                    // Determine longest subsequence of items that are in the same order before and after
                    var piles = [];
                    for (slotRefresh = sequenceNew.firstInner; true; slotRefresh = slotRefresh.next) {
                        ordinal = slotRefresh.ordinal;
                        if (ordinal !== undefined) {
                            var searchFirst = 0,
                                searchLast = piles.length - 1;
                            while (searchFirst <= searchLast) {
                                var searchMidpoint = Math.floor(0.5 * (searchFirst + searchLast));
                                if (piles[searchMidpoint].ordinal < ordinal) {
                                    searchFirst = searchMidpoint + 1;
                                } else {
                                    searchLast = searchMidpoint - 1;
                                }
                            }
                            piles[searchFirst] = slotRefresh;
                            if (searchFirst > 0) {
                                slotRefresh.predecessor = piles[searchFirst - 1];
                            }
                        }

                        if (slotRefresh === sequenceNew.lastInner) {
                            break;
                        }
                    }

                    // The items in the longest ordered subsequence don't move; everything else does
                    var stationaryItems = [],
                        stationaryItemCount = piles.length;
                    slotRefresh = piles[stationaryItemCount - 1];
                    for (j = stationaryItemCount; j--; ) {
                        slotRefresh.stationary = true;
                        stationaryItems[j] = slotRefresh;
                        slotRefresh = slotRefresh.predecessor;
                    }
                    sequenceOld.stationarySlot = slotFromSlotRefresh(stationaryItems[0]);

                    // Try to match new items between stationary items to placeholders
                    for (j = 0; j < stationaryItemCount - 1; j++) {
                        slotRefresh = stationaryItems[j];
                        slot = slotFromSlotRefresh(slotRefresh);
                        var slotRefreshStop = stationaryItems[j + 1],
                            slotStop = slotFromSlotRefresh(slotRefreshStop);

                        // Find all the new items
                        for (slotRefresh = slotRefresh.next; slotRefresh !== slotRefreshStop && slot !== slotStop; slotRefresh = slotRefresh.next) {
                            if (!slotFromSlotRefresh(slotRefresh)) {
                                // Find the next placeholder
                                for (slot = slot.next; slot !== slotStop; slot = slot.next) {
                                    if (slot.kind === "placeholder") {
                                        copyRefreshSlotData(slotRefresh, slot);
                                        slot.stationary = true;
                                        break;
                                    }
                                }
                            }
                        }

                        // Delete remaining placeholders, sending notifications
                        while (slot !== slotStop) {
                            slotNext = slot.next;

                            if (slot.kind === "placeholder" && slot.key === undefined) {
                                deleteSlot(slot, !!slot.potentialMirage);
                            }

                            slot = slotNext;
                        }
                    }
                }
            }
        }


        // Move items and send notifications
        for (i = 0; i < sequenceCountNew; i++) {
            sequenceNew = sequencesNew[i];

            if (sequenceNew.firstInner) {
                slotPrev = undefined;
                for (slotRefresh = sequenceNew.firstInner; true; slotRefresh = slotRefresh.next) {
                    slot = slotFromSlotRefresh(slotRefresh);
                    if (slot) {
                        if (!slotRefresh.stationary) {

                            var slotMoveBefore,
                                mergeWithPrev = false,
                                mergeWithNext = false;
                            if (slotPrev) {
                                slotMoveBefore = slotPrev.next;
                                mergeWithPrev = true;
                            } else {
                                // The first item will be inserted before the first stationary item, so find that now
                                var slotRefreshStationary;
                                for (slotRefreshStationary = sequenceNew.firstInner; !slotRefreshStationary.stationary && slotRefreshStationary !== sequenceNew.lastInner; slotRefreshStationary = slotRefreshStationary.next) {
                                    /*@empty*/
                                }

                                if (!slotRefreshStationary.stationary) {
                                    // There are no stationary items, as all the items are moving from another old sequence

                                    var index = slotRefresh.index;

                                    // Find the best place to insert the new sequence
                                    if (index === 0) {
                                        // Index 0 is a special case
                                        slotMoveBefore = slotsStart.next;
                                        mergeWithPrev = true;
                                    } else {
                                        slotMoveBefore = index === undefined ?
                                            lastInsertionPoint(slotsStart, slotsEnd) :
                                            successorFromIndex(index, indexMap, slotsStart, slotsEnd);
                                    }
                                } else {
                                    slotMoveBefore = slotFromSlotRefresh(slotRefreshStationary);
                                    mergeWithNext = true;
                                }
                            }

                            // Preserve merge boundaries
                            if (slot.mergedForRefresh) {
                                delete slot.mergedForRefresh;
                                if (!slot.lastInSequence) {
                                    slot.next.mergedForRefresh = true;
                                }
                            }

                            moveSlot(slot, slotMoveBefore, mergeWithPrev, mergeWithNext);
                        }

                        slotPrev = slot;
                    }

                    if (slotRefresh === sequenceNew.lastInner) {
                        break;
                    }
                }
            }
        }


        // Insert new items (with new indices) and send notifications
        for (i = 0; i < sequenceCountNew; i++) {
            sequenceNew = sequencesNew[i];

            if (sequenceNew.firstInner) {
                slotPrev = undefined;
                for (slotRefresh = sequenceNew.firstInner; true; slotRefresh = slotRefresh.next) {
                    slot = slotFromSlotRefresh(slotRefresh);
                    if (!slot) {
                        var slotInsertBefore;
                        if (slotPrev) {
                            slotInsertBefore = slotPrev.next;
                        } else {
                            // The first item will be inserted *before* the first old item, so find that now
                            var slotRefreshOld;
                            for (slotRefreshOld = sequenceNew.firstInner; !slotFromSlotRefresh(slotRefreshOld); slotRefreshOld = slotRefreshOld.next) {
                                /*@empty*/
                            }
                            slotInsertBefore = slotFromSlotRefresh(slotRefreshOld);
                        }

                        // Create a new slot for the item
                        slot = addNewSlot(slotRefresh, slotInsertBefore, !!slotPrev);

                        if (!slotInsertBefore.mergedForRefresh) {
                            prepareSlotItem(slot);

                            // Send the notification after the insertion
                            sendInsertedNotification(slot);
                        }
                    }
                    slotPrev = slot;

                    if (slotRefresh === sequenceNew.lastInner) {
                        break;
                    }
                }
            }
        }


        // Set placeholder indices, merge sequences and send mirage notifications if necessary, match outer new items
        // to outer placeholders, add extra outer new items (possibly merging with Start, End).
        for (i = 0; i < sequenceCountOld; i++) {
            sequenceOld = sequencesOld[i];
            if (sequenceOld) {
                sequenceNew = sequenceOld.sequenceNew;
                if (sequenceNew) {
                    // Re-establish the start of sequenceOld, since it might have been invalidated by the moves and insertions
                    var slotBefore = sequenceOld.stationarySlot;
                    while (!slotBefore.firstInSequence) {
                        slotBefore = slotBefore.prev;
                    }
                    sequenceOld.first = slotBefore;

                    // Walk backwards through outer placeholders and new items at the start of the sequence
                    while (potentialRefreshMirage(slotBefore)) {
                        slotBefore = slotBefore.next;
                    }

                    var newItemBefore = sequenceNew ? sequenceNew.firstInner : undefined,
                        indexBefore = slotBefore.index;

                    while (!slotBefore.firstInSequence) {
                        indexBefore--;

                        // Check for index collision with other sequences
                        if (indexBefore !== undefined) {
                            var slotCollisionBefore = indexMap[indexBefore];
                            if (slotCollisionBefore && slotCollisionBefore !== slotBefore.prev) {
                                removeMiragesAndMerge(slotCollisionBefore, slotBefore);
                                break;
                            }

                            if (slotBefore.prev.index !== indexBefore) {
                                changeSlotIndex(slotBefore.prev, indexBefore, indexMap);
                            }
                        }

                        slotBefore = slotBefore.prev;

                        // Match items
                        if (newItemBefore) {
                            if (newItemBefore.firstInSequence) {
                                newItemBefore = undefined;
                            } else {
                                newItemBefore = newItemBefore.prev;
                                copyRefreshSlotData(newItemBefore, slotBefore);
                            }
                        }
                    }

                    if (newItemBefore) {
                        // Add extra new items to the start of the sequence
                        while (!newItemBefore.firstInSequence) {
                            newItemBefore = newItemBefore.prev;

                            if (newItemBefore === refreshStart) {
                                mergeSequences(slotsStart);
                                break;
                            } else {
                                slotBefore = addNewSlot(newItemBefore, slotBefore, false);
                                sequenceOld.first = slotBefore;
                            }
                        }
                    }

                    // Re-establish the end of sequenceOld, since it might have been invalidated by the moves and insertions
                    var slotAfter = sequenceOld.stationarySlot;
                    while (!slotAfter.lastInSequence) {
                        slotAfter = slotAfter.next;
                    }
                    sequenceOld.last = slotAfter;

                    // Walk forwards through outer placeholders and new items at the end of the sequence
                    while (potentialRefreshMirage(slotAfter)) {
                        slotAfter = slotAfter.prev;
                    }

                    var newItemAfter = sequenceNew ? sequenceNew.lastInner : undefined,
                        indexAfter = slotAfter.index;

                    while (!slotAfter.lastInSequence) {
                        indexAfter++;

                        // Check for index collision with other sequences
                        if (indexAfter !== undefined) {
                            var slotCollisionAfter = indexMap[indexAfter];
                            if (slotCollisionAfter && slotCollisionAfter !== slotAfter.next) {
                                removeMiragesAndMerge(slotAfter, slotCollisionAfter);
                                break;
                            }

                            if (slotAfter.next.index !== indexAfter) {
                                changeSlotIndex(slotAfter.next, indexAfter, indexMap);
                            }
                        }

                        slotAfter = slotAfter.next;

                        // Match items
                        if (newItemAfter) {
                            if (newItemAfter.lastInSequence) {
                                newItemAfter = undefined;
                            } else {
                                newItemAfter = newItemAfter.next;
                                copyRefreshSlotData(newItemAfter, slotAfter);
                            }
                        }
                    }

                    if (newItemAfter) {
                        // Add extra new items to the end of the sequence
                        while (!newItemAfter.lastInSequence) {
                            newItemAfter = newItemAfter.next;

                            if (newItemAfter === refreshEnd) {
                                mergeSequences(slotAfter.prev);
                                break;
                            } else {
                                slotAfter = addNewSlot(newItemAfter, slotAfter.next, true);
                                sequenceOld.last = slotAfter;
                            }
                        }
                    }
                }
            }
        }


        // Complete promises, detect changes; send itemAvailable, changed, indexChanged notifications
        for (i = 0; i < sequenceCountOld; i++) {
            sequenceOld = sequencesOld[i];
            if (sequenceOld) {
                var offset = 0,
                    indexFirst;

                // Find a reference index for the entire sequence
                indexFirst = undefined;
                for (slot = sequenceOld.first; true; slot = slot.next, offset++) {
                    if (slot === slotsStart) {
                        indexFirst = -1;
                    } else if (slot.indexRequested) {
                        indexFirst = slot.index - offset;
                        // TODO: Handle case of slot.index being out of sync with results indices
                    } else if (indexFirst === undefined && slot.key !== undefined) {
                        var indexNew = refreshKeyMap[slot.key].index;
                        if (indexNew !== undefined) {
                            indexFirst = indexNew - offset;
                        }
                    }

                    // Clean up in this final pass
                    delete slot.potentialMirage;
                    delete slot.mergedForRefresh;

                    if (slot.lastInSequence) {
                        break;
                    }
                }

                updateItemRange(sequenceOld.first, sequenceOld.last, indexFirst, null, sequenceOld.first, sequenceOld.last);
            }
        }


        // Send countChanged notification
        if (refreshCount !== undefined && refreshCount !== knownCount) {
            changeCount(refreshCount);
        }

        var fetches = [];

        // Kick-start fetches for remaining placeholders
        for (i = 0; i < sequenceCountOld; i++) {
            sequenceOld = sequencesOld[i];

            if (sequenceOld) {
                var firstPlaceholder,
                    placeholderCount,
                    slotRequestedByIndex,
                    requestedIndexOffset,
                    lastItem;

                firstPlaceholder = undefined;
                slotRequestedByIndex = undefined;
                lastItem = undefined;
                for (slot = sequenceOld.first; true; slot = slot.next) {
                    if (slot.kind === "placeholder") {
                        // Count the number of placeholders in a row
                        if (firstPlaceholder === undefined) {
                            firstPlaceholder = slot;
                            placeholderCount = 1;
                        } else {
                            placeholderCount++;
                        }

                        // If this group of slots was requested by index, re-request them that way (since that may be the only way to get them)
                        if (slot.indexRequested && slotRequestedByIndex === undefined) {
                            slotRequestedByIndex = slot;
                            requestedIndexOffset = placeholderCount - 1;
                        }
                    } else if (slot.kind === "item") {
                        if (firstPlaceholder !== undefined) {
                            // Fetch the group of placeholders before this item
                            queueFetchFromIdentity(fetches, slot, placeholderCount + 1, 0);
                            firstPlaceholder = undefined;
                            slotRequestedByIndex = undefined;
                        }

                        lastItem = slot;
                    }

                    if (slot.lastInSequence) {
                        if (firstPlaceholder !== undefined) {
                            if (lastItem !== undefined) {
                                // Fetch the group of placeholders after the last item
                                queueFetchFromIdentity(fetches, lastItem, 0, placeholderCount + 1);
                            } else if (firstPlaceholder.prev === slotsStart) {
                                // Fetch the group of placeholders at the start
                                queueFetchFromStart(fetches, firstPlaceholder, placeholderCount + 1);
                            } else if (slot === slotsEnd) {
                                // Fetch the group of placeholders at the end
                                queueFetchFromEnd(fetches, slot.prev, placeholderCount + 1);
                            } else {

                                // Fetch the group of placeholders by index
                                queueFetchFromIndex(fetches, slotRequestedByIndex, requestedIndexOffset + 1, placeholderCount - requestedIndexOffset);
                            }
                        }

                        break;
                    }
                }
            }
        }

        finishNotifications();

        resetRefreshState();
        refreshInProgress = false;

        applyNextEdit();

        var fetchCount = fetches.length;
        for (i = 0; i < fetchCount; i++) {
            fetches[i]();
        }
    }

    function slotFromResult(result, candidateKeyMap) {
        if (result === undefined) {
            throw new Error(undefinedItemReturned);
        } else if (result === null) {
            return null;
        } else if (result === startMarker) {
            return slotsStart;
        } else if (result === endMarker) {
            return slotsEnd;
        } else if (result.key === undefined || result.key === null) {
            throw new Error(invalidKeyReturned);
        } else {
            // A requested slot gets the highest priority...
            var slot = keyMap[result.key];
            if (slot && slotRequested(slot)) {
                return slot;
            } else {
                if (candidateKeyMap) {
                    // ...then a candidate placeholder...
                    var candidate = candidateKeyMap[result.key];
                    if (candidate) {
                        return candidate;
                    }
                }

                // ...then an unrequested item, if any
                return slot;
            }
        }
    }

    // Returns true if the given slot and result refer to different items
    function slotResultMismatch(slot, result) {
        return slot.key !== undefined && result !== null && result.key !== undefined && slot.key !== result.key;
    }

    // Searches for placeholders that could map to members of the results array.  If there is more than one candidate
    // for a given result, either would suffice, so use the first one.
    function generateCandidateKeyMap(results) {
        var candidateKeyMap = {},
            resultsCount = results.length;

        for (var offset = 0; offset < resultsCount; offset++) {
            var slot = slotFromResult(results[offset], null);
            if (slot) {
                // Walk backwards from the slot looking for candidate placeholders
                var slotBefore = slot,
                    offsetBefore = offset;
                while (offsetBefore > 0 && !slotBefore.firstInSequence) {
                    slotBefore = slotBefore.prev;
                    offsetBefore--;

                    if (slotBefore.kind !== "placeholder") {
                        break;
                    }

                    var resultBefore = results[offsetBefore];
                    if (resultBefore && resultBefore.key !== undefined) {
                        candidateKeyMap[resultBefore.key] = slotBefore;
                    }
                }

                // Walk forwards from the slot looking for candidate placeholders
                var slotAfter = slot,
                    offsetAfter = offset;
                while (offsetAfter < resultsCount - 1 && !slotAfter.lastInSequence) {
                    slotAfter = slotAfter.next;
                    offsetAfter++;

                    if (slotAfter.kind !== "placeholder") {
                        break;
                    }

                    var resultAfter = results[offsetAfter];
                    if (resultAfter && resultAfter.key !== undefined) {
                        candidateKeyMap[resultAfter.key] = slotAfter;
                    }
                }
            }
        }

        return candidateKeyMap;
    }

    // Processes a single result returned by a data adaptor.  Returns true if the result is consistent with the current
    // state of the slot, false otherwise.
    function processResult(slot, result) {
        delete slot.fetchID;

        if (result === null) {
            setStatus(UI.ItemsManagerStatus.failure);
        } else {
            if (slot.key !== undefined) {
                // If there's a key assigned to this slot already, and it's not that of the result, something has
                // changed.
                if (slot.key !== result.key) {
                    return false;
                }
            } else {
                setSlotKey(slot, result.key);
            }

            // Store the new item; this value will be compared with that stored in slot.item later
            slot.itemNew = result;
        }

        return true;
    }

    function potentialMirage(slot) {
        return (slot.kind === "placeholder" && !slot.indexRequested) || !slotRequested(slot);
    }

    function sequenceStart(slot) {
        while (!slot.firstInSequence) {
            slot = slot.prev;
        }

        return slot;
    }

    function sequenceEnd(slot) {
        while (!slot.lastInSequence) {
            slot = slot.next;
        }

        return slot;
    }

    // Returns true if slotBefore and slotAfter can be made adjacent by simply removing "mirage" placeholders and
    // merging two sequences.
    function mergePossible(slotBefore, slotAfter, notificationsPermitted, asynchronousContinuation) {
        // If anything after slotBefore other than placeholders (even slotAfter is bad!), return false
        var slotBeforeEnd = slotBefore;
        while (!slotBeforeEnd.lastInSequence) {
            slotBeforeEnd = slotBeforeEnd.next;
            if (!potentialMirage(slotBeforeEnd)) {
                return false;
            }
        }

        // If anything before slotAfter other than placeholders (even slotBefore is bad!), return false
        var slotAfterStart = slotAfter;
        while (!slotAfterStart.firstInSequence) {
            slotAfterStart = slotAfterStart.prev;
            if (!potentialMirage(slotAfterStart)) {
                return false;
            }
        }

        // If slotBefore and slotAfter aren't in adjacent sequences, ensure that at least one of them can be moved
        if (slotBeforeEnd.next !== slotAfterStart &&
                sequenceStart(slotBefore) === slotsStart && sequenceEnd(slotAfter) === slotsEnd) {
            return false;
        }

        // If slotBefore and slotAfter are in the same sequence (in reverse order), return false!
        while (!slotBefore.firstInSequence) {
            slotBefore = slotBefore.prev;
            if (slotBefore === slotAfter) {
                return false;
            }
        }

        return true;
    }

    // Returns true if there are any requsted items that will need to be removed before slotAfter can be positioned
    // immediately after slotBefore in the list.
    function mergeRequiresNotifications(slotBefore, slotAfter) {
        while (!slotBefore.lastInSequence) {
            slotBefore = slotBefore.next;
            if (slotRequested(slotBefore)) {
                return true;
            }
        }

        while (!slotAfter.firstInSequence) {
            slotAfter = slotAfter.prev;
            if (slotRequested(slotAfter)) {
                return true;
            }
        }

        return false;
    }

    // Does a little careful surgery to the slot sequence from slotFirst to slotLast before slotNext
    function moveSequenceBefore(slotNext, slotFirst, slotLast) {

        slotFirst.prev.next = slotLast.next;
        slotLast.next.prev = slotFirst.prev;

        slotFirst.prev = slotNext.prev;
        slotLast.next = slotNext;

        slotFirst.prev.next = slotFirst;
        slotNext.prev = slotLast;

        return true;
    }

    // Does a little careful surgery to the slot sequence from slotFirst to slotLast after slotPrev
    function moveSequenceAfter(slotPrev, slotFirst, slotLast) {

        slotFirst.prev.next = slotLast.next;
        slotLast.next.prev = slotFirst.prev;

        slotFirst.prev = slotPrev;
        slotLast.next = slotPrev.next;

        slotPrev.next = slotFirst;
        slotLast.next.prev = slotLast;

        return true;
    }

    function removeMiragesAndMerge(slotBefore, slotAfter) {

        // If slotBefore and slotAfter aren't in adjacent sequences, ensure that at least one of them can be moved
        if (sequenceEnd(slotBefore).next !== sequenceStart(slotAfter) &&
                sequenceStart(slotBefore) === slotsStart && sequenceEnd(slotAfter) === slotsEnd) {
            return false;
        }

        // Remove the placeholders and unrequested items after slotBefore
        while (!slotBefore.lastInSequence) {
            deleteSlot(slotBefore.next, true);
        }

        // Remove the placeholders and unrequested items before slotAfter
        while (!slotAfter.firstInSequence) {
            deleteSlot(slotAfter.prev, true);
        }

        // Move one sequence if necessary
        if (slotBefore.next !== slotAfter) {
            var slotLast = sequenceEnd(slotAfter);
            if (slotLast !== slotsEnd) {
                moveSequenceAfter(slotBefore, slotAfter, slotLast);
            } else {
                moveSequenceBefore(slotAfter, sequenceStart(slotBefore), slotBefore);
            }
        }

        // Proceed with the merge
        mergeSequences(slotBefore);

        return true;
    }

    function itemChanged(slot) {
        var itemNew = slot.itemNew;

        if (!itemNew) {
            return false;
        }

        var item = slot.item;

        for (var property in item) {
            switch (property) {
                case "data":
                    // This is handled below
                    break;

                default:
                    if (item[property] !== itemNew[property]) {
                        return true;
                    }
                    break;
            }
        }

        return (
            compareByIdentity ?
                item.data !== itemNew.data :
                JSON.stringify(slot.data) !== JSON.stringify(itemNew.data)
        );
    }
    
    // Updates the indices of a range of items, rerenders them as necessary (or queues them for rerendering), and sends
    // indexChanged notifications.
    function updateItemRange(slotFirst, slotLast, indexFirst, slotNew, slotFirstChanged, slotLastChanged) {
        var slot = slotFirst,
            index = indexFirst,
            inNewRange;
        while (true) {
            var indexOld = slot.index,
                indexChanged = false;

            if (slot === slotFirstChanged) {
                inNewRange = true;
            }

            if (index !== indexOld) {
                changeSlotIndex(slot, index, indexMap);
                if (slotRequested(slot)) {
                    indexChanged = true;
                }
            }

            if (slotRequested(slot) || slot === slotNew || slot.fetchRequested) {
                if (slot.kind === "item") {
                    // If we're in the region for which new results just arrived, see if the item changed
                    if (inNewRange) {
                        if (itemChanged(slot)) {
                            changeSlot(slot);
                        } else {
                            slot.itemNew = null;
                        }
                    }
                } else {

                    if (slot.key) {
                        prepareSlotItem(slot);
                    }
                }
            }

            // Send out index change notifications after we have at least tried to rerender the items
            if (indexChanged) {
                forEachBindingRecordOfSlot(slot, function (bindingRecord) {
                    if (bindingRecord.notificationHandler.indexChanged) {
                        handlerToNotify(bindingRecord).indexChanged(slot.handle, slot.index, indexOld);
                    }
                });
            }

            if (slot === slotLast) {
                break;
            }

            if (slot === slotLastChanged) {
                inNewRange = false;
            }

            slot = slot.next;
            index++;
        }
    }

    // Removes any placeholders with requested indices that exceed the given upper bound on the count
    function removeMirageIndices(countMax) {

        for (var slot = slotsEnd.prev; slot !== slotsStart; ) {
            var slotPrev = slot.prev;

            if (slot.index < countMax) {
                break;
            } else if (slot.indexRequested) {

                deleteSlot(slot, true);
            }

            slot = slotPrev;
        }
    }

    // Adjust the indices of all slots to be consistent with any indexNew properties, and strip off the indexNews
    function updateIndices() {
        indexUpdateDeferred = false;

        var slotFirstInSequence,
            indexNew;

        for (var slot = slotsStart; slot; slot = slot.next) {
            if (slot.firstInSequence) {
                slotFirstInSequence = slot;
                if (slot.indexNew !== undefined) {
                    indexNew = slot.indexNew;
                    delete slot.indexNew;
                } else {
                    indexNew = slot.index;
                }
            }

            if (slot.lastInSequence) {
                updateItemRange(slotFirstInSequence, slot, indexNew, null, slotFirstInSequence, slot);
            }
        }

        if (countDelta && knownCount !== undefined) {
            changeCount(knownCount + countDelta);

            countDelta = 0;
        }
    }

    function restartFetchesIfNecessary(index) {
        if (requestedSlots === 0) {
            // There's nothing to fetch
            return;
        }

        for (var property in fetchesInProgress) {
            // There's still at least one incomplete fetch
            return;
        }

        var slotFetchFirst;

        for (var slot = slotsStart.next; slot; slot = slot.next) {
            if (slot.kind === "placeholder") {
                if (!slotFetchFirst) {
                    slotFetchFirst = slot;
                }
            } else {
                if (slotFetchFirst) {
                    var slotFetchLast = slot.prev,
                        count = slotFetchLast.index - slotFetchFirst.index + 1;
                    
                    if (slotFetchFirst.index < index) {
                        fetchItemsFromIndex(slotFetchFirst, 1, count);
                    } else {
                        fetchItemsFromIndex(slotFetchLast, count, 1);
                    }

                    slotFetchFirst = null;
                }
            }
        }
    }

    function processResultsAsynchronously(slot, refreshID, fetchID, results, offset, count, index) {
        msSetImmediate(function () {
            processResults(slot, refreshID, fetchID, results, offset, count, index);
        });
    }

    // Merges the results of a fetch into the slot list data structure, and determines if any notifications need to be
    // synthesized.
    function processResults(slot, refreshID, fetchID, results, offset, count, index) {
        // This fetch has completed, whatever it has returned
        delete fetchesInProgress[fetchID];

        if (refreshID !== currentRefreshID || slot.released) {
            // This information is out of date, or the slot has since been released

            restartFetchesIfNecessary(index);
            return;
        }

        index = validateIndexReturned(index);
        count = validateCountReturned(count);

        if (indexUpdateDeferred) {
            updateIndices();
        }


        var refreshRequired = false,
            listEndObserved = !slotsEnd.firstInSequence,
            countChanged = false,
            countMax,
            slotFirst,
            fetchCountBefore = 0,
            slotLast,
            fetchCountAfter = 0;

        (function () {
            var synchronousCallback = !slotRequested(slot);

            // Check if an error result was returned
            if (results === UI.FetchError.noResponse) {
                setStatus(UI.ItemsManagerStatus.failure);
                return;
            } else if (results === UI.FetchError.doesNotExist) {
                if (slot.key === undefined) {
                    if (!isNonNegativeNumber(count) && slot.indexRequested) {

                        // We now have an upper bound on the count
                        if (countMax === undefined || countMax > slot.index) {
                            countMax = slot.index;
                        }
                    }

                    // This item counts as a mirage, since for all we know it never existed
                    if (synchronousCallback) {
                        removeSlotPermanently(slot);
                        setSlotKind(slot, "mirage");
                    } else {
                        deleteSlot(slot, true);
                    }
                }

                // It's likely that the client requested this item because something has changed since the client's
                // latest observations of the data.  Begin a refresh just in case.
                refreshRequired = true;
                return;
            }

            // See if the result returned already exists in a different slot
            var slotExisting = slotFromResult(results[offset], null);
            if ((slotExisting && slotExisting !== slot)) {
                if (slot.description) {
                    var fetchComplete = slot.fetchComplete;

                    if (!slotExisting.item) {
                        prepareSlotItem(slotExisting);
                    }

                    slot.item = slotExisting.item;
                    removeSlotPermanently(slot);
                    if (fetchComplete) {
                        fetchComplete();
                    }
                }
                // A contradiction has been found, so we can't proceed further
                refreshRequired = true;
                return;
            }

            if (!processResult(slot, results[offset])) {
                // A contradiction has been found, so we can't proceed further
                refreshRequired = true;
                return;
            }

            // Now determine how the other results fit into the slot list

            var mergeQueue = [];

            // First generate a map of existing placeholders that could map to the results
            var candidateKeyMap = generateCandidateKeyMap(results);

            // Now walk backwards from the given slot
            var slotBefore = slot,
                offsetBefore = offset,
                fetchCountDetermined = false;
            while (true) {
                if (offsetBefore > 0) {
                    // There are still results to process
                    var slotExpectedBefore = slotFromResult(results[offsetBefore - 1], candidateKeyMap);
                    if (slotExpectedBefore) {
                        if (slotBefore.firstInSequence || slotExpectedBefore !== slotBefore.prev) {
                            if (!mergePossible(slotExpectedBefore, slotBefore)) {
                                // A contradiction has been found, so we can't proceed further
                                refreshRequired = true;
                                return;
                            } else if (synchronousCallback && mergeRequiresNotifications(slotExpectedBefore, slotBefore)) {
                                // Process these results from an asynchronous call
                                processResultsAsynchronously(slot, refreshID, fetchID, results, offset, count, index);
                                return;
                            } else {
                                // Unrequested items will be silently deleted, but if they don't match the items that
                                // are arriving now, consider that a refresh hint.
                                var slotMirageBefore = slotBefore,
                                    offsetMirageBefore = offsetBefore;
                                while (offsetMirageBefore > 0 && !slotMirageBefore.firstInSequence) {
                                    slotMirageBefore = slotMirageBefore.prev;
                                    offsetMirageBefore--;
                                    if (slotResultMismatch(slotMirageBefore, results[offsetMirageBefore])) {
                                        refreshRequired = true;
                                    }
                                }

                                mergeQueue.push({ slotBefore: slotExpectedBefore, slotAfter: slotBefore });
                            }
                        }
                        slotBefore = slotExpectedBefore;
                    } else if (slotBefore.firstInSequence) {
                        slotBefore = addSlotBefore(slotBefore, indexMap);
                    } else {
                        slotBefore = slotBefore.prev;
                    }
                    offsetBefore--;

                    if (slotBefore === slotsStart) {
                        slotFirst = slotsStart;
                        break;
                    }

                    if (!processResult(slotBefore, results[offsetBefore])) {
                        // A contradiction has been found, so we can't proceed further
                        refreshRequired = true;
                        return;
                    }
                } else {
                    // Keep walking to determine (and verify consistency) of indices, if necessary

                    if (offsetBefore === 0) {
                        slotFirst = slotBefore;
                    }

                    if (slotBefore.firstInSequence) {
                        break;
                    }

                    slotBefore = slotBefore.prev;
                    offsetBefore--;

                    if (!fetchCountDetermined) {
                        if (slotShouldBeFetched(slotBefore)) {
                            fetchCountBefore++;
                        } else {
                            fetchCountDetermined = true;
                        }
                    }
                }

                // See if the indices are consistent
                if (slotBefore.index !== undefined) {
                    var indexGivenSlotBefore = slotBefore.index + offset - offsetBefore;
                    if (index !== undefined) {
                        if (index !== indexGivenSlotBefore) {
                            // A contradiction has been found, so we can't proceed further
                            refreshRequired = true;
                            return;
                        }
                    } else {
                        // This is the first information we have about the indices of any of these slots
                        index = indexGivenSlotBefore;
                    }
                }

                // Once the results are processed, it's only necessary to walk until the index is known (if it isn't
                // already) and the number of additional items to fetch has been determined.
                if (fetchCountDetermined && index !== undefined) {
                    break;
                }
            }

            // Then walk forwards
            var slotAfter = slot,
                offsetAfter = offset;

            fetchCountDetermined = false;

            var resultsCount = results.length;
            while (true) {
                if (offsetAfter < resultsCount - 1) {
                    // There are still results to process
                    var slotExpectedAfter = slotFromResult(results[offsetAfter + 1], candidateKeyMap);
                    if (slotExpectedAfter) {
                        if (slotAfter.lastInSequence || slotExpectedAfter !== slotAfter.next) {
                            if (!mergePossible(slotAfter, slotExpectedAfter)) {
                                // A contradiction has been found, so we can't proceed further
                                refreshRequired = true;
                                return;
                            } else if (synchronousCallback && mergeRequiresNotifications(slotAfter, slotExpectedAfter)) {
                                // Process these results from an asynchronous call
                                processResultsAsynchronously(slot, refreshID, fetchID, results, offset, count, index);
                                return;
                            } else {
                                // Unrequested items will be silently deleted, but if they don't match the items that
                                // are arriving now, consider that a refresh hint.
                                var slotMirageAfter = slotAfter,
                                    offsetMirageAfter = offsetAfter;
                                while (offsetMirageAfter < resultsCount - 1 && !slotMirageAfter.lastInSequence) {
                                    slotMirageAfter = slotMirageAfter.next;
                                    offsetMirageAfter++;
                                    if (slotResultMismatch(slotMirageAfter, results[offsetMirageAfter])) {
                                        refreshRequired = true;
                                    }
                                }

                                mergeQueue.push({ slotBefore: slotAfter, slotAfter: slotExpectedAfter });
                            }
                        }
                        slotAfter = slotExpectedAfter;
                    } else if (slotAfter.lastInSequence) {
                        slotAfter = addSlotAfter(slotAfter, indexMap);
                    } else {
                        slotAfter = slotAfter.next;
                    }
                    offsetAfter++;

                    if (slotAfter === slotsEnd) {
                        slotLast = slotAfter;
                        break;
                    }

                    if (!processResult(slotAfter, results[offsetAfter])) {
                        // A contradiction has been found, so we can't proceed further
                        refreshRequired = true;
                        return;
                    }
                } else {
                    // Keep walking to determine (and verify consistency) of indices, if necessary

                    if (offsetAfter === resultsCount - 1) {
                        slotLast = slotAfter;
                    }

                    if (slotAfter.lastInSequence) {
                        break;
                    }

                    slotAfter = slotAfter.next;
                    offsetAfter++;

                    if (!fetchCountDetermined) {
                        if (slotShouldBeFetched(slotAfter)) {
                            fetchCountAfter++;
                        } else {
                            fetchCountDetermined = true;
                        }
                    }
                }

                // See if the indices are consistent
                if (slotAfter.index !== undefined) {
                    var indexGivenSlotAfter = slotAfter.index + offset - offsetAfter;
                    if (index !== undefined) {
                        if (index !== indexGivenSlotAfter) {
                            // A contradiction has been found, so we can't proceed further
                            refreshRequired = true;
                            return;
                        }
                    } else {
                        // This is the first information we have about the indices of any of these slots
                        index = indexGivenSlotAfter;
                    }
                }

                // Once the results are processed, it's only necessary to walk until the index is known (if it isn't
                // already) and the number of additional items to fetch has been determined.
                if (fetchCountDetermined && index !== undefined) {
                    break;
                }
            }

            // We're ready to perform the sequence merges, although in rare cases a contradiction might still be found
            while (mergeQueue.length > 0) {
                var merge = mergeQueue.pop();
                if (!removeMiragesAndMerge(merge.slotBefore, merge.slotAfter)) {
                    // A contradiction has been found, so we can't proceed further
                    refreshRequired = true;
                    return;
                }
            }

            // The description is no longer required
            delete slot.description;

            // Now walk through the entire range of interest, and detect items that can now be rendered, items that have
            // changed, and indices that were unknown but are now known.
            updateItemRange(slotBefore, slotAfter, index - offset + offsetBefore, slot.released ? null : slot, slotFirst, slotLast);
        })();

        // If the count wasn't provided, see if it can be determined from the end of the list.
        if (!isNonNegativeNumber(count) && !slotsEnd.firstInSequence) {
            var indexLast = slotsEnd.prev.index;
            if (indexLast !== undefined) {
                count = indexLast + 1;
            }
        }

        // If the count has changed, and the end of the list had been reached, that's a hint to refresh, but
        // since there are no known contradictions we can proceed with what we have.
        if (isNonNegativeNumber(count) || count === UI.CountResult.unknown) {
            if (count !== knownCount) {
                countChanged = true;
                if (isNonNegativeNumber(knownCount) && listEndObserved) {
                    // Don't send the countChanged notification until the refresh, so don't update knownCount now
                    refreshRequired = true;
                }
            }
        }

        if (isNonNegativeNumber(count)) {
            removeMirageIndices(count);
        } else if (countMax !== undefined) {
            removeMirageIndices(countMax);
        }

        if (refreshRequired) {
            beginRefresh();
        } else {
            // If the count changed, but that's the only thing, just send the notification
            if (countChanged) {
                changeCount(count);
            }

            // See if there are more requests we can now fulfill
            if (fetchCountBefore > 0) {
                fetchItemsFromIdentity(slotFirst, fetchCountBefore + 1, 0);
            }
            if (fetchCountAfter > 0) {
                fetchItemsFromIdentity(slotLast, 0, fetchCountAfter + 1);
            } else if (fetchCountBefore === 0) {
                restartFetchesIfNecessary(index);
            }
        }

        finishNotifications();

    }

    function processResultsForIndex(indexRequested, slot, refreshID, results, offset, count, index) {
        if (refreshID !== currentRefreshID) {
            // This information is out of date.  Ignore it.
            return;
        }

        index = validateIndexReturned(index);
        count = validateCountReturned(count);

        if (results === UI.FetchError.noResponse) {
            setStatus(UI.ItemsManagerStatus.failure);
        } else if (results === UI.FetchError.doesNotExist) {
            if (indexRequested === slotsStart.index) {
                // The request was for the start of the list, so the item must not exist
                processResults(slot, refreshID, null, UI.FetchError.doesNotExist);
            } else {
                // Something has changed, so request a refresh
                beginRefresh();
            }
        } else if (index !== undefined && index !== indexRequested) {
            // Something has changed, so request a refresh
            beginRefresh();
        } else {
            var indexFirst = indexRequested - offset;

            var resultsCount = results.length;
            if (slot.index >= indexFirst && slot.index < indexFirst + resultsCount) {
                // The item is in this batch of results - process them all
                processResults(slot, refreshID, null, results, offset, count, index);
            } else if (offset === resultsCount - 1 && indexRequested < slot.index) {
                // The requested index does not exist
                // Let processResults handle this case.
                processResults(slot, refreshID, null, UI.FetchError.doesNotExist);
            } else {
                // We didn't get all the results we requested - pick up where they left off
                if (slot.index < indexFirst) {
                    fetchItemsForIndex(indexFirst, slot, listDataAdaptor.itemsFromKey(
                        results[0].key,
                        indexFirst - slot.index,
                        0
                    ));
                } else {
                    var indexLast = indexFirst + resultsCount - 1;

                    fetchItemsForIndex(indexLast, slot, listDataAdaptor.itemsFromKey(
                        results[resultsCount - 1].key,
                        0,
                        slot.index - indexLast
                    ));
                }
            }
        }        
    }

    function reduceReleasedSlotCount() {
        // If lastSlotReleased has been removed from the list, use the end of the list instead
        if (!lastSlotReleased.prev) {
            lastSlotReleased = slotsEnd.prev;
        }

        // Retain at least half the maximum number, but remove a substantial number
        var releasedSlotsTarget = Math.max(releasedSlotsMax / 2, Math.min(releasedSlotsMax * 0.9, releasedSlotsMax - 10));

        // Now use the simple heuristic of walking outwards in both directions from lastSlotReleased until the target
        // count is reached, the removing everything else.
        var slotPrev = lastSlotReleased.prev,
            slotNext = lastSlotReleased.next,
            releasedSlotsFound = 0,
            slotToDelete;

        function considerDeletingSlot() {
            if (slotToDelete.released) {
                if (releasedSlotsFound <= releasedSlotsTarget) {
                    releasedSlotsFound++;
                } else {
                    deleteUnrequestedSlot(slotToDelete);
                }
            }
        }

        while (slotPrev || slotNext) {
            if (slotPrev) {
                slotToDelete = slotPrev;
                slotPrev = slotToDelete.prev;
                considerDeletingSlot();
            }
            if (slotNext) {
                slotToDelete = slotNext;
                slotNext = slotToDelete.next;
                considerDeletingSlot();
            }
        }
    }

    function getSlotItem(slot) {

        if (slot.item) {
            return Promise.wrap(slot.item);
        } else {
            return new Promise(function (complete) {
                slot.fetchComplete = complete;
            }, function () {
                // Cancellation

                // TODO:  Cancelling the fetch is tricky

                slot.fetchComplete = null;
            });
        }
    }

    function firstSlot() {
        return requestSlotAfter(slotsStart, function (slotNew) {
            fetchItemsFromStart(slotNew, 2);
        });
    }

    function lastSlot() {
        return requestSlotBefore(slotsEnd, function (slotNew) {
            fetchItemsFromEnd(slotNew, 2);
        });
    }

    function slotFromKey(key) {
        if (typeof key !== "string") {
            throw new Error(keyIsInvalid);
        }

        var slot = keyMap[key];

        if (slot === slotsEnd) {
            slot = null;
        } else if (slot && slot.key === key) {
            requestSlot(slot);
        } else {
            var slotNext = lastInsertionPoint(slotsStart, slotsEnd);

            if (!slotNext) {
                // The complete list has been observed, and this key isn't a part of it; a refresh may be necessary
                return null;
            }

            // Create a new slot and start a request for it
            slot = createSlotSequence(slotNext);

            setSlotKey(slot, key);
            slot.keyRequested = true;

            fetchItemsFromIdentity(slot, 1, 1);

            slot = slotCreated(slot);
        }

        return slot;
    }

    function slotFromIndex(index) {
        if (typeof index !== "number" || index < 0) {
            throw new Error(indexIsInvalid);
        }

        var slot = indexMap[index];

        if (slot === slotsEnd) {
            slot = null;
        } else if (slot && slot.index === index) {
            requestSlot(slot);
        } else {
            var slotNext = successorFromIndex(index, indexMap, slotsStart, slotsEnd);

            if (slotNext === undefined) {
                // The complete list has been observed, and this index isn't a part of it; a refresh may be necessary
                return null;
            }

            // Create a new slot and start a request for it
            if (slotNext.prev.index === index - 1) {
                slot = addSlotAfter(slotNext.prev, indexMap);
            } else if (slotNext.index === index + 1) {
                slot = addSlotBefore(slotNext, indexMap);
            } else {
                slot = createSlotSequence(slotNext, index, indexMap);
            }

            if ((slot.firstInSequence || slot.prev.kind !== "placeholder") && (slot.lastInSequence || slotNext.kind !== "placeholder")) {
                // Heuristic: if the next slot's index is within 25 of this one, request all the intervening items
                var delta = slotNext.index - index;
                if (delta <= 25) {
                    // If the next slot is likely to be fetched soon, do not attempt to fetch this one now
                    // (In the worst case, the fetching process will have to be restarted.)
                    if (slotNext.kind === "item" || !slotRequested(slotNext)) {
                        fetchItemsFromIndex(slot, 1, delta);
                    }
                } else {
                    fetchItemsFromIndex(slot, 1, 1);
                }
            }

            slot = slotCreated(slot);
        }

        if (slot && slot.kind === "placeholder") {
            slot.indexRequested = true;
        }

        return slot;
    }

    function slotFromDescription(description) {
        var slot = lastInsertionPoint(slotsStart, slotsEnd);

        if (!slot) {
            // If the entire list has been observed, "forget" this for a while
            slotsEnd.index = null;
            splitSequences(slotsEnd.prev);
        }

        // Create a new slot and start a request for it
        slot = createSlotSequence(slotsEnd);

        fetchItemsFromDescription(slot, description, 1, 1);

        slot.description = description;

        return slotCreated(slot);
    }

    function previousSlot(slot) {
        return requestSlotBefore(slot, function (slotNew) {
            var slotNext = slotNew.next;
            if (slotNext.key !== undefined && slotNext.kind !== "placeholder") {
                fetchItemsFromIdentity(slotNext, 2, 0);
            }
        });
    }

    function nextSlot(slot) {
        return requestSlotAfter(slot, function (slotNew) {
            var slotPrev = slotNew.prev;
            if (slotPrev.key !== undefined && slotPrev.kind !== "placeholder") {
                fetchItemsFromIdentity(slotPrev, 0, 2);
            }
        });
    }

    function releaseSlotIfUnrequested(slot) {
        if (!slotRequested(slot)) {
            if (!releaseSlotsPosted) {
                releaseSlotsPosted = true;

                if (UI._PerfMeasurement_leakSlots) {
                    return;
                }

                msSetImmediate(function () {
                    releaseSlotsPosted = false;
                    for (var slot2 = slotsStart.next; slot2 !== slotsEnd; slot2 = slot2.next) {
                        if (!slot2.released && !slotRequested(slot2)) {
                            releaseSlot(slot2);
                        }
                    }
                });
            }
        }
    }

    function releaseSlot(slot) {
        // Revert the slot to the state of an unrequested item
        setSlotKind(slot, null);
        delete slot.indexRequested;
        delete slot.keyRequested;

        // Ensure that an outstanding fetch doesn't "re-request" the item
        slot.released = true;

        // If a refresh is in progress, retain all slots, just in case the user re-requests some of them
        // before the refresh completes.
        if (!refreshInProgress) {
            // If releasedSlotsMax is 0, delete the released slot immediately
            if (releasedSlotsMax === 0) {
                deleteUnrequestedSlot(slot);
            } else {
                // Track which slot was released most recently
                releasedSlots++;
                lastSlotReleased = slot;

                // See if the number of released slots has exceeded the maximum allowed
                if (!releasedSlotReductionInProgress && releasedSlots > releasedSlotsMax) {
                    releasedSlotReductionInProgress = true;

                    msSetImmediate(function () {
                        reduceReleasedSlotCount();
                        releasedSlotReductionInProgress = false;
                    });
                }
            }
        }
    }

    // Returns the index of the slot taking into account any outstanding index updates
    function adjustedIndex(slot) {
        var undefinedIndex;

        if (!slot) {
            return undefinedIndex;
        }

        var delta = 0;
        while (!slot.firstInSequence) {
            
            delta++;
            slot = slot.prev;
        }

        return (
            typeof slot.indexNew === "number" ?
                slot.indexNew + delta :
            typeof slot.index === "number" ?
                slot.index + delta :
                undefinedIndex
        );
    }

    // Updates the new index of the first slot in each sequence after the given slot
    function updateNewIndicesAfterSlot(slot, indexDelta) {
        // Adjust all the indexNews after this slot
        for (slot = slot.next; slot; slot = slot.next) {
            if (slot.firstInSequence) {
                var indexNew = (slot.indexNew !== undefined ? slot.indexNew : slot.index);
                if (indexNew !== undefined) {
                    slot.indexNew = indexNew + indexDelta;
                }
            }
        }

        // Adjust the overall count
        countDelta += indexDelta;

        indexUpdateDeferred = true;

        // Increment currentRefreshID so any outstanding fetches don't cause trouble.  If a refresh is in progress,
        // restart it (which will also increment currentRefreshID).
        if (refreshInProgress) {
            beginRefresh();
        } else {
            currentRefreshID++;
        }
    }

    // Updates the new index of the given slot if necessary, and all subsequent new indices
    function updateNewIndices(slot, indexDelta) {

        // If this slot is at the start of a sequence, transfer the indexNew
        if (slot.firstInSequence) {
            var indexNew;

            if (indexDelta < 0) {
                // The given slot is about to be removed
                indexNew = slot.indexNew;
                if (indexNew !== undefined) {
                    delete slot.indexNew;
                } else {
                    indexNew = slot.index;
                }

                if (!slot.lastInSequence) {
                    // Update the next slot now
                    slot = slot.next;
                    if (indexNew !== undefined) {
                        slot.indexNew = indexNew;
                    }
                }
            } else {
                // The given slot was just inserted
                if (!slot.lastInSequence) {
                    var slotNext = slot.next;

                    indexNew = slotNext.indexNew;
                    if (indexNew !== undefined) {
                        delete slotNext.indexNew;
                    } else {
                        indexNew = slotNext.index;
                    }

                    if (indexNew !== undefined) {
                        slot.indexNew = indexNew;
                    }
                }
            }
        }

        updateNewIndicesAfterSlot(slot, indexDelta);
    }

    // Updates the new index of the first slot in each sequence after the given new index
    function updateNewIndicesFromIndex(index, indexDelta) {

        for (var slot = slotsStart; slot !== slotsEnd; slot = slot.next) {
            var indexNew = slot.indexNew;

            if (indexNew !== undefined && index <= indexNew) {
                updateNewIndicesAfterSlot(slot, indexDelta);
                break;
            }
        }        
    }

    function insertNewSlot(key, itemNew, slotInsertBefore, mergeWithPrev, mergeWithNext) {
        // Create a new slot, but don't worry about its index, as indices will be updated during endEdits
        var slot = createSlot();
        insertAndMergeSlot(slot, slotInsertBefore, mergeWithPrev, mergeWithNext);
        setSlotKey(slot, key);
        slot.itemNew = itemNew;

        updateNewIndices(slot, 1);

        prepareSlotItem(slot);

        // Send the notification after the insertion
        sendInsertedNotification(slot);

        return slot;
    }

    function dequeueEdit() {
        var editNext = editQueue.next.next;

        editQueue.next = editNext;
        editNext.prev = editQueue;
    }

    function attemptEdit(edit) {
        var reentrant = true;

        function continueEdits() {
            if (!waitForRefresh) {
                if (reentrant) {
                    synchronousEdit = true;
                } else {
                    applyNextEdit();
                }
            }
        }

        var keyUpdate = edit.keyUpdate;

        function onEditComplete(item) {
            if (keyUpdate && item && keyUpdate.key !== item.key) {
                var keyNew = item.key;
                if (reentrant) {
                    // We can use the correct key, so there's no need for a later update
                    keyUpdate.key = keyNew;
                } else {
                    var slot = keyUpdate.slot;
                    if (slot) {
                        var keyOld = slot.key;
                        if (keyOld) {
                            delete keyMap[keyOld];
                        }

                        setSlotKey(slot, keyNew);

                        slot.itemNew = item;
                        changeSlot(slot);
                    }
                }
            }

            dequeueEdit();

            if (edit.complete) {
                edit.complete(item);
            }

            continueEdits();
        }

        function onEditError(error) {
            var EditError = UI.EditError;

            switch (error.Name) {
                case EditError.noResponse:
                    // Report the failure to the client, but do not dequeue the edit
                    setStatus(UI.ItemsManagerStatus.failure);
                    waitForRefresh = true;

                    // Don't report the error, as the edit will be attempted again on the next refresh
                    return;

                case EditError.notPermitted:
                    // Discard all remaining edits, rather than try to determine which subsequent ones depend
                    // on this one.
                    edit.failed = true;
                    discardEditQueue();
                    break;

                case EditError.noLongerMeaningful:
                    if (edit.isDeletion) {
                        // Special case - if a deletion is no longer meaningful, assume that's because the item no
                        // longer exists, in which case there's no point in undoing it.
                        dequeueEdit();
                    } else {
                        // Discard all remaining edits, rather than try to determine which subsequent ones depend
                        // on this one.
                        edit.failed = true;
                        discardEditQueue();
                    }

                    // Something has changed, so request a refresh
                    beginRefresh();
                    break;

                default:
                    // TODO Validation check
                    break;
            }

            if (edit.error) {
                edit.error(error);
            }            

            continueEdits();
        }

        // Call the applyEdit function for the given edit, passing in our own wrapper of the error handler that the
        // app passed in.
        edit.applyEdit().then(onEditComplete, onEditError);
        reentrant = false;
    }

    function applyNextEdit() {
        // See if there are any outstanding edits, and try to process as many as possible synchronously
        while (editQueue.next !== editQueue) {
            synchronousEdit = false;
            attemptEdit(editQueue.next);
            if (!synchronousEdit) {
                return;
            }
        }

        // The queue emptied out synchronously (or was empty to begin with)
        concludeEdits();
    }

    // Queues an edit and immediately "optimistically" apply it to the slots list, sending reentrant notifications
    function queueEdit(applyEdit, complete, error, keyUpdate, isDeletion, updateSlots, undo) {
        var editQueueTail = editQueue.prev,
            edit = {
                prev: editQueueTail,
                next: editQueue,
                applyEdit: applyEdit,
                complete: complete,
                error: error,
                keyUpdate: keyUpdate,
                isDeletion: isDeletion
            };
        editQueueTail.next = edit;
        editQueue.prev = edit;
        editsQueued = true;

        if (!refreshInProgress && editQueue.next === edit) {
            // Attempt the edit immediately, in case it completes synchronously
            attemptEdit(edit);
        }

        // If the edit succeeded or is still pending, apply it to the slots (in the latter case, "optimistically")
        if (!edit.failed) {
            updateSlots();

            // Supply the undo function now
            edit.undo = undo;
        }

        if (!editsInProgress) {
            completeEdits();
        }
    }

    // Once the edit queue has emptied, update state appropriately and resume normal operation
    function concludeEdits() {
        editsQueued = false;

        // See if there's a refresh that needs to begin
        if (refreshRequested) {
            refreshRequested = false;
            beginRefresh();
        }
    }

    function completeEdits() {

        updateIndices();

        finishNotifications();

        if (editQueue.next === editQueue) {
            concludeEdits();
        }
    }

    // Undo all queued edits, starting with the most recent
    function discardEditQueue() {
        while (editQueue.prev !== editQueue) {
            var editLast = editQueue.prev;

            // Edits that haven't been applied to the slots yet don't need to be undone
            if (editLast.undo) {
                editLast.undo();
            }

            editQueue.prev = editLast.prev;
        }
        editQueue.next = editQueue;

        editsInProgress = false;

        completeEdits();
    }

    function insertItem(key, data, slotInsertBefore, append, applyEdit) {
        // It is acceptable to pass null in as a temporary key, but since we need unique keys, one will be
        // generated.
        if (key === null) {
            key = "__temp`" + nextTempKey++;
        }

        data = validateData(data);

        var keyUpdate = { key: key };

        return new Promise(function (complete, error) {
            queueEdit(
                applyEdit, complete, error, keyUpdate,

                // isDeletion,
                false,
            
                // updateSlots
                function () {
                    if (slotInsertBefore) {
                        var itemNew = {
                            key: keyUpdate.key,
                            data: data
                        };

                        keyUpdate.slot = insertNewSlot(keyUpdate.key, itemNew, slotInsertBefore, append, !append);
                    }
                },

                // undo
                function () {
                    var slot = keyUpdate.slot;

                    if (slot) {
                        updateNewIndices(slot, -1);
                        deleteSlot(slot, false);
                    }
                }
            );
        });
    }

    function moveItem(slot, slotMoveBefore, append, applyEdit) {
        return new Promise(function (complete, error) {
            var slotNext,
                firstInSequence,
                lastInSequence;

            queueEdit(
                applyEdit, complete, error,

                // keyUpdate, isDeletion
                null, false,

                // updateSlots
                function () {
                    slotNext = slot.next;
                    firstInSequence = slot.firstInSequence;
                    lastInSequence = slot.lastInSequence;

                    updateNewIndices(slot, -1);
                    moveSlot(slot, slotMoveBefore, append, !append);
                    updateNewIndices(slot, 1);
                },

                // undo
                function () {
                    updateNewIndices(slot, -1);
                    moveSlot(slot, slotNext, !firstInSequence, !lastInSequence);
                    updateNewIndices(slot, 1);
                }
            );
        });
    }

    function ListDataNotificationHandler() {
        /// <summary locid="140">
        /// Methods on data notification handler object passed to DataSource.setNotificationHandler.
        /// </summary>

        this.invalidateAll = function () {
            /// <summary locid="141">
            /// Notifies the Items Manager that some data has changed, without specifying what.  Since it may be
            /// impractical for some data sources to call this method for any or all changes, doing so is optional.
            /// However, if it is not called by a given data adaptor, the application should periodically call refresh
            /// to update the associated Items Manager.
            /// </summary>

            beginRefresh();
        };

        this.beginNotifications = function () {
            /// <summary locid="142">
            /// May be called before a sequence of other notification calls, to minimize the number of countChanged
            /// and indexChanged notifications sent to the client of the Items Manager.  Must be paired with a call
            /// to endNotifications, and pairs may not be nested.
            /// </summary>

            dataNotificationsInProgress = true;
        };

        function completeNotification() {
            if (!dataNotificationsInProgress) {
                updateIndices();
                finishNotifications();
            }
        }

        this.inserted = function (newItem, previousKey, nextKey, index) {
            /// <summary locid="143">
            /// Called when an item has been inserted.
            /// </summary>
            /// <param name="newItem" type="Object" locid="144">
            /// The inserted item.  Must have key and data properties.
            /// </param>
            /// <param name="previousKey" mayBeNull="true" type="String" locid="145">
            /// The key of the item before the insertion point, null if the item was inserted at the start of the list.
            /// </param>
            /// <param name="nextKey" mayBeNull="true" type="String" locid="146">
            /// The key of the item after the insertion point, null if the item was inserted at the end of the list.
            /// </param>
            /// <param name="index" optional="true" type="Number" integer="true" locid="147">
            /// The index of the inserted item.
            /// </param>

            if (editsQueued) {
                // We can't change the slots out from under any queued edits
                beginRefresh();
            } else {
                var key = newItem.key,
                    slotPrev = keyMap[previousKey],
                    slotNext = keyMap[nextKey];

                if (keyMap[key] || (slotPrev && slotNext && (slotPrev.next !== slotNext || slotPrev.lastInSequence || slotNext.firstInSequence))) {
                    // Something has changed, start a refresh
                    beginRefresh();
                } else if (slotPrev || slotNext) {
                    insertNewSlot(key, newItem, (slotNext ? slotNext : slotPrev.next), !!slotPrev, !!slotNext);

                    completeNotification();
                } else if (slotsStart.next === slotsEnd && !slotsStart.lastInSequence) {
                    insertNewSlot(key, newItem, slotsStart.next, true, true);

                    completeNotification();
                } else if (index !== undefined) {
                    updateNewIndicesFromIndex(index, 1);

                    completeNotification();
                }
            }
        };

        this.changed = function (item) {
            /// <summary locid="148">
            /// Called when an item's data object has been changed.
            /// </summary>
            /// <param name="item" type="Object" locid="149">
            /// The item that has changed.  Must have key and data properties.
            /// </param>

            if (editsQueued) {
                // We can't change the slots out from under any queued edits
                beginRefresh();
            } else {
                var key = item.key,
                    slot = keyMap[key];

                if (slot) {
                    slot.itemNew = item;

                    if (slot.item) {
                        changeSlot(slot);

                        completeNotification();
                    }
                }
            }
        };

        this.moved = function (item, previousKey, nextKey, oldIndex, newIndex) {
            /// <summary locid="150">
            /// Called when an item has been moved to a new position.
            /// </summary>
            /// <param name="item" type="Object" locid="151">
            /// The item that has moved.  Must have key and data properties.
            /// </param>
            /// <param name="previousKey" mayBeNull="true" type="String" locid="152">
            /// The key of the item before the insertion point, null if the item was moved to the start of the list.
            /// </param>
            /// <param name="nextKey" mayBeNull="true" type="String" locid="153">
            /// The key of the item after the insertion point, null if the item was moved to the end of the list.
            /// </param>
            /// <param name="oldIndex" optional="true" type="Number" integer="true" locid="154">
            /// The index of the item before it was moved.
            /// </param>
            /// <param name="newIndex" optional="true" type="Number" integer="true" locid="155">
            /// The index of the item after it has moved.
            /// </param>

            if (editsQueued) {
                // We can't change the slots out from under any queued edits
                beginRefresh();
            } else {
                var key = item.key,
                    slot = keyMap[key],
                    slotPrev = keyMap[previousKey],
                    slotNext = keyMap[nextKey];

                if (slot) {
                    if (slotPrev && slotNext && (slotPrev.next !== slotNext || slotPrev.lastInSequence || slotNext.firstInSequence)) {
                        // Something has changed, start a refresh
                        beginRefresh();
                    } else if (!slotPrev && !slotNext) {
                        // If we can't tell where the item moved to, treat this like a removal
                        updateNewIndices(slot, -1);
                        deleteSlot(slot, false);

                        if (oldIndex !== undefined) {
                            // TODO: VALIDATE(newIndex !== undefined);

                            if (oldIndex < newIndex) {
                                newIndex--;
                            }

                            updateNewIndicesFromIndex(newIndex, 1);
                        }

                        completeNotification();
                    } else {
                        updateNewIndices(slot, -1);
                        moveSlot(slot, (slotNext ? slotNext : slotPrev.next), !!slotPrev, !!slotNext);
                        updateNewIndices(slot, 1);

                        completeNotification();
                    }
                } else if (slotPrev || slotNext) {
                    // If previousKey or nextKey is known, but key isn't, treat this like an insertion.

                    if (oldIndex !== undefined) {
                        // TODO: VALIDATE(newIndex !== undefined);

                        updateNewIndicesFromIndex(oldIndex, -1);

                        if (oldIndex < newIndex) {
                            newIndex--;
                        }
                    }

                    this.inserted(item, previousKey, nextKey, newIndex);
                } else if (oldIndex !== undefined) {
                    // TODO: VALIDATE(newIndex !== undefined);

                    updateNewIndicesFromIndex(oldIndex, -1);

                    if (oldIndex < newIndex) {
                        newIndex--;
                    }

                    updateNewIndicesFromIndex(newIndex, 1);

                    completeNotification();
                }
            }
        };

        this.removed = function (key, index) {
            /// <summary locid="156">
            /// Called when an item has been removed.
            /// </summary>
            /// <param name="key" mayBeNull="true" type="String" locid="157">
            /// The key of the item that has been removed.
            /// </param>
            /// <param name="index" optional="true" type="Number" integer="true" locid="158">
            /// The index of the item that has been removed.
            /// </param>

            if (editsQueued) {
                // We can't change the slots out from under any queued edits
                beginRefresh();
            } else {
                var slot;
                
                if (typeof key === "string") {
                    slot = keyMap[key];
                } else {
                    slot = indexMap[index];
                }

                if (slot) {
                    updateNewIndices(slot, -1);
                    deleteSlot(slot, false);

                    completeNotification();
                } else if (index !== undefined) {
                    updateNewIndicesFromIndex(index, -1);
                    completeNotification();
                }
            }
        };

        this.endNotifications = function () {
            /// <summary locid="159">
            /// Concludes a sequence of notifications.
            /// </summary>

            dataNotificationsInProgress = false;
            completeNotification();
        };

    } // ListDataNotificationHandler
    ListDataNotificationHandler.prototype.constructor = null;

    // Construction

    // Process creation parameters
    if (!listDataAdaptor) {
        throw new Error(listDataAdaptorIsInvalid);
    }
    if (Array.isArray(listDataAdaptor) || listDataAdaptor.getAt) {
        listDataAdaptor = new WinJS.UI.ArrayDataSource(listDataAdaptor, null);
    }

    // Request from the data adaptor to avoid serialization to JSON
    compareByIdentity = !!listDataAdaptor.compareByIdentity;

    // Cached listDataNotificationHandler initially undefined
    if (listDataAdaptor.setNotificationHandler) {
        listDataNotificationHandler = new ListDataNotificationHandler();

        listDataAdaptor.setNotificationHandler(listDataNotificationHandler);
    }

    // Status of the Items Manager
    status = UI.ItemsManagerStatus.ready;

    // ID to assign to the next ListBinding, incremented each time one is created
    nextListBindingID = 0;

    // Map of bindingIDs to binding records
    bindingMap = {};

    // ID assigned to a slot, incremented each time one is created - start with 1 so if (handle) tests are valid
    nextHandle = 1;

    // Count of requested slots
    requestedSlots = 0;

    // Track count promises
    getCountPromise = null;
    getCountPromisesReturned = 0;

    // Track whether releaseSlots has already been posted
    releaseSlotsPosted = false;

    // Track whether finishNotifications has been posted already
    finishNotificationsPosted = false;

    // Track whether finishNotifications should be called after each edit
    editsInProgress = false;

    // Queue of edis that have yet to be completed
    editQueue = {};
    editQueue.next = editQueue;
    editQueue.prev = editQueue;

    // Track whether there are currently edits queued
    editsQueued = false;

    // If an edit has returned noResponse, the edit queue will be reapplied when the next refresh is requested
    waitForRefresh = false;

    // Change to count while multiple edits are taking place
    countDelta = 0;

    // True while the indices are temporarily in a bad state due to multiple edits
    indexUpdateDeferred = false;

    // Next temporary key to use
    nextTempKey = 0;

    // ID of the refresh in progress, incremented each time a new refresh is started
    currentRefreshID = 0;

    // ID of a fetch, incremented each time a new fetch is initiated - start with 1 so if (fetchID) tests are valid
    nextFetchID = 1;

    // Set of fetches for which results have not yet arrived
    fetchesInProgress = {};

    // Sentinel objects for results arrays
    startMarker = {};
    endMarker = {};

    // Tracks the count returned explicitly or implicitly by the data adaptor
    knownCount = UI.CountResult.unknown;

    // Sentinel objects for list of slots
    // Give the start sentinel an index so we can always use predecessor + 1.
    slotsStart = {
        firstInSequence: true,
        lastInSequence: true,
        index: -1
    };
    slotsEnd = {
        firstInSequence: true,
        lastInSequence: true
    };
    slotsStart.next = slotsEnd;
    slotsEnd.prev = slotsStart;


    // Map of request IDs to slots
    handleMap = {};

    // Map of keys to slots
    keyMap = {};

    // Map of indices to slots
    indexMap = {};
    indexMap[-1] = slotsStart;

    // Count of slots that have been released but not deleted
    releasedSlots = 0;

    // Maximum number of released slots to retain
    releasedSlotsMax = 200;

    // lastSlotReleased is initially undefined

    // At most one call to reduce the number of refresh slots should be posted at any given time
    releasedSlotReductionInProgress = false;

    // Multiple refresh requests are coalesced
    refreshRequested = false;

    // Requests do not cause fetches while a refresh is in progress
    refreshInProgress = false;

    // Public methods

    this.createListBinding = function (notificationHandler) {
        var listBindingID = nextListBindingID++,
            slotCurrent = null;

        function moveCursor(slot) {
            // Retain the new slot first just in case it's the same slot
            retainSlotForCursor(slot);
            releaseSlotForCursor(slotCurrent);
            slotCurrent = slot;
        }

        function adjustCurrentSlot() {
            moveCursor(
                !slotCurrent || slotCurrent.lastInSequence || slotCurrent.next === slotsEnd ?
                    null :
                    slotCurrent.next
            );
        }

        bindingMap[listBindingID] = {
            notificationHandler: notificationHandler,
            notificationsSent: false,
            adjustCurrentSlot: adjustCurrentSlot
        };

        function releaseSlotFromListBinding(slot) {
            if (slot.bindingMap && slot.bindingMap[listBindingID]) {
                delete slot.bindingMap[listBindingID];
                    
                // See if there are any listBindings left in the map:
                for (var property in slot.bindingMap) {
                    return;
                }
                slot.bindingMap = null;
                releaseSlotIfUnrequested(slot);
            }
        }

        function releaseItem(handle) {
            var slot = handleMap[handle],
                slotBinding = slot.bindingMap[listBindingID];

            // TODO:  Validate slotBinding.count > 0

            if (--slotBinding.count === 0) {
                releaseSlotFromListBinding(slot);
            }
        }

        function createItemPromise(promise) {
            return {
                then: function (onComplete, onError, onCancel) {
                    return promise.then(onComplete, onError, onCancel);
                },

                cancel: function () {
                    return promise.cancel();
                }
            };
        }

        function itemPromiseFromSlot(slot) {
            var itemPromise;

            // Return a complete promise for a non-existent slot
            if (!slot) {
                itemPromise = createItemPromise(Promise.wrap(null));
                itemPromise.handle = null;
                // Only implement retain and relesase methods if a notification handler has been supplied
                if (notificationHandler) {
                    itemPromise.retain = function () { };
                    itemPromise.release = function () { };
                }
            } else {
                var handle = slot.handle;

                itemPromise = createItemPromise(new Promise(function (complete, error) {
                    function completeRequest() {
                        complete(slot.item);
                        sendItemAvailableNotification(slot);
                    }

                    if (slot.item) {
                        completeRequest();
                    } else {
                        if (!slot.fetchPromise) {
                            slot.fetchPromise = getSlotItem(slot);
                        }

                        slot.fetchPromisesReturned++;

                        slot.fetchPromise.then(function () {
                            completeRequest();

                            if (--slot.fetchPromisesReturned === 0) {
                                slot.fetchPromise = null;
                                releaseSlotIfUnrequested(slot);
                            }
                        });
                        // Fetches don't return errors
                    }
                }, function () {
                    // Cancellation

                    if (--slot.fetchPromisesReturned === 0) {
                        slot.fetchPromise.cancel();
                        slot.fetchPromise = null;
                        releaseSlotIfUnrequested(slot);
                    }
                }));

                defineCommonItemProperties(itemPromise, slot);

                // Only implement retain and release methods if a notification handler has been supplied
                if (notificationHandler) {
                    itemPromise.retain = function () {
                        if (!slot.bindingMap) {
                            slot.bindingMap = {};
                        }
                
                        var slotBinding = slot.bindingMap[listBindingID];
                        if (slotBinding) {
                            slotBinding.count++;
                        } else {
                            slot.bindingMap[listBindingID] = {
                                bindingRecord: bindingMap[listBindingID],
                                count: 1
                            };
                        }
                    };

                    itemPromise.release = function () {
                        releaseItem(handle);
                    };
                }
            }

            moveCursor(slot);

            return itemPromise;
        }

        var listBinding = {
            jumpToItem: function (item) {
                return itemPromiseFromSlot(item ? handleMap[item.handle] : null);
            },

            current: function () {
                return itemPromiseFromSlot(slotCurrent);
            },

            previous: function () {
                return itemPromiseFromSlot(slotCurrent ? previousSlot(slotCurrent): null);
            },

            next: function () {
                return itemPromiseFromSlot(slotCurrent ? nextSlot(slotCurrent): null);
            },

            releaseItem: function (item) {
                releaseItem(item.handle);
            },

            release: function () {
                // TODO:  Validate only called once???

                releaseSlotForCursor(slotCurrent);
                slotCurrent = null;

                for (var slot = slotsStart.next; slot !== slotsEnd; ) {
                    var slotNext = slot.next;

                    releaseSlotFromListBinding(slot);

                    slot = slotNext;
                }

                delete bindingMap[listBindingID];
            }
        };

        // Only implement each navigation method if the data adaptor implements certain methods

        if (listDataAdaptor.itemsFromStart || listDataAdaptor.itemsFromIndex) {
            listBinding.first = function (prefetchAfter) {
                return itemPromiseFromSlot(firstSlot(prefetchAfter));
            };
        }

        if (listDataAdaptor.itemsFromEnd) {
            listBinding.last = function (prefetchBefore) {
                return itemPromiseFromSlot(lastSlot(prefetchBefore));
            };
        }

        if (listDataAdaptor.itemsFromKey || listDataAdaptor.itemsFromIndex) {
            listBinding.fromKey = function (key, prefetchBefore, prefetchAfter) {
                return itemPromiseFromSlot(slotFromKey(key, prefetchBefore, prefetchAfter));
            };
        }

        if (listDataAdaptor.itemsFromIndex || (listDataAdaptor.itemsFromStart && listDataAdaptor.itemsFromKey)) {
            listBinding.fromIndex = function (index, prefetchBefore, prefetchAfter) {
                return itemPromiseFromSlot(slotFromIndex(index, prefetchBefore, prefetchAfter));
            };
        }

        if (listDataAdaptor.itemsFromDescription) {
            listBinding.fromDescription = function (description, prefetchBefore, prefetchAfter) {
                return itemPromiseFromSlot(slotFromDescription(description, prefetchBefore, prefetchAfter));
            };
        }

        return listBinding;
    };

    this.refresh = function () {
        /// <summary locid="160">
        /// Directs the Items Manager to communicate with the data adaptor to determine if any aspects of the
        /// fetched items have changed.
        /// </summary>

        beginRefresh();
    };

    this.getCount = function () {
        /// <summary locid="161">
        /// Fetches the total number of items.
        /// </summary>

        return new Promise(function (complete, error) {
            // If the data adaptor doesn't support the count method, return the Items Manager's reckoning of the
            // count.
            if (!listDataAdaptor.getCount) {
                msSetImmediate(function () {
                    complete(knownCount);
                });
            } else {
                var reentrant = true;

                function returnCount(count) {
                    // TODO:  Do we need the reentrancy check?
                    if (reentrant) {
                        msSetImmediate(function () {
                            complete(count);
                        });
                    } else {
                        complete(count);
                    }

                    if (--getCountPromisesReturned === 0) {
                        getCountPromise = null;
                    }
                }

                if (!getCountPromise) {
                    getCountPromise = listDataAdaptor.getCount();
                }

                getCountPromisesReturned++;

                // Always do a fetch, even if there is a cached result
                getCountPromise.then(function (count) {
                    if (!isNonNegativeInteger(count) && count !== undefined) {
                        throw new Error(invalidRequestedCountReturned);
                    }

                    if (count !== knownCount) {
                        changeCount(count);
                        finishNotifications();
                    }

                    if (count === 0) {
                        if (slotsStart.next !== slotsEnd) {
                            // A contradiction has been found
                            beginRefresh();
                        } else if (slotsStart.lastInSequence) {
                            // Now we know the list is empty
                            mergeSequences(slotsStart);
                            slotsEnd.index = 0;
                        }
                    }

                    returnCount(count);
                }, function (error) {
                    switch (error.name) {
                        case UI.CountError.noResponse:
                            // Report the failure, but still report last known count
                            setStatus(UI.ItemsManagerStatus.failure);
                            returnCount(knownCount);
                            break;

                        default:
                            throw error;
                    }
                });
                reentrant = false;
            }
        }, function () {
            // Cancellation

            if (--getCountPromisesReturned === 0) {
                getCountPromise.cancel();
                getCountPromise = null;
            }
        });
    };

    this.beginEdits = function () {
        /// <summary locid="162">
        /// Notifies the Items Manager that a sequence of edits is about to begin.  The Items Manager will call
        /// beginNotifications and endNotifications once each for a sequence of edits.
        /// </summary>

        editsInProgress = true;
    };

    // Only implement each editing method if the data adaptor implements the corresponding ListDataAdaptor method

    if (listDataAdaptor.insertAtStart) {
        this.insertAtStart = function (key, data) {
            /// <summary locid="163">
            /// Inserts an item at the start of the list.
            /// </summary>
            /// <param name="key" mayBeNull="true" type="String" locid="164">
            /// The unique key of the item, if known.
            /// </param>
            /// <param name="data" locid="165">
            /// The item's data.
            /// </param>
            /// <returns type="Promise" locid="166">
            /// complete(Object)    -- (OPTIONAL) The inserted item, if a new key has been assigned or additional
            /// properties have been added to the item.
            /// error(EditError)
            /// </returns>

            // Add item to start of list, only notify if the first item was requested
            return insertItem(
                key, data,
                    
                // slotInsertBefore, append
                (slotsStart.lastInSequence ? null : slotsStart.next), true,

                // applyEdit
                function () {
                    return listDataAdaptor.insertAtStart(key, data);
                }
            );
        };
    }

    if (listDataAdaptor.insertBefore) {
        this.insertBefore = function (key, data, nextKey) {
            /// <summary locid="167">
            /// Inserts an item before a given item in the list.
            /// </summary>
            /// <param name="key" mayBeNull="true" type="String" locid="164">
            /// The unique key of the item, if known.
            /// </param>
            /// <param name="data" locid="165">
            /// The item's data.
            /// </param>
            /// <param name="nextKey" type="String" locid="168">
            /// The unique key of the item immediately after the insertion point.
            /// </param>
            /// <returns type="Promise" locid="166">
            /// complete(Object)    -- (OPTIONAL) The inserted item, if a new key has been assigned or additional
            /// properties have been added to the item.
            /// error(EditError)
            /// </returns>

            var slotNext = keyMap[nextKey];
            
            // TODO:  Validate valid key

            // Add item before given item and send notification
            return insertItem(
                key, data,

                // slotInsertBefore, append
                slotNext, false,
                        
                // applyEdit
                function () {
                    return listDataAdaptor.insertBefore(key, data, nextKey, adjustedIndex(slotNext));
                }
            );
        };
    }

    if (listDataAdaptor.insertAfter) {
        this.insertAfter = function (key, data, previousKey) {
            /// <summary locid="169">
            /// Inserts an item after a given item in the list.
            /// </summary>
            /// <param name="key" mayBeNull="true" type="String" locid="164">
            /// The unique key of the item, if known.
            /// </param>
            /// <param name="data" locid="165">
            /// The item's data.
            /// </param>
            /// <param name="previousKey" type="String" locid="170">
            /// The unique key of the item immediately before the insertion point.
            /// </param>
            /// <returns type="Promise" locid="166">
            /// complete(Object)    -- (OPTIONAL) The inserted item, if a new key has been assigned or additional
            /// properties have been added to the item.
            /// error(EditError)
            /// </returns>

            var slotPrev = keyMap[previousKey];
            
            // TODO:  Validate valid key

            // Add item after given item and send notification
            return insertItem(
                key, data,
                    
                // slotInsertBefore, append
                (slotPrev ? slotPrev.next : null), true,

                // applyEdit
                function () {
                    return listDataAdaptor.insertAfter(key, data, previousKey, adjustedIndex(slotPrev));
                }
            );
        };
    }

    if (listDataAdaptor.insertAtEnd) {
        this.insertAtEnd = function (key, data) {
            /// <summary locid="171">
            /// Inserts an item at the end of the list.
            /// </summary>
            /// <param name="key" mayBeNull="true" type="String" locid="164">
            /// The unique key of the item, if known.
            /// </param>
            /// <param name="data" locid="165">
            /// The item's data.
            /// </param>
            /// <returns type="Promise" locid="166">
            /// complete(Object)    -- (OPTIONAL) The inserted item, if a new key has been assigned or additional
            /// properties have been added to the item.
            /// error(EditError)
            /// </returns>

            // Add item to end of list, only notify if the last item was requested
            return insertItem(
                key, data,
                
                // slotInsertBefore, append
                (slotsEnd.firstInSequence ? null : slotsEnd), false,

                // applyEdit
                function () {
                    return listDataAdaptor.insertAtEnd(key, data);
                }
            );
        };
    }

    if (listDataAdaptor.change) {
        this.change = function (key, newData) {
            /// <summary locid="172">
            /// Changes the data object of an item.
            /// </summary>
            /// <param name="key" type="String" locid="173">
            /// The unique key of the item.
            /// </param>
            /// <param name="newData" type="Object" locid="174">
            /// The item's new data.
            /// </param>
            /// <returns type="Promise" locid="175">
            /// complete(Object)    -- (OPTIONAL) The item, if any properties other than key or data have been added to
            /// the item or changed.
            /// error(EditError)
            /// </returns>

            newData = validateData(newData);

            var slot = keyMap[key];

            // TODO:  Validate valid key

            return new Promise(function (complete, error) {
                var itemOld;

                queueEdit(
                    // applyEdit
                    function () {
                        return listDataAdaptor.change(key, newData, adjustedIndex(slot));
                    },

                    complete, error,

                    // keyUpdate, isDeletion
                    null, false,

                    // updateSlots
                    function () {
                        itemOld = slot.item;
                        slot.itemNew = {
                            key: key,
                            data: newData
                        };

                        changeSlot(slot);
                    },

                    // undo
                    function () {
                        slot.item = itemOld;
                    }
                );
            });
        };
    }

    if (listDataAdaptor.moveToStart) {
        this.moveToStart = function (key) {
            /// <summary locid="176">
            /// Moves an item to the start of the list.
            /// </summary>
            /// <param name="key" type="String" locid="173">
            /// The unique key of the item.
            /// </param>
            /// <returns type="Promise" locid="175">
            /// complete(Object)    -- (OPTIONAL) The item, if any properties other than key or data have been added to
            /// the item or changed.
            /// error(EditError)
            /// </returns>

            var slot = keyMap[key];

            // TODO:  Validate valid key

            return moveItem(
                slot,
                
                // slotMoveBefore, append
                slotsStart.next, true,

                // applyEdit
                function () {
                    return listDataAdaptor.moveToStart(key, adjustedIndex(slot));
                }
            );
        };
    }

    if (listDataAdaptor.moveBefore) {
        this.moveBefore = function (key, nextKey) {
            /// <summary locid="177">
            /// Moves an item before a given item.
            /// </summary>
            /// <param name="key" type="String" locid="173">
            /// The unique key of the item.
            /// </param>
            /// <param name="nextKey" type="String" locid="168">
            /// The unique key of the item immediately after the insertion point.
            /// </param>
            /// <returns type="Promise" locid="175">
            /// complete(Object)    -- (OPTIONAL) The item, if any properties other than key or data have been added to
            /// the item or changed.
            /// error(EditError)
            /// </returns>

            var slot = keyMap[key],
                slotNext = keyMap[nextKey];

            // TODO:  Validate valid keys

            return moveItem(
                slot,
                
                // slotMoveBefore, append
                slotNext, false,

                // applyEdit
                function () {
                    return listDataAdaptor.moveBefore(key, nextKey, adjustedIndex(slot), adjustedIndex(slotNext));
                }
            );
        };
    }

    if (listDataAdaptor.moveAfter) {
        this.moveAfter = function (key, previousKey) {
            /// <summary locid="178">
            /// Moves an item after a given item.
            /// </summary>
            /// <param name="key" type="String" locid="173">
            /// The unique key of the item.
            /// </param>
            /// <param name="previousKey" type="String" locid="170">
            /// The unique key of the item immediately before the insertion point.
            /// </param>
            /// <returns type="Promise" locid="175">
            /// complete(Object)    -- (OPTIONAL) The item, if any properties other than key or data have been added to
            /// the item or changed.
            /// error(EditError)
            /// </returns>

            var slot = keyMap[key],
                slotPrev = keyMap[previousKey];

            // TODO:  Validate valid keys

            return moveItem(
                slot,
                
                // slotMoveBefore, append
                slotPrev.next, true,

                // applyEdit
                function () {
                    return listDataAdaptor.moveAfter(key, previousKey, adjustedIndex(slot), adjustedIndex(slotPrev));
                }
            );
        };
    }

    if (listDataAdaptor.moveToEnd) {
        this.moveToEnd = function (key) {
            /// <summary locid="179">
            /// Moves an item to the end of the list.
            /// </summary>
            /// <param name="key" type="String" locid="173">
            /// The unique key of the item.
            /// </param>
            /// <returns type="Promise" locid="175">
            /// complete(Object)    -- (OPTIONAL) The item, if any properties other than key or data have been added to
            /// the item or changed.
            /// error(EditError)
            /// </returns>

            var slot = keyMap[key];

            // TODO:  Validate valid key

            return moveItem(
                slot,
                
                // slotMoveBefore, append
                slotsEnd, false,

                // applyEdit
                function () {
                    return listDataAdaptor.moveToEnd(key, adjustedIndex(slot));
                }
            );
        };
    }

    if (listDataAdaptor.remove) {
        this.remove = function (key) {
            /// <summary locid="180">
            /// Removes an item.
            /// </summary>
            /// <param name="key" type="String" locid="173">
            /// The unique key of the item.
            /// </param>
            /// <returns type="Promise" locid="181">
            /// complete()
            /// error(EditError)
            /// </returns>

            var slot = keyMap[key];

            // TODO:  Validate valid key

            return new Promise(function (complete, error) {
                var slotNext,
                    firstInSequence,
                    lastInSequence;

                queueEdit(
                    // applyEdit
                    function () {
                        return listDataAdaptor.remove(key, adjustedIndex(slot));
                    },

                    complete, error,

                    // keyUpdate, isDeletion,
                    null, true,

                    // updateSlots
                    function () {
                        slotNext = slot.next;
                        firstInSequence = slot.firstInSequence;
                        lastInSequence = slot.lastInSequence;

                        updateNewIndices(slot, -1);
                        deleteSlot(slot, false);
                    },

                    // undo
                    function () {
                        reinsertSlot(slot, slotNext, !firstInSequence, !lastInSequence);
                        updateNewIndices(slot, 1);
                        sendInsertedNotification(slot);
                    }
                );
            });
        };
    }

    this.endEdits = function () {
        /// <summary locid="182">
        /// Notifies the Items Manager that a sequence of edits has ended.  The Items Manager will call
        /// beginNotifications and endNotifications once each for a sequence of edits.
        /// </summary>

        editsInProgress = false;
        completeEdits();
    };

    if (listDataAdaptor._groupOf) {
        this._groupOf = function () {
            return listDataAdaptor._groupOf;
        };
    }
} // ListDataSource

// Public definitions

WinJS.Namespace.define("WinJS.UI", {

    ItemsManagerStatus: {
        ready: "ready",
        waiting: "waiting",
        failure: "failure"
    },

    CountResult: {
        unknown: "unknown"
    },

    CountError: {
        noResponse: "noResponse"
    },

    FetchError: {
        noResponse: "noResponse",
        doesNotExist: "doesNotExist"
    },

    EditError: {
        noResponse: "noResponse",
        notPermitted: "notPermitted",
        noLongerMeaningful: "noLongerMeaningful"
    },

    ListDataSource: ListDataSource

});

})(this);



// Render Manager

(function (global) {

WinJS.Namespace.define("WinJS.UI", {});

var UI = WinJS.UI;
var Promise = WinJS.Promise;
var Utilities = WinJS.Utilities;

// Private statics

var invalidElement = "Error: expected a DOM element or an HTML string (with a single root element).";

// Some characters must be escaped in HTML and JavaScript, but the only other requirement for element IDs is that they
// be unique strings.  Use ` as the escape character, simply because it's rarely used.
var escapeMap = {
    "`": "``",
    "'": "`s",
    '"': '`d',
    '<': '`l',
    '>': '`g',
    '&': '`a',
    '\\': '`b',
    '\/': '`f'
};

var simultaneousResourceFetches = 6;
var outstandingResourceFetches = 0;

var Priority = {
    immediate: 0,
    high: 1,
    medium: 2,
    low: 3
};

// Returns an empty circular doubly-linked list
function createQueue() {
    var queue = {};

    queue.next = queue;
    queue.prev = queue;

    return queue;
}

// Sentinels for circular linked lists of resource fetch tasks
var taskQueues = {};
taskQueues[Priority.high] = createQueue();
taskQueues[Priority.medium] = createQueue();
taskQueues[Priority.low] = createQueue();

function queueTask(task) {
    var queue = taskQueues[task.priority];


    task.prev = queue.prev;
    task.next = queue;
    queue.prev.next = task;
    queue.prev = task;
}

function dequeueTask(task) {
    if (task.prev) {

        task.prev.next = task.next;
        task.next.prev = task.prev;

        task.prev = task.next = null;
    }
}

function prioritizeTask(task, priority) {
    if (task.priority !== priority) {
        dequeueTask(task);
        task.priority = priority;
        queueTask(task);
    }
}

var fetchingNextResources = false;

// Find the highest-priority outstanding request for resources, and start a fetch; continue until the desired number of
// simultaneous fetches are in progress.
function fetchNextResources() {

    // Re-entrant calls are redundant, as the loops below will continue fetching when the callee returns
    if (!fetchingNextResources) {
        fetchingNextResources = true;

        for (var priority = Priority.high; priority <= Priority.low; priority++) {
            var taskQueue = taskQueues[priority];
            for (var task = taskQueue.next; task !== taskQueue; ) {
                var taskNext = task.next;
                dequeueTask(task);
                task.discard();

                instantiateItemTree(task.renderer, task.item, task.complete);

                if (outstandingResourceFetches >= simultaneousResourceFetches) {
                    fetchingNextResources = false;
                    return;
                }

                task = taskNext;
            }
        }

        fetchingNextResources = false;
    }
}

function setIframeLoadHandler(element, onIframeLoad) {
    element.onload = function () {
        onIframeLoad(element);
    };
}

// Tracks the loading of resources for the following tags:
// 
//     <img src="[URL]">
//     <iframe src="[URL]">
//     <script src="[URL]">
//     <input type="image" src="[URL]">
//     <video poster="[URL]">
//     <object data="[URL]">
// 
// Ensures itemAvailable will be called only when all resources in the given subtree have loaded (or failed to load).
function loadItemResources(subtree, complete) {
    // Initialize the count to 1 to ensure the itemAvailable event doesn't fire prematurely
    var remainingResources = 1;

    // Similarly, increment the global fetch count to offset the extra call to onResourceLoad below
    outstandingResourceFetches++;

    function onResourceLoad() {

        if (--outstandingResourceFetches < simultaneousResourceFetches) {
            fetchNextResources();
        }

        if (--remainingResources === 0) {
            // If the promise has been cancelled, calling complete will be a no-op
            complete(subtree);
        }
    }

    function onError() {
        // TODO:  Fire resourceLoadFailure event

        onResourceLoad();
    }

    function onIframeLoad(element) {
        element.parentNode.removeChild(element);
        onResourceLoad();
    }

    // Walk the tree and locate elements that will load resources
    for (var element = subtree, elementPrev = null; elementPrev !== subtree || element !== elementPrev.nextSibling; element = element || elementPrev.nextSibling) {
        if (element) {
            var tagName = element.tagName,
                resourceUrl,
                resourceAttribute = "src";

            resourceUrl = undefined;

            switch (tagName) {
                case "IMG":
                    if (!element.complete) {
                        resourceUrl = element.src;
                    }
                    break;

                case "IFRAME":
                case "SCRIPT":
                    resourceUrl = element.src;
                    break;

                case "INPUT":
                    if (element.type === "image") {
                        tagName = "img";
                        resourceUrl = element.src;
                    }
                    break;

                case "VIDEO":
                    tagName = "img";
                    resourceUrl = element.poster;
                    break;

                case "OBJECT":
                    resourceUrl = element.data;
                    resourceAttribute = "data";
                    break;
            }

            // If this element loads a resource, create a dummy element so we can set its onload handler
            if (resourceUrl) {
                var dummyElement = document.createElement(tagName);

                outstandingResourceFetches++;
                remainingResources++;

                // Set the onload handler before the resource attribute, to guarantee that it fires.  Note that the
                // event might fire synchronously.
                if (element.tagName === "IFRAME") {
                    // Must attach an IFRAME to get it to load
                    dummyElement.style.display = "none";
                    document.body.appendChild(dummyElement);
                    setIframeLoadHandler(dummyElement, onIframeLoad);
                } else {
                    dummyElement.onload = onResourceLoad;
                    dummyElement.onerror = onError;
                }
                dummyElement[resourceAttribute] = resourceUrl;
            }

            // Continue walking the tree
            elementPrev = element;
            element = element.firstChild;
        } else {
            elementPrev = elementPrev.parentNode;
        }
    }

    // Call onResourceLoad directly to compensate for initializing the count to 1.  If all onload events fired
    // synchronously, this will trigger item instantiation and the itemAvailable event.
    onResourceLoad();
}

function instantiateItemTree(renderer, item, complete) {
    
    var element = renderer(item);

    element.msDataItem = item;
    
    element.msDataItem.dataObject = item.data;  // TODO: Temporary, for compatibility with existing code

    complete(element);
}

function createTask(renderer, item, priority, complete, error, progress, discardTask) {
    var task = null;

    // See if the resource fetch can begin immediately
    if (outstandingResourceFetches < simultaneousResourceFetches || priority === Priority.immediate) {
        instantiateItemTree(renderer, item, complete);
    } else {
        // Append a new task to the appropriate queue

        task = {
            renderer: renderer,
            item: item,
            priority: priority,
            complete: complete,
            error: error,
            progress: progress,
            discard: discardTask
        };

        queueTask(task);
    }

    return task;
}

// Dummy parent node used to parse HTML
var dummyParent = document.createElement("div");

// Public definitions

WinJS.Namespace.define("WinJS.UI", {

    Priority: Priority,     // TODO:  Put this under RenderManager?

    // Accepts either an HTML string (with a single root element) or a DOM element; if it is the former, parses it
    ensureElement: function (input) {
        switch (typeof input) {
            case "object":
                if (Utilities._isDOMElement(input)) {
                    return input;
                }
                break;

            case "string":
                dummyParent.innerHTML = input;
                if (dummyParent.childNodes.length === 1) {
                    var element = dummyParent.removeChild(dummyParent.firstChild);
                    dummyParent.innerHTML = null;
                    return element;
                }
                break;
        }

        throw new Error(invalidElement);
    },

    RenderManager: WinJS.Class.define(function (renderer, keyOf) {
        // Constructor

        this._renderer = renderer;
        this._keyOf = keyOf;

        this._tasks = {};
    }, {
        // Public members

        render: function (item, priority) {
            var that = this,
                key = that._keyOf(item),
                task;

            if (this._tasks[key]) {
                // TODO: Validation error
            }

            if (typeof priority !== "number") {
                priority = UI.Priority.low;
            }

            return new WinJS._PerfMeasurement_Promise(function (complete, error, progress) {
                task = createTask(that._renderer, item, priority, complete, error, progress, function () {
                    delete that._tasks[key];
                });

                if (task) {
                    that._tasks[key] = task;
                }
            }, function () {
                if (task) {
                    dequeueTask(task);
                }
            });
        },

        deprioritizeAll: function () {
            var tasks = this._tasks;
            for (var property in tasks) {
                prioritizeTask(tasks[property], Priority.low);
            }
        },

        prioritize: function (item, priority) {
            var task = this._tasks[this._keyOf(item)];
            if (task) {
                prioritizeTask(task, priority);
            }
        }
    })

});

// Public statics

UI.RenderManager.itemID = function (ownerElement, key) {
    var ownerID = "";
    if (ownerElement) {
        var elementID = ownerElement.id;
        if (elementID !== undefined) {
            ownerID = elementID;
        }
    }

    return ownerID + "_" + key.replace(/[`'"<>&\\\/]/g, function (character) {
        return escapeMap[character];
    });
};

})(this);


// Storage Item Data Source

(function (global) {

    WinJS.Namespace.define("WinJS.UI", {});

    var StorageDataAdaptor = WinJS.Class.define(function (query, options) {
        // Constructor

        var mode = Windows.Storage.FileProperties.ThumbnailMode.singleItem,
            size = 192,
            flags = 0,
            delayLoad = true;
        if (options) {
            if (options.mode !== null) {
                mode = options.mode;
            }
            if (options.requestedThumbnailSize !== null) {
                size = options.requestedThumbnailSize;
            }
            if (options.thumbnailOptions !== null) {
                flags = options.thumbnailOptions;
            }
            if (options.synchronous !== null) {
                delayLoad = !options.synchronous;
            }
        }

        this._query = query;
        this._loader = new Windows.Storage.BulkAccess.FileInformationFactory(this._query, mode, size, flags, delayLoad);
        this.compareByIdentity = true;
    }, {
        // Public members

        setNotificationHandler: function (notificationHandler) {
            this._notificationHandler = notificationHandler;
            this._query.addEventListener("contentschanged", function () {
                notificationHandler.invalidateAll();
            });
            this._query.addEventListener("optionschanged", function () {
                notificationHandler.invalidateAll();
            });
        },

        itemsFromEnd: function (count) {
            var that = this;
            return this.getCount().then(function (totalCount) {
                if (totalCount === 0) {
                    return WinJS.Promise.wrapError(new WinJS.ErrorFromName(WinJS.UI.FetchError.doesNotExist));
                }
                // Intentionally passing countAfter = 1 to go one over the end so that itemsFromIndex will
                // report the vector size since its known.
                return that.itemsFromIndex(totalCount - 1, Math.min(totalCount - 1, count - 1), 1);
            });
        },

        itemsFromIndex: function (index, countBefore, countAfter) {
            var first = (index - countBefore),
                count = (countBefore + 1 + countAfter);
            var that = this;
            function listener(ev) {
                that._notificationHandler.changed(that._item(ev.target));
            };
            return this._loader.getItemsAsync(first, count).then(function (itemsVector) {
                var vectorSize = itemsVector.size;
                if (vectorSize === 0) {
                    return WinJS.Promise.wrapError(new WinJS.ErrorFromName(WinJS.UI.FetchError.doesNotExist));
                }
                var items = new Array(vectorSize);
                for (var i = 0; i < vectorSize; i++) {
                    var loadedItem = itemsVector.getAt(i);
                    items[i] = that._item(loadedItem);
                    loadedItem.addEventListener("thumbnailupdated", listener, false);
                    loadedItem.addEventListener("propertiesupdated", listener, false);
                }
                var result = {
                    items: items,
                    offset: countBefore,
                    absoluteIndex: index
                };
                // set the totalCount only when we know it (when we retrieived fewer items than were asked for)
                if (vectorSize < count) {
                    result.totalCount = index + vectorSize;
                }
                return result;
            });
        },

        itemsFromDescription: function (description, countBefore, countAfter) {
            var that = this;
            return this._query.findStartIndexAsync(description).then(function (index) {
                return that.itemsFromIndex(index, countBefore, countAfter);
            });
        },

        getCount: function () {
            return this._query.getItemCountAsync();
        },

        // compareByIdentity: set in constructor
        // itemsFromStart: not implemented
        // itemsFromKey: not implemented
        // insertAtStart: not implemented
        // insertBefore: not implemented
        // insertAfter: not implemented
        // insertAtEnd: not implemented
        // change: not implemented
        // moveToStart: not implemented
        // moveBefore: not implemented
        // moveAfter: not implemented
        // moveToEnd: not implemented
        // remove: not implemented

        // Private members

        _item: function (item) {
            return {
                key: item.folderRelativeId,
                data: item
            };
        }
    });

    // Public definitions

    WinJS.Namespace.define("WinJS.UI", {

        /// <summary locid="183">
        /// Returns a data source that enumerates a StorageQueryResult
        /// </summary>
        /// <param name="query" type="Windows.Storage.Search.IStorageQueryResultBase" locid="184">
        /// An object that supports IStorageQueryResultBase
        /// </param>
        /// <param name="options" mayBeNull="true" optional="true" type="Object" locid="185">
        /// Options for the enumeration.  Properties on this object may include:
        /// 
        /// mode (type="Windows.Storage.FileProperties.ThumbnailMode"):
        /// The kind of thumbnails requested (if any).
        /// 
        /// requestedThumbnailSize (type="Number"):
        /// The size of the requested thumbnails for the given thumbnail mode.
        /// 
        /// thumbnailOptions (type="Windows.Storage.FileProperties.ThumbnailOptions"):
        /// Additional options that can be specified for retrieving thumbnails.
        /// 
        /// synchronous (type="Boolean"):
        /// When set, items will only be returned with properties and thumbnails already delivered.
        /// 
        /// </param>
        StorageDataSource: function (query, options) {
            return new WinJS.UI.ListDataSource(new StorageDataAdaptor(query, options));
        }
    });

})();


WinJS.Namespace.define("WinJS.UI", {});

(function (global, WinJS, undefined) {

var utilities = WinJS.Utilities,
    Promise = WinJS.Promise,
    Animation = WinJS.UI.Animation;

// These values are taken from PVL, with a 30ms buffer added to them to allow events a chance to fire from the animations first.
// If for whatever reason the animation promise never returns, each animation that fires will join the animation promise to a timeout promise. 
// If the animation never finishes, the timeout will, and the LV will be usable once more.
var expectedRemoveDuration = 397;
var expectedMoveDurationReflow = 697;
var expectedMoveDurationFade = 530;
var expectedAddDuration = 397;

function setOpacityCallback(opacity) {
    return function (elem) {
        if (elem.style.opacity === opacity) {
            return false;
        } else {
            elem.style.opacity = opacity;
            return true;
        }
    };
}

AnimationStage = {
    waiting: 0,
    remove: 1,
    move: 2,
    add: 3,
    done: 4
};

function _ListviewAnimationStage() {
    this._affectedItems = {};
    this._running = false;
}

_ListviewAnimationStage.prototype = {
    stageCompleted: function () {
        var itemKeys = Object.keys(this._affectedItems);
        for (var i = 0, len = itemKeys.length; i < len; i++) {
            var element = this._affectedItems[itemKeys[i]].element;
            if (element._currentAnimationStage === this) {
                // An item can be moved between stages, so the currentAnimationStage should only be cleared if this stage is the right stage
                element._animating = false;
                delete element._currentAnimationStage;
            }
        }

        this._running = false;
    },


    removeItemFromStage: function (itemID) {
        delete this._affectedItems[itemID];
    },

    running: function () {
        return this._running;
    }
};

function _ListviewAnimationRemoveStage(itemsRemoved, canvas) {
    var itemIDs = Object.keys(itemsRemoved);
    this._affectedItems = {};
    this._targetSurface = canvas;

    for (var i = 0, len = itemIDs.length; i < len; i++) {
        var itemID = itemIDs[i],
            itemData = itemsRemoved[itemID],
            itemAnimationStage = itemData.element._currentAnimationStage,
            skipItemAnimation = false;

        itemData.element._animating = true;
        if (itemAnimationStage) {
            // An item can already be attached to a different animation stage.
            // Remove animations take precedence over the other two animation stages.
            // If an item is in an add stage and is now being removed and that add animation hasn't played yet,
            // then it's okay to just skip the item's animation entirely.
            itemAnimationStage.removeItemFromStage(itemID);
            if (itemAnimationStage instanceof _ListviewAnimationAddStage && !itemAnimationStage.running()) {
                skipItemAnimation = true;
            }
        }

        if (!skipItemAnimation) {
            itemData.element._currentAnimationStage = this;
            this._affectedItems[itemID] = itemsRemoved[itemID];
        }
    }
}

_ListviewAnimationRemoveStage.prototype = new _ListviewAnimationStage();
_ListviewAnimationRemoveStage.prototype.mergeStage = function (stage) {
    var newItemIDs = Object.keys(stage._affectedItems);
    for (var i = 0, len = newItemIDs.length; i < len; i++) {
        var itemID = newItemIDs[i],
            itemData = stage._affectedItems[itemID];
        this._affectedItems[itemID] = itemData;
        itemData.element._currentAnimationStage = this;
    }
};

_ListviewAnimationRemoveStage.prototype.animateStage = function () {
    this._running = true;
    var itemIDs = Object.keys(this._affectedItems),
        items = [];
    if (itemIDs.length === 0) {
        return Promise.wrap();
    }

    var that = this;
    function done() {
        for (var i = 0, len = itemIDs.length; i < len; i++) {
            var item = that._affectedItems[itemIDs[i]].element;
            if (item.parentNode) {
                item.parentNode.removeChild(item);
                item.style.opacity = 1.0;
            }
        }

        that.stageCompleted();
    }

    for (var j = 0, lenJ = itemIDs.length; j < lenJ; j++) {
        // It's necessary to set the opacity of every item being removed to 0 here.
        // The deleteFromList animation will reset the item's opacity to 1.0 for the sake of animation,
        // but once that animation is finished it will clean up every state it put on the item and reset the
        // item back to its original style. If the opacity isn't set, the item will briefly flicker back
        // on screen at full size+opacity until the cleanup code in done() runs.
        var item = that._affectedItems[itemIDs[j]].element;
        item.style.opacity = 0.0;
        if (item.parentNode !== this._targetSurface) {
            this._targetSurface.appendChild(item);
        }
        items.push(item);
    }

    // One way or another, these promises are finishing. If something goes wrong with the animations, things will still be okay.
    return Promise.any([Animation.createDeleteFromListAnimation (items).execute(), Promise.timeout(expectedRemoveDuration)]).then(done, done);
};

// The listview has two types of move animations: A Reflow animation, and a fade transition between the two views.
// A fade transition will play if there are variably sized items in or near the viewport. Reflows will play at all other times.
// The problem is that one move may be triggered using reflow, and another using fade (it's a very rare scenario, but possible).
// When this happens, the fade transition should take precedence. If the old move animation used fades, then the new one will use
// it too.
function _ListviewAnimationMoveStage(itemsMoved, gridLayout, useFadeAnimation, canvas) {
    // The itemsMoved parameter passed to the move stage must map items to their old+new locations.
    this._affectedItems = {};
    this._targetSurface = canvas;
    this._useFadeAnimation = useFadeAnimation;
    this._gridLayout = gridLayout;

    var itemIDs = Object.keys(itemsMoved);
    for (var i = 0, len = itemIDs.length; i < len; i++) {
        var itemID = itemIDs[i],
            itemData = itemsMoved[itemID],
            itemAnimationStage = itemData.element._currentAnimationStage,
            skipItemAnimation = false,
            itemCameFromRunningMoveAnimation = false;

        itemData.element._animating = true;
        if (itemAnimationStage) {
            // An item can already be attached to a different animation stage.
            // Moved items should never have a removed stage animation attached to them. 
            // If the moved item has another move stage attached to it, there can be two possibilities:
            //  1 - The animation is already running. If this happens, the animation tracker will automatically handle
            //      the chaining of the old move animation and this new one. The item's animation stage just needs to be
            //      updated to point to this new stage instead.
            //  2 - The animation hasn't yet run. If this is the case, the item is still in its original position before any
            //      move animations were queued up. In this case, this new stage will take the old stage's record of the item's
            //      old location, remove the item from the old stage, and animate the item going from oldRecordLoc to newRecordLoc.
            // If the moved item has an add animation attached to it, there are two cases:
            //  1 - Animation is not yet running. If that's the case, this stage won't animate the item being moved, but will
            //      move that item instantly to its final location and leave the item's stage alone.
            //  2 - Animation is already running. In this case, the move animation should play once this item is done
            //      animating in. This stage will remove the item from the old add stage and prepare to animate it.
            //      The tracker will handle firing the move animation at the appropriate time.
            if (!itemAnimationStage.running()) {
                if (itemAnimationStage instanceof _ListviewAnimationMoveStage) {
                    var oldMoveData = itemAnimationStage._affectedItems[itemID],
                        newMoveData = itemsMoved[itemID];
                    newMoveData.oldRow = oldMoveData.oldRow;
                    newMoveData.oldColumn = oldMoveData.oldColumn;
                    newMoveData.oldLeft = oldMoveData.oldLeft;
                    newMoveData.oldTop = oldMoveData.oldTop;
                    itemAnimationStage.removeItemFromStage(itemID);
                    this._useFadeAnimation = this._useFadeAnimation || itemAnimationStage._useFadeAnimation;
                } else if (itemAnimationStage instanceof _ListviewAnimationAddStage) {
                    skipItemAnimation = true;
                    itemAnimationStage.updateItemLocation (itemsMoved[itemID]);
                }
            } else if (itemAnimationStage instanceof _ListviewAnimationMoveStage) {
                itemCameFromRunningMoveAnimation = true;
            }
        }

        if (!skipItemAnimation) {
            if (!itemCameFromRunningMoveAnimation) {
                // If an item came from a running move animation, we don't want to change its top/left properties mid animation.
                var elementStyle = itemData.element.style;
                elementStyle.left = itemData.oldLeft + "px";
                elementStyle.top = itemData.oldTop + "px";
            }
            this._affectedItems[itemID] = itemsMoved[itemID];
            itemData.element._currentAnimationStage = this;
        }
    }
}

_ListviewAnimationMoveStage.prototype = new _ListviewAnimationStage();
_ListviewAnimationMoveStage.prototype.mergeStage = function (stage) {
    this._useFadeAnimation = this._useFadeAnimation || stage._useFadeAnimation;
    var newItemIDs = Object.keys(stage._affectedItems);
    for (var i = 0, len = newItemIDs.length; i < len; i++) {
        // There shouldn't be any duplicate items in this merge. Items with two move stages would have been handled
        // in the second stage's constructor.
        var itemID = newItemIDs[i];
        if (!this._affectedItems[itemID]) {
            this._affectedItems[itemID] = stage._affectedItems[itemID];
            this._affectedItems[itemID].element._currentAnimationStage = this;
        }
    }
};

_ListviewAnimationMoveStage.prototype.animateStage = function () {
    this._running = true;
    var itemIDs = Object.keys(this._affectedItems);
    if (itemIDs.length === 0) {
        return Promise.wrap();
    }

    var that = this;
    function done() {
        that.stageCompleted();
    }

    // At the moment it's necessary to have an element being removed to make use of the move portion of the removeFromList animation.
    // These animations will create a junk div to accomplish that, and remove that junk div later.
    var animation = (this._gridLayout ? (this._useFadeAnimation ? this.createFadeReflowAnimation (itemIDs) : this.createGridReflowAnimation (itemIDs)) : this.createListReflowAnimation (itemIDs));
    return animation.then(done, done);
};

_ListviewAnimationMoveStage.prototype.createGridReflowAnimation = function (itemIDs) {
    var clones = [],
        movedItems = [],
        moveData = [],
        canvasHeight = this._targetSurface.offsetHeight,
        junkDiv = document.createElement("div"), 
        cloneElement = WinJS.UI._ListViewAnimationHelper._cloneElement,
        i, len;
        
    for (var i = 0, len = itemIDs.length; i < len; i++) {
        var itemData = this._affectedItems[itemIDs[i]];
        movedItems.push(itemData.element);
        moveData.push({left: itemData.left, top: itemData.top});
        if (!itemData.isHeader) {
            if (itemData.oldColumn !== undefined && itemData.oldColumn !== itemData.column) {
                var cloneEnd, 
                    actualStart;
                if (itemData.oldColumn > itemData.column) {
                    cloneEnd = itemData.top - canvasHeight; 
                    actualStart = canvasHeight + itemData.oldTop;
                } else {
                    actualStart = -(canvasHeight + itemData.oldTop);
                    cloneEnd = (canvasHeight - itemData.oldTop) + itemData.top + itemData.oldTop; 
                }
                var itemStyle = itemData.element.style;
                itemStyle.top = actualStart + "px";
                itemStyle.left = itemData.left + "px";
                var clonedNode = cloneElement(itemData.element);
                this._targetSurface.appendChild(clonedNode);
                var cloneStyle = clonedNode.style;
                cloneStyle.top = itemData.oldTop + "px";
                cloneStyle.left = itemData.oldLeft + "px";
                clones.push(clonedNode);
                movedItems.push(clonedNode);
                moveData.push({left: itemData.oldLeft, top: cloneEnd});
            }
        }
    }

    var animation = Animation.createDeleteFromListAnimation ([junkDiv], movedItems);
    for (i = 0, len = movedItems.length; i < len; i++) {
        var item = movedItems[i];
        item.style.top = moveData[i].top + "px";
        item.style.left = moveData[i].left + "px";
    }

    function done() {
        if (junkDiv.parentNode) {
            junkDiv.parentNode.removeChild(junkDiv);
        }
        for (var j = 0, lenJ = clones.length; j < lenJ; j++) {
            clones[j].parentNode.removeChild(clones[j]);
        }
    }
    return Promise.any([animation.execute(), Promise.timeout(expectedMoveDurationReflow)]).then(done, done);
};

_ListviewAnimationMoveStage.prototype.createListReflowAnimation = function (itemIDs) {
    var junkDiv = document.createElement("div");
    
    var that = this;
    function done() {
        if (junkDiv.parentNode) {
            junkDiv.parentNode.removeChild(junkDiv);
        }
        that.stageCompleted();
    }

    var items = [],
        i, len;
    for (i = 0, len = itemIDs.length; i < len; i++) {
        items.push(this._affectedItems[itemIDs[i]].element);
    }

    this._targetSurface.appendChild(junkDiv);
    var animation = Animation.createDeleteFromListAnimation ([junkDiv], items);

    for (i = 0, len = itemIDs.length; i < len; i++) {
        var itemData = this._affectedItems[itemIDs[i]];
        itemData.element.style.left = itemData.left + "px";
        itemData.element.style.top = itemData.top + "px";
    }

    return Promise.any([animation.execute(), Promise.timeout(expectedMoveDurationReflow)]).then(done, done);
};

_ListviewAnimationMoveStage.prototype.createFadeReflowAnimation = function (itemIDs) {
    var fadedInLayer = WinJS.UI._ListViewAnimationHelper._createHelperDiv(),
        fadedOutLayer = WinJS.UI._ListViewAnimationHelper._createHelperDiv(),
        cloneElement = WinJS.UI._ListViewAnimationHelper._cloneElement,
        hiddenRealItems = [],
        i, len;
    for (i = 0, len = itemIDs.length; i < len; i++) {
        // This check is only necessary for the fade animation. In horizontal grid layout with
        // variably sized items, the items' left and top properties will stay the same,
        // but their row/column will change, so endLayout will treat the item as an affected item.
        // This check will filter out the items that never moved.
        var itemData = this._affectedItems[itemIDs[i]];
        if (itemData.oldLeft !== itemData.left || itemData.oldTop !== itemData.top) {
            var elementStyle = itemData.element.style;
            elementStyle.top = itemData.top + "px";
            elementStyle.left = itemData.left + "px";
            hiddenRealItems.push(itemData.element);

            var fadedInClone = cloneElement(itemData.element),
                incomingCloneStyle = fadedInClone.style;
            incomingCloneStyle.top = itemData.top + "px";
            incomingCloneStyle.left = itemData.left + "px";
            fadedInLayer.appendChild(fadedInClone);

            var fadedOutClone = cloneElement(itemData.element),
                outgoingCloneStyle = fadedOutClone.style;
            outgoingCloneStyle.top = itemData.oldTop + "px";
            outgoingCloneStyle.left = itemData.oldLeft + "px";
            fadedOutLayer.appendChild(fadedOutClone);

            elementStyle.opacity = 0.0;
        }
    }

    if (hiddenRealItems.length === 0) {
        return Promise.wrap();
    }

    var canvas = this._targetSurface;
    canvas.appendChild(fadedInLayer);
    canvas.appendChild(fadedOutLayer);
    function done() {
        for (i = 0, len = hiddenRealItems.length; i < len; i++) {
            hiddenRealItems[i].style.opacity = 1.0;
        }
        canvas.removeChild(fadedInLayer);
        canvas.removeChild(fadedOutLayer);
    }

    return Promise.any([WinJS.UI._ListViewAnimationHelper._slowCrossFade(fadedInLayer, fadedOutLayer), Promise.timeout(expectedMoveDurationFade)]).then(done, done);
};

function _ListviewAnimationAddStage(itemsAdded, canvas) {
    // The itemsMoved parameter passed to the move stage must map items to their old+new locations.
    var itemIDs = Object.keys(itemsAdded);
    this._affectedItems = {};
    this._targetSurface = canvas;

    for (var i = 0, len = itemIDs.length; i < len; i++) {
        var itemID = itemIDs[i],
            itemData = itemsAdded[itemID],
            itemAnimationStage = itemData.element._currentAnimationStage,
            skipItemAnimation = false;

        itemData.element._animating = true;
        if (itemAnimationStage) {
            // An item can already be attached to a different animation stage.
            // If an item is already attached to a remove stage, we'll follow this logic:
            // - If remove animation is running, queue up add animation
            // - If remove animation isn't running, cancel remove animation for that item and don't play add.
            // Added items should never be attached to a move stage
            // Added items should never be attached to another add stage
            if (itemAnimationStage instanceof _ListviewAnimationRemoveStage) {
                if (!itemAnimationStage.running()) {
                    itemAnimationStage.removeItemFromStage(itemID);
                    skipItemAnimation = true;
                }
            }
        }

        if (!skipItemAnimation) {
            this._affectedItems[itemID] = itemsAdded[itemID];
            itemData.element._currentAnimationStage = this;
        }
    }
}

_ListviewAnimationAddStage.prototype = new _ListviewAnimationStage();
_ListviewAnimationAddStage.prototype.mergeStage = function (stage) {
    var newItemIDs = Object.keys(stage._affectedItems);
    for (var i = 0, len = newItemIDs.length; i < len; i++) {
        // There shouldn't be any duplicate items in this merge.
        var itemID = newItemIDs[i];
        if (!this._affectedItems[itemID]) {
            this._affectedItems[itemID] = stage._affectedItems[itemID];
            this._affectedItems[itemID].element._currentAnimationStage = this;
        }
    }
};

_ListviewAnimationAddStage.prototype.animateStage = function () {
    this._running = true;
    var itemIDs = Object.keys(this._affectedItems),
        items = [];

    if (itemIDs.length === 0) {
        return Promise.wrap();
    }

    var that = this;

    function done() {
        that.stageCompleted();
    }
    
    for (var i = 0, len = itemIDs.length; i < len; i++) {
        var item = this._affectedItems[itemIDs[i]].element;
        item.style.opacity = 1.0;
        if (!item.parentNode) {
            this._targetSurface.appendChild(item);
        }
        items.push(item);
    }

    return Promise.any([Animation.createAddToListAnimation (items).execute(), Promise.timeout(expectedAddDuration)]).then(done, done);
};

// updateItemLocation will be called by the move animation stage.
// It will only be called if an item waiting to be added gets moved before its animation plays.
_ListviewAnimationAddStage.prototype.updateItemLocation = function (itemData) {
    itemData.element.style.left = itemData.left + "px";
    itemData.element.style.top = itemData.top + "px";
};

function _ListViewAnimationTracker(removeStage, moveStage, addStage, oldTracker) {
    var startRemoveStage = true,
        that = this;

    this._removeStage = removeStage;
    this._moveStage = moveStage;
    this._addStage = addStage;
    this._started = false;
    this._stopped = false;
    this._currentStage = AnimationStage.waiting;
    this._animationsCompletePromise = new Promise(function (complete, error) {
        that._completeCallback = complete;
        that._errorCallback = error;
    });

    function waitComplete() {
        that.waitingComplete();
    }

    if (oldTracker && !oldTracker.done()) {
        if (oldTracker.waiting()) {
            removeStage.mergeStage(oldTracker._removeStage);
            moveStage.mergeStage(oldTracker._moveStage);
            addStage.mergeStage(oldTracker._addStage);
            this._waitingPromise = oldTracker._waitingPromise;
            this._waitingPromise.then(waitComplete, waitComplete);
            startRemoveStage = false;
        } else {
            var oldTrackerStage = oldTracker.getCurrentStage();
            switch (oldTrackerStage) {
                case AnimationStage.remove:
                    moveStage.mergeStage(oldTracker._moveStage);
                    // Fallthrough is intentional here. If the old tracker was on the remove stage, then the new one
                    // needs to merge the move+add stages of the old tracker
                case AnimationStage.move: 
                    addStage.mergeStage(oldTracker._addStage);
                    break;
            }

            // If the old tracker was on its remove or add animation stage, the tracker can play its remove animations while the
            // older animation is still running. The move portion of an animation is the only stage that can't be played in parallel.
            if (oldTrackerStage === AnimationStage.move) {
                startRemoveStage = false;
            }
        }
        oldTracker.stopAnimations();
    }

    if (startRemoveStage) {
        this.startAnimations();
    } else {
        this._waitingPromise = oldTracker._waitingPromise;
        this._waitingPromise.then(waitComplete, waitComplete);
    }
}

_ListViewAnimationTracker.prototype = {
    getCompletionPromise: function () {
        if (this._done) {
            return Promise.wrap();
        }

        return this._animationsCompletePromise;
    },

    waitingComplete: function () {
        if (!this._stopped) {
            this.startAnimations();
        }
    },

    nextStage: function () {
        this._waitingPromise = null;
        this._currentStage++;

        if (this._stopped) {
            return;
        }

        var targetStage = (this._currentStage === AnimationStage.move ? this._moveStage : (this._currentStage === AnimationStage.add ? this._addStage : null));

        if (targetStage) {
            this._waitingPromise = targetStage.animateStage();
            var that = this;
            function moveToNext() {
                that.nextStage();
            }
            this._waitingPromise.then(moveToNext, moveToNext); 
        } else {
            this._completeCallback();
        }
    },

    startAnimations: function () {
        if (this._started) {
            return;
        }
        this._started = true;
        this._currentStage = AnimationStage.remove;
        this._waitingPromise = this._removeStage.animateStage();
        var that = this;
        function moveToNext() {
            that.nextStage();
        }
        this._waitingPromise.then(moveToNext, moveToNext);
    },

    stopAnimations: function () {
        this._stopped = true;
        this._errorCallback();
    },

    getCurrentStage: function () {
        return this._currentStage;
    },

    done: function () {
        return this._currentStage === AnimationStage.done || this._stopped;
    },

    waiting: function () {
        return this._currentStage === AnimationStage.waiting;
    }
};

WinJS.Namespace.define("WinJS.UI", {
    _ListViewAnimationHelper: {
        fadeInElement: function (element) {
            return Animation.fadeIn(element);
        },

        fadeOutElement: function (element) {
            return Animation.fadeOut(element);
        },

        fadeInDragOverlay: function (shown) {
            return WinJS.UI.executeTransition (
                shown,
                {
                    name: 'opacity',
                    delay: 0,
                    duration: 240,
                    timing: "linear",
                    transition: setOpacityCallback(0.6)
                }
            );
        },
        
        animateContent: function (element, frames) {
            var current = -1,
                startTime = new Date(),
                timerId;
            
            function run() {
                var time = (new Date()) - startTime,
                    last = -1;
                for (var i = current + 1, len = frames.length; i < len; i++) {
                    var frame = frames[i];
                    if (time >= frame.time) {
                        last = i;
                    } else {
                        break;
                    }
                }
                if (last >= 0) {
                    element.innerText = frames[last].content;
                    current = last;
                }
                if (current >= frames.length - 1) {
                    clearInterval(timerId);
                }
            }

            timerId = setInterval(run, 10);
            
            run();
        },

        _cloneElement: function (original) {
            var clone = original.cloneNode(true);
            clone.id = "";
            return clone;
        },

        _createHelperDiv: function () {
            var div = document.createElement("div");
            div.style.position = "absolute";
            div.style.left = "0px";
            div.style.top = "0px";

            // Appending a single child to stop the first child selector from messing the animation up
            div.appendChild(document.createElement("div"));

            return div;
        },

        _slowCrossFade: function (incoming, outgoing) {
            incoming.style.opacity = 0.0;
            var promise1 = WinJS.UI.executeTransition (
                incoming,
                {
                    name: "opacity",
                    delay: 0,
                    duration: 500,
                    timing: "linear",
                    transition: setOpacityCallback(1)
                }
            );

            var promise2 = WinJS.UI.executeTransition (
                outgoing,
                {
                    name: "opacity",
                    delay: 0,
                    duration: 500,
                    timing: "linear",
                    transition: setOpacityCallback(0)
                }
            );
            return Promise.join([promise1, promise2]);
        },


        animateListFadeBetween: function (oldAnimationTracker, canvas, affectedItems, inserted, removed, headers) {
            if (headers) {
                for (var i = 0, len = headers.length;i < len; i++) {
                    var headerID = headers[i].element.uniqueID;
                    affectedItems[headerID] = headers[i];
                    affectedItems[headerID].isHeader = true;
                }
            }

            return new _ListViewAnimationTracker(new _ListviewAnimationRemoveStage(removed, canvas), 
                                                 new _ListviewAnimationMoveStage(affectedItems, true, true, canvas), 
                                                 new _ListviewAnimationAddStage(inserted, canvas), oldAnimationTracker);
        },

        animateEntrance: function (canvas, firstEntrance) {
            Animation.transitionContent(canvas, [{left: firstEntrance ? "100px" : "40px", top: "0px"}]);
        },

        animateItemAdded: function (item, delay) {
            // TODO: Delete this function when async renderer is in
            var delayTime = (delay ? expectedMoveDurationReflow : 0);
            return Promise.timeout(delayTime).then(function () {
                item.style.opacity = 1;
                return Animation.createAddToListAnimation (item).execute();
            });
        },

        animateReflow: function (oldAnimationTracker, canvas, affectedItems, inserted, removed, headers) {
            if (headers) {
                for (var i = 0, len = headers.length;i < len; i++) {
                    var headerID = headers[i].element.uniqueID;
                    affectedItems[headerID] = headers[i];
                    affectedItems[headerID].isHeader = true;
                }
            }
            return new _ListViewAnimationTracker(new _ListviewAnimationRemoveStage(removed, canvas), 
                                                 new _ListviewAnimationMoveStage(affectedItems, true, false, canvas), 
                                                 new _ListviewAnimationAddStage(inserted, canvas), oldAnimationTracker);
        },

        animateListReflow: function (oldAnimationTracker, canvas, affectedItems, inserted, removed) {
            return new _ListViewAnimationTracker(new _ListviewAnimationRemoveStage(removed, canvas), 
                                                 new _ListviewAnimationMoveStage(affectedItems, false, false, canvas),
                                                 new _ListviewAnimationAddStage(inserted, canvas), oldAnimationTracker);
        },

        selfReveal: function (element, offset) {
            return WinJS.UI.executeAnimation (element, {
                name: "cs_reveal",
                delay: 0,
                duration: 50,
                timing: "cubic-bezier(0.5, 1, 0.5, 1)",
                from: "-ms-transform: translate(0px, 0px)",
                to: "-ms-transform: translate(" + offset.left + "px, " + offset.top + "px)"
            });
        }
    }
});

})(this, WinJS);


WinJS.Namespace.define("WinJS.UI", {});

(function (global, WinJS, undefined) {

var utilities = WinJS.Utilities,
    Promise = WinJS.Promise, 
    Animation = WinJS.UI.Animation,
    AnimationHelper = WinJS.UI._ListViewAnimationHelper;

var CrossSlideState = {
    started: 0,
    dragging: 1,
    selecting: 2,
    selectSpeedBumping: 3,
    speedBumping: 4,
    rearranging: 5,
    completed: 6,

    selected: function (state) {
        return state === this.selecting || state === this.selectSpeedBumping;
    }
};

var PT_TOUCH = 2;

// This component is responsible for handling input in Browse Mode. 
// When the user clicks on an item in this mode itemInvoked event is fired.
WinJS.Namespace.define("WinJS.UI", {
    _getCursorPos: function (eventObject) {
        var pos = utilities.getPosition(eventObject.srcElement);
        pos.left += eventObject.offsetX;
        pos.top += eventObject.offsetY;
        return pos;
    },

    _SelectionMode: function (modeSite) {
        this.initialize(modeSite);
    }
});

WinJS.UI._SelectionMode.prototype = {
    initialize: function (modeSite) {

        this.site = modeSite;
        this.pressedItem = null;
        this.pressedIndex = WinJS.UI._INVALID_INDEX;
        this.pressedPosition = null;
        this.hoverItem = null;

        this.animations = {};
        this.keyboardNavigationHandlers = {};
        this.keyboardAcceleratorHandlers = {};

        function createArrowHandler(direction) {
            return function (oldFocus) {
                var items = modeSite._view.items;
                return modeSite._layout.getAdjacent(oldFocus, items.rootElement(items.itemAt(oldFocus)), direction);
            };
        }

        var Key = utilities.Key,
            view = this.site._view;
        this.keyboardNavigationHandlers[Key.upArrow] = createArrowHandler(WinJS.UI._UP);
        this.keyboardNavigationHandlers[Key.downArrow] = createArrowHandler(WinJS.UI._DOWN);
        this.keyboardNavigationHandlers[Key.leftArrow] = createArrowHandler(WinJS.UI._LEFT);
        this.keyboardNavigationHandlers[Key.rightArrow] = createArrowHandler(WinJS.UI._RIGHT);
        this.keyboardNavigationHandlers[Key.pageUp] = createArrowHandler(WinJS.UI._PAGEUP);
        this.keyboardNavigationHandlers[Key.pageDown] = createArrowHandler(WinJS.UI._PAGEDOWN);
        this.keyboardNavigationHandlers[Key.home] = function () {
            return Promise.wrap(0);
        };
        this.keyboardNavigationHandlers[Key.end] = function () {
            return new Promise(function (complete) {
                // The two views need to treat their ends a bit differently. Scroll view is virtualized and will allow one to jump
                // to the end of the list, but incremental view requires that the item be loaded before it can be jumped to.
                // Due to that limitation, we need to ask the view what its final item is and jump to that. The incremental view
                // will give the final loaded item, while the scroll view will give count - 1.
                view.finalItem(function (maxIndex) {
                    complete(maxIndex);
                });
            });
        };
        var that = this;
        this.keyboardAcceleratorHandlers[Key.c] = function () {
            that.site._executeCopy();
        };
        this.keyboardAcceleratorHandlers[Key.x] = function () {
            if (that.site._executeCopy()) {
                that.site._executeDelete();
            }
        };
        this.keyboardAcceleratorHandlers[Key.v] = function () {
            that.site._executePaste();
        };
        this.keyboardAcceleratorHandlers[Key.a] = function () {
            if (that.site._multiSelection()) {
                view.finalItem(function (maxIndex) {
                    that.site._selection.set(new WinJS.UI.ListViewItems([{
                        begin: 0,
                        end: maxIndex
                    }]));
                });
            }
        };
    },

    staticMode: function () {
        return this.site._tap === WinJS.UI.Tap.none && this.site._selectionMode === WinJS.UI.SelectionMode.none;
    },

    togglePressed: function (add) {
        if (!this.staticMode()) {
            utilities[add ? "addClass" : "removeClass"](this.pressedItem, WinJS.UI._pressedClass);
        
            var element = this.pressedItem;
            Promise.timeout().then(function () {
                Animation[add ? "pointerDown" : "pointerUp"](element);
            });
        }
    },

    handleTap: function (itemIndex) {
        var site = this.site,
            selection = site._selection,
            selected = selection.isSelected(itemIndex);

        if (site._selectionAllowed() && site._selectOnTap()) {
            if (site._selectionMode === WinJS.UI.SelectionMode.single || site._selectionMode === WinJS.UI.SelectionMode.extended) {
                if (!selected) {
                    selection.set(new WinJS.UI.ListViewItems(itemIndex));
                }
            } else {
                // Selection state of the clicked item is toggled 
                if (!selected) {
                    selection.add(itemIndex);
                } else {
                    selection.remove(itemIndex);
                }
            }
        }
    },

    handleCrossSlide: function (itemIndex) {
        var site = this.site,
            selection = this.site._selection,
            selected = selection.isSelected(itemIndex);
        
        if (site._selectionAllowed() && site._crossSlide === WinJS.UI.CrossSlide.select) {
            if (site._selectionMode === WinJS.UI.SelectionMode.single) {
                if (!selected) {
                    selection.set(new WinJS.UI.ListViewItems(itemIndex));
                } else {
                    selection.clear();
                }
            } else {
                if (!selected) {
                    selection.add(itemIndex);
                } else {
                    selection.remove(itemIndex);
                }
            }
        }
    },

    fireInvokeEvent: function (itemIndex) {
        if (this.site._tap !== WinJS.UI.Tap.none) {
            var eventObject = document.createEvent("CustomEvent");
            eventObject.initCustomEvent("iteminvoked", true, true, {
                itemIndex: itemIndex
            });

            // If preventDefault was not called, call the default action on the site
            if (this.pressedItem.dispatchEvent(eventObject)) {
                this.site._defaultInvoke(itemIndex);
            }
        }
    },

    prepareDragAndDrop: function (pressedPosition) {
        var site = this.site,
            selectedItems = site._selection.get();

        if (!site._selection.isSelected(this.pressedIndex)) {
            selectedItems = new WinJS.UI.ListViewItems(this.pressedIndex);
        }

        var dragData = new WinJS.UI._DataTransfer();
        if (this.reorderSupported()) {
            dragData.setData(WinJS.UI._REORDER_FORMAT, {
                uniqueID: site._element.uniqueID,
                draggedItems: selectedItems
            });
        }

        var items = site._view.items,
            draggedItem = items.itemAt(this.pressedIndex),
            draggedRoot = items.rootElement(draggedItem), 
            draggedPos = utilities.getPosition(draggedRoot),
            thumbnailIndex = this.pressedIndex,
            thumbnail = this.createThumbnail(draggedRoot, selectedItems.getIndicesCount()),
            offset = {
                x: pressedPosition.left - draggedPos.left,
                y: pressedPosition.top - draggedPos.top
            };

        // This event gives the application a chance to insert data in a custom format to the dataTransfer object
        if (this.site._dragSupported()) {
            this.fireDragStartEvent(selectedItems, dragData, thumbnail, offset);
        }

        return {
            dragData: dragData,
            selectedItems: selectedItems, 
            thumbnailIndex: thumbnailIndex, 
            thumbnail: thumbnail, 
            offset: offset
        };
    },

    startDragAndDrop: function (pressedPosition, cancelCapture) {
        var dragInfo = this.prepareDragAndDrop(pressedPosition);
        if (dragInfo.dragData.count() > 0) {

            utilities.removeClass(this.pressedItem, WinJS.UI._hoverClass);
            this.togglePressed(false);
            this.pressedItem = null;
            this.pressedIndex = WinJS.UI._INVALID_INDEX;

            var site = this.site;
            site._pushMode(new WinJS.UI._DragSourceMode(site, dragInfo.dragData, dragInfo.selectedItems, dragInfo.thumbnailIndex, dragInfo.thumbnail, dragInfo.offset, cancelCapture));
            return true;
        } else {
            return false;
        }
    },

    selectionAllowed: function () {
        var site = this.site;
        if (site._selectionAllowed()) {
            var selected = site._selection.isSelected(this.pressedIndex),
                single = !site._multiSelection(),
                newSelection;
            
            if (selected) {
                if (single) {
                    newSelection = new WinJS.UI.ListViewItems();
                } else {
                    newSelection = new WinJS.UI.ListViewItems(site._selection.selected);
                    newSelection._remove(this.pressedIndex);
                }
            } else {
                if (single) {
                    newSelection = new WinJS.UI.ListViewItems(this.pressedIndex);
                } else {
                    newSelection = new WinJS.UI.ListViewItems(site._selection.selected);
                    newSelection._add(this.pressedIndex);
                }
            }

            var eventObject = document.createEvent("CustomEvent");
            eventObject.initCustomEvent("selectionchanging", true, true, {
                newSelection: newSelection
            });
            
            return site._element.dispatchEvent(eventObject) && (selected || newSelection.getAllIndices().indexOf(this.pressedIndex) !== -1);
        } else {
            return false;
        }
    },

    prepareItem: function (pressedElement, selected) {
        var that = this,
            site = this.site,
            pressedIndex = this.pressedIndex;
        
        if (!selected) {
            (this.animations[pressedIndex] || Promise.wrap()).then(function () {
                var items = site._view.items,
                    pressedElement = items.itemAt(pressedIndex),
                    root = items.rootElement(pressedElement);

                if (pressedElement === root) {
                    site._renderSelection(pressedIndex, pressedElement, true).then(function (root) {
                        var style = root.style,
                        selectionCheckmark = root.querySelector("." + WinJS.UI._selectionCheckmarkClass),
                        selectionBackground = root.querySelector("." + WinJS.UI._selectionBackgroundClass);

                        style.zIndex = WinJS.UI._THUMBNAIL_ZINDEX;

                        utilities.removeClass(root, WinJS.UI._selectedClass);
                        selectionCheckmark.style.opacity = 0;
                        selectionBackground.style.opacity = 0;
                    }); 
                }
            });
        } else {
            site._view.items.rootElement(pressedElement).style.zIndex = WinJS.UI._THUMBNAIL_ZINDEX;
        }
    },

    clearItem: function (pressedIndex, selected) {
        var site = this.site,
            items = site._view.items,
            pressedElement = items.itemAt(pressedIndex),
            root = items.rootElement(pressedElement);
        
        if (!selected && root !== pressedElement) {
            site._renderSelection(pressedIndex, pressedElement, false);
        } else {
            root.style.zIndex = null;
        }
    },

    isInteractive: function (element) {
        var matches = element.parentNode.querySelectorAll(".win-interactive, .win-interactive *");
        for (var i = 0, len = matches.length; i < len; i++) {
            if (matches[i] === element) {
                return true;
            }
        }
        return false;
    },

    onMSPointerDown: function (eventObject) {
        var site = this.site,
            items = this.site._view.items,
            touchInput = (eventObject.pointerType === PT_TOUCH),
            leftButton = (eventObject.button === WinJS.UI._LEFT_MSPOINTER_BUTTON);

        this.crossSlideState = null; 


        if ((touchInput || leftButton) && this.pressedIndex === WinJS.UI._INVALID_INDEX && !this.isInteractive(eventObject.srcElement)) {
            this.pressedIndex = items.index(eventObject.srcElement);

            if (this.pressedIndex !== WinJS.UI._INVALID_INDEX) {
                this.pressedPosition = WinJS.UI._getCursorPos(eventObject);

                var pressedElement = items.itemAt(this.pressedIndex),
                    selected = site._selection.isSelected(this.pressedIndex),
                    crossSlide = touchInput && site._crossSlide === WinJS.UI.CrossSlide.select;
        
                this.canDrag = this.prepareDragAndDrop(this.pressedPosition).dragData.count() > 0;
                this.canSelect = this.selectionAllowed();

                if (crossSlide) {
                    this.crossSlideSelectionChanged = false;
                    this.crossSlideSelfReveal = false;
                    this.selectionHint = null;
                }

                if (crossSlide && this.canSelect) {
                    this.prepareItem(pressedElement, selected);
                    this.addSelectionHint();
                }

                this.pressedItem = items.rootElement(pressedElement);
                this.togglePressed(true);

                if (crossSlide && (this.canSelect || this.canDrag)) {
                    this.startCrossSlide();
                }
            
                this.pointerId = eventObject.pointerId;

                if (this.gestureRecognizer) {
                    this.gestureRecognizer.processDownEvent(Windows.UI.Input.PointerPoint.getCurrentPoint(eventObject.pointerId));
                }

                site._canvas.msSetPointerCapture(eventObject.pointerId);

                if (this.gestureRecognizer && eventObject.preventManipulation) {
                    eventObject.preventManipulation();
                }
            }
        }
    },
    
    onMSPointerMove: function (eventObject) {
        if (this.gestureRecognizer) {
            this.gestureRecognizer.processMoveEvents(Windows.UI.Input.PointerPoint.getIntermediatePoints(eventObject.pointerId));
        }
        
        if (this.crossSlideState !== null) {
            // Cross-slide is in progress. Calling preventDefault to stop DManip from panning
            eventObject.preventDefault();
        } else if (eventObject.button === WinJS.UI._LEFT_MSPOINTER_BUTTON && this.pressedItem) {
            var clicked = WinJS.UI._getCursorPos(eventObject);
            if (Math.abs(this.pressedPosition.left - clicked.left) > WinJS.UI._DRAG_START_THRESHOLD || Math.abs(this.pressedPosition.top - clicked.top) > WinJS.UI._DRAG_START_THRESHOLD) {
                var that = this;
                this.startDragAndDrop(this.pressedPosition, function () {
                    that.site._canvas.msReleasePointerCapture(that.pointerId);
                });
            }
        }
    },
    
    onMSPointerUp: function (eventObject) {
        if (this.gestureRecognizer) {
            this.gestureRecognizer.processUpEvent(Windows.UI.Input.PointerPoint.getCurrentPoint(eventObject.pointerId));
        }

        var site = this.site,
            currentFocus = site._selection.getFocused(),
            touchInput = (eventObject.pointerType === PT_TOUCH);

        if (!touchInput && this.pressedIndex !== WinJS.UI._INVALID_INDEX) {
            if (eventObject.ctrlKey) {
                // Cross slide emulation
                this.handleCrossSlide(this.pressedIndex);                
            } else if (eventObject.shiftKey && currentFocus !== WinJS.UI._INVALID_INDEX) {
                if (site._selectOnTap() && site._multiSelection()) {
                    site._selection.set(new WinJS.UI.ListViewItems([{
                        begin: Math.min(this.pressedIndex, currentFocus),
                        end: Math.max(this.pressedIndex, currentFocus)
                    }]));
                }
            }
        } 

        if (this.pointerId === eventObject.pointerId) {
            if (!eventObject.ctrlKey && !eventObject.shiftKey && this.pressedIndex !== WinJS.UI._INVALID_INDEX) {
                site._changeFocus(this.pressedIndex, true);
            }

            if (this.pressedItem) {
                if (this.crossSlideState !== CrossSlideState.completed) {
                    this.removeSelectionHint();
                    this.clearItem(this.pressedIndex, this.site._selection.isSelected(this.pressedIndex) || (this.crossSlideSelected && this.crossSlideSelectionChanged));

                    if (!eventObject.ctrlKey && !eventObject.shiftKey) {
                        var items = site._view.items;
                        this.pressedItem = items.rootElement(items.itemAt(this.pressedIndex));
                        this.handleTap(this.pressedIndex);
                        this.fireInvokeEvent(this.pressedIndex);
                    }
                }  
                this.togglePressed(false);
            }

            this.pressedItem = null;
            this.pressedIndex = WinJS.UI._INVALID_INDEX;

            this.site._canvas.msReleasePointerCapture(this.pointerId);
        }
    },

    onMSLostPointerCapture: function (eventObject) {
        if (this.gestureRecognizer) {
            this.endCrossSlide(true);
        }
        
        if (this.pressedItem) {
            this.togglePressed(false);

            this.pressedItem = null;
            this.pressedIndex = WinJS.UI._INVALID_INDEX;
        }
    },

    onMSPointerOver: function (eventObject) {
        var items = this.site._view.items,
            toItem = items.rootElement(items.itemFrom(eventObject.target)),
            touchInput = (eventObject.pointerType === PT_TOUCH);
        
        if (!touchInput && (this.pressedIndex === WinJS.UI._INVALID_INDEX) && toItem && !this.staticMode()) {
            if (this.hoverItem) {
                utilities.removeClass(this.hoverItem, WinJS.UI._hoverClass);
            }
            this.hoverItem = toItem;
            utilities.addClass(this.hoverItem, WinJS.UI._hoverClass);
        }
    },

    onMSPointerOut: function (eventObject) {
        var items = this.site._view.items;
        
        if ((this.pressedIndex === WinJS.UI._INVALID_INDEX) && this.hoverItem) {
            utilities.removeClass(this.hoverItem, WinJS.UI._hoverClass);
            this.hoverItem = null;
        }
    },

    startCrossSlide: function () {
        if (window.Windows) { 
            if (!this.cachedRecognizer || this.cachedRecognizer.isActive) {
                this.cachedRecognizer = new Windows.UI.Input.GestureRecognizer();

                var settings = Windows.UI.Input.GestureSettings;
                this.cachedRecognizer.gestureSettings = settings.crossSlide | settings.hold | settings.manipulationTranslateX | settings.manipulationTranslateY;

                var that = this;
                this.cachedRecognizer.addEventListener("crosssliding", function (eventObject) {
                    that.dispatchCrossSlide(eventObject);
                });
                this.cachedRecognizer.addEventListener("manipulationstarted", function (eventObject) {
                    that.manipulationStarted(eventObject);
                });
                this.cachedRecognizer.addEventListener("holding", function (eventObject) {
                    that.selfReveal();
                });
            }
            
            this.gestureRecognizer = this.cachedRecognizer;  

            var thresholds;
            if (this.canSelect) {
                thresholds = {
                    selectionStart: WinJS.UI._CROSSSLIDE_SELECTION_THRESHOLD,
                    speedBumpStart: WinJS.UI._CROSSSLIDE_SPEED_BUMP_START,
                    speedBumpEnd: WinJS.UI._CROSSSLIDE_SPEED_BUMP_END,
                    rearrangeStart: WinJS.UI._CROSSSLIDE_REARRANGE
                };
            } else {
                thresholds = {
                    selectionStart: 0,
                    speedBumpStart: WinJS.UI._CROSSSLIDE_SPEED_BUMP_START,
                    speedBumpEnd: WinJS.UI._CROSSSLIDE_SPEED_BUMP_END,
                    rearrangeStart: WinJS.UI._CROSSSLIDE_REARRANGE
                };
            }
            thresholds.speedBumpStart += thresholds.selectionStart;
            thresholds.speedBumpEnd += thresholds.speedBumpStart;
            thresholds.rearrangeStart += thresholds.speedBumpEnd;
            this.gestureRecognizer.crossSlideThresholds = thresholds; 

            this.gestureRecognizer.crossSlideHorizontally = !this.site._layout.horizontal;
        }
    },

    manipulationStarted: function (eventObject) {
        this.endCrossSlide();
        this.togglePressed(false);
        this.pressedItem = null;
        this.pressedIndex = WinJS.UI._INVALID_INDEX;

        // setting capture to viewport which content is scrolled. Because there is no event handlers on viewport DManip can stop calling UI thread 
        this.site._viewport.msSetPointerCapture(this.pointerId);
    },

    selfReveal: function () {
        var horizontal = this.site._layout.horizontal;
        if (!this.crossSlideSelfReveal) {
            this.crossSlideSelfReveal = true;

            var that = this,
                offset = {
                    left: (!horizontal ? -WinJS.UI._SELFREVEAL_OFFSET : 0),
                    top: (horizontal ? WinJS.UI._SELFREVEAL_OFFSET : 0)
                };

            AnimationHelper.selfReveal(this.pressedItem, offset).then(function () {
                that.pressedItem.style.msTransform = that.crossSlideTransform + " translate(" + offset.left + "px, " + offset.top + "px)";
            });
        }
    },

    animateSelectionChange: function (select) {
        this.crossSlideSelectionChanged = true;
        this.crossSlideSelected = select;

        var toAnimate = [],
            selectionCheckmark = this.pressedItem.querySelector("." + WinJS.UI._selectionCheckmarkClass),
            selectionBackground = this.pressedItem.querySelector("." + WinJS.UI._selectionBackgroundClass);
                
        if (selectionCheckmark) {
            toAnimate.push(selectionCheckmark);
        }
        if (selectionBackground) {
            toAnimate.push(selectionBackground);
        }

        Animation[select ? "fadeIn" : "fadeOut"](toAnimate);
        var classOperation = select ? "addClass" : "removeClass";
        utilities[classOperation](this.pressedItem, WinJS.UI._selectedClass);
        if (this.selectionHint) {
            utilities[classOperation](this.selectionHint.querySelector("." + WinJS.UI._selectionHintClass), WinJS.UI._revealedClass);
        }
    },

    endCrossSlide: function (animateBack) {
        var that = this;
        
        this.removeSelectionHint();

        if (this.gestureRecognizer) {
            this.gestureRecognizer = null;
        }

        return new Promise(function (complete) {
            var pressedIndex = that.pressedIndex;

            function cleanUp() {
                var wasSelected = that.site._selection.isSelected(pressedIndex) || (that.crossSlideSelected && that.crossSlideSelectionChanged);
                that.clearItem(pressedIndex, wasSelected);

                delete that.animations[pressedIndex];
            
                complete();
            }

            if (!that.pressedItem) {
                complete();
            } else if (animateBack) {
                that.animations[pressedIndex] = Animation.crossSlideSelect(that.pressedItem, []);
                that.animations[pressedIndex].then(cleanUp, cleanUp);
            } else {
                cleanUp();
            }
        });
    },

    dispatchCrossSlide: function (eventObject) {
        if (this.pressedItem) {
            if (this.crossSlideState !== eventObject.crossSlidingState) {
                if (eventObject.crossSlidingState === CrossSlideState.started) {
                    this.crossSlideStart = Math.floor(eventObject.position[this.site._layout.horizontal ? "y" : "x"]);
                    this.crossSlideTransform = this.pressedItem.style.msTransform;
                    if (this.selectionHint) {
                        this.selectionHint.style.display = "block";
                    }
                } else if (eventObject.crossSlidingState === CrossSlideState.completed) {
                    var that = this,
                        site = this.site,
                        selection = site._selection,
                        pressedIndex = this.pressedIndex; 
                    
                    // snap back and remove addional elements
                    this.endCrossSlide(true).then(function (){
                        if (that.crossSlideSelectionChanged) {
                            if (site._selectionAllowed() && site._crossSlide === WinJS.UI.CrossSlide.select) {
                                if (site._selectionMode === WinJS.UI.SelectionMode.single) {
                                    if (that.crossSlideSelected) {
                                        selection.set(new WinJS.UI.ListViewItems(pressedIndex));
                                    } else {
                                        selection.clear();
                                    }
                                } else {
                                    if (that.crossSlideSelected) {
                                        selection.add(pressedIndex);
                                    } else {
                                        selection.remove(pressedIndex);
                                    }
                                }
                            }
                        } 
                    });
                } else if (eventObject.crossSlidingState === CrossSlideState.rearranging) {
                    if (this.canDrag) {
                        this.endCrossSlide(false);

                        var that = this;
                        this.startDragAndDrop(this.pressedPosition, function () {
                            that.site._canvas.msReleasePointerCapture(that.pointerId);
                        });
                    }
                } else if (CrossSlideState.selected(eventObject.crossSlidingState) && !CrossSlideState.selected(this.crossSlideState) && this.canSelect) {
                    this.animateSelectionChange(!this.site._selection.isSelected(this.pressedIndex));
                } else if (!CrossSlideState.selected(eventObject.crossSlidingState) && CrossSlideState.selected(this.crossSlideState) && this.canSelect) {
                    this.animateSelectionChange(this.site._selection.isSelected(this.pressedIndex));
                }
                this.crossSlideState = eventObject.crossSlidingState;
            } 
        
            var lastState = (this.canDrag ? CrossSlideState.rearranging : CrossSlideState.selectSpeedBumping);
            if (eventObject.crossSlidingState < lastState) {
                var offset = Math.floor(eventObject.position[this.site._layout.horizontal ? "y" : "x"]) - this.crossSlideStart;
                if (this.crossSlideSelfReveal) {
                    offset = Math.max(offset, WinJS.UI._SELFREVEAL_OFFSET);
                }
                var transform = "translate" + (this.site._layout.horizontal ? "Y" : "X") + "(" + offset + "px)";
                this.pressedItem.style.msTransform = this.crossSlideTransform + " " + transform;
            }
        }
    },

    addSelectionHint: function () {
        if (!this.site._selection.isSelected(this.pressedIndex)) {
            this.selectionHint = document.createElement("div");
            var style = this.selectionHint.style;
            style.position = "absolute";
            style.display = "none";

            var element = document.createElement("div");
            element.className = WinJS.UI._selectionHintClass;
            element.innerText = WinJS.UI._SELECTION_CHECKMARK;
            this.selectionHint.appendChild(element);
        
            this.site._canvas.insertBefore(this.selectionHint, this.pressedItem);
    
            var that = this;
            this.site._layout.getItemPosition(this.pressedIndex).then(function (pos) {
                that.site._getItemMargins().then(function (margins) {
                    var style = that.selectionHint.style;
                    if (!that.site._flowLayout()) {
                        style.left = pos.left + "px";
                        style.top = pos.top + "px";
                    }
                    style.width = pos.offsetWidth + "px";
                    style.height = pos.offsetHeight + "px";
                    style.marginLeft = margins.computed.marginLeft;
                    style.marginTop = margins.computed.marginTop;
                });
            });
        } else {
            this.selectionHint = null;
        }
    },

    removeSelectionHint: function () {
        if (this.selectionHint) {
            this.site._canvas.removeChild(this.selectionHint);
            this.selectionHint = null;
        }
    },

    onDragStart: function (eventObject) {
        event.returnValue = false;
    },

    onKeyDown: function (eventObject) {
        var site = this.site,
            view = site._view,
            oldFocus = site._selection.getFocused(),
            newFocus = oldFocus,
            handled = true,
            handlerName,
            ctrlKeyDown = eventObject.ctrlKey;

        function setNewFocus() {
            // We need to get the final item in the view so that we don't try setting focus out of bounds.
            view.finalItem(function (maxIndex) {
                // Since getAdjacent is purely geometry oriented, it can return us out of bounds numbers, so this check is necessary
                if (newFocus < 0) {
                    return;
                }
                newFocus = Math.min(maxIndex, newFocus);
                if (oldFocus !== newFocus) {
                    site._changeFocus(newFocus, false, ctrlKeyDown);
                }
            });
        }

        var Key = utilities.Key,
            keyCode = eventObject.keyCode;

        if (!this.isInteractive(eventObject.srcElement)) {
            if (eventObject.ctrlKey && !eventObject.altKey && !eventObject.shiftKey && this.keyboardAcceleratorHandlers[keyCode]) {
                this.keyboardAcceleratorHandlers[keyCode]();
            }

            if (this.keyboardNavigationHandlers[keyCode]) {
                this.keyboardNavigationHandlers[keyCode](oldFocus).then(function (index) {
                    newFocus = index;
                    setNewFocus();
                });
            } else if (keyCode === Key.enter || (keyCode === Key.space && !eventObject.ctrlKey)) {
                // Todo: Evaluate whether or not this needs some sort of visual for invoking via enter
                this.pressedIndex = oldFocus;
                this.pressedItem = site._view.items.itemAt(oldFocus);
                this.handleTap(oldFocus);
                this.fireInvokeEvent(oldFocus);
                this.pressedItem = null;
                this.pressedIndex = WinJS.UI._INVALID_INDEX;
                this.site._changeFocus(oldFocus, false, ctrlKeyDown);
            } else if (keyCode === Key.space && eventObject.ctrlKey) {
                // Cross slide emulation
                this.handleCrossSlide(oldFocus);
                this.site._changeFocus(oldFocus, false, ctrlKeyDown);
            } else if (keyCode === Key.deleteKey) {
                site._executeDelete();
            } else if (keyCode === Key.escape) {
                site._selection.clear();
            } else {
                handled = false;
            }

            if (handled) {
                eventObject.stopPropagation();
                eventObject.preventDefault();
            }
        }
    },

    fireDragStartEvent: function (items, dragData, thumbnail, offset) {
        var eventObject = document.createEvent("CustomEvent");
        eventObject.initCustomEvent("dragitemsstart", true, false, {
            thumbnail: thumbnail,
            thumbnailOffset: offset,
            items: items,
            dragData: dragData
        });
        this.site._element.dispatchEvent(eventObject);
    },

    reorderSupported: function () {
        return this.site.reorder && !this.site._groups.groupByFunction && this.site._dragSupported();
    },

    createThumbnail: function (dragged, count) {
        var element = document.createElement("div"),
            style = element.style;

        style.position = "absolute";
        style.left = dragged.offsetLeft + "px";
        style.top = dragged.offsetTop + "px";
        style.width = utilities.getTotalWidth(dragged) + "px";
        style.height = utilities.getTotalHeight(dragged) + "px";
        style.zIndex = WinJS.UI._THUMBNAIL_ZINDEX;
        utilities.addClass(element, WinJS.UI._draggedItemClass);

        var clone = dragged.cloneNode(true);
        style = clone.style;
        style.left = style.top = 0;
        style.msTransform = "";
        utilities.removeClass(clone, WinJS.UI._pressedClass);
        utilities.removeClass(clone, WinJS.UI._selectedClass);
        utilities.removeClass(clone, WinJS.UI._hoverClass);
        element.appendChild(clone);

        if (count > 1) {
            var number = document.createElement("div");
            utilities.addClass(number, WinJS.UI._draggedNumberClass);
            element.appendChild(number);

            var overlay = document.createElement("div");
            utilities.addClass(overlay, WinJS.UI._draggedOverlayClass);
            element.appendChild(overlay);
        }

        return element;
    }
};

WinJS.Namespace.define("WinJS.UI", {
    _DataTransfer: function () {
        this.formatsMap = {};
        this.dropEffect = "move";
    }
});

WinJS.UI._DataTransfer.prototype = {
    setData: function DataTransfer_setData(format, data) {
        this.formatsMap[format] = data;
    },

    getData: function DataTransfer_getData(format) {
        return this.formatsMap[format];
    },

    count: function DataTransfer_count() {
        return Object.keys(this.formatsMap).length;
    }
};
})(this, WinJS);


WinJS.Namespace.define("WinJS.UI", {});

(function (global, WinJS, undefined) {
    var thisWinUI = WinJS.UI;
    thisWinUI._listViewClass = "win-listView";
    thisWinUI._viewportClass = "win-viewport";
    thisWinUI._rtlListViewClass = "win-rtl";
    thisWinUI._horizontalClass = "win-horizontal";
    thisWinUI._verticalClass = "win-vertical";
    thisWinUI._scrollableClass = "win-scrollable";
    thisWinUI._itemClass = "win-item";
    thisWinUI._selectedClass = "win-selected";
    thisWinUI._selectionBackgroundClass = "win-selection-background";
    thisWinUI._selectionCheckmarkClass = "win-selection-checkmark";
    thisWinUI._pressedClass = "win-pressed";
    thisWinUI._hoverClass = "win-hover";
    thisWinUI._headerClass = "win-groupHeader";
    thisWinUI._draggedItemClass = "win-inTransit";
    thisWinUI._draggedOverlayClass = "win-inTransitOverlay";
    thisWinUI._draggedNumberClass = "win-inTransitNumber";
    thisWinUI._progressClass = "win-progressbar";
    thisWinUI._selectionHintClass = "win-selection-hint";
    thisWinUI._revealedClass = "win-revealed";
    
    thisWinUI._INVALID_INDEX = -1;
    thisWinUI._UNINITIALIZED = -1;

    thisWinUI._LEFT_MSPOINTER_BUTTON = 1;

    // For better performance in FRE build ListView calls reclusively up to 100 frames on stack before unwinding callstack.
    thisWinUI._FIND_GROUP_LOOP_THRESHOLD = 100;


    thisWinUI._DRAG_START_THRESHOLD = 10;

    thisWinUI._AUTOSCROLL_THRESHOLD = 11;
    thisWinUI._AUTOSCROLL_INTERVAL = 50;
    thisWinUI._AUTOSCROLL_DELTA = 50;

    thisWinUI._REORDER_FORMAT = "msListViewReorder";
    thisWinUI._DRAG_TARGET_EXPANDO = "msDragTarget";

    thisWinUI._DEFAULT_PAGES_TO_LOAD = 5;
    thisWinUI._DEFAULT_PAGE_LOAD_THRESHOLD = 2;
    thisWinUI._INCREMENTAL_CANVAS_PADDING = 100;

    thisWinUI._UP = 0;
    thisWinUI._RIGHT = 1;
    thisWinUI._DOWN = 2;
    thisWinUI._LEFT = 3;
    thisWinUI._PAGEUP = 4;
    thisWinUI._PAGEDOWN = 5;

    thisWinUI._DEFERRED_ACTION = 500;

    thisWinUI._DRAG_BETWEEN_ZINDEX = 1;
    thisWinUI._THUMBNAIL_ZINDEX = 2;

    thisWinUI._NUMBER_ANIMATION_DELAY = 100;
    thisWinUI._DRAG_BETWEEN_OFFSET = 40;

    thisWinUI._CROSSSLIDE_SELECTION_THRESHOLD = 39;
    thisWinUI._CROSSSLIDE_SPEED_BUMP_START = 10;
    thisWinUI._CROSSSLIDE_SPEED_BUMP_END = 70;
    thisWinUI._CROSSSLIDE_REARRANGE = 1;
    
    thisWinUI._SELFREVEAL_OFFSET = 10;

    thisWinUI._SELECTION_CHECKMARK = "\uE081";

    thisWinUI._LISTVIEW_PROGRESS_DELAY = 2000;
})(this, WinJS);


WinJS.Namespace.define("WinJS.UI", {});

(function (global, WinJS, undefined) {

var utilities = WinJS.Utilities,
    Promise = WinJS.Promise,
    Animation = WinJS.UI.Animation,
    AnimationHelper = WinJS.UI._ListViewAnimationHelper;

// ListView switches to this interaction mode when the user starts drag something in this ListView.
// This mode calls methods of the drag target interface in a response to the mouse input.
WinJS.Namespace.define("WinJS.UI", {
    _DragSourceMode: function (modeSite, dragData, items, thumbnailIndex, thumbnail, offset, cancelCapture) {

        this.site = modeSite;
        this.previousPosition = { x: 0, y: 0 };
        this.items = items;
        this.dragData = dragData;
        this.thumbnailIndex = thumbnailIndex;
        this.thumbnail = thumbnail;
        this.thumbnailOffset = offset;
        this.target = WinJS.UI._INVALID_INDEX;
        this.cancelCapture = cancelCapture;

        if (dragData.count() > 1 || !dragData.getData(WinJS.UI._REORDER_FORMAT)) {
            this.targets = this.getTargets();
        } else {
            this.targets = [{
                element: this.site._element,
                position: utilities.getPosition(this.site._element)
            }];
        }

    }
});

WinJS.UI._DragSourceMode.prototype = {
    onMSLostPointerCapture: function (eventObject) {
        if (this.thumbnail && this.thumbnail.parentElement) {
            document.body.removeChild(this.thumbnail);
        }

        this.callDragHandler("onDragLeave", eventObject);
        this.target = WinJS.UI._INVALID_INDEX;

        this.site._popMode();

        if (this.hidden) {
            this.showDraggedItems();
        }

        this.fireDragEndEvent();
    },

    onMSPointerUp: function (eventObject) {
        this.dragEndAnimations();

        this.callDragHandler("onDrop", eventObject);
        this.target = WinJS.UI._INVALID_INDEX;

        this.cancelCapture();
    },

    onMSPointerMove: function (eventObject) {
        if (this.previousPosition.x !== eventObject.x || this.previousPosition.y !== eventObject.y) {

            this.previousPosition = {
                x: eventObject.x,
                y: eventObject.y
            };

            var cursorPosition = WinJS.UI._getCursorPos(eventObject);

            var style = this.thumbnail.style;
            style.left = cursorPosition.left - this.thumbnailOffset.x + "px";
            style.top = cursorPosition.top - this.thumbnailOffset.y + "px";

            if (!this.thumbnail.parentNode) {
                document.body.appendChild(this.thumbnail);
                this.dragStartAnimations();
            }

            var newTarget = this.targetFromPosition(cursorPosition);
            if (this.target !== newTarget) {
                this.callDragHandler("onDragLeave", eventObject);

                this.target = newTarget;
                this.dragData.dropEffect = (this.target !== WinJS.UI._INVALID_INDEX ? "copy" : "none");

                this.callDragHandler("onDragEnter", eventObject);
            }

            this.callDragHandler("onDragOver", eventObject);

            if ((eventObject.reorder || this.dragData.dropEffect === "move") && !this.hidden) {
                this.hideDraggedItems();
            }
            else if (!eventObject.reorder && this.dragData.dropEffect !== "move" && this.hidden) {
                this.showDraggedItems();
            }

            if (this.cursorOwner) {
                this.cursorOwner.style.cursor = this.previousCursor;
            }
            this.cursorOwner = eventObject.srcElement;
            style = this.cursorOwner.style;
            this.previousCursor = style.cursor;

            style.cursor = (this.dragData.dropEffect === "none" ? "no-drop" : "default");

            this.fireDragEvent();
        }
        eventObject.preventDefault();
    },

    showDraggedItems: function () {
        var view = this.site._view,
            indices = this.items.getAllIndices(),
            animated = [];
                
        this.hidden = false;

        for (var i = 0, len = indices.length; i < len; i++) {
            var item = view.items.itemAt(indices[i]);
            if (item) {
                animated.push(view.items.rootElement(item));
            }
        }
            
        var that = this;
        function done() {
            view.items.setLayoutIndices({});
            view.refresh(that.site.scrollPosition);
        }
                
        Animation.createAddToListAnimation(animated, []).execute().then(done, done);
    },

    hideDraggedItems: function () {
        var view = this.site._view,
            indices = this.items.getAllIndices(),
            hiddenItems = {},
            animated = [];
                
        this.hidden = true;

        hiddenItems[this.thumbnailIndex] = WinJS.UI._INVALID_INDEX;
        view.items.setLayoutIndices(hiddenItems);
        view.refresh(this.site.scrollPosition);

        for (var i = 0, len = indices.length; i < len; i++) {
            var index = indices[i],
                item = view.items.itemAt(index);
            
            if (this.thumbnailIndex !== index && item) {
                animated.push(view.items.rootElement(item));
            }

            hiddenItems[indices[i]] = WinJS.UI._INVALID_INDEX;
        }
                
        var that = this;
        function done() {
            view.items.setLayoutIndices(hiddenItems);
            view.refresh(that.site.scrollPosition);
        }
                
        if (animated.length) {
            Animation.createDeleteFromListAnimation(animated, []).execute().then(done, done);
        } else {
            done();
        }
    },

    dragStartAnimations: function () {
        Animation.dragSourceStart(this.thumbnail, []);
        
        var toFade = [],
            selectionCheckmark = this.thumbnail.querySelector("." + WinJS.UI._selectionCheckmarkClass),
            selectionBackground = this.thumbnail.querySelector("." + WinJS.UI._selectionBackgroundClass);
                
        if (selectionCheckmark) {
            toFade.push(selectionCheckmark);
        }
        if (selectionBackground) {
            toFade.push(selectionBackground);
        }

        Animation.fadeOut(toFade);

        var overlay = this.thumbnail.querySelector("." + WinJS.UI._draggedOverlayClass);
        Promise.timeout().then(function () {
            AnimationHelper.fadeInDragOverlay(overlay);
        });
            
        var numberElement = this.thumbnail.querySelector("." + WinJS.UI._draggedNumberClass);
        if (numberElement) {
            var end = this.items.getIndicesCount(),
                begin = Math.max(1, end - 10),
                time = WinJS.UI._NUMBER_ANIMATION_DELAY,
                frames = [];

            for (var i = begin; i <= end; i++) {
                frames.push({
                    content: i.toString(),
                    time: time
                });
                time += WinJS.UI._NUMBER_ANIMATION_DELAY;
            }

            AnimationHelper.animateContent(numberElement, frames);
        }
    },

    dragEndAnimations: function () {
        var thumbnail = this.thumbnail;
        this.thumbnail = null;

        function done() {
            if (thumbnail && thumbnail.parentElement) {
                document.body.removeChild(thumbnail);
            }
        }
        
        var currentTarget = this.targets[this.target] || {},
            count = this.items.getIndicesCount();
        if (count > 1 || currentTarget.element !== this.site._element) {
            Animation.createDeleteFromListAnimation(thumbnail, []).execute().then(done, done);
        } else {
            Animation.dragSourceEnd(thumbnail, [], []).then(done, done);
        }
    },

    callDragHandler: function (method, eventObject) {
        if (this.target !== WinJS.UI._INVALID_INDEX) {
            var targetObject = this.targets[this.target];

            if (targetObject.element[WinJS.UI._DRAG_TARGET_EXPANDO][method]) {
                var cursorPosition = WinJS.UI._getCursorPos(eventObject);
                targetObject.element[WinJS.UI._DRAG_TARGET_EXPANDO][method](eventObject, {
                    cursorPosition: {
                        x: cursorPosition.left - targetObject.position.left,
                        y: cursorPosition.top - targetObject.position.top
                    },
                    dragData: this.dragData
                });
            }
        }
    },

    targetFromPosition: function (cursor) {
        for (var i = 0, len = this.targets.length; i < len; i++) {
            var target = this.targets[i].position;
            if (cursor.left >= target.left && cursor.left < target.left + target.width &&
                cursor.top >= target.top && cursor.top < target.top + target.height) {
                return i;
            }
        }
        return -1;
    },

    getTargets: function () {
        var targets = [];

        for (var element = document.body, elementPrev = null;
             elementPrev !== document.body || element !== elementPrev.nextSibling;
             element = element || elementPrev.nextSibling) {

            if (element) {

                if (element[WinJS.UI._DRAG_TARGET_EXPANDO]) {
                    targets.unshift({
                        element: element,
                        position: utilities.getPosition(element)
                    });
                }

                elementPrev = element;
                element = element.firstChild;

            } else {
                elementPrev = elementPrev.parentNode;
            }
        }

        return targets;
    },

    onDataChanged: function () {
        this.cancelCapture();
    },

    fireDragEvent: function () {
        var eventObject = document.createEvent("CustomEvent");
        eventObject.initCustomEvent("dragitems", true, true, {
            items: this.items,
            dragData: this.dragData
        });
        this.site._element.dispatchEvent(eventObject);
    },

    fireDragEndEvent: function () {
        var eventObject = document.createEvent("CustomEvent");
        eventObject.initCustomEvent("dragitemsend", true, false, {
            items: this.items,
            dragData: this.dragData
        });
        this.site._element.dispatchEvent(eventObject);
    },

    onKeyDown: function (eventObject) {
        if (event.keyCode === utilities.Key.escape) {
            this.cancelCapture();
        }
    }
};
})(this, WinJS);


WinJS.Namespace.define("WinJS.UI", {});

(function (global, WinJS, undefined) {

var utilities = WinJS.Utilities,
    Promise = WinJS.Promise,
    Animation = WinJS.UI.Animation;


// This component implements the target side of drag and drop operations. Its methods are called by DragSourceMode from source ListView.
WinJS.Namespace.define("WinJS.UI", {
    _DragTargetHandler: function (site) {
        this.site = site;
        this.count = 0;
        this.reorder = false;            
    }
});

WinJS.UI._DragTargetHandler.prototype = {
    onDragEnter: function (eventObject, detail) {
        var that = this,
            dragEnterEvent = this.fireDragEnterEvent(eventObject.srcElement, detail.dragData),
            reorderData = detail.dragData.getData(WinJS.UI._REORDER_FORMAT);

        if (dragEnterEvent.detail.count && this.site._dragSupported()) {
            this.count = dragEnterEvent.detail.count;
            this.dragHandler = function (insertIndex) {
                return that.fireDropEvent(insertIndex, detail.dragData);
            };
            this.reorder = false;            
        } else if (reorderData && reorderData.uniqueID === this.site._element.uniqueID) {
            this.count = reorderData.draggedItems.getIndicesCount();
            this.dragHandler = function (insertIndex) {
                return that.reorderItems(insertIndex, reorderData.draggedItems);
            };
            this.reorder = true;            
        } else {
            this.dragHandler = null; 
        }

        if (this.dragHandler) {
            this.site._layout.dragEnter();
        }
    },

    onDragOver: function (eventObject, detail) {
        if (this.dragHandler) {
            this.cursorPosition = detail.cursorPosition;

            if (this.inScrollZone(this.cursorPosition)) {
                this.startAutoScroll();
            } else {
                this.stopAutoScroll();
            }

            this.translateCursorPosition(detail);
            
            this.site._layout.dragOver(detail.cursorPosition.x, detail.cursorPosition.y, this.count);
            
            eventObject.reorder = this.reorder;
        }
    },

    onDragLeave: function (eventObject, detail) {
        if (this.dragHandler) {
            this.dragHandler = null;

            this.stopAutoScroll();
            this.site._layout.dragLeave();
            this.site._layout.dragEnd();
        }
    },

    onDrop: function (eventObject, detail) {
        if (this.dragHandler) {
            var dragHandler = this.dragHandler;
            this.dragHandler = null;
            
            this.stopAutoScroll();
            
            var site = this.site;
            this.translateCursorPosition(detail);
            site._layout.dragOver(detail.cursorPosition.x, detail.cursorPosition.y, this.count).then(function (insertIndex) {
                site._layout.dragLeave();
                site._layout.dragEnd();

                dragHandler(insertIndex);
            });
        }
    },


    onDataChanged: function () {
        if (this.dragHandler) {
            this.dragHandler = null;

            this.stopAutoScroll();
            this.site._layout.dragLeave();
        }
    },

    translateCursorPosition: function (detail) {
        var site = this.site,
            scrollPos = site.scrollPosition;
        
        if (site._rtl() && site._horizontal()) {
            scrollPos = site._element[site._scrollLength] - scrollPos - site._viewport.offsetWidth;
        }

        var newCursorPosition = site._horizontal() ? {
            x: detail.cursorPosition.x + scrollPos,
            y: detail.cursorPosition.y
        } : {
            x: detail.cursorPosition.x,
            y: detail.cursorPosition.y + scrollPos
        };

        detail.cursorPosition = newCursorPosition;
    },

    inScrollZone: function (position) {
        var viewportSize = this.site._getViewportSize();

        if (this.site._horizontal()) {
            return position.x < WinJS.UI._AUTOSCROLL_THRESHOLD || position.x > (viewportSize.width - WinJS.UI._AUTOSCROLL_THRESHOLD);
        } else {
            return position.y < WinJS.UI._AUTOSCROLL_THRESHOLD || position.y > (viewportSize.height - WinJS.UI._AUTOSCROLL_THRESHOLD);
        }
    },

    autoScroll: function () {
        if (this.inScrollZone(this.cursorPosition)) {
            var site = this.site,
                scrollDelta = WinJS.UI._AUTOSCROLL_DELTA * (this.cursorPosition[site._horizontal() ? "x" : "y"] < WinJS.UI._AUTOSCROLL_THRESHOLD ? -1 : 1);
            if (site._horizontal() && site._rtl()) {
                scrollDelta = -scrollDelta;
            }
            site.scrollPosition = site.scrollPosition + scrollDelta;
        }
    },

    startAutoScroll: function () {
        if (this.autoScrollTimer === undefined) {
            var that = this;
            this.autoScrollTimer = setInterval(function () {
                that.autoScroll();
            }, WinJS.UI._AUTOSCROLL_INTERVAL);
        }
    },

    stopAutoScroll: function () {
        if (this.autoScrollTimer !== undefined) {
            clearTimeout(this.autoScrollTimer);
            this.autoScrollTimer = null;
        }
    },

    fireDragEnterEvent: function (srcElement, dragData) {
        var eventObject = document.createEvent("CustomEvent");
        eventObject.initCustomEvent("dragitemsenter", true, false, {
            dragSource: srcElement,
            dragData: dragData
        });
        this.site._element.dispatchEvent(eventObject);

        return eventObject;
    },

    fireDropEvent: function (insertIndex, dragData) {
        var eventObject = document.createEvent("CustomEvent");
        eventObject.initCustomEvent("dropitems", true, false, {
            index: insertIndex,
            dragData: dragData
        });
        this.site._element.dispatchEvent(eventObject);
    },

    reorderItems: function (insertIndex, draggedItems) {
        var site = this.site, 
            eventObject = document.createEvent("CustomEvent");

        function move(moveProc, insertBeforeKey) {        
            dataSource.beginEdits();
            var indices = draggedItems.getAllIndices();
            for (var i = 0, len = indices.length; i < len; i++) {
                site._itemsManager.simplerItemAtIndex(indices[i], function (element) {
                    moveProc(element.msDataItem.key, insertBeforeKey);
                });
            }
            dataSource.endEdits();
        }

        eventObject.initCustomEvent("itemsmoved", true, true, {
            index: insertIndex,
            items: draggedItems
        });
    
        if (site._element.dispatchEvent(eventObject)) {
            var dataSource = site._itemsManager.dataSource;

            if (insertIndex < 0 || insertIndex >= site._cachedCount) {
                move(dataSource.moveToEnd.bind(dataSource));
            } else {
                site._itemsManager.simplerItemAtIndex(insertIndex, function (nextElement) {
                    move(dataSource.moveBefore.bind(dataSource), nextElement.msDataItem.key);
                });
            }
        }
    }
};
})(this, WinJS);


WinJS.Namespace.define("WinJS.UI", {});

(function (global, WinJS, undefined) {
    WinJS.UI._elementIsInvalid = "Invalid argument: ListView expects valid DOM element as the first argument.";
    WinJS.UI._layoutIsInvalid = "Invalid argument: layout must be one of following values: 'verticalgrid', " +
    "'horizontalgrid' or 'list'.";
    WinJS.UI._modeIsInvalid = "Invalid argument: mode must be one of following values: 'static', 'browse', " +
    "'singleselection' or 'multiselection'.";
    WinJS.UI._loadingBehaviorIsInvalid = "Invalid argument: loadingBehavior must be 'incremental' or 'randomaccess'.";
    WinJS.UI._itemIndexIsInvalid = "Invalid argument: index is invalid.";
    WinJS.UI._pagesToLoadIsInvalid = "Invalid argument: pagesToLoad must be a positive number.";
    WinJS.UI._pageLoadThresholdIsInvalid = "Invalid argument: pageLoadThreshold must be a positive number.";
    WinJS.UI._automaticallyLoadItemsIsInvalid = "Invalid argument: automaticallyLoadItems must be a boolean.";
    WinJS.UI._layoutNotInitialized = "Layout is not initialized.";
})(this, WinJS);


WinJS.Namespace.define("WinJS.UI", {});

(function (global, WinJS, undefined) {

var utilities = WinJS.Utilities,
    Promise = WinJS.Promise;

// This component is responsible for dividing the items into groups and storing the information about these groups.
WinJS.Namespace.define("WinJS.UI", {
    _GroupsContainer: function (site, groupByFunction) {
        this.site = site;
        this.groupByFunction = groupByFunction;
        this.groups = [];
        this.dirty = true;
    }
});

WinJS.UI._GroupsContainer.prototype = {

    addItem: function GroupsContainer_addItem(itemsManager, itemIndex, element, groupAddedCallback) {
        var that = this;

        var previousItem = this.previousItem;
        this.previousItem = itemIndex;

        var currentIndex = this.groupFromItem(itemIndex);
        if (currentIndex === null && this.groups.length > 0) {
            currentIndex = 0;
        }
        
        var currentGroup = null,
            currentData = null,
            nextGroup = null;
        if (currentIndex !== null) {
            currentGroup = this.groups[currentIndex];
            currentData = currentGroup.userData;
            if (currentIndex + 1 < this.groups.length) {
                nextGroup = this.groups[currentIndex + 1];
            }
        }

        var item = {
            data: element.msDataItem.dataObject,
            key: element.msDataItem.key
        };

        // The application verifies if the item belongs to the current group
        var newGroupData = this.groupByFunction(item);
        if (currentData && newGroupData.key === currentData.key) {
            if (itemIndex < currentGroup.startIndex) {
                currentGroup.startIndex = itemIndex;
                this.dirty = true;
            }
            // The item belongs to the current group
            if (currentGroup.waitingList) {
                currentGroup.waitingList.push(groupAddedCallback);
            } else {
                groupAddedCallback();
            }
            // Maybe the item belongs to the next group. This can happen when the beginning of the next group is still not known (nextGroup.waitingList!== undefined).
        } else if (nextGroup && nextGroup.waitingList && nextGroup.userData.key === this.groupByFunction(item).key) {
            nextGroup.waitingList.push(groupAddedCallback);
        } else {
            // The item belongs to a new group

            // If the item's index was just incremented then this new group starts with this item, so the startIndex is known
            if (previousItem + 1 === itemIndex) {
                currentIndex = this.addGroup(currentGroup, currentIndex, {
                    userData: newGroupData,
                    startIndex: itemIndex
                });
                groupAddedCallback();
            } else if (newGroupData.startIndex !== undefined) {
                // The application has provided startIndex for this group
                currentIndex = this.addGroup(currentGroup, currentIndex, {
                    userData: newGroupData,
                    startIndex: newGroupData.startIndex
                });
                groupAddedCallback();
            } else if (itemIndex === 0) {
                currentIndex = this.addGroup(null, null, {
                    userData: newGroupData,
                    startIndex: itemIndex
                });
                groupAddedCallback();
            } else {
                // We need to find the beginning of the group
                var newGroup = {
                    userData: newGroupData,
                    startIndex: itemIndex,
                    waitingList: []
                };
                currentIndex = this.addGroup(currentGroup, currentIndex, newGroup);
                newGroup.waitingList.push(groupAddedCallback);
                this.findStart(itemsManager, newGroup, itemIndex, 0);
            }
        }
    },

    addGroup: function GroupsContainer_addGroup(currentGroup, currentIndex, toInsert) {
        if (currentGroup) {
            this.groups.splice(++currentIndex, 0, toInsert);
        } else {
            currentIndex = this.groups.length;
            this.groups.unshift(toInsert);
        }

        this.dirty = true;
        return currentIndex;
    },

    startFound: function GroupsContainer_startFound(group, itemIndex) {

        group.startIndex = itemIndex;
        this.dirty = true;

        var tempWaiting = [];
        for (var i = 0, len = group.waitingList.length; i < len; i++) {
            tempWaiting.push(group.waitingList[i]);
        }
        delete group.waitingList;

        // Beginning of the group has been found. The correct position of an item can be calculated at this point so 
        // all callbacks waiting until the group is added and ready to use can be called.
        for (i = 0; i < len; i++) {
            tempWaiting[i](i === 0);
        }
    },

    findStart: function GroupsContainer_findStart(itemsManager, group, itemIndex, counter) {
        var that = this;

        if (itemIndex > 0) {
            if (counter < WinJS.UI._FIND_GROUP_LOOP_THRESHOLD) {
                itemsManager.simplerItemAtIndex(--itemIndex, function (element) {
                    var item = {
                        data: element.msDataItem.dataObject,
                        key: element.msDataItem.key
                    };
                    var newGroupData = that.groupByFunction(item);
                    if (newGroupData.key !== group.userData.key) {
                        that.startFound(group, itemIndex + 1);
                    } else {
                        that.findStart(itemsManager, group, itemIndex, ++counter);
                    }
                });
            } else {
                group.startIndex = itemIndex;
                this.dirty = true;

                WinJS.UI._setTimeout(function () {
                    that.findStart(itemsManager, group, itemIndex, 0);
                }, 0);
            }
        } else {
            this.startFound(group, itemIndex);
        }
    },

    groupFromImpl: function GroupsContainer_groupFromImpl(fromGroup, toGroup, comp) {
        if (toGroup < fromGroup) {
            return null;
        }

        var center = fromGroup + Math.floor((toGroup - fromGroup) / 2),
            centerGroup = this.groups[center];
        if (comp(centerGroup, center)) {
            return this.groupFromImpl(fromGroup, center - 1, comp);
        } else if (center < toGroup && !comp(this.groups[center + 1], center + 1)) {
            return this.groupFromImpl(center + 1, toGroup, comp);
        } else {
            return center;
        }
    },

    groupFrom: function GroupsContainer_groupFrom(comp) {
        if (this.groups.length > 0) {
            var lastGroupIndex = this.groups.length - 1,
                lastGroup = this.groups[lastGroupIndex];
            if (!comp(lastGroup, lastGroupIndex)) {
                return lastGroupIndex;
            } else {
                return this.groupFromImpl(0, this.groups.length - 1, comp);
            }
        } else {
            return null;
        }
    },

    groupFromItem: function GroupsContainer_groupFromItem(itemIndex) {
        return this.groupFrom(function (group) {
            return itemIndex < group.startIndex;
        });
    },

    groupFromOffset: function GroupsContainer_groupFromOffset(offset) {
        return this.groupFrom(function (group, groupIndex) {
            return offset < group.offset;
        });
    },

    group: function GroupsContainer_getGroup(index) {
        return this.groups[index];
    },

    length: function GroupsContainer_length() {
        return this.groups.length;
    },

    renderGroup: function GroupsContainer_renderGroup(index) {
        var group = this.groups[index],
            element = this.site.groupRenderer ? this.site._headersPool.renderItem(group.userData) : null;
        return element;
    },

    setHeader: function GroupsContainer_setHeaders(index, element) {
        var group = this.groups[index];
        group.element = element;
    },

    removeGroups: function GroupsContainer_removeGroups() {
        this.groups = [];
        delete this.previousItem;
        delete this.pinnedItem;
        delete this.pinnedOffset;
        this.dirty = true;
    },

    resetGroups: function GroupsContainer_resetGroups(canvas) {
        for (var i = 0, len = this.groups.length; i < len; i++) {
            var group = this.groups[i];
            if (group.element) {
                canvas.removeChild(group.element);
            }
        }
        this.removeGroups();
    },

    rebuildGroups: function GroupsContainer_rebuildGroups(itemsManager, itemIndex, end, allGroupAddedCallback) {
        var that = this,
            counter = end - itemIndex;

        function itemAddedCallback() {
            if (--counter === 0) {
                allGroupAddedCallback();
            }
        }

        function addItemWrapper(itemsManager, itemIndex, callback) {
            itemsManager.simplerItemAtIndex(itemIndex, function (element) {
                that.addItem(itemsManager, itemIndex, element, callback);
            });
        }

        if (counter > 0) {
            if (itemIndex > 0) {
                // The first group always needs to be added
                counter++;
                addItemWrapper(itemsManager, 0, itemAddedCallback);
            }

            for (; itemIndex < end; itemIndex++) {
                addItemWrapper(itemsManager, itemIndex, itemAddedCallback);
            }
        } else {
            allGroupAddedCallback();
        }
    },

    pinItem: function GroupsContainer_pinItem(item, offset) {
        this.pinnedItem = item;
        this.pinnedOffset = offset;
        this.dirty = true;
    }
};

WinJS.UI._NoGroups = function () {
    this.groups = [{ startIndex: 0 }];
    this.dirty = true;

    this.rebuildGroups = function (itemsManager, begin, end, callback) {
        callback();
    };

    this.addItem = function (itemsManager, itemIndex, element, callback) {
        callback(null);
    };

    this.removeGroups = function () {
        this.groups = [{ startIndex: 0 }];
        delete this.previousItem;
        delete this.pinnedItem;
        delete this.pinnedOffset;
        this.dirty = true;
    };

    this.renderGroup = function () {
        return null;
    };
};

WinJS.UI._NoGroups.prototype = WinJS.UI._GroupsContainer.prototype;

})(this, WinJS);


WinJS.Namespace.define("WinJS.UI", {});

(function (global, WinJS, undefined) {

var utilities = WinJS.Utilities,
    Promise = WinJS.Promise,
    Animation = WinJS.UI.Animation,
    AnimationHelper = WinJS.UI._ListViewAnimationHelper;

function getDimension(element, property) {
    return WinJS.Utilities.convertToPixels(element, window.getComputedStyle(element, null)[property]);
}

function getMargins(element) {
    return {
        left: getDimension(element, "marginLeft"),
        right: getDimension(element, "marginRight"),
        top: getDimension(element, "marginTop")
    };
}

function emptyMargins() {
    return {
        left: 0,
        right: 0,
        top: 0
    };
}

function whenElementRendered(that, callback) {
    return function(element) {
        if (element.msRendererPromise) {
            // parent element and wait for it to render,
            // then we remove it and continue on... 
            var viewport = that._site.viewport;
            viewport.appendChild(element);
            element.msRendererPromise.then(function () { 
                viewport.removeChild(element);
                callback(element); 
            });
        } else {
            callback(element);
        }
    };
}

// This component is responsible for calculating items' positions in horizontal grid mode.
WinJS.Namespace.define("WinJS.UI", {
    Layout: WinJS.Class.define(function (options) {
    }),

    _LayoutCommon: WinJS.Class.derive(WinJS.UI.Layout, function (options) {
    }, {
        init: function () {
            this._trackedAnimation = null;
            this._cachedInserted = [];
            this._cachedRemoved = [];
            this._cachedItemRecords = {};
            this._items = {};
            this.reset();
            this._dummyGroup = {
                startIndex: 0,
                offset: 0
            };
        },

        setSite: function (layoutSite) {
            this._site = layoutSite;
        },

        reset: function () {
            this._measuring = null; 
            this._totalItemWidth = WinJS.UI._UNINITIALIZED;
            this._totalItemHeight = WinJS.UI._UNINITIALIZED;
            this._itemWidth = WinJS.UI._UNINITIALIZED;
            this._itemHeight = WinJS.UI._UNINITIALIZED;
            this._offsetWidth = WinJS.UI._UNINITIALIZED;
            this._offsetHeight = WinJS.UI._UNINITIALIZED;
            this._totalHeaderWidth = WinJS.UI._UNINITIALIZED;
            this._totalHeaderHeight = WinJS.UI._UNINITIALIZED;
            this._leadingMargins = this._leadingGroupMargins = this._headerMargins = {
                left: 0,
                right: 0,
                top: 0
            };
        },

        itemSize: {
            enumerable: true, 
            get: function () {
                return this._itemSize;
            },
            set: function (itemSize) {
                this._itemSize = itemSize;
                this._invalidateLayout();
            }
        },

        _invalidateLayout: function () {
            if (this._site) {
                this._site.invalidateLayout();
            }
        },

        _getSize: function () {
            if (this._totalItemWidth === WinJS.UI._UNINITIALIZED || this._totalItemHeight === WinJS.UI._UNINITIALIZED) {
                var size = (this._itemSize && typeof this._itemSize === "function" ? this._itemSize() : this._itemSize);
                this._totalItemWidth = this._itemWidth = this._offsetWidth = size.width;
                this._totalItemHeight = this._itemHeight = this._offsetHeight = size.height;
            }
        },

        _getItemWidth: function () {
            this._getSize();
            return this._itemWidth;
        },
        
        _getItemHeight: function () {
            this._getSize();
            return this._itemHeight;
        },
        
        _getTotalItemWidth: function () {
            this._getSize();
            return this._totalItemWidth;
        },

        _getTotalItemHeight: function (group) {
            this._getSize();
            return this._totalItemHeight;
        },

        _getItemInfo: function (index) {
            var cached = this._items[index];
            if (!cached) {
                this._items[index] = cached = {};
            }
            return cached;
        },

        _purgeItemCache: function (begin, end) {
            var keys = Object.keys(this._items)
            for (var i = 0, len = keys.length; i < len; i++) {
                var index = parseInt(keys[i], 10);
                if (index < begin || index >= end) {
                    delete this._items[index];
                }
            }
        },

        _addElements: function (element) {
            // This function clones element returned by itemAtIndex and adds them to viewport. 
            // Element is cloned in order to avoid changes to element stored in ItemsManager cache. 
            element = element.cloneNode(true);
            var secondElement = element.cloneNode(true);

            var viewport = this._site.viewport;
            // insertBefore is used here to make sure that this is the first element in the viewport and first-child selector is applied to it. 
            // first-child selector is used to configure the leading margin.
            viewport.insertBefore(element, viewport.firstChild);
            viewport.appendChild(secondElement);

            return [element, secondElement];
        },

        _addHeaders: function (header) {
            var headers = [];

            header.style.position = "absolute";
            utilities.addClass(header, WinJS.UI._headerClass);
            headers[0] = header;
            headers[1] = headers[0].cloneNode(true);

            var viewport = this._site.viewport;
            viewport.insertBefore(headers[0], viewport.firstChild);
            viewport.appendChild(headers[1]);

            return headers;
        },

        _measureHeaders: function (headers) {
            this._totalHeaderWidth = utilities.getTotalWidth(headers[1]);
            this._totalHeaderHeight = utilities.getTotalHeight(headers[1]);
            this._headerMargins = getMargins(headers[1]);

            this._leadingGroupMargins = getMargins(headers[0]);
            this._leadingGroupMargins.left -= this._headerMargins.left;
            this._leadingGroupMargins.right -= this._headerMargins.right;
            this._leadingGroupMargins.top -= this._headerMargins.top;
        },

        _noHeaders: function (headers) {
            this._totalHeaderWidth = this._totalHeaderHeight = 0;
            this._leadingGroupMargins = this._headerMargins = {
                left: 0,
                right: 0,
                top: 0
            };
        },

        _measureItemMargins: function (elements) {
            this._leadingMargins = getMargins(elements[0]);

            var margin = getMargins(elements[1]);
            this._leadingMargins.left -= margin.left;
            this._leadingMargins.right -= margin.right;
            this._leadingMargins.top -= margin.top;
        },

        _initialized: function () {
            return this._measuring;
         },

        _measureItem: function (element) {
            var itemWidth = utilities.getContentWidth(element),
                itemHeight = utilities.getContentHeight(element),
                totalItemWidth = utilities.getTotalWidth(element),
                totalItemHeight = utilities.getTotalHeight(element),
                offsetWidth = element.offsetWidth,
                offsetHeight = element.offsetHeight;
        
            if (totalItemWidth !== 0 && totalItemHeight !== 0) {
                this._itemWidth = itemWidth;
                this._itemHeight = itemHeight;
                this._totalItemWidth = totalItemWidth;
                this._totalItemHeight = totalItemHeight;
                this._offsetWidth = offsetWidth;
                this._offsetHeight = offsetHeight;
                return true;
            } else {
                return false;
            }
        },

        _removeElements: function (elements) {
            var viewport = this._site.viewport;
            for (var i = 0, len = elements.length; i < len; i++) {
                if (elements[i].parentNode === viewport) {
                    viewport.removeChild(elements[i]);
                }
            }
        },

        _measureItems: function (groupInfo) {
            if (!this._measuring) {
                var that = this;
                this._measuring = new Promise(function (complete) {
                    function computeSizeOfRendered(element) {
                        var elements = that._addElements(element),
                            headers = [],
                            newGroup;

                        function measure() {
                            if (groupInfo && groupInfo(newGroup ? newGroup : that._dummyGroup.userData).multiSize) {
                                that._rowHeight = groupInfo(newGroup ? newGroup : that._dummyGroup.userData).slotHeight;
                            } else {
                                if (!that._measureItem(elements[1])) {
                                    complete(false);
                                }
                            }

                            if (headers.length) {
                                that._measureHeaders(headers);
                                that._leadingMargins = emptyMargins();
                            } else {
                                that._measureItemMargins(elements);
                                that._leadingGroupMargins = emptyMargins();
                        
                                that._noHeaders();
                            }

                            that._removeElements(headers);
                            that._removeElements(elements);
                            complete(true);
                        }

                        if (that._site.groupByFunction && that._site.groupRenderer) {
                            var item = {
                                data: element.msDataItem.dataObject,
                                key: element.msDataItem.key
                            };
                            newGroup = that._site.groupByFunction(item);
                            var whenRenderer = whenElementRendered(that, function(header) {
                                headers = that._addHeaders(header);    
                                measure();
                            });
                            whenRenderer(that._site.groupRenderer(newGroup));
                        } else {
                            measure();
                        }
                    }
                    
                    that._site.itemsManager.simplerItemAtIndex(0, function (element) {
                        var callback = whenElementRendered(that, computeSizeOfRendered);
                        callback(element);
                    }); 
                }); 
            }
            return this._measuring;
        },

        _adjustDirection: function (direction) {
            if (this._site.rtl) {
                if (direction === WinJS.UI._LEFT) {
                    direction = WinJS.UI._RIGHT;
                } else if (direction === WinJS.UI._RIGHT) {
                    direction = WinJS.UI._LEFT;
                }
            }
            return direction;
        },

        _setZIndex: function (items, zIndex) {
            for (var i = 0, len = items.length; i < len; i++) {
                items[i].style.zIndex = zIndex;
            }
        },

        _dragBetweenLeave: function (items) {
            var that = this,
                filteredItems = items.filter(function (value) {
                    return !!value;
                });

            function done() {
                that._setZIndex(filteredItems, null);
            }
            Animation.dragBetweenLeave(filteredItems).then(done, done);
        },

        _dragBetweenEnter: function (items, offsets) {
            function fixOffset(offset) {
                return {
                    top: (offset.top || 0) + "px" ,
                    left: (offset.left || 0) + "px"
                };
            }
            
            var filteredItems = [],
                filteredOffsets = [];
            
            for (var i = 0, len = items.length; i < len; i++) {
                if (items[i]) {
                    filteredItems.push(items[i]);
                    filteredOffsets.push(fixOffset(offsets[i]));
                }
            }
            this._setZIndex(filteredItems, WinJS.UI._DRAG_BETWEEN_ZINDEX);
            Animation.dragBetweenEnter(filteredItems, filteredOffsets);
        },

        _dragTarget: function (start) {
            var affected = [],
                keys = Object.keys(this._items);

            for (var i = 0, len = keys.length; i < len; i++) {
                var element = this._items[parseInt(keys[i], 10)].element;
                if (element && element.parentNode === this._site.scrollableElement) {
                    affected.push(element);
                }
            }

            if (start) {
                Animation.dragSourceStart([], affected);
            } else {
                Animation.dragSourceEnd([], [], affected);
            }
        },

        getAdjacent: function (index, element, direction) {

            var scrollbarPos = this._site.scrollbarPos,
                viewportLength = this._site.viewportSize[this.horizontal ? "width" : "height"],
                offsetProp = this.horizontal ? "offsetWidth" : "offsetHeight",
                currentItemLength = (element ? element[offsetProp] : 0),
                that = this;

            if (direction === WinJS.UI._PAGEUP) {
                return new Promise(function (complete) {
                    that.calcFirstDisplayedItem(scrollbarPos, true).then(function (firstElementOnPage) {
                        if (index !== firstElementOnPage) {
                            complete(firstElementOnPage);
                        } else {
                            that.calcFirstDisplayedItem(Math.max(0, scrollbarPos - viewportLength + currentItemLength), false).then(function (newFocus) {
                                // This check is necessary for items that are larger than the viewport
                                complete(newFocus < index ? newFocus : index - 1);
                            });
                        }
                    });
                });
            } else {
                return new Promise(function (complete) {
                    that.calcLastDisplayedItem(scrollbarPos, viewportLength, true).then(function (lastElementOnPage) {
                        if (index !== lastElementOnPage) {
                            complete(lastElementOnPage);
                        } else {
                            that.calcLastDisplayedItem(scrollbarPos + viewportLength - currentItemLength, viewportLength, false).then(function (newFocus) {
                                // This check is necessary for items that are larger than the viewport
                                complete(newFocus > index ? newFocus : index + 1);
                            });
                        }
                    });
                });
            }
        }
    })
});

function FixedSizeDecorator() {
}

FixedSizeDecorator.prototype = {
    getGroupSize: function (layout, group, groupIndex, itemsCount) {
        return Math.ceil(itemsCount / layout._itemsPerColumn) * layout._getTotalItemWidth() + layout._headerSlot.cx + (groupIndex ? 0 : layout._leadingGroupMargin);
    },
    
    calcItemPosition: function (layout, group, groupIndex, index) {
        var coordinates = layout._indexToCoordinate(group ? index - group.startIndex : index),
            pos = {
                left: (group ? group.offset : 0) + layout._headerSlot.cx + (groupIndex ? 0 : layout._leadingGroupMargin) + coordinates.column * layout._getTotalItemWidth() + layout._leadingMargin,
                top: layout._headerSlot.cy + coordinates.row * layout._getTotalItemHeight(),
                contentWidth: layout._getItemWidth(),
                contentHeight:  layout._getItemHeight(),
                totalWidth: layout._getTotalItemWidth(),
                totalHeight: layout._getTotalItemHeight(),
                offsetWidth: layout._offsetWidth,
                offsetHeight: layout._offsetHeight
            };
        
        if (layout._rtl) {
            pos.left = layout._getCanvasWidth(layout._count) - pos.left - layout._getTotalItemWidth();
        }

        return WinJS._PerfMeasurement_Promise.wrap(pos);
    },

    itemOffset: function (layout, group, index) {
        var coordinates = layout._indexToCoordinate(index - group.startIndex);
        return coordinates.column * layout._getTotalItemWidth();
    },

    itemFromOffset: function (layout, group, groupIndex, offset, wholeItem, last) {
        if (wholeItem) {
            offset += (last ? -1 : 1) * (layout._getTotalItemWidth() - 1);
        }
        return (Math.max(0, Math.floor((offset - group.offset - layout._headerSlot.cx - layout._leadingMargin - (groupIndex ? 0 : layout._leadingGroupMargin)) / layout._getTotalItemWidth())) + last) * layout._itemsPerColumn - last;
    },

    getAdjacent: function (layout, group, groupSize, index, element, direction) {
        return new Promise(function (complete) {
            var currentColumn = Math.floor((index - group.startIndex) / layout._itemsPerColumn);
            
            switch (direction) {
            case WinJS.UI._UP:
                complete({ index: index - 1});
                break;
            case WinJS.UI._DOWN:
                complete({ index: index + 1});
                break;
            case WinJS.UI._LEFT:
                complete(currentColumn > 0 ? { index: index - layout._itemsPerColumn} : { group: -1});
                break;
            case WinJS.UI._RIGHT:
                var lastColumnOfGroup = Math.floor(groupSize / layout._itemsPerColumn);
                complete(currentColumn < lastColumnOfGroup ? { index: Math.min(index + layout._itemsPerColumn, group.startIndex + groupSize - 1)} : { group: 1});
                break;
            default:
                layout._super.getAdjacent.call(layout, index, element, direction).then(function (newIndex) {
                    complete({ index: newIndex});
                });
                break;
            }
        });
    }
};


function VariableSizeDecorator() {
    this.occupancyMap = [];
    this.lastAdded = 0;
    this.adding = {};
}

VariableSizeDecorator.prototype = {
    
    getGroupSize: function (layout, group, groupIndex, itemsCount) {
        var measuredItems = 0,
            groupInfo = layout._getGroupInfo(group);
        
        if (this.occupancyMap.length > 0 ) {
            measuredItems = Math.ceil((this.occupancyMap.length - 1) / layout._itemsPerColumn) * groupInfo.slotWidth;
            itemsCount -= this.occupancyMap[this.occupancyMap.length - 1].index + 1;
        } else {
            measuredItems = 0;
        }
        
        var otherItems = Math.ceil(itemsCount / layout._itemsPerColumn) * groupInfo.slotWidth + layout._headerSlot.cx + (groupIndex ? 0 : layout._leadingGroupMargin);

        return measuredItems + otherItems;
    },
    
    coordinateToIndex: function (layout, c, r) {
        return c * layout._itemsPerColumn + r;
    },

    markSlotAsFull: function (layout, index, itemEntry) {
        var coordinates = layout._indexToCoordinate(index);
        for (var r = coordinates.row, toRow = coordinates.row + itemEntry.rows; r < toRow; r++) {
            for (var c = coordinates.column, toColumn = coordinates.column + itemEntry.columns; c < toColumn; c++) {
                this.occupancyMap[this.coordinateToIndex(layout, c, r)] = itemEntry;
            }
        }
    },

    isSlotEmpty: function (layout, itemSize, row, column) {
        for (var r = row, toRow = row + itemSize.rows; r < toRow; r++) {
            for (var c = column, toColumn = column + itemSize.columns; c < toColumn; c++) {
                if ((r >= layout._itemsPerColumn) || (this.occupancyMap[this.coordinateToIndex(layout, c, r)] !== undefined)) {
                    return false;
                }
            }
        }
        return true;
    },

    findEmptySlot: function (layout, startIndex, itemSize, newColumn) {
        var coordinates = layout._indexToCoordinate(startIndex),
            startRow = coordinates.row,
            lastColumn = Math.floor((this.occupancyMap.length - 1) / layout._itemsPerColumn);

        if (newColumn) {
            for (var c = coordinates.column + 1; c <= lastColumn; c++) {
                if (this.isSlotEmpty(layout, itemSize, 0, c)) {
                    return this.coordinateToIndex(layout, c, 0);
                }
            }
        } else {
            for (var c = coordinates.column; c <= lastColumn; c++) {
                for (var r = startRow; r < layout._itemsPerColumn; r++) {
                    if (this.isSlotEmpty(layout, itemSize, r, c)) {
                        return this.coordinateToIndex(layout, c, r);
                    }
                }
                startRow = 0;
            }
        }

        return (lastColumn + 1) * layout._itemsPerColumn;
    },

    findItem: function (index) {
        for (var inMapIndex = index, len = this.occupancyMap.length; inMapIndex < len; inMapIndex++) {
            var entry = this.occupancyMap[inMapIndex];
            if (entry && entry.index === index) {
                return inMapIndex;
            }
        }
        return inMapIndex;
    },

    getItemSize: function (layout, group, element, index) {
        var added;

        utilities.addClass(element, WinJS.UI._itemClass);
        if (element.parentNode !== layout._site.scrollableElement) {
            added = true;
            layout._site.scrollableElement.appendChild(element);
        }

        var itemWidth = utilities.getContentWidth(element),
            itemHeight = utilities.getContentHeight(element),
            totalItemWidth = utilities.getTotalWidth(element),
            totalItemHeight = utilities.getTotalHeight(element),
            offsetWidth = element.offsetWidth,
            offsetHeight = element.offsetHeight;

        if (added) {
            layout._site.scrollableElement.removeChild(element);
        }

        var groupInfo = layout._getGroupInfo(group);
        return {
            index: index,
            contentWidth: itemWidth,
            contentHeight: itemHeight,
            offsetWidth: offsetWidth,
            offsetHeight: offsetHeight, 
            columns: Math.max(1, Math.ceil(totalItemWidth / groupInfo.slotWidth)),
            rows: Math.min(layout._itemsPerColumn, Math.max(1, Math.ceil(totalItemHeight / groupInfo.slotHeight)))
        };
    },

    addItemToMap: function (layout, group, index) {
        var that = this;

        function add(mapEntry, newColumn) {
            var inMapIndex = that.findEmptySlot(layout, that.lastAdded, mapEntry, newColumn);
            that.lastAdded = inMapIndex;
            that.markSlotAsFull(layout, inMapIndex, mapEntry);
            layout._site.groups.dirty = true;
            return inMapIndex;
        }

        return new Promise(function (complete) {
            var mapEntry, newColumn;

            if (layout._itemSize && typeof layout._itemSize === "function") {
                var size = layout._itemSize(group.startIndex + index);
                if (size.width && size.height) {
                    var groupInfo = layout._getGroupInfo(group);
                    mapEntry = {
                        index: index,
                        contentWidth: size.width,
                        contentHeight: size.height,
                        offsetWidth: size.width,
                        offsetHeight: size.width, 
                        columns: Math.max(1, Math.ceil(size.width / groupInfo.slotWidth)),
                        rows: Math.min(layout._itemsPerColumn, Math.max(1, Math.ceil(size.height / groupInfo.slotHeight)))
                    };
                }

                newColumn = size.newColumn;
            } 

            if (mapEntry) {
                var inMapIndex = add(mapEntry, newColumn);
                complete(inMapIndex);
            } else {
                function processElement(element) {
                    inMapIndex = add(that.getItemSize(layout, group, element, index), newColumn);
                    complete(inMapIndex);
                }
            
                layout._site.itemsManager.simplerItemAtIndex(group.startIndex + index, whenElementRendered(that, processElement));
            }
        });
    },

    ensureInMap: function (layout, group, index) {
        var that = this;
        if (!this.adding[index]) {
            this.adding[index] = new Promise(function (complete) {
                if (index > 0) {
                    that.ensureInMap(layout, group, index - 1).then(function () {
                        that.addItemToMap(layout, group, index).then(function (inMapIndex) {
                            complete(inMapIndex);
                        });
                    });
                } else {
                    that.addItemToMap(layout, group, index).then(function (inMapIndex) {
                        complete(inMapIndex);
                    });
                }
            });
        }
        return this.adding[index];
    },

    calcItemPosition: function (layout, group, groupIndex, index) {
        var that = this;
        return new Promise(function (complete) {
            that.ensureInMap(layout, group, index - group.startIndex).then( function (inMapIndex) {
                var groupInfo = layout._getGroupInfo(group),
                    itemEntry = that.occupancyMap[inMapIndex],
                    coordinates = layout._indexToCoordinate(inMapIndex),
                    pos = {
                        left: group.offset + layout._headerSlot.cx + (groupIndex ? 0 : layout._leadingGroupMargin) + coordinates.column * groupInfo.slotWidth + layout._leadingMargin,
                        top: layout._headerSlot.cy + coordinates.row * groupInfo.slotHeight,
                        contentWidth: itemEntry.contentWidth,
                        contentHeight: itemEntry.contentHeight, 
                        offsetWidth: itemEntry.offsetWidth,
                        offsetHeight: itemEntry.offsetHeight, 
                        totalWidth: itemEntry.columns * groupInfo.slotWidth,
                        totalHeight: itemEntry.rows * groupInfo.slotHeight 
                    };
                
                if (layout._rtl) {
                    pos.left = layout._getCanvasWidth(layout._count) - pos.left - pos.totalWidth;
                }

                complete(pos);
            });
        });
    },

    itemOffset: function (layout, group, index) {
        var inMapIndex = this.findItem(index - group.startIndex),
            coordinates = layout._indexToCoordinate(inMapIndex),
            groupInfo = layout._getGroupInfo(group);
        return coordinates.column * groupInfo.slotWidth;
    },


    itemFromOffset: function (layout, group, groupIndex, offset, wholeItem, last) {
        offset -= group.offset + layout._headerSlot.cx;
        
        var measuredWidth = 0,
            lastItem = 0,
            groupInfo = layout._getGroupInfo(group);
        
        if (this.occupancyMap.length > 0 ) {
            lastItem = this.occupancyMap[this.occupancyMap.length - 1].index;
            measuredWidth = Math.ceil((this.occupancyMap.length - 1) / layout._itemsPerColumn) * groupInfo.slotWidth;
            
            if (offset < measuredWidth) {
                var counter = layout._itemsPerColumn,
                    index = (Math.max(0, Math.floor(offset / groupInfo.slotWidth)) + last) * layout._itemsPerColumn - last;
                while (!this.occupancyMap[index] && counter-- > 0) {
                    index += (last > 0 ? -1 : 1);
                }
                return this.occupancyMap[index].index;
            } 
        } 
         
        return lastItem + (Math.max(0, Math.floor((offset - measuredWidth) / groupInfo.slotWidth)) + last) * layout._itemsPerColumn - last;
    },

    getAdjacent: function (layout, group, groupSize, index, element, direction) {
        var that = this;

        index -= group.startIndex;

        var newIndex, inMap, inMapIndex;
        if (this.lastAdjacent === index) {
            inMapIndex = this.lastInMapIndex;
        } else {
            inMapIndex = this.findItem(index);
        }

        do {
            var column = Math.floor(inMapIndex / layout._itemsPerColumn),
                row =  inMapIndex - column * layout._itemsPerColumn,
                lastColumn = Math.floor((this.occupancyMap.length - 1) / layout._itemsPerColumn),
                entry, 
                c;
            
            switch (direction) {
            case WinJS.UI._UP:
                if (row > 0) {
                    inMapIndex--;
                } else { 
                    inMapIndex = -1;
                    for (c = column - 1; c >=0 ; c--) {
                        entry = this.occupancyMap[this.coordinateToIndex(layout, c, row)];
                        if (!entry || entry.index !== index) {
                            inMapIndex = this.coordinateToIndex(layout, c + 1, row) - 1;
                            break;
                        }
                    }
                }
                break;
            case WinJS.UI._DOWN:
                if (row + 1 < layout._itemsPerColumn) {
                    inMapIndex++;
                } else { 
                    inMapIndex = this.occupancyMap.length;
                    for (c = column + 1; c <= lastColumn; c++) {
                        entry = this.occupancyMap[this.coordinateToIndex(layout, c, row)];
                        if (!entry || entry.index !== index) {
                            inMapIndex = this.coordinateToIndex(layout, c - 1, row) + 1;
                            break;
                        }
                    }
                }
                break;
            case WinJS.UI._LEFT:
                inMapIndex = (column > 0 ? inMapIndex - layout._itemsPerColumn : -1);
                break;
            case WinJS.UI._RIGHT:
                inMapIndex = (column < lastColumn ? Math.min(inMapIndex + layout._itemsPerColumn, this.occupancyMap.length - 1) : this.occupancyMap.length);
                break;
            }

            inMap = inMapIndex >= 0 && inMapIndex < this.occupancyMap.length;
            if (inMap) {
                newIndex = that.occupancyMap[inMapIndex] ? that.occupancyMap[inMapIndex].index : undefined;
            }
        
        } while (inMap && (index === newIndex || newIndex === undefined));

        this.lastAdjacent = newIndex;
        this.lastInMapIndex = inMapIndex;

        return Promise.wrap(inMap ? {index: group.startIndex + newIndex} : {group: inMapIndex < 0 ? -1 : 1} );
    }
};


WinJS.Namespace.define("WinJS.UI", {
    HeaderPosition: {
        left: "left",
        top: "top"
    },

    GridLayout: WinJS.Class.derive(WinJS.UI._LayoutCommon, function (options) {
        /// <summary locid="38">
        /// Constructs the GridLayout
        /// </summary>
        /// <param name="options" type="object" locid="39">
        /// The set of options to be applied initially to the GridLayout.
        /// </param>
        /// <returns type="WinJS.UI.GridLayout" locid="40">
        /// A GridLayout Object.
        /// </returns>
        this.init();
        this._groupHeaderPosition = WinJS.UI.HeaderPosition.left;
        this._groupInfo = null;
        WinJS.UI.setOptions(this, options);
    }, {
        horizontal: {
            enumerable: true, 
            get: function () {
                return true;
            }
        },

        /// <field type="String" locid="41">
        /// The position of group headers
        /// </field>
        groupHeaderPosition: {
            enumerable: true, 
            get: function () {
                return this._groupHeaderPosition;
            },
            set: function (position) {
                this._groupHeaderPosition = position;
                this._invalidateLayout();
            }
        },

        /// <field type="Function" locid="42">
        /// A callback function that returns a flag, representing whether a group has variable sized items
        /// </field>
        groupInfo: {
            enumerable: true, 
            get: function () {
                return this._groupInfo;
            },
            set: function (groupInfo) {
                this._groupInfo = groupInfo;
                this._invalidateLayout();
            }
        },

        /// <field type="Number" integer="true" locid="43">
        /// The maximum number of displayed rows
        /// </field>
        maxRows: {
            enumerable: true, 
            get: function () {
                return this._maxRows;
            },
            set: function (maxRows) {
                this._maxRows = maxRows;
                this._invalidateLayout();
            }
        },

        startLayout: function (from, to, count) {
            var that = this;
            this._headersMoved = [];
            return new Promise(function (complete) {
                if (count) {
                    that._measureItems(that._groupInfo).then(function (initalized) {
                        if (initalized) {
                            that._count = count;
                            that._rtl = that._site.rtl;
                            that._leadingMargin = that._leadingMargins[that._rtl ? "right" : "left"];
                            that._headerMargin = that._headerMargins[that._rtl ? "right" : "left"];
                            that._leadingGroupMargin = that._leadingGroupMargins[that._rtl ? "right" : "left"];
                            if (that._groupHeaderPosition === "top") {
                                that._headerSlot = {
                                    cx: that._headerMargin,
                                    cy: that._totalHeaderHeight
                                };
                            } else {
                                that._headerSlot = {
                                    cx: that._totalHeaderWidth,
                                    cy: 0
                                };
                            }
                        
                            that._itemsPerColumn = Math.floor((that._site.viewportSize.height - that._headerSlot.cy) / (that._rowHeight ? that._rowHeight : that._getTotalItemHeight()));
                            if (that._maxRows) {
                                that._itemsPerColumn = Math.min(that._itemsPerColumn, that._maxRows);
                            }
                            that._itemsPerColumn = Math.max(that._itemsPerColumn, 1);

                            that.calcFirstDisplayedItem(from, false).then(function (begin) {
                                that.calcLastDisplayedItem(from, to - from, false).then(function (last) {
                                    var end = last + 1;
                                    that._purgeItemCache(begin, end);                                    
                                    complete({
                                        begin: begin, 
                                        end: end 
                                    });
                                });
                            });
                        } else {
                            complete(null);
                        }
                    });
                } else {
                    complete({
                        begin: 0, 
                        end: 0 
                    });
                }
            });
        },

        _multiSize: function (group) {
            return this._groupInfo && this._getGroupInfo(group).multiSize;
        },

        _getGroupInfo: function (group) {
            return this._groupInfo(group.userData);
        },

        _getCanvasWidth: function (count) {
            var groupIndex = this._site.groups.length() - 1,
                lastGroup = this._getGroup(groupIndex);
            
            return lastGroup.offset + this._decorateGroup(lastGroup).getGroupSize(this, lastGroup, groupIndex, count - lastGroup.startIndex) + this._leadingMargin;
        },

        getScrollbarRange: function (count) {
            var that = this;
            return new Promise(function (complete, error) {
                if (that._initialized()) {
                    var firstGroup = that._getGroup(0);
                    complete({
                        begin: firstGroup.offset,
                        end: that._getCanvasWidth(count)
                    });        
                } else {
                    error(WinJS.UI._layoutNotInitialized);
                }
            });
        },

        getAdjacent: function (index, element, direction) {
            var that = this;
            return new Promise(function (complete) {
                
                var groupIndex = that._site.groups.groupFromItem(index),
                    group = that._site.groups.group(groupIndex);
                
                that._decorateGroup(group).getAdjacent(that, group, that._getItemsCount(group, groupIndex), index, element, that._adjustDirection(direction)).then(function (newPosition) {
                    if (newPosition.group) {
                        var newGroupIndex = groupIndex + newPosition.group,
                            newGroup = that._site.groups.group(newGroupIndex);
                        if (newGroupIndex < 0) {
                            complete(-1);
                        } else if (newGroupIndex >= that._site.groups.length()) {
                            complete(that._count);
                        } else if (newPosition.group < 0) {
                            complete(newGroup.startIndex + that._getItemsCount(newGroup,newGroupIndex) - 1);
                        } else {
                            complete(newGroup.startIndex);
                        }
                    } else {
                        complete(newPosition.index);
                    }
                });
            });
        },

        _indexToCoordinate: function (index) {
            var column = Math.floor(index / this._itemsPerColumn);
            return {
                column: column,
                row: index - column * this._itemsPerColumn
            };
        },

        _calcItemPosition: function (index, groupIndex) {
            this._updateOffsets();

            var that = this,
                group = this._getGroup(groupIndex);

            return this._decorateGroup(group).calcItemPosition(this, group, groupIndex, index);
        },

        prepareItem: function (itemIndex, element) {
            var style = element.style;
            style.position = "absolute";
        },

        layoutItem: function (itemIndex, element) {
            var that = this,
                groupIndex = this._site.groups.groupFromItem(itemIndex);

            this._calcItemPosition(itemIndex, groupIndex).then( function (itemPos) {
                var itemData = that._getItemInfo(itemIndex);
                
                if (itemData.left !== itemPos.left || itemData.top !== itemPos.top || element !== itemData.element) {

                    itemData.element = element;
                    itemData.left = itemPos.left;
                    itemData.top = itemPos.top;
                    var coordinates = that._indexToCoordinate(groupIndex >= 0 ? itemIndex - that._site.groups.group(groupIndex).startIndex : itemIndex);
                    itemData.row = coordinates.row;
                    itemData.column = coordinates.column;

                    if (!element._animating) {
                        var style = element.style;
                        style.left = itemPos.left + "px";
                        style.top = itemPos.top + "px";
                    }
                }
            });
        },

        layoutHeader: function (groupIndex, element) {
            this._updateOffsets();

            var group = this._site.groups.group(groupIndex),
            pos = {
                top: 0,
                left: group.offset
            };


            if (this._rtl) {
                pos.left = this._getCanvasWidth(this._count) - pos.left - this._totalHeaderWidth - (groupIndex ? 0 : this._leadingGroupMargin);
            }

            if (group.left !== pos.left || group.top !== pos.top) {
                if (this._animateEndLayout) {
                    this._headersMoved.push({element: element, left: pos.left, top: pos.top});
                } else {
                    var style = element.style;
                    style.position = "absolute";
                    style.left = pos.left + "px";
                    style.top = pos.top + "px";
                }

                group.left = pos.left;
                group.top = pos.top;
            }
        },

        endLayout: function () {
            if (!this._animateEndLayout) {
                return;
            }
            this._animateEndLayout = false;

            var affectedItems = {},
                firstNearbyItem, 
                lastNearbyItem, 
                that = this,
                scrollbarPos = this._site.scrollbarPos,
                viewportSize = this._site.viewportSize.width,
                firstPromise = this.calcFirstDisplayedItem(Math.max(0, scrollbarPos - viewportSize), false),
                lastPromise = this.calcLastDisplayedItem(scrollbarPos + viewportSize, viewportSize, false),
                groups = this._site.groups;
            
            firstPromise.then(function(first) {
                firstNearbyItem = first;
            });
            lastPromise.then(function(last) {
                lastNearbyItem = last;
            });
            WinJS.Promise.join([firstPromise, lastPromise]).then(function () {
                var variablySizedItemsFound = false,
                    itemData,
                    i, len;
                for (i = firstNearbyItem - 1, len = lastNearbyItem + 1; i < len; i++) {
                    var itemData = that._getItemInfo(i);
                    if (itemData && itemData.element) {
                        variablySizedItemsFound = variablySizedItemsFound || that._multiSize(groups.group(groups.groupFromItem(i)));
                        var itemRecord = that._cachedItemRecords[itemData.element.uniqueID];
                        if (itemRecord && (itemRecord.oldRow !== itemData.row || itemRecord.oldColumn !== itemData.column || itemRecord.oldLeft !== itemData.left || itemRecord.oldTop !== itemData.top)) {
                            itemRecord.element = itemData.element;
                            itemRecord.top = itemData.top;
                            itemRecord.left = itemData.left;
                            itemRecord.row = itemData.row;
                            itemRecord.column = itemData.column;

                            // The itemData object can be reused by the ListView, but item records are recreated every time a change happens. The stages
                            // need unchanging records to function properly, so we give it the itemRecord.
                            affectedItems[itemData.element.uniqueID] = itemRecord; 
                            itemData.element._animating = true;
                        } else {
                            if (!itemRecord) {
                                itemData.element.style.left = itemData.left + "px";
                                itemData.element.style.top = itemData.top + "px";
                            }
                        }
                    }
                }

                var insertedMap = {},
                    removedMap = {},
                    element;
                for (i = 0, len = that._cachedInserted.length; i < len; i++) {
                    element = that._cachedInserted[i];
                    element.style.opacity = 0;
                    insertedMap[element.uniqueID] = { element: element };
                }
                for (i = 0, len = that._cachedRemoved.length; i < len; i++) {
                    element = that._cachedRemoved[i];
                    removedMap[element] = { element: element };
                }

                if (variablySizedItemsFound) {
                    that._trackedAnimation = AnimationHelper.animateListFadeBetween(that._trackedAnimation, that._site.scrollableElement, affectedItems, insertedMap, removedMap, that._headersMoved);
                } else {
                    that._trackedAnimation = AnimationHelper.animateReflow(that._trackedAnimation, that._site.scrollableElement, affectedItems, insertedMap, removedMap, that._headersMoved);
                }

                function trackerDone() {
                    that._trackedAnimation = null;
                }
                that._trackedAnimation.getCompletionPromise().then(trackerDone, trackerDone);

                that._cachedInserted = [];
                that._cachedRemoved = [];
                that._headersMoved = [];
                that._cachedItemRecords = {};
            });
        },

        _groupFromOffset: function (offset) {
            this._updateOffsets();
            return this._site.groups.groupFromOffset(offset);
        },

        _getGroup: function (groupIndex) {
            var group = this._site.groups.group(groupIndex);
            return group ? group : this._dummyGroup;
        },

        _getItemsCount: function (group, groupIndex) {
            if (groupIndex + 1 < this._site.groups.length()) {
                return this._site.groups.group(groupIndex + 1).startIndex - group.startIndex;
            } else {
                return this._count - group.startIndex;
            }
        },

        calcFirstDisplayedItem: function (scrollbarPos, wholeItem) {
            var that = this;
            return new Promise(function (complete, error) {
                if (that._initialized()) {
                    var groupIndex = that._groupFromOffset(scrollbarPos);
                    if (that._count && typeof groupIndex === "number") {
                        var group = that._site.groups.group(groupIndex),
                            groupSize = that._getItemsCount(group, groupIndex),
                            startIndex = group.startIndex,
                            index = that._decorateGroup(group).itemFromOffset(that, group, groupIndex, scrollbarPos, wholeItem, 0);
                        complete(Math.min(startIndex + index, startIndex + groupSize));
                    } else {
                        complete(0);
                    }
                } else {
                    error(WinJS.UI._layoutNotInitialized);
                }
            });
        },

        calcLastDisplayedItem: function (scrollbarPos, viewportLength, wholeItem) {
            var that = this;
            return new Promise(function (complete, error) {
                if (that._initialized()) {
                    var offset = scrollbarPos + viewportLength - 1,
                        groupIndex = that._groupFromOffset(offset);
                    if (that._count && typeof groupIndex === "number") {
                        var group = that._site.groups.group(groupIndex),
                            groupSize = that._getItemsCount(group, groupIndex),
                            startIndex = group.startIndex,
                            groupOffset = group.offset;
                        if (offset - groupOffset >= that._headerSlot.cx) {
                            var index = that._decorateGroup(group).itemFromOffset(that, group, groupIndex, offset, wholeItem, 1);
                            complete(Math.min(startIndex + index, startIndex + groupSize));
                        } else {
                            complete(Math.max(0, startIndex - 1));
                        }
                    } else if (that._count) {
                        complete(Math.ceil(Math.max(0, offset - that._leadingGroupMargin - that._leadingMargin) / that._getTotalItemWidth()) * that._itemsPerColumn - 1);
                    } else {
                        complete(0);
                    }
                } else {
                    error(WinJS.UI._layoutNotInitialized);
                }
            });
        },

        hitTest: function (x, y) {
            if (this._count) {
                if (this._rtl) {
                    x = this._getCanvasWidth(this._count) - x;
                }
                var groups = this._site.groups;
                for (var i = 0, len = groups.length(); i < len; i++) {
                    if (x < groups.group(i).offset) {
                        break;
                    }
                }
                var groupIndex = i - 1,
                    group = groups.group(groupIndex),
                    groupSize = this._getItemsCount(group, groupIndex),
                    startIndex = group.startIndex,
                    index = this._decorateGroup(group).itemFromOffset(this, group, groupIndex, x, false, 0),
                    row = Math.min(this._itemsPerColumn - 1, Math.floor((y - this._headerSlot.cy) / this._getTotalItemHeight()));

                return Math.min(startIndex + index + row, startIndex + groupSize - 1);
            } else {
                return -1;
            }
        },

        dragEnter: function () {
            this._dragTarget(true);
        },

        dragLeave: function () {
            this._dragTarget(false);
        },
        
        dragOver: function (x, y) {
            var that = this;
            return new Promise(function (complete) {
                function firstRow(index) {
                    return that._itemsPerColumn > 1 && that._indexToCoordinate(index).row === 0;
                }

                function lastRow(index) {
                    return that._itemsPerColumn > 1 && that._indexToCoordinate(index).row === (that._itemsPerColumn - 1);
                }

                var itemIndex = that.hitTest(x,y);
                if (itemIndex !== -1) {
                    that.getItemPosition(itemIndex).then(function (itemPos) {
                        var center = itemPos.top + itemPos.totalHeight / 2,
                            secondHalf = (y >= center),
                            beforeIndex = (secondHalf ? itemIndex : itemIndex - 1),
                            afterIndex =  beforeIndex + 1;
                    
                        var beforeItem = (lastRow(beforeIndex) && !secondHalf ? null : that._getItemInfo(beforeIndex).element),
                            afterItem = (firstRow(afterIndex) && secondHalf ? null :  that._getItemInfo(afterIndex).element);

                        that._dragBetweenLeave([
                            that._beforeItem !== beforeItem ? that._beforeItem : null, 
                            that._afterItem !== afterItem ? that._afterItem : null
                        ]);

                        that._beforeItem = beforeItem;
                        that._afterItem = afterItem;

                        var offsets;
                        if (that._itemsPerColumn > 1) {
                            offsets = [{top: -WinJS.UI._DRAG_BETWEEN_OFFSET}, {top: WinJS.UI._DRAG_BETWEEN_OFFSET}];
                        } else {
                            offsets = [{left: -WinJS.UI._DRAG_BETWEEN_OFFSET}, {left: WinJS.UI._DRAG_BETWEEN_OFFSET}];
                        }

                        that._dragBetweenEnter([that._beforeItem, that._afterItem], offsets);

                        complete(afterIndex);
                    });
                } else {
                    complete(itemIndex);
                }
            });
        },

        dragEnd: function () {
            this._dragBetweenLeave([this._beforeItem, this._afterItem]);
        },

        getItemPosition: function (itemIndex) {
            var groupIndex = this._site.groups.groupFromItem(itemIndex);
            return this._calcItemPosition(itemIndex, groupIndex);
        },

        getItemOffset: function (itemIndex) {
            var that = this;
            return this.getItemPosition(itemIndex).then(function (pos) {
                that._site.groups.pinItem(itemIndex, pos);
                return {
                    begin: pos.left,
                    end: pos.left + pos.totalWidth
                };
            });
        },

        _decorateGroup: function (group) {
            if (!group.decorator) {
                group.decorator = this._multiSize(group) ? new VariableSizeDecorator() : new FixedSizeDecorator();
            }
            return group.decorator;
        },

        dataModified: function (inserted, removed, itemsMoved) {
            if (this._initialized() && (inserted.length > 0 || removed.length > 0 || itemsMoved)) {
                this._animateEndLayout = true;
                this._cachedItemRecords = {};
                this._cachedRemoved = removed;
                this._cachedInserted = inserted;
                var firstNearbyItem, 
                    lastNearbyItem, 
                    that = this,
                    viewportSize = this._site.viewportSize.width,
                    firstPromise = this.calcFirstDisplayedItem(Math.max(0, this._site.scrollbarPos - viewportSize), false),
                    lastPromise = this.calcLastDisplayedItem(this._site.scrollbarPos + viewportSize, viewportSize, false);
            
                firstPromise.then(function(first) {
                    firstNearbyItem = first;
                });
                lastPromise.then(function(last) {
                    lastNearbyItem = last;
                });
                WinJS.Promise.join([firstPromise, lastPromise]).then(function () {
                    for (var i = firstNearbyItem - 1; i < lastNearbyItem + 1; i++) {
                        var itemData = that._getItemInfo(i);
                        if (itemData && itemData.element) {
                            if (!that._cachedItemRecords[itemData.element.uniqueID]) {
                                that._cachedItemRecords[itemData.element.uniqueID] = {
                                    oldRow: itemData.row,
                                    oldColumn: itemData.column,
                                    oldLeft: itemData.left,
                                    oldTop: itemData.top
                                };
                            }
                        }
                    }

                    that._dummyGroup = {
                        startIndex: 0,
                        offset: 0
                    };
                });
            }
        },

        _updateOffsets: function () {
            if (this._site.groups.dirty) {
                var count = this._site.groups.length();

                if (count) {
                    var previousGroup;

                    for (var i = 0; i < count; i++) {
                        var group = this._site.groups.group(i);

                        if (previousGroup) {
                            var itemsCount = group.startIndex - previousGroup.startIndex;
                            group.offset = previousGroup.offset + this._decorateGroup(previousGroup).getGroupSize(this, previousGroup, i - 1, itemsCount);
                            group.absoluteOffset = group.offset;
                        } else {
                            group.offset = group.absoluteOffset = 0;
                        }

                        previousGroup = group;
                    }

                    if (this._site.groups.pinnedItem !== undefined) {
                        var pinnedGroupIndex = this._site.groups.groupFromItem(this._site.groups.pinnedItem),
                            pinnedGroup = this._site.groups.group(pinnedGroupIndex),
                            pinnedCoordinates = this._indexToCoordinate(this._site.groups.pinnedItem - pinnedGroup.startIndex),
                            pinnedGroupOffset = this._site.groups.pinnedOffset.left - this._headerSlot.cx - (pinnedGroupIndex ? 0 : this._leadingGroupMargin) - this._leadingMargin - this._decorateGroup(pinnedGroup).itemOffset(this, pinnedGroup, this._site.groups.pinnedItem),
                            correction = pinnedGroupOffset - pinnedGroup.offset;
                        
                        for (i = 0; i < count; i++) {
                            this._site.groups.group(i).offset += correction;
                        }
                    }
                }

                this._site.groups.dirty = false;
            }
        }
    })
});
})(this, WinJS);


WinJS.Namespace.define("WinJS.UI", {});

(function (global, WinJS, undefined) {

var utilities = WinJS.Utilities,
    Promise = WinJS.Promise;

// Incremental View doesn't use virtualization. It creates all the items immediately but it creates 
// only a small set of items - a chunk. By default there are 50 items in a chunk. When the user 
// scrolls to the last item the next chunk of items is created.
WinJS.Namespace.define("WinJS.UI", {
    _IncrementalView: function (viewSite) {
        this.site = viewSite;
        this.items = new WinJS.UI._ItemsContainer(viewSite);
        this.lastPageBegin = 0;
        this.lastItem = -1;
        this.loadingInProgress = false;
        this.realizePass = 1;
        this.pagesToLoad = WinJS.UI._DEFAULT_PAGES_TO_LOAD;
        this.pageLoadThreshold = WinJS.UI._DEFAULT_PAGE_LOAD_THRESHOLD;
        this.automaticallyLoadItems = true;
        this.dummyFirstChild = document.createElement("div");
        this.site._canvas.appendChild(this.dummyFirstChild);
        this.resetView();
        this.firstLayoutPass = true;
        this.viewReset = false;
    }
});
WinJS.UI._IncrementalView.prototype = {
    addItem: function IncrementalView_addItem(fragment, itemIndex, currentPass, finishCallback) {
        var that = this;

        this.site._itemsManager.simplerItemAtIndex(itemIndex, function (item) {
            function completeItemLayout(root) {         
                root.setAttribute("role", that.site._itemRole);
                root.tabIndex = 0;
             
                that.items.setItemAt(itemIndex, {
                    index: itemIndex,
                    element: item
                });

                that.site._layout.layoutItem(itemIndex, root);
                
                finishCallback();
            }

            function configure() {
                if (that.site._isSelected(itemIndex)) {
                    that.site._renderSelection(itemIndex, item, true, true).then(completeItemLayout);
                } else {
                    completeItemLayout(item);
                }
            }

            function nextItemSibling(element) {
                var curr = element.nextSibling;
                while (curr && !utilities.hasClass(curr, WinJS.UI._itemClass)) {
                    curr = curr.nextSibling;
                }
                return curr;
            }

            function insert(element, insertBefore) {
                if (that.realizePass === currentPass) {
                    if (insertBefore) {
                        fragment.insertBefore(element, insertBefore);
                    } else {
                        fragment.appendChild(element);
                    }

                    configure();
                } else {
                    finishCallback();
                }
            }

            if (item.parentNode !== fragment) {
                if (itemIndex === 0) {
                    insert(item);
                } else {
                    that.items.requestItem(itemIndex - 1).then(function (previousItem) {
                        insert(item, nextItemSibling(that.items.rootElement(previousItem)));
                    });
                }
            } else if (that.realizePass === currentPass) {
                configure();
            } else {
                finishCallback();
            }
        }, function () {
            finishCallback();
        });
    },

    realizeItems: function IncrementalView_realizeItem(fragment, begin, end, count, currentPass, finishCallback) {
        var that = this,
            counter = end - begin;

        this.hideProgressBar();

        function callCallback() {
            if (--counter === 0) {
                var newEnd = that.site._layout.endLayout();
                if (that.firstLayoutPass) {
                    that.site._animateListEntrance(!that.viewReset);
                }
                that.firstLayoutPass = false;
                if (newEnd) {
                    that.realizeItems(fragment, end, Math.min(count, newEnd), count, currentPass, finishCallback);
                } else {
                    finishCallback(end - 1);
                }
            }
        }

        if (counter !== 0) {
            for (var itemIndex = begin; itemIndex < end; itemIndex++) {
                var item = this.items.itemAt(itemIndex);
                if (!item) {
                    this.addItem(fragment, itemIndex, currentPass, callCallback);
                } else {
                    // Item already exists. Only position needs to be updated 
                    this.site._layout.layoutItem(itemIndex, this.items.rootElement(item));
                    callCallback();
                }
            }
        } else {
            finishCallback(end - 1);
        }
    },

    loadNextChunk: function IncrementalView_loadNextChunk(callback) {
        if (!this.loadingInProgress) {
            var that = this,
                currentPass = ++this.realizePass;

            this.loadingInProgress = true;

            function done() {
                that.loadingInProgress = false;
                callback();
            }
            
            this.site._itemsCount(function (count) {
                if (!that.destroyed && that.realizePass === currentPass) {
                    if (count > that.lastItem + 1) {
                        var viewportLength = that.site._getViewportLength();

                        that.site._layout.startLayout(0, that.pagesToLoad * viewportLength, count).then(function (range) {
                            if (range) {
                                var end = Math.min(count, range.end - range.begin + that.lastItem + 1),
                                    begin = that.lastItem + 1;

                                that.lastPageBegin = begin;
                                that.lastItem = end;

                                that.realizeItems(that.site._canvas, begin, end, count, currentPass, function (finalItem) {
                                    if (that.realizePass === currentPass) {
                                        that.lastItem = finalItem;
                                        that.updateScrollbar();
                                    }
                                    done();
                                });
                            } else {
                                done();
                            }
                        });
                    } else {
                        done();
                    }
                } else {
                    done();
                }
            });
        }
    },

    updateItems: function IncrementalView_updateItems(callback) {
        var that = this,
            currentPass = ++this.realizePass,
            scrollbarPos = this.site.scrollPosition,
            viewportLength = this.site._getViewportLength();

        this.site._itemsCount(function (count) {
            if (!that.destroyed && that.realizePass === currentPass) {
                if (count !== 0) {
                    that.site._layout.startLayout(0, scrollbarPos + viewportLength, that.lastItem + 1).then(function (range) {
                        if (range) { 
                            that.realizeItems(that.site._canvas, 0, that.lastItem + 1, count, currentPass, function (finalItem) {
                                if (that.realizePass === currentPass) {
                                    that.lastItem = finalItem;
                                    that.updateScrollbar();
                                }
                                callback();
                            });
                        } else {
                            callback();
                        }
                    });
                } else {
                    callback();
                }
            }
        });
    },

    download: function IncrementalView_download(action, callback) {
        var that = this;

        if (this.site._cachedCount === WinJS.UI._UNINITIALIZED || this.lastItem === WinJS.UI._UNINITIALIZED) {
            this.showProgressBar();
        }

        this.site._raiseViewLoading();
        action(function () {
            that.site._raiseViewComplete();
        });
    },

    loadNextPages: function IncrementalView_loadNextPages() {
        this.download(this.loadNextChunk.bind(this));
        this.checkProgressBarVisibility();
    },

    checkProgressBarVisibility: function IncrementalView_checkProgressBarVisibility() {
        var viewportLength = this.site._getViewportLength(),
            scrollBarPos = this.site.scrollPosition;

            if (this.site._cachedCount > this.lastItem + 1 && this.loadingInProgress &&
                scrollBarPos >= this.site._canvas[this.site._layout.horizontal ? "offsetWidth" : "offsetHeight"] - viewportLength) {
                this.showProgressBar(); 
            }
    },

    showProgressBar: function IncrementalView_showProgressBar() {
        var barX = "50%",
            barY = "50%",
            parent = this.site._element;
        if (this.lastItem !== WinJS.UI._UNINITIALIZED) {
            parent = this.site._canvas;
            var padding = WinJS.UI._INCREMENTAL_CANVAS_PADDING / 2;
            if (this.site._layout.horizontal) {
                barX = "calc(100% - " + padding + "px)";
            } else {
                barY = "calc(100% - " + padding + "px)";
            }
        }

        this.site._showProgressBar(parent, barX, barY);
    },

    hideProgressBar: function IncrementalView_hideProgressBar() {
        this.site._hideProgressBar();
    },

    scrollbarAtEnd: function IncrementalView_scrollbarAtEnd(scrollbarPos, scrollLength, viewportSize) {
        var viewportLength = this.site._getViewportLength(),
            last = this.items.rootElement(this.items.itemAt(this.lastItem)),
            lastOffset = 0;

        if (last) {
            lastOffset =  last[ this.site._layout.horizontal ? "offsetLeft" : "offsetTop"]; 
        }

        return (scrollbarPos + viewportLength) > (lastOffset - viewportLength * this.pageLoadThreshold);
    },

    finalItem: function IncrementalView_finalItem(callback) {
        callback(this.lastItem);
    },

    onScroll: function IncrementalView_onScroll(scrollbarPos, scrollLength, viewportSize) {
        this.checkProgressBarVisibility();
        if (this.scrollbarAtEnd(scrollbarPos, scrollLength, viewportSize) && this.automaticallyLoadItems) {
            this.download(this.loadNextChunk.bind(this));
        } else {
            this.site._raiseViewComplete();
        }
    },

    onResize: function IncrementalView_onResize(scrollbarPos, viewportSize) {
        this.download(this.updateItems.bind(this));
    },

    reset: function IncrementalView_reset() {
        var site = this.site;
        this.items.each(function (index, item) {
            site._resetMargins(item);
        });
        this.loadingInProgress = false;
        this.firstLayoutPass = true;
        this.viewReset = true;
        this.lastItem = -1;
        site._unsetFocusOnItem();
        this.items.removeItems();
        utilities.empty(site._canvas);
        site._canvas.appendChild(this.dummyFirstChild);
    },

    reload: function IncrementalView_reset(viewportSize) {
        this.reset();
        this.download(this.loadNextChunk.bind(this));
        this.site._setFocusOnItem(this.site._selection.getFocused());
    },

    resetView: function IncrementalView_resetView() {
        this.site.scrollPosition = 0;
    },

    refresh: function IncrementalView_refresh(scrollbarPos, scrollLength, viewportSize, newCount) {
        var that = this,
            end = Math.min(this.lastItem + 1, newCount);

        this.lastItem = end - 1;
        that.updateScrollbar();

        var canvas = this.site._canvas,
            items = this.items.itemData,
            keys = Object.keys(items);

        for (var i = 0, len = keys.length; i < len; i++) {
            var index = parseInt(keys[i], 10);
            if ((index < 0) || (index > that.lastItem)) {
                var item = this.items.rootElement(items[index].element);
                canvas.removeChild(item);
                delete items[index];
            }
        }

        this.download(function (callback) {
            that.updateItems(function () {
                if (that.scrollbarAtEnd(scrollbarPos, scrollLength, viewportSize) && (newCount > end) && that.automaticallyLoadItems) {
                    that.loadNextChunk(callback);
                } else {
                    callback(newCount);
                }
            });
        });
    },

    updateScrollbar: function IncrementalView_updateScrollbar() {
        var that = this;
        
        if (this.lastItem !== -1) {
            this.site._layout.getScrollbarRange(this.lastItem + 1).then(function (range) {
                that.site._setCanvasLength(range.end - range.begin + WinJS.UI._INCREMENTAL_CANVAS_PADDING);
            });
        } else {
            this.site._setCanvasLength(0);
        }
    },

    cleanUp: function IncrementalView_cleanUp() {
        var itemsManager = this.site._itemsManager;
        this.items.each(function (index, item) {
            itemsManager.releaseItem(item);
        });
        this.lastItem = -1;
        this.site._unsetFocusOnItem();
        this.items.removeItems();
        utilities.empty(this.site._canvas);
        this.destroyed = true;
    }
};

})(this, WinJS);


WinJS.Namespace.define("WinJS.UI", {});

(function (global, WinJS, undefined) {

var utilities = WinJS.Utilities,
    Promise = WinJS.Promise;

WinJS.Namespace.define("WinJS.UI", {
    _ItemsContainer: function (site) {
        this.site = site;
        this.itemData = {};
        this.dataIndexToLayoutIndex = {};
        this.waitingItemRequests = {};
        this.placeholders = {};
    }
});

WinJS.UI._ItemsContainer.prototype = {
    requestItem: function ItemsContainer_requestItem(itemIndex) {
        if (!this.waitingItemRequests[itemIndex]) {
            this.waitingItemRequests[itemIndex] = [];
        }

        var that = this;
        var promise = new Promise(function (complete, error) {
            if (that.itemData[itemIndex] && that.itemData[itemIndex].element) {
                complete(that.itemData[itemIndex].element);
            } else {
                that.waitingItemRequests[itemIndex].push(complete);
            }
        });

        return promise;
    },

    removeItems: function ItemsContainer_removeItems() {
        this.itemData = {};
        this.placeholders = {};
        this.waitingItemRequests = {};
    },
    
    setPlaceholderAt: function ItemsContainer_setPlaceholderAt(itemIndex, placeholder) {
        this.placeholders[itemIndex] = placeholder;
    },

    setItemAt: function ItemsContainer_setItemAt(itemIndex, itemData) {
        this.itemData[itemIndex] = itemData;
        if (this.waitingItemRequests[itemIndex]) {
            var requests = this.waitingItemRequests[itemIndex];
            for (var i = 0; i < requests.length; i++) {
                requests[i](itemData.element);
            }

            this.waitingItemRequests[itemIndex] = [];
        }
        if (this.placeholders[itemIndex]) {
            delete this.placeholders[itemIndex];
        }
    },

    itemAt: function ItemsContainer_itemAt(itemIndex) {
        var itemData = this.itemData[itemIndex];
        return itemData ? itemData.element : null;
    },

    itemDataAt: function ItemsContainer_itemDataAt(itemIndex) {
        return this.itemData[itemIndex];
    },

    rootElement: function ItemsContainer_rootElement(element) {
        if (element && element.parentNode && element.parentNode !== this.site._canvas) {
            return element.parentNode;
        } else {
            return element;
        }
    },

    itemFrom: function ItemsContainer_itemFrom(element) {
        while (element && element !== this.site._viewport && !element.msDataItem) {
            element = element.parentNode;
        }
        return element !== this.site._viewport ? element : null;
    },

    index: function ItemsContainer_index(element) {
        var item = this.itemFrom(element);
        if (item) {
            for (var index in this.itemData) {
                if (this.itemData[index].element === item) {
                    return parseInt(index, 10);
                }
            }
        }

        return WinJS.UI._INVALID_INDEX;
    },

    each: function ItemsContainer_each(callback) {
        for (var index in this.itemData) {
            if (this.itemData.hasOwnProperty(index)) {
                var itemData = this.itemData[index];
                callback(parseInt(index, 10), itemData.element, itemData);
            }
        }
    },

    setLayoutIndices: function ItemsContainer_setLayoutIndices(indices) {
        this.dataIndexToLayoutIndex = indices;
    },

    getLayoutIndex: function ItemsContainer_getLayoutIndex(dataIndex) {
        var layoutIndex = this.dataIndexToLayoutIndex[dataIndex];
        return layoutIndex === undefined ? dataIndex : layoutIndex;
    }
};
})(this, WinJS);


WinJS.Namespace.define("WinJS.UI", {});

(function (global, WinJS, undefined) {

var utilities = WinJS.Utilities,
    Promise = WinJS.Promise;

// Default renderer for Listview
function trivialHtmlRenderer(item) {
    if (utilities._isDOMElement(item.data)) {
        return item.data;
    }
    
    var data = item.data;
    if (data === undefined) {
        data = "undefined";
    } else if (data === null) {
        data = "null";
    } else if (typeof data === "object") {
        data = JSON.stringify(data);
    }

    var element = document.createElement("span");
    element.innerText = data.toString();
    return element;
}

WinJS.Namespace.define("WinJS.UI", {
    _ItemsPool: function (site, itemClass, selectionClass) {
        this.site = site;
        this.itemClass = itemClass;
        this.selectionClass = selectionClass;
        this.entries = [];
        this.canvas = site._canvas;
        this.renderer = trivialHtmlRenderer;
        this.release = null;
    }
});

WinJS.UI._ItemsPool.prototype = {
    setRenderer: function (newRenderer) {
        if (!newRenderer) {
            this.renderer = trivialHtmlRenderer;
        } else if (typeof newRenderer === "function") {
            this.renderer = newRenderer;
        } else if (typeof newRenderer === "object") {
            this.renderer = newRenderer.renderItem;
        }
    },

    renderItem: function (item) {
        var entry = this.getEntry(),
            recycledElement = entry ? entry.element : null;
        var newElement = this.renderer(item, recycledElement);
        if (newElement !== recycledElement) {
            utilities.addClass(newElement, this.itemClass);
            this.site._layout.prepareItem(item.index, newElement);
        } else {
            this.removeFromPool(entry); 
        }
        return newElement;
    },
    
    getEntry: function () {
        var len = this.entries.length;
        if (len) {
            var object = this.entries[len - 1]; 
            return { 
                element: object.element,
                data: object.data,
                display: object.display,
                index: len - 1
            };
        } else {
            return null;
        }
    },

    removeFromPool: function (entry) {
        if (this.selectionClass) {
            utilities.removeClass(entry.element, this.selectionClass);
        }
        if (entry.display) {
            entry.element.style.display = entry.style.display;
        }
        if (this.release) {
            this.release(entry.data, entry.element);
        }
        this.entries.splice(entry.index, 1);
    },

    addToPool: function (index, data, element) {
        this.entries.push({
            data: data,    
            element: element
        });
    },

    clear: function () {
        for (var i = 0, len = this.entries.length; i < len; i++) {
            var entry = this.entries[i];
            if (this.release) {
                this.release(entry.data, entry.element);
            }
            if (entry.element.parentNode === this.canvas) {
                this.canvas.removeChild(entry.element);
            }
        }
        this.entries = [];
    }
};

})(this, WinJS);


WinJS.Namespace.define("WinJS.UI", {});

(function (global, WinJS, undefined) {

var utilities = WinJS.Utilities,
    Promise = WinJS.Promise,
    AnimationHelper = WinJS.UI._ListViewAnimationHelper;

function ListLayout() {
    this._cachedItemRecords = {};
}

ListLayout.prototype = {
    getScrollbarRange: function (count) {
        var that = this;
        return new Promise(function (complete, error) {
            if (that._initialized()) {
                complete({
                    begin: 0,
                    end: count * that._totalItemHeight
                });        
            } else {
                error(WinJS.UI._layoutNotInitialized);
            }
        });
    },

    getItemPosition: function (itemIndex) {
        var pos = this._calcItemPosition(itemIndex);

        pos.contentWidth = this._width;
        pos.contentHeight = this._itemHeight;
        pos.totalWidth = this._site.viewportSize.width;
        pos.totalHeight = this._totalItemHeight;
        pos.offsetWidth = pos.totalWidth - (this._totalItemWidth - this._offsetWidth);
        pos.offsetHeight = this._offsetHeight;

        return Promise.wrap(pos);
    },

    getItemOffset: function (itemIndex) {
        return this.getItemPosition(itemIndex).then(function (pos) {
            return {
                begin: pos.top,
                end: pos.top + pos.totalHeight
            };
        });
    },

    startLayout: function (from, to, count) {
        var that = this;

        return new Promise(function (complete) {
            that._measureItems().then(function (initialized) {
                if (initialized) {    
                    var overhead = that._totalItemWidth - that._itemWidth;
                    that._width = that._site.viewportSize.width - overhead;

                    that.calcFirstDisplayedItem(from, false).then(function (begin) {
                        that.calcLastDisplayedItem(to, 0, false).then(function (last) {
                            var end = last + 1;
                            that._purgeItemCache(begin, end);                                    
                            complete({
                                begin: begin, 
                                end: end
                            });
                        });
                    });
                } else {
                    complete(null);
                }
            });
        });
    },

    prepareItem: function (itemIndex, element) {
        var style = element.style;
        style.position = "absolute";
    },

    layoutItem: function (itemIndex, element) {
        var itemPos = this._calcItemPosition(itemIndex),
            itemData = this._getItemInfo(itemIndex);

        if (itemData.top !== itemPos.top || itemData.width !== this._width || element !== itemData.element) {
            itemData.element = element;
            itemData.top = itemPos.top;
            itemData.width = this._width;

            var style = element.style;
            if (!element._animating) {
                style.left = "0px";
                style.top = itemPos.top + "px";
            }
            style.width = this._width + "px";
        }
    },

    layoutHeader: function (groupIndex, element) {
        element.style.display = "none";
    },

    dataModified: function (inserted, removed, itemsMoved) {
        if (this._initialized() && (inserted.length > 0 || removed.length > 0 || itemsMoved)) {
            this._animateEndLayout = true;
            this._cachedItemRecords = {};
            this._cachedRemoved = removed;
            this._cachedInserted = inserted;
            var firstNearbyItem, 
                lastNearbyItem, 
                that = this,
                viewportSize =  this._site.viewportSize.height,
                firstPromise = this.calcFirstDisplayedItem(Math.max(0, this._site.scrollbarPos - viewportSize), false),
                lastPromise = this.calcLastDisplayedItem(this._site.scrollbarPos + viewportSize, viewportSize, false);
            
            firstPromise.then(function(first) {
                firstNearbyItem = first;
            });
            lastPromise.then(function(last) {
                lastNearbyItem = last;
            });
            WinJS.Promise.join([firstPromise, lastPromise]).then(function () {
                that._animationStartIndex = firstNearbyItem;
                that._animationEndIndex = lastNearbyItem;
                for (var i = firstNearbyItem - 1; i <= lastNearbyItem; i++) {
                    var itemData = that._getItemInfo(i);
                    if (itemData && itemData.element) {
                        if (!that._cachedItemRecords[itemData.element.uniqueID]) {
                            that._cachedItemRecords[itemData.element.uniqueID] = {
                                oldLeft: itemData.left,
                                oldTop: itemData.top
                            };
                        }
                    }
                }
            });
        }
    },

    endLayout: function () {
        if (!this._animateEndLayout) {
            return;
        }
        this._animateEndLayout = false;

        var affectedItems = {},
            firstNearbyItem, 
            lastNearbyItem, 
            that = this,
            scrollbarPos = this._site.scrollbarPos,
            viewportSize = this._site.viewportSize.height,
            firstPromise = this.calcFirstDisplayedItem(Math.max(0, scrollbarPos - viewportSize), false),
            lastPromise = this.calcLastDisplayedItem(scrollbarPos + viewportSize, viewportSize, false);
            
        firstPromise.then(function(first) {
            firstNearbyItem = first;
        });
        lastPromise.then(function(last) {
            lastNearbyItem = last;
        });
        WinJS.Promise.join([firstPromise, lastPromise]).then(function () {
            var itemData,
                i, len;

            for (i = firstNearbyItem - 1; i < lastNearbyItem + 1; i++) {
                itemData = that._getItemInfo(i);
                if (itemData && itemData.element) {
                    var itemRecord = that._cachedItemRecords[itemData.element.uniqueID];
                    if (itemRecord && (itemRecord.oldLeft !== itemData.left || itemRecord.oldTop !== itemData.top)) {
                        itemRecord.element = itemData.element;
                        itemRecord.top = itemData.top;
                        itemRecord.left = itemData.left;
                        // The itemData object is reused by the ListView, but item records are recreated every time a change happens. The stages
                        // need unchanging records to function properly.
                        affectedItems[itemData.element.uniqueID] = itemRecord; 
                        itemData.element._animating = true;
                    } else {
                        if (!itemRecord) {
                            itemData.element.style.left = itemData.left + "px";
                            itemData.element.style.top = itemData.top + "px";
                        }
                    }
                }
            }

            var insertedMap = {},
                removedMap = {},
                element;
            for (i = 0, len = that._cachedInserted.length; i < len; i++) {
                element = that._cachedInserted[i];
                element.style.opacity = 0;
                insertedMap[element.uniqueID] = {element: element};
            }
            for (i = 0, len = that._cachedRemoved.length; i < len; i++) {
                element = that._cachedRemoved[i];
                removedMap[element] = {element: element};
            }

            that._trackedAnimation = AnimationHelper.animateListReflow(that._trackedAnimation, that._site.scrollableElement, affectedItems, insertedMap, removedMap);
            function trackerDone() {
                that._trackedAnimation = null;
            }
            that._trackedAnimation.getCompletionPromise().then(trackerDone, trackerDone);

            that._cachedInserted = [];
            that._cachedRemoved = [];
            that._cachedItemRecords = {};
        });
    },

    _calcItemPosition: function (index) {
        return {
            top: index * this._totalItemHeight,
            left: 0
        };
    },

    calcFirstDisplayedItem: function (scrollbarPos, wholeItem) {
        var that = this;
        return new Promise(function (complete, error) {
            if (that._initialized()) {
                complete(Math[wholeItem ? "ceil" : "floor"](scrollbarPos / that._totalItemHeight));
            } else {
                error(WinJS.UI._layoutNotInitialized);
            }
        });
    },

    calcLastDisplayedItem: function (scrollbarPos, viewportLength, wholeItem) {
        var that = this;
        return new Promise(function (complete, error) {
            if (that._initialized()) {
                complete(Math[wholeItem ? "floor" : "ceil"]((scrollbarPos + viewportLength) / that._totalItemHeight) - 1);
            } else {
                error(WinJS.UI._layoutNotInitialized);
            }
        });
    },

    hitTest: function (x, y) {
        return Math.floor(y / this._totalItemHeight);
    },

    dragEnter: function () {
        this._dragTarget(true);
    },

    dragLeave: function () {
        this._dragTarget(false);
    },
        
    dragOver: function (x, y) {
        var that = this;
        return new Promise(function (complete) {
            var itemIndex = that.hitTest(x,y);
            if (itemIndex !== -1) {
                that.getItemPosition(itemIndex).then(function (itemPos) {
                    that._dragBetweenLeave([that._beforeItem, that._afterItem]);

                    var center = itemPos.top + itemPos.totalHeight / 2,
                        secondHalf = (y >= center),
                        beforeIndex = (secondHalf ? itemIndex : itemIndex - 1),
                        afterIndex =  beforeIndex + 1;
                    
                    that._beforeItem = that._getItemInfo(beforeIndex).element;
                    that._afterItem = that._getItemInfo(afterIndex).element;

                    that._dragBetweenEnter([that._beforeItem, that._afterItem], [{
                        top: -WinJS.UI._DRAG_BETWEEN_OFFSET
                    }, {
                        top: WinJS.UI._DRAG_BETWEEN_OFFSET
                    }]);

                    complete(afterIndex);
                });
            } else {
                complete(itemIndex);
            }
        });
    },

    dragEnd: function () {
        this._dragBetweenLeave([this._beforeItem, this._afterItem]);
    }
};

function FlowLayout() {
}

FlowLayout.prototype = {
    startLayout: function (from, to, count) {
        this.to = to;

        var end;
        if (this.average) {
            end = Math.ceil((to - from) / this.average);
        } else {
            // This is the first call so an average height is not available. In this layout 10 items
            end = 10;
        }
        this.lastIndex = null;
        this.lastItem = null;
        return Promise.wrap({
            begin: 0,
            end: end
        });
    },

    prepareItem: function (itemIndex, element) {
        element.style.position = "relative";
    },

    layoutItem: function (itemIndex, element) {
        var itemData = this._getItemInfo(itemIndex);
        
        if (element !== itemData.element || itemData.width !== this._width) {
            itemData.element = element;
            itemData.width = this._width;

            element.style.width = this._width + "px";
        }

        this.lastIndex = itemIndex;
        this.lastItem = element;
    },

    layoutHeader: function (groupIndex, element) {
    },

    endLayout: function () {
        if (this._animateEndLayout) {
            this._animateEndLayout = false;

            AnimationHelper.animateListReflow(this._site.scrollableElement, [],  this._cachedInserted, []);
            this._cachedInserted = [];
        }

        var threshold = this._site.scrollbarPos + this.to,
            bottom = this.lastItem.offsetTop + this.lastItem.offsetHeight;
        this.average = bottom / (this.lastIndex + 1);
        if (bottom < threshold) {
            return this.lastIndex + Math.ceil((threshold - bottom) / this.average) + 1;
        } else {
            return null;
        }
    },

    calcFirstDisplayedItem: function (scrollbarPos, wholeItem) {
        var childNodes = this._site.scrollableElement.childNodes,
        ignoredNodesCount = 0;
        for (var i = 0, count = childNodes.length; i < count; i++) {
            var item = childNodes[i],
            offsetTop = item.offsetTop,
            bottom = offsetTop + item.offsetHeight;

            if (!utilities.hasClass(item, WinJS.UI._itemClass)) {
                ignoredNodesCount++;
            }

            if ((scrollbarPos >= offsetTop) && (scrollbarPos < bottom)) {
                var index = wholeItem && (scrollbarPos > offsetTop) ? i + 1 : i;
                return Promise.wrap(index - ignoredNodesCount);
            }
        }

        return Promise.wrap(-1);
    },

    calcLastDisplayedItem: function (scrollbarPos, viewportLength, wholeItem) {
        var bottomEdge = scrollbarPos + viewportLength,
            childNodes = this._site.scrollableElement.childNodes,
            ignoredNodesCount = 0;

        // It's necessary to iterate forward in calcLastDisplayedItem here because IncrementalMode adds
        // elements to the layout that aren't actually a part of the counted indices. 
        for (var i = 0, count = childNodes.length; i < count; i++) {
            var item = childNodes[i],
            offsetTop = item.offsetTop,
            bottom = offsetTop + item.offsetHeight;

            if (!utilities.hasClass(item, WinJS.UI._itemClass)) {
                ignoredNodesCount++;
            }

            if ((bottomEdge > offsetTop) && (bottomEdge <= bottom)) {
                var index = wholeItem && (bottomEdge < bottom) ? i - 1 : i;
                return Promise.wrap(index - ignoredNodesCount);
            }
        }
        return Promise.wrap(childNodes.length);
    },
        
    getItemPosition: function (itemIndex) {
        var itemData = this._getItemInfo(itemIndex),
            element = itemData.element;

        return Promise.wrap(element ? 
            {
                left: element.offsetLeft,
                top: element.offsetTop,
                contentWidth: utilities.getContentWidth(element), 
                contentHeight: utilities.getContentHeight(element),
                totalWidth: utilities.getTotalWidth(element),
                totalHeight: utilities.getTotalHeight(element),
                offsetWidth: element.offsetWidth,
                offsetHeight: element.offsetHeight
            } : 
            {
            });
    },

    getItemOffset: function (itemIndex) {
        var itemData = this._getItemInfo(itemIndex),
            element = itemData.element;

        return Promise.wrap({
            begin: element.offsetTop,
            end: element.offsetTop + utilities.getTotalHeight(element)
        });
    },

    getScrollbarRange: function (count) {
        return Promise.wrap({
            begin: 0,
            end: this.lastItem.offsetTop + this.lastItem.offsetHeight
        });
    },

    dataModified: function (inserted, removed, moved) {
        //  FlowLayout can only support inserted animations
        if (inserted && inserted.length > 0) {
            this._animateEndLayout = true;
            this._cachedInserted = inserted;
        }
    }
};

// This component is responsible for calculating items' positions in list mode. 
WinJS.Namespace.define("WinJS.UI", {
    ListLayout: WinJS.Class.derive(WinJS.UI._LayoutCommon, function (options) {
        /// <summary locid="44">
        /// Constructs the ListLayout
        /// </summary>
        /// <param name="options" type="object" locid="45">
        /// The set of options to be applied initially to the ListLayout.
        /// </param>
        /// <returns type="WinJS.UI.ListLayout" locid="46">
        /// A ListLayout Object.
        /// </returns>
        this.init();
    }, {
        horizontal: {
            enumerable: true, 
            get: function () {
                return false;
            }
        },

        getAdjacent: function (index, element, direction) {
            direction = this._adjustDirection(direction);

            var newIndex;
            switch (direction) {
            case WinJS.UI._UP:
            case WinJS.UI._LEFT: // TODO: evaluate whether or not left/right should go no where in flow layout, or to next/prev item
                newIndex = index - 1;
                break;
            case WinJS.UI._DOWN:
            case WinJS.UI._RIGHT:
                newIndex = index + 1;
                break;
            default:
                return this._super.getAdjacent.call(this, index, element, direction);
            }
            
            return Promise.wrap(newIndex);
        },

        setSite: function (layoutSite) {
            this._site = layoutSite;

            var worker = this._site.loadingBehavior === "incremental" ? new FlowLayout() : new ListLayout();
            for (var method in worker) {
                this[method] = worker[method];
            }
        }
    })
});

})(this, WinJS);


WinJS.Namespace.define("WinJS.UI", {});

(function (global, WinJS, undefined) {

var thisWinUI = WinJS.UI,
    utilities = WinJS.Utilities,
    Promise = WinJS.Promise,
    AnimationHelper = WinJS.UI._ListViewAnimationHelper;

// ListView implementation
var margins = ["marginLeft", "marginTop", "marginRight", "marginBottom"];
                        
function setMargins(elementStyle, marginsCache) {
    for (var i = 0, len = margins.length; i < len; i++) {
        var margin = margins[i];
        elementStyle[margin] = marginsCache[margin];
    }
}

function elementListViewHandler(eventName, caseSensitive, capture) {
    return {
        name: (caseSensitive ? eventName : eventName.toLowerCase()),
        handler: function (eventObject) {
            var that = WinJS.UI.getControl(eventObject.srcElement);
            if (that && that instanceof WinJS.UI.ListView) {
                that["_on" + eventName](eventObject);
            }
        },
        capture: capture
    };
}

function elementModeHandler(eventName, caseSensitive, capture) {
    return {
        capture: capture,
        name: (caseSensitive ? eventName : eventName.toLowerCase()),
        handler: function (eventObject) {
            var that = WinJS.UI.getControl(eventObject.srcElement);
            if (that && that instanceof WinJS.UI.ListView) {
                var currentMode = that._modes[that._modes.length - 1],
                                name = "on" + eventName;
                if (currentMode[name]) {
                    currentMode[name](eventObject);
                }
            }
        }
    };
}

var ZoomableView = WinJS.Class.define(function (listView) {
    // Constructor

    this._listView = listView;
}, {
    // Public methods

    getPanAxis: function () {
        return this._listView._getPanAxis();
    },

    configureForZoom: function (isZoomedOut, isCurrentView, triggerZoom, prefetchedPages) {
        this._listView._configureForZoom(isZoomedOut, isCurrentView, triggerZoom, prefetchedPages);
    },

    setCurrentItem: function (x, y) {
        this._listView._setCurrentItem(x, y);
    },

    getCurrentItem: function () {
        return this._listView._getCurrentItem();
    },

    beginZoom: function () {
        this._listView._beginZoom();
    },

    positionItem: function (item, position) {
        return this._listView._positionItem(item, position);
    },

    endZoom: function (isCurrentView) {
        this._listView._endZoom(isCurrentView);
    },

    handlePointer: function (pointerId) {
        this._listView._handlePointer(pointerId);
    }
});

WinJS.Namespace.defineWithParent(WinJS, "UI", {
    SelectionMode: {
        none: "none",
        single: "single",
        multi: "multi",
        extended: "extended"
    },
    Tap: {
        selectAndInvoke: "selectAndInvoke",
        invoke: "invoke",
        none: "none"
    },
    CrossSlide: {
        select: "select",
        none: "none"
    },
    /// <summary locid="47">
    /// The ListView control displays a list of items using either a grid or a list layout
    /// </summary>
    /// <htmlSnippet><![CDATA[<div data-win-control="WinJS.UI.ListView"></div>]]></htmlSnippet>
    /// <event name="iteminvoked" bubbles="true" locid="48">Raised when then user clicks on an item</event>
    /// <event name="selectionchanging" bubbles="true" locid="49">Raised before the selection is changed</event>
    /// <event name="selectionchanged" bubbles="true" locid="50">Raised after the selection has changed</event>
    /// <event name="dragitemsstart" bubbles="true" locid="51">Raised when the user starts dragging items</event>
    /// <event name="dragitems" bubbles="true" locid="52">Raised while the user is dragging items</event>
    /// <event name="dragitemsend" bubbles="true" locid="53">Raised when drag and drop ends</event>
    /// <event name="dragitemsenter" bubbles="true" locid="54">Raised when the user drags something over this ListView</event>
    /// <event name="dropitems" bubbles="true" locid="55">Raised when the user drops something over this ListView</event>
    /// <event name="readystatechanged" bubbles="true" locid="56">Raised when the ready state changes</event>
    /// <event name="itemscopy" locid="57">Raised when items are copied to the clipboard</event>
    /// <event name="itemspaste" locid="58">Raised when items are pasted from the clipboard</event>
    /// <event name="itemsdelete" locid="59">Raised when items are deleted</event>
    /// <part name="listView" class="win-listView" locid="60">The ListView itself</part>
    /// <part name="viewport" class="win-viewport" locid="61">The viewport</part>
    /// <part name="scrollable" class="win-scrollable" locid="62">The scrollable element</part>
    /// <part name="item" class="win-item" locid="63">An item</part>
    /// <part name="selection-background" class="win-selection-background" locid="64">The background of a selection checkmark</part>
    /// <part name="selection-checkmark" class="win-selection-checkmark" locid="65">A selection checkmark</part>
    /// <part name="groupHeader" class="win-groupHeader" locid="66">The header of a group</part>
    /// <part name="progressbar" class="win-progressbar" locid="67">The loading progressbar of ListView</part>
    /// <resource type="javascript" src="/winjs/js/base.js" shared="true" />
    /// <resource type="javascript" src="/winjs/js/ui.js" shared="true" />
    /// <resource type="javascript" src="/winjs/js/animations.js" shared="true" />
    /// <resource type="javascript" src="/winjs/js/uicollections.js" shared="true" />
    /// <resource type="css" src="/winjs/css/ui-dark.css" shared="true" />
    ListView: WinJS.Class.define(function (element, options) {
        /// <summary locid="68">
        /// Constructs the ListView
        /// </summary>
        /// <param name="element" domElement="true" locid="69">
        /// The DOM element to be associated with the ListView control.
        /// </param>
        /// <param name="options" type="object" locid="70">
        /// The set of options to be applied initially to the ListView control.
        /// </param>
        /// <returns type="WinJS.UI.ListView" locid="71">
        /// A ListView control.
        /// </returns>

        if (!element) {
            throw new Error(WinJS.UI._elementIsInvalid);
        }

        if (this === window || this === WinJS.UI) {
            var listView = WinJS.UI.getControl(element);
            if (listView) {
                return listView;
            } else {
                return new WinJS.UI.ListView(element, options);
            }
        }

        options = options || {};

        // Attaching JS control to DOM element
        WinJS.UI.setControl(element, this);

        this._insertedElements = {};
        this._element = element;
        this._startProperty = null;
        this._scrollProperty = null;
        this._scrollLength = null;
        this._scrolling = false;
        this._zooming = false;
        this._itemsManager = null;
        this._canvas = null;
        this._cachedCount = WinJS.UI._UNINITIALIZED;
        this._stateComplete = true;
        this._firstTimeDisplayed = true;
        this._lastScrollPosition = 0;
        this._notificationHandlers = [];
        this._viewportWidth = WinJS.UI._UNINITIALIZED;
        this._viewportHeight = WinJS.UI._UNINITIALIZED;
        var childElements = this._setupInternalTree();
        // The view needs to be initialized after the internal tree is setup, because the view uses the canvas node immediately to insert an element in its constructor
        this._view = new WinJS.UI._ScrollView(this);
        this._selection = new WinJS.UI._SelectionManager(this);
        this._tabManager = new WinJS.UI.TabContainer(this._viewport);
        this._itemsPool = new WinJS.UI._ItemsPool(this, WinJS.UI._itemClass, WinJS.UI._selectedClass);
        this._headersPool = new WinJS.UI._ItemsPool(this, WinJS.UI._headerClass);
        if (!options.dataSource) {
            this._dataSource = new WinJS.UI.ArrayDataSource(childElements, { compareByIdentity: true });
            this._usingChildNodes = true;
        } else {
            this._dataSource = options.dataSource;
            this._usingChildNodes = false;
        }
        this._selectionMode = WinJS.UI.SelectionMode.single;
        this._tap = WinJS.UI.Tap.selectAndInvoke;
        this._crossSlide = WinJS.UI.CrossSlide.select;
        this._modes = [new WinJS.UI._SelectionMode(this)];
        this._itemRole = "option";
        this._element.setAttribute("role", "listbox");
        this._element.tabIndex = -1;
        if (this._element.style.position !== "absolute" && this._element.style.position !== "relative") {
            this._element.style.position = "relative";
        }
        this._marginsPromise = null;
        this._reorder = false;
        this._editable = false;
        this._groups = new WinJS.UI._NoGroups();
        this._updateItemsManager();
        this._updateLayout(new WinJS.UI.GridLayout());
        this._attachEvents();
        WinJS.UI.setOptions(this, options);
        this._setDragHandler();

        if (this._refreshTimer) {
            clearTimeout(this._refreshTimer);
            this._refreshTimer = null;
        }

        this._view.reload(this._getViewportSize());
    }, {
        _refresh: function () {
            if (!this._refreshTimer) {
                var that = this;
                this._raiseViewLoading();
                this._view.reset();
                this._refreshTimer = WinJS.UI._setTimeout(function () {
                    function onRefresh () {
                        that._refreshTimer = null;
                        that._lastScrollPosition = 0;
                        that.scrollPosition = 0;
                        that._view.reload(that._getViewportSize());
                    }
                    if (that._firstTimeDisplayed) {
                        onRefresh();
                        that._firstTimeDisplayed = false;   
                    } else {
                        that._fadeOutCanvas(onRefresh);
                    }
                }, 0);
            }
        },

        // Public properties

        /// <field type="WinJS.UI.Layout" locid="72">
        /// The current layout of the ListView control
        /// </field>
        layout: {
            get: function () {
                return this._layout;
            },
            set: function (layoutObject) {
                this._updateLayout(layoutObject);
                this._updateItemsManager();
                this._refresh();
            }
        },

        /// <field type="Number" integer="true" locid="73">
        /// The number of pages to load when the user scrolls beyond the pagesLoadThreshold
        /// </field>
        pagesToLoad: {
            get: function () {
                return this._view.pagesToLoad;
            },
            set: function (newValue) {
                if ((typeof newValue === "number") && (newValue > 0)) {
                    if (this._view instanceof WinJS.UI._IncrementalView) {
                        this._view.pagesToLoad = newValue;
                        this._refresh();
                    }
                    return;
                }
                throw new Error(WinJS.UI._pagesToLoadIsInvalid);
            }
        },

        /// <field type="Number" integer="true" locid="74">
        /// A number representing a threshold, where the next set of pages is loaded
        /// </field>
        pageLoadThreshold: {
            get: function () {
                return this._view.pageLoadThreshold;
            },
            set: function (newValue) {
                if ((typeof newValue === "number") && (newValue > 0)) {
                    if (this._view instanceof WinJS.UI._IncrementalView) {
                        this._view.pageLoadThreshold = newValue;
                        this._refresh();
                    }
                    return;
                }
                throw new Error(WinJS.UI._pageLoadThresholdIsInvalid);
            }
        },

        /// <field type="object" locid="75">
        /// The data source that contains the groups
        /// </field>
        groupDataSource: {
            get: function () {
                return this._groupDataSource;
            },
            set: function (newValue) {
                this._groupDataSource = newValue;
                if (newValue && newValue._groupOf && newValue._groupOf()) {
                    this._groups = new WinJS.UI._GroupsContainer(this, newValue._groupOf());
                } else {
                    this._groups = new WinJS.UI._NoGroups();
                }
                this._layout.reset();
                this._refresh();
            }
        },

        /// <field type="Boolean" locid="76">
        /// Whether the next set of pages is automatically loaded when the user scrolls beyond pagesLoadThreshold
        /// </field>
        automaticallyLoadItems: {
            get: function () {
                return this._view.automaticallyLoadItems;
            },
            set: function (newValue) {
                if (typeof newValue === "boolean") {
                    if (this._view instanceof WinJS.UI._IncrementalView) {
                        this._view.automaticallyLoadItems = newValue;
                    }
                    return;
                }
                throw new Error(WinJS.UI._automaticallyLoadItemsIsInvalid);
            }
        },

        /// <field type="Boolean" locid="77">
        /// Determines whether pressing Ctrl+X, Ctrl+V and Delete key should cut, paste or delete items.
        /// </field>
        editable: {
            get: function () {
                return this._editable;
            },
            set: function (newValue) {
                if (typeof newValue === "boolean") {
                    this._editable = newValue;
                    return;
                }
            }
        },

        /// <field type="String" locid="78">
        /// Controls how items are loaded by the ListView
        /// </field>
        loadingBehavior: {
            get: function () {
                return (this._view instanceof WinJS.UI._IncrementalView) ? "incremental" : "randomaccess";  
            },
            set: function (newValue) {
                if (typeof newValue === "string") {
                    if (newValue.match(/^(incremental|randomaccess)$/)) {
                        if (this._view) {
                            this._view.cleanUp();
                        }

                        if (newValue === "incremental") {
                            this._view = new WinJS.UI._IncrementalView(this);
                        } else {
                            this._view = new WinJS.UI._ScrollView(this);
                        }

                        this._setLayoutSite();

                        this._refresh();

                        return;
                    }
                }
                throw new Error(WinJS.UI._loadingBehaviorIsInvalid);
            }
        },

        /// <field type="String" locid="79">
        /// Controls whether a single item, multiple items, or no items can be selected
        /// </field>
        selectionMode: {
            get: function () {
                return this._selectionMode;
            },
            set: function (newMode) {
                if (typeof newMode === "string") {
                    if (newMode.match(/^(none|single|multi|extended)$/)) {
                        this._selectionMode = newMode;
                        this._element.setAttribute("aria-multiselectable", this._multiSelection());
                        return;
                    }
                }
                throw new Error(WinJS.UI._modeIsInvalid);
            }
        },

        /// <field type="String" locid="80">
        /// Controls how the ListView reacts to tap or click
        /// </field>
        tap: {
            get: function () {
                return this._tap;
            },
            set: function (tap) {
                this._tap = tap;
            }
        },
        
        /// <field type="String" locid="81">
        /// Controls how the ListView reacts to the cross-slide gesture
        /// </field>
        crossSlide: {
            get: function () {
                return this._crossSlide;
            },
            set: function (crossSlide) {
                this._crossSlide = crossSlide;
            }
        },

        /// <field type="object" locid="82">
        /// The datasource that provides the ListView with items to display
        /// </field>
        dataSource: {
            get: function () {
                return this._itemsManager.dataSource;
            },
            set: function (newData) {
                this._usingChildNodes = false;
                this._dataSource = newData;
                this._updateItemsManager();
                this._refresh();
            }
        },

        /// <field locid="24">
        /// A function responsible for generating a tree of DOM elements to represent each item
        /// </field>
        itemRenderer: {
            get: function () {
                return this._itemsPool.renderer;
            },
            set: function (newRenderer) {
                this._itemsPool.setRenderer(newRenderer);
                if (this._marginsPromise) {
                    this._marginsPromise.cancel();
                    this._marginsPromise = null;
                }
                this._layout.reset();
                this._updateItemsManager();
                this._refresh();
            }
        },

        /// <field type="Function" locid="83">
        /// A function responsible for resetting an element before it can be reused
        /// </field>
        resetItem: {
            get: function () {
                return this._itemsPool.release;
            },
            set: function (release) {
                this._itemsPool.release = release;
            }
        },

        /// <field locid="84">
        /// A function responsible for generating a tree of DOM elements to represent each group header
        /// </field>
        groupRenderer: {
            get: function () {
                return this._headersPool.renderer;
            },
            set: function (newRenderer) {
                this._headersPool.setRenderer(newRenderer);
                this._layout.reset();
                this._refresh();
            }
        },

        /// <field type="Function" locid="85">
        /// A function responsible for resetting a group header element before it can be reused
        /// </field>
        resetGroup: {
            get: function () {
                return this._headersPool.release;
            },
            set: function (release) {
                this._headersPool.release = release;
            }
        },

        /// <field type="String" locid="86">
        /// The current state of the ListView
        /// </field>
        readyState: {
            get: function () {
                return this._stateComplete ? "complete" : "loading";
            }
        },

        /// <field type="Boolean" locid="87">
        /// Whether items can be reordered within this ListView
        /// </field>
        reorder: {
            get: function () {
                return this._reorder;
            },
            set: function (reorder) {
                this._reorder = reorder;
            }
        }, 

        /// <field type="Number" integter="true" locid="88">
        /// The distance between the leading edge of the ListView and the first item
        /// </field>
        scrollPosition: {
            get: function () {
                return this._viewport[this._scrollProperty];
            },
            set: function (newPosition) {
                this._viewport[this._scrollProperty] = newPosition;
            }
        }, 

        /// <field type="object" locid="89">
        /// An object representing the selected items
        /// </field>
        selection: {
            get: function () {
                return this._selection.get();
            },
            set: function (newSelection) {
                var ranges = new WinJS.UI.ListViewItems(newSelection);
                if (this._cachedCount !== WinJS.UI._UNINITIALIZED) {
                    for (var i = 0, count = ranges.length; i < count; i++) {
                        var range = ranges[i];
                        if ((range.begin < 0) || (range.end >= this._cachedCount)) {
                            throw new Error(WinJS.UI._itemIndexIsInvalid);
                        }
                    }
                }
                if (ranges.length > 0) {
                    var multi = ranges.length > 1 || ranges[0].begin !== ranges[0].end;
                    if (!this._selectionAllowed() || (multi && !this._multiSelection())) {
                        throw new Error(WinJS.UI._itemIndexIsInvalid);
                    }
                }
                this._selection.set(ranges);
            }
        },

        /// <field type="object" locid="90">
        /// Allows a ListView to be used in a SemanticZoom control
        /// </field>
        zoomableView: {
            get: function () {
                if (!this._zoomableView) {
                    this._zoomableView = new ZoomableView(this);
                }

                return this._zoomableView;
            }
        },

        // Public methods
        getElementAtIndex: function (itemIndex, itemOnly) {
            /// <summary locid="91">
            /// Returns the element representing the item at the specified index
            /// </summary>
            /// <param name="itemIndex" type="Number" integer="true" locid="92">
            /// The index of the item
            /// </param>
            /// <returns type="object" domElement="true" locid="93">
            /// The element used to display the specified item
            /// </returns>

            var items = this._view.items,
                item = items.itemAt(itemIndex);
            return itemOnly ? item : items.rootElement(item);
        },

        getIndexFromElement: function (element) {
            /// <summary locid="94">
            /// Returns the index of the item displayed by the specified element
            /// </summary>
            /// <param name="element" type="HTMLElement" domElement="true" locid="95">
            /// The element used to display the item
            /// </param>
            /// <returns type="Number" integer="true" locid="96">
            /// The index of item
            /// </returns>

            return this._view.items.index(element);
        },

        scrollTo: function ListView_scrollTo(itemIndex) {
            /// <summary locid="97">
            /// Scrolls the ListView so that the specified item is the displayed first
            /// </summary>
            /// <param name="itemIndex" type="Number" integer="true" locid="98">
            /// The index of the item to scroll to
            /// </param>

            this._raiseViewLoading(true);
            
            var that = this;
            this._layout.getItemOffset(itemIndex).then(function (range) {
                if (that.scrollPosition !== range.begin) {
                    that.scrollPosition = range.begin;
                } else {
                    that._raiseViewComplete();
                }
            });
        },

        ensureVisible: function ListView_ensureVisible(itemIndex) {
            /// <summary locid="99">
            /// Ensures that the specified item is visible, scrolling the ListView if necessary
            /// </summary>
            /// <param name="itemIndex" type="Number" integer="true" locid="100">
            /// The index of the item to scroll into view
            /// </param>

            this._raiseViewLoading(true);
            
            var that = this;
            this._layout.getItemOffset(itemIndex).then(function (range) {
                var left = that.scrollPosition,
                    right = left + that._getViewportLength(),
                    newPosition = that.scrollPosition;

                if (range.begin < left) {
                    newPosition = range.begin;
                } else if (range.end > right) {
                    newPosition = range.end - that._getViewportLength();
                }
                if (that.scrollPosition !== newPosition) {
                    that.scrollPosition = newPosition;
                } else {
                    that._raiseViewComplete();
                }
            });
        },

        firstVisible: function ListView_firstVisible() {
            /// <summary locid="101">
            /// Returns the index of the first visible item
            /// </summary>
            /// <returns type="WinJS.Promise" locid="102">
            /// A promise for the index of the first visible item
            /// </returns>
            return this._layout.calcFirstDisplayedItem(
                this.scrollPosition,
                false);
        },

        loadNextPages: function ListView_loadNextPages() {
            /// <summary locid="103">
            /// Loads the next set of pages, if in incremental loading mode.
            /// </summary>
            if (this._view instanceof WinJS.UI._IncrementalView) {
                this._view.loadNextPages();
            }
        },

        lastVisible: function ListView_lastVisible() {
            /// <summary locid="104">
            /// Returns the index of the last visible item
            /// </summary>
            /// <returns type="WinJS.Promise" locid="105">
            /// A promise for the index of the last visible item
            /// </returns>
            var that = this;
            return this._layout.calcLastDisplayedItem(this.scrollPosition, this._getViewportLength(), false).then(function (lastVisible) {
                    return Promise.wrap(Math.min(that._cachedCount - 1, lastVisible));
                });
        },

        addEventListener: function ListView_addEventListener(eventName, eventCallback, capture) {
            /// <summary locid="28">
            /// Adds an event listener
            /// </summary>
            /// <param name="eventName" type="String" locid="29">Event name</param>
            /// <param name="eventCallback" type="Function" locid="30">The event handler function to associate with this event</param>
            /// <param name="capture" type="Boolean" locid="31">Whether event handler should be called during the capturing phase</param>
            return this._element.addEventListener(eventName, eventCallback, capture);
        },

        removeEventListener: function ListView_removeEventListener(eventName, eventCallback, capture) {
            /// <summary locid="32">
            /// Removes an event listener
            /// </summary>
            /// <param name="eventName" type="String" locid="29">Event name</param>
            /// <param name="eventCallback" type="Function" locid="30">The event handler function to associate with this event</param>
            /// <param name="capture" type="Boolean" locid="106">Whether event handler should be called during capturing phase</param>
            return this._element.removeEventListener(eventName, eventCallback, capture);
        },

        refresh: function () {
            /// <summary locid="107">
            /// Forces the control to recreate its content
            /// </summary>
            this._layout.reset();
            this._view.reset();
            this._resizeViewport();
            
            var that = this;
            this._groups.rebuildGroups(this._itemsManager,
                Math.min(this._cachedCount, this._view.begin),
                Math.min(this._cachedCount, this._view.end),
                function () {
                    that._view.refresh(
                        that._lastScrollPosition,
                        that._viewport[that._scrollLength],
                        that._getViewportSize(),
                        that._cachedCount
                    );
            });

            if (this.scrollPosition !== this._lastScrollPosition) {
                this.scrollPosition = this._lastScrollPosition;
            }
        },

        dataObject: function ListView_dataObject(itemIndex, callback) {
            if ((itemIndex >= 0) && (itemIndex < this._cachedCount)) {
                var something = this._itemsManager.simplerItemAtIndex(itemIndex, function (element) {
                    callback.success(element.msDataItem.dataObject);
                });
                if (!something && callback.error) {
                    callback.error(WinJS.UI._itemIndexIsInvalid);
                }
            } else if (callback.error) {
                callback.error(WinJS.UI._itemIndexIsInvalid);
            }
        },

        group: function ListView_group(groupIndex) {
            return this._groups.group(groupIndex);
        },

        groupCount: function ListView_groupCount() {
            return this._groups.length();
        },

        // Private methods

        _setupInternalTree: function ListView_setupInternalTree() {
            
            utilities.addClass(this._element, WinJS.UI._listViewClass);
            utilities[this._rtl() ? "addClass" : "removeClass"](this._element, WinJS.UI._rtlListViewClass);

            var childElements = utilities.children(this._element).slice(0);
            utilities.empty(this._element);

            var viewportSize = this._getViewportSize();
            
            this._viewport = document.createElement("div");
            utilities.addClass(this._viewport, WinJS.UI._viewportClass);
            utilities.addClass(this._viewport, WinJS.UI._horizontalClass);
            var viewportStyle = this._viewport.style;
            viewportStyle.left = 0;
            viewportStyle.top = 0;
            viewportStyle.width = viewportSize.width + "px";
            viewportStyle.height = viewportSize.height + "px";
            this._element.appendChild(this._viewport);

            this._canvas = document.createElement("div");
            this._canvas.onselectstart = function () { return false; };
            utilities.addClass(this._canvas, WinJS.UI._scrollableClass);
            this._viewport.appendChild(this._canvas);

            this._progressBar = document.createElement("progress");
            utilities.addClass(this._progressBar, WinJS.UI._progressClass);
            this._progressBar.style.position = "absolute";
            this._progressBar.max = 100;

            // The keyboard event helper is a dummy node that allows us to keep getting keyboard events when a virtualized element
            // gets discarded. It has to be positioned in the center of the viewport, though, otherwise calling .focus() on it
            // can move our viewport around when we don't want it moved.
            this._keyboardEventsHelper = document.createElement("div");
            this._keyboardEventsHelper.style.position = "absolute";
            this._keyboardEventsHelper.style.left = "50%";
            this._keyboardEventsHelper.style.top = "50%";
            // This element will be skipped in the tab order if it doesn't have a background color. The element will still be invisible because of its 0px width+height
            this._keyboardEventsHelper.style.backgroundColor = "FF0000";
            this._element.appendChild(this._keyboardEventsHelper);

            return childElements;
        },

        _unsetFocusOnItem: function ListView_unsetFocusOnItem(newFocusExists) {
            if (!newFocusExists) {
                if (this._tabManager.childFocus) {
                    this._tabManager.childFocus = null;
                }

                this._keyboardEventsHelper._shouldHaveFocus = this._hasKeyboardFocus;
                if (this._hasKeyboardFocus) {
                    this._keyboardEventsHelper.tabIndex = 0;
                    this._keyboardEventsHelper.focus();
                }
            }
            this._itemFocused = false;
        },

        _setFocusOnItem: function ListView_setFocusOnItem(index) {
            if (this._focusRequest) {
                this._focusRequest.cancel();
            }
            var that = this;
            this._focusRequest = this._view.items.requestItem(index).then(function(item) {
                that._keyboardEventsHelper.tabIndex = -1;
                item = that._view.items.rootElement(item);

                if (that._tabManager.childFocus !== item) {
                    that._tabManager.childFocus = item;
                }
                that._focusRequest = null;
                if (that._hasKeyboardFocus && !that._itemFocused) {
                    // Some consumers of ListView listen for item invoked events and hide the listview when an item is clicked.
                    // Since keyboard interactions rely on async operations, sometimes an invoke event can be received before we get
                    // to item.setActive(), and the listview will be made invisible. If that happens and we call item.setActive(), an exception
                    // is raised for trying to focus on an invisible item. Checking visibility is non-trivial, so it's best
                    // just to catch the exception and ignore it.
                    try {
                        that._itemFocused = true;
                        item.setActive();
                    } catch (error) { }
                }
            });
        },

        _attachEvents: function ListView_attachEvents() {
            var that = this;
            
            function listViewHandler(eventName, caseSensitive, capture) {
                return {
                    name: (caseSensitive ? eventName : eventName.toLowerCase()),
                    handler: function (eventObject) {
                        that["_on" + eventName](eventObject);
                    },
                    capture: capture
                };
            }

            function modeHandler(eventName, caseSensitive, capture) {
                return {
                    capture: capture,
                    name: (caseSensitive ? eventName : eventName.toLowerCase()),
                    handler: function (eventObject) {
                        var currentMode = that._modes[that._modes.length - 1],
                            name = "on" + eventName;
                        if (currentMode[name]) {
                            currentMode[name](eventObject);
                        }
                    }
                };
            }

            var elementEvents = [
                elementListViewHandler("Resize"),
                elementListViewHandler("PropertyChange"),
                elementModeHandler("DragStart")
            ];

            // The resize event is not fired for element when addEventListener is used. Using attachEvent temporarily.
            elementEvents.forEach(function (elementEvent) {
                that._element.attachEvent("on" + elementEvent.name, elementEvent.handler);
            });

            // KeyDown handler needs to be added explicitly via addEventListener instead of using the above attachEvent.
            // If it's not added via addEventListener, the eventObject given to us on event does not have the functions stopPropagation() and preventDefault().
            var events = [
                modeHandler("MSPointerDown", true),
                modeHandler("MSPointerMove", true),
                modeHandler("MSPointerUp", true),
                modeHandler("MSPointerOver", true),
                modeHandler("MSPointerOut", true),
                modeHandler("MSLostPointerCapture", true)
            ];
            events.forEach(function (eventHandler) {
                that._canvas.addEventListener(eventHandler.name, eventHandler.handler, false);
            });
            
            // Focus and Blur events need to be handled during the capturing phase, they do not bubble.
            var elementEvents = [
                listViewHandler("Focus", false, true),
                listViewHandler("Blur", false, true),
                modeHandler("KeyDown")
            ];
            elementEvents.forEach(function (eventHandler) {
                that._element.addEventListener(eventHandler.name, eventHandler.handler, !!eventHandler.capture);
            });

            var viewportEvents = [
                listViewHandler("Scroll")
            ];

            viewportEvents.forEach(function (viewportEvent) {
                that._viewport.addEventListener(viewportEvent.name, viewportEvent.handler, false);
            });
        },

        _updateItemsManager: function ListView_updateItemsManager() {
            var that = this,
                notificationHandler = {
                    createUpdater: function ListView_createUpdater() {
                        if (!that._updater) {
                            var updater = {
                                oldCount: that._cachedCount,
                                changed: false,
                                elements: {},
                                placeholders: {},
                                selection: {},
                                removedElements: [],
                                oldFocus: WinJS.UI._INVALID_INDEX,
                                newFocus: WinJS.UI._INVALID_INDEX,
                                itemsMoved: false
                            };

                            that._view.items.each(function (index, item, itemData) {
                                updater.elements[item.uniqueID] = {
                                    item: item,
                                    root: that._view.items.rootElement(item),
                                    index: index,
                                    newIndex: index,
                                    display: itemData.display
                                };
                            });

                            var placeholders = that._view.items.placeholders,
                                keys = Object.keys(placeholders);
                            for (var i = 0, len = keys.length; i < len; i++) {
                                var index = parseInt(keys[i], 10),
                                    item = placeholders[index];
                                updater.placeholders[item.uniqueID] = {
                                    element: item,
                                    index: index,
                                    newIndex: index
                                };
                            }

                            var selection = that._selection.get().getAllIndices();
                            for (i = 0, len = selection.length; i < len; i++) {
                                updater.selection[selection[i]] = selection[i];
                            }
                            updater.oldFocus = that._selection.getFocused();
                            updater.newFocus = updater.oldFocus;

                            that._updater = updater;
                        }
                    },

                    // Following methods are used by ItemsManager
                    beginNotifications: function ListView_beginNotifications() {
                    },

                    changed: function ListView_changed(newItem, oldItem) {
                        this.createUpdater();


                        var elementInfo = that._updater.elements[oldItem.uniqueID];
                        if (elementInfo) {
                            that._canvas.removeChild(elementInfo.root);
                            delete that._updater.elements[oldItem.uniqueID];
                            that._updater.changed = true;
                        } else {
                            var placeholder = that._updater.placeholders[oldItem.uniqueID];
                            if (placeholder) {
                                that._updater.placeholders[oldItem.uniqueID].element = newItem;
                                that._updater.changed = true;
                            }
                        }
                        for (var i = 0, len = that._notificationHandlers.length; i < len; i++) {
                            that._notificationHandlers[i].changed(newItem, oldItem);
                        }
                    },

                    removed: function ListView_removed(item, mirage) {
                        this.createUpdater();

                        var index,
                            elementInfo = that._updater.elements[item.uniqueID];
                        if (elementInfo) {
                            index = elementInfo.index;
                            that._canvas.removeChild(elementInfo.root);
                            that._updater.removedElements.push(elementInfo.root);
                            delete that._updater.elements[item.uniqueID];
                        } else {
                            index = that._itemsManager.itemIndex(item);
                        }
                        
                        var callbacksMap = that._itemsManager.callbacksMap,
                            placeholderID = item.uniqueID,
                            callbacks = callbacksMap[placeholderID];
                        
                        if (callbacks) {
                            delete callbacksMap[placeholderID];
                            for (var i = 0, len = callbacks.length; i < len; i++) {
                                var unavailable = callbacks[i].unavailable;
                                if (unavailable) {
                                    unavailable();
                                }
                            }
                        }

                        var placeholder = that._updater.placeholders[item.uniqueID];
                        if (placeholder) {
                            delete that._updater.placeholders[item.uniqueID];
                        }

                        if (that._updater.oldFocus === index) {
                            that._updater.newFocus = index; // If index is too high, it'll be fixed in endNotifications
                            that._updater.focusedItemRemoved = true;
                        }

                        if (that._updater.selection[index] !== undefined) {
                            delete that._updater.selection[index];
                        }

                        that._updater.changed = true;
                    },

                    indexChanged: function ListView_indexChanged(item, newIndex, oldIndex) {
                        this.createUpdater();

                        var elementInfo = that._updater.elements[item.uniqueID];
                        if (elementInfo) {

                            elementInfo.newIndex = newIndex;
                            that._updater.changed = true;
                        }
                        that._updater.itemsMoved = true;
                        var placeholder = that._updater.placeholders[item.uniqueID];
                        if (placeholder) {
                            placeholder.newIndex = newIndex;
                            that._updater.changed = true;
                        }
                        if (that._updater.oldFocus === oldIndex) {
                            that._updater.newFocus = newIndex;
                            that._updater.changed = true;
                        }
                        if (that._updater.selection[oldIndex] !== undefined) {
                            that._updater.selection[oldIndex] = newIndex;
                            that._updater.changed = true;
                        }
                    },

                    endNotifications: function ListView_endNotifications() {
                        var updater = that._updater;
                        that._updater = null;

                        if (updater && updater.changed) {
                            var inserted = [],
                                keys = Object.keys(that._insertedElements);
                            for (var i = 0, len = keys.length; i < len; i++) {
                                if (!that._itemsManager.isPlaceholder(that._insertedElements[keys[i]])) {
                                    inserted.push(that._insertedElements[keys[i]]);
                                    delete that._insertedElements[keys[i]];
                                }
                            }
                            that._layout.dataModified(inserted, updater.removedElements, updater.itemsMoved);
                            that._view.items.setLayoutIndices({});

                            that._element[WinJS.UI._DRAG_TARGET_EXPANDO].onDataChanged();

                            if (that._currentMode().onDataChanged) {
                                that._currentMode().onDataChanged();
                            }

                            var newSelection = [];
                            for (var i in updater.selection) {
                                if (updater.selection.hasOwnProperty(i)) {
                                    newSelection.push(updater.selection[i]);
                                }
                            }
                            that._selection.selected._set(newSelection);
                            updater.newFocus = Math.min(that._cachedCount - 1, updater.newFocus);
                            that._selection.setFocused(updater.newFocus);

                            var newItems = {};
                            for (i in updater.elements) {
                                if (updater.elements.hasOwnProperty(i)) {
                                    var elementInfo = updater.elements[i];
                                    newItems[elementInfo.newIndex] = { 
                                        element: elementInfo.item,
                                        display: elementInfo.display
                                    };
                                }
                            }
                            that._view.items.itemData = newItems;

                            var newPlaceholders = {};
                            for (i in updater.placeholders) {
                                if (updater.placeholders.hasOwnProperty(i)) {
                                    var placeholder = updater.placeholders[i];
                                    newPlaceholders[placeholder.newIndex] = placeholder.element;
                                }
                            }
                            that._view.items.placeholders = newPlaceholders;

                            that._groups.resetGroups(that._canvas);
                            that._groups.rebuildGroups(that._itemsManager,
                                Math.min(that._cachedCount, that._view.begin),
                                Math.min(that._cachedCount, that._view.end),
                                function () {
                                    that._view.refresh(
                                        that.scrollPosition,
                                        that._viewport[that._scrollLength],
                                        that._getViewportSize(),
                                        that._cachedCount);
                                }
                            );

                            if (updater.focusedItemRemoved) {
                                that._itemFocused = false;
                                that._setFocusOnItem(that._selection.getFocused());
                            }
                        }
                    },

                    itemAvailable: function ListView_itemAvailable(item, placeholder) {
                        var callbacksMap = that._itemsManager.callbacksMap,
                            placeholderID = placeholder.uniqueID,
                            callbacks = callbacksMap[placeholderID],
                            index = that._itemsManager.itemIndex(item);

                        if (that._view.items.placeholders[index]) {
                            delete that._view.items.placeholders[index];
                        }
                                                
                        if (that._insertedElements[placeholder.uniqueID]) {
                            delete that._insertedElements[placeholder.uniqueID];
                            if (that._updater && that._updater.changed) {
                                that._insertedElements[item.uniqueID] = item;
                            } else {
                                // TODO: Remove this when async renderer is done. This is a workaround for an issue with inserted items in the current model.
                                // When we get itemInserted notifications, generally the item we're given is a placeholder. Animations are done in the updater cycle,
                                // but when inserted items are placeholders dataModified can't pass the right inserted item to the layout during endNotifications,
                                // and so the inserted item won't be animated when it's realized. The inserted item will be realized later via itemAvailable, and
                                // by then it's too late to animate in the layout. So, we've got this workaround here to animate the item.
                                item.style.opacity = 0.0;
                                AnimationHelper.animateItemAdded(item, (index !== that._cachedCount - 1));
                            }
                        }

                        if (callbacks) {
                            delete callbacksMap[placeholderID];
                            for (var i = 0, len = callbacks.length; i < len; i++) {
                                callbacks[i].available(item, placeholder);
                            }
                        }

                        if (that._updater && that._updater.placeholders[placeholder.uniqueID]) {
                            delete that._updater.placeholders[placeholder.uniqueID];
                        }
                    },

                    inserted: function ListView_inserted(item, previous, next) {
                        this.createUpdater();
                        item.style.opacity = 0;
                        that._insertedElements[item.uniqueID] = item;
                        that._updater.changed = true;
                    },

                    moved: function ListView_moved(item, previous, next) {
                        this.createUpdater();
                        that._updater.itemsMoved = true;
                    },

                    countChanged: function ListView_countChanged(newCount, oldCount) {
                        that._cachedCount = newCount;
                    }
                };

            if (this._itemsManager) {
                this._itemsManager._elementNotificationHandler = {
                    changed: function () {},
                    removed: function () {},
                    indexChanged: function () {},
                    endNotifications: function () {},
                    itemAvailable: function () {},
                    inserted: function () {},
                    moved: function () {},
                    countChanged: function () {}
                };
            }

            this._cachedCount = WinJS.UI._UNINITIALIZED;
            this._itemsManager = thisWinUI.createItemsManager(this._dataSource, function (item) {return that._itemsPool.renderItem(item);}, notificationHandler, {
                ownerElement: this._element
            });
            this._itemsManager.callbacksMap = {};
            this._itemsManager.simplerItemAtIndex = function (index, itemAvailable, itemUnavailable, placeholderAvailable) {
                var something = this.itemAtIndex(index);
                if (something) {
                    if (!this.isPlaceholder(something)) {
                        itemAvailable(something);
                    } else {
                        var placeholderID = something.uniqueID,
                            callbacks = this.callbacksMap[placeholderID],
                            newCallback = { 
                                available: itemAvailable,
                                unavailable: itemUnavailable
                            };
                        if (!callbacks) {
                            this.callbacksMap[placeholderID] = callbacks = [newCallback];
                        } else {
                            callbacks.push(newCallback);
                        }
                    
                        if (placeholderAvailable) {
                            placeholderAvailable(something);
                        }
                    }
                } else if (itemUnavailable) {
                    itemUnavailable();
                }
                return something;
            };
        },

        _registerNotificationHandler: function (handler) {
            this._notificationHandlers.push(handler);     
        },
        
        _unregisterNotificationHandler: function (handler) {
            for (var i = 0, len = this._notificationHandlers.length; i < len; i++) {
                if (this._notificationHandlers[i] === handler) {
                    this._notificationHandlers.splice(i, 1);
                    break;
                }
            }
        },

        _setLayoutSite: function () {
            var that = this,
                layoutSite = Object.create({
                invalidateLayout : function () {
                    that._view.refresh(
                        that.scrollPosition,
                        that._element[that._scrollLength],
                        that._getViewportSize(),
                        that._cachedCount);
                }
                }, {
                itemsManager: {
                    enumerable: true, 
                    get: function () { 
                        return that._itemsManager;
                    }
                }, 
                rtl: {
                    enumerable: true, 
                    get: function () { 
                        return that._rtl();
                    }
                }, 
                scrollableElement: {
                    enumerable: true, 
                    get: function () { 
                        return that._canvas;
                    }
                }, 
                viewport: {
                    enumerable: true, 
                    get: function () { 
                        return that._viewport;
                    }
                }, 
                groupByFunction: {
                    enumerable: true, 
                    get: function () { 
                        return that._groups.groupByFunction;
                    }
                }, 
                groupRenderer: {
                    enumerable: true, 
                    get: function () { 
                        return that.groupRenderer;
                    }
                }, 
                groups: {
                    enumerable: true, 
                    get: function () { 
                        return that._groups;
                    }
                },
                scrollbarPos: {
                    enumerable: true, 
                    get: function () { 
                        return that.scrollPosition;
                    }
                },
                viewportSize: {
                    enumerable: true, 
                    get: function () { 
                        return that._getViewportSize();
                    }
                },
                loadingBehavior: {
                    enumerable: true, 
                    get: function () { 
                        return that.loadingBehavior;
                    }
                }
            });

            this._layout.setSite(layoutSite);
        },

        _updateLayout: function ListView_updateLayout(layoutObject) {
            if (layoutObject && typeof layoutObject.type === "function") {
                this._layout = new layoutObject.type(layoutObject);
            } else if (layoutObject && layoutObject.setSite) {
                this._layout = layoutObject;
            } else {
                this._layout = new WinJS.UI.GridLayout(layoutObject);
            }

            this._selection.setFocused(0);
            this._unsetFocusOnItem();
            this._setFocusOnItem(0);
            this._setLayoutSite();

            if (this._layout.horizontal) {
                this._startProperty = "left";
                this._scrollProperty = "scrollLeft";
                this._scrollLength = "scrollWidth";
                utilities.addClass(this._viewport, WinJS.UI._horizontalClass);
                utilities.removeClass(this._viewport, WinJS.UI._verticalClass);
                this._element.scrollTop = 0;
            } else {
                this._startProperty = "top";
                this._scrollProperty = "scrollTop";
                this._scrollLength = "scrollHeight";
                utilities.addClass(this._viewport, WinJS.UI._verticalClass);
                utilities.removeClass(this._viewport, WinJS.UI._horizontalClass);
                this._element.scrollLeft = 0;
            }
        },

        _pushMode: function ListView_pushMode(newMode) {
            this._modes.push(newMode);
        },

        _currentMode: function ListView_currentMode() {
            return this._modes[this._modes.length - 1];
        },

        _popMode: function ListView_popMode() {
            this._modes.pop();
        },

        _resizeViewport: function ListView_resizeViewport() {
            this._viewportWidth = WinJS.UI._UNINITIALIZED;
            this._viewportHeight = WinJS.UI._UNINITIALIZED;

            var viewportSize = this._getViewportSize(),
                viewportStyle = this._viewport.style;
            viewportStyle.width = viewportSize.width + "px";
            viewportStyle.height = viewportSize.height + "px";
        },

        _onResize: function ListView_onResize() {
            msSetImmediate((function() {
                if ((this._previousWidth !== this._element.offsetWidth) ||
                    (this._previousHeight !== this._element.offsetHeight)) {
                    this._previousWidth = this._element.offsetWidth;
                    this._previousHeight = this._element.offsetHeight;

                    this._resizeViewport();

                    this._raiseViewLoading();
                    this._view.onResize(this.scrollPosition, this._getViewportSize());
                }
            }).bind(this));
        },

        _onFocus: function ListView_onFocus(event) {
            this._hasKeyboardFocus = true;
            var that = this;
            function moveFocusToItem() {
                that._changeFocus(that._selection.getFocused());
            }
            // The keyboardEventsHelper object can get focus through two ways: We give it focus explicitly, in which case _shouldHaveFocus will be true,
            // or the item that should be focused isn't in the viewport, so keyboard focus could only go to our helper. In the second case, we want to navigate
            // back to the focused item via changeFocus().
            if (event.srcElement === this._keyboardEventsHelper) {
                if (!this._keyboardEventsHelper._shouldHaveFocus) {
                    moveFocusToItem();
                } else {
                    this._keyboardEventsHelper._shouldHaveFocus = false;
                }
            } else if (event.srcElement === this._element) {
                // If someone explicitly calls .focus() on the listview element, we need to route focus to the item that should be focused
                moveFocusToItem();
            } else {
                this._keyboardEventsHelper.tabIndex = -1;
                // In the event that .focus() is explicitly called on an element, we need to figure out what item got focus and set our state appropriately.
                var curr = event.srcElement;
                while (curr && curr !== this._element) {
                    if (curr.parentNode === this._canvas) {
                        if (this._tabManager.childFocus !== curr) {
                            var index = this._view.items.index(curr);
                            if (index >= 0) {
                                this._selection.setFocused(index);
                                this._tabManager.childFocus = curr;
                            }
                        }
                        break;
                    }

                    curr = curr.parentNode;
                }
            }
        },

        _onBlur: function ListView_onBlur() {
            this._hasKeyboardFocus = false;
            this._itemFocused = false;

            if (this._focusRequest) {
                // If we're losing focus and we had an outstanding focus request, that means the focused item isn't realized. To enable the user to tab back
                // into the listview, we'll make the keyboardEventsHelper tabbable for this scenario.
                this._keyboardEventsHelper.tabIndex = 0;
            }
        },

        _pendingScroll: false,
        
        _onScroll: function ListView_onScroll() {
            if (!this._zooming && !this._pendingScroll) {
                this._pendingScroll = true;
        
                var that = this;
                setTimeout(function () {
                    if (that.scrollPosition !== that._lastScrollPosition) {
                        that._lastScrollPosition = that.scrollPosition;
                        that._raiseViewLoading(true);
                        that._view.onScroll(
                            that._lastScrollPosition,
                            that._viewport[that._scrollLength],
                            that._getViewportSize());
                    }
                    that._pendingScroll = false;
                }, 16);
            }
        },

        _onPropertyChange: function ListView_onPropertyChange() {
            if ((event.propertyName === "dir") || (event.propertyName === "style.direction")) {
                utilities[this._rtl() ? "addClass" : "removeClass"](this._element, WinJS.UI._rtlListViewClass);
                
                this._lastScrollPosition = 0;
                this.scrollPosition = 0;
                this._view.reload(this._getViewportSize());
            }
        },

        // Methods in the site interface used by ScrollView
        _getViewportSize: function ListView_getViewportSize() {
            if (this._viewportWidth === WinJS.UI._UNINITIALIZED || this._viewportHeight === WinJS.UI._UNINITIALIZED) {
                this._viewportWidth = utilities.getContentWidth(this._element);
                this._viewportHeight = utilities.getContentHeight(this._element);
            }
            return {
                width: this._viewportWidth,
                height: this._viewportHeight
            };
        },

        _itemsCount: function ListView_itemsCount(callback) {
            if (this._cachedCount !== WinJS.UI._UNINITIALIZED) {
                callback(this._cachedCount);
            } else {
                var that = this,
                    itemsManager = this._itemsManager;
                itemsManager.dataSource.getCount().then(function (count) {
                    if (itemsManager === that._itemsManager) {
                        that._cachedCount = count;
                        callback(count);
                    }
                });
            }
        },

        _isSelected: function ListView_isSelected(index) {
            return this._selection.isSelected(index);
        },

        _raiseViewLoading: function ListView_raiseViewLoading(scrolling) {
            if (this._stateComplete) {
                this._scrolling = !!scrolling;
            }
            this._setViewState(false, null);            
        },

        _raiseViewComplete: function ListView_raiseViewComplete(addedItems, addedHeaders) {
            var detail = {
                scrolling: this._scrolling
            };
            if (addedItems) {
                detail.addedItems = addedItems;
            }
            if (addedHeaders) {
                detail.addedHeaders = addedHeaders;
            }
            this._setViewState(true, detail);            
        },

        _setViewState: function ListView_setViewState(complete, detail) {
            if (complete !== this._stateComplete) {
                this._stateComplete = complete;
                var eventObject = document.createEvent("CustomEvent");
                eventObject.initCustomEvent("readystatechanged", true, false, detail);
                this._element.dispatchEvent(eventObject);
            }
        },

        _selectionRenderer: function ListView_selectionRenderer(element) {
            var wrapper = document.createElement("div");
            wrapper.style.display = "block";

            var elem = document.createElement("div");
            wrapper.appendChild(elem);

            wrapper.appendChild(element);
            
            elem = document.createElement("div");
            elem.className = WinJS.UI._selectionBackgroundClass;
            wrapper.appendChild(elem);

            elem = document.createElement("div");
            elem.className = WinJS.UI._selectionCheckmarkClass;
            elem.innerText = WinJS.UI._SELECTION_CHECKMARK;
            wrapper.appendChild(elem);

            return wrapper;
        },

        _getItemMargins: function ListView_getItemMargins() {
            if (!this._marginsPromise) {
                var that = this;
                this._marginsPromise = new Promise(function (complete) {
                    that._itemsManager.simplerItemAtIndex(0, function (element) {
                        var computed = {},
                            inline = {},
                            elementStyle = element.style;

                        for (var i = 0, len = margins.length; i < len; i++) {
                            var margin = margins[i];
                            computed[margin] = window.getComputedStyle(element, null)[margin];
                            inline[margin] = elementStyle[margin];
                        }

                        complete({
                            computed: computed,
                            inline: inline
                        });
                    }); 
                });
            }
            return this._marginsPromise;
        },

        // Methods used by SelectionManager
        _renderSelection: function ListView_renderSelection(index, element, selected, aria) {
            var that = this;
            return new Promise(function (complete) {
                that._layout.getItemPosition(index).then(function (pos) {
                    that._getItemMargins().then(function (margins) {
                        var root, 
                            next, 
                            elementStyle,
                            rootStyle;

                        function copyAriaAttributes(target, source) {
                            if (aria) {
                                var attributes = ["role", "aria-setsize", "aria-posinset", "aria-flowto"];
                                for (var i = 0, len = attributes.length; i < len; i++) {
                                    var name = attributes[i];
                                    target.setAttribute(name, source.getAttribute(name));
                                    source.removeAttribute(name);
                                }
                            }
                        }

                        if (selected) {
                            next = element.nextElementSibling;
                        
                            elementStyle = element.style;
                            elementStyle.left = elementStyle.top = 0;
                            elementStyle.position = "absolute";
                            if (that._flowLayout()) {
                                elementStyle.width = elementStyle.height = "100%";
                            }
                        
                            element.msMarginCache = margins.inline;
                            elementStyle.margin = 0;

                            utilities.removeClass(element, WinJS.UI._itemClass);
                            utilities.removeClass(element, WinJS.UI._hoverClass);
                        
                            root = that._selectionRenderer(element);
                        
                            root.id = element.id;
                            element.id = "";

                            copyAriaAttributes(root, element);
                            utilities.addClass(root, WinJS.UI._itemClass);

                            rootStyle = root.style;
                            rootStyle.width = pos.offsetWidth + "px";
                            rootStyle.height = pos.offsetHeight + "px";
                        
                            setMargins(rootStyle, margins.computed);
                        } else {
                            elementStyle = element.style;
                            if (that._flowLayout()) {
                                elementStyle.left = elementStyle.top = elementStyle.width = elementStyle.height = null;
                            } else {
                                elementStyle.width = pos.contentWidth + "px";
                                elementStyle.height = pos.contentHeight + "px";
                            }
                            utilities.addClass(element, WinJS.UI._itemClass);

                            var wrapper = that._view.items.rootElement(element);
                            next = wrapper.nextElementSibling;
                            element.id = wrapper.id;
                            wrapper.id = "";

                            copyAriaAttributes(element, wrapper);
                        
                            setMargins(elementStyle, element.msMarginCache);
                            element.msMarginCache = null;
                        
                            that._canvas.removeChild(wrapper);

                            root = element;
                            rootStyle = root.style;
                        }

                        if (!that._flowLayout()) {
                            rootStyle.left = pos.left + "px";
                            rootStyle.top = pos.top + "px";
                        }

                        utilities[selected ? "addClass" : "removeClass"](root, WinJS.UI._selectedClass);
                        if (aria) {
                            var attr = "aria-selected";
                            if (root !== element) {
                                element.removeAttribute(attr);
                            }
                            root.setAttribute(attr, selected);
                        }

                        that._canvas.insertBefore(root, next);
                        that._layout.prepareItem(index, root);

                        complete(root);            
                    });
                });
            });
        },

        _updateSelection: function ListView_updateSelection() {
            var that = this;
            this._view.items.each(function (index, element) {
                var selected = that._selection.isSelected(index),
                    root = that._view.items.rootElement(element),
                    wasSelected = (root !== element);
                if (selected !== wasSelected) {
                    that._renderSelection(index, element, selected, true);
                }
            });
        },

        _flowLayout: function ListView__flowLayout() {
            return this._view instanceof WinJS.UI._IncrementalView && this._layout instanceof WinJS.UI.ListLayout;
        },

        _getViewportLength: function ListView_getViewportLength() {
            return this._getViewportSize()[this._horizontal() ? "width" : "height"];
        },

        _setCanvasLength: function (length) {
            var style = this._canvas.style,
                viewportSize = this._getViewportSize();
            
            if (this._horizontal()) {
                style.width = length + "px";
                style.height = viewportSize.height + "px";
            } else {
                style.width = viewportSize.width + "px";
                style.height = length + "px";
            }
        },
        
        _horizontal: function ListView_horizontal() {
            return this._scrollProperty === "scrollLeft";
        },

        _setDragHandler: function ListView_setDragHandler() {
            this._element[WinJS.UI._DRAG_TARGET_EXPANDO] = new WinJS.UI._DragTargetHandler(this);
        },

        _dragSupported: function ListView_dragSupported() {
            return this._view instanceof WinJS.UI._ScrollView;
        },

        _rtl: function ListView_rtl() {
            return window.getComputedStyle(this._element, null).direction === "rtl";
        },

        _showProgressBar: function ListView_showProgressBar(parent, x, y) {
            if (WinJS.UI._PerfMeasurement_disableProgressBar) {
                return;
            }

            var progressBar = this._progressBar,
                progressStyle = progressBar.style;

            if (!progressBar.parentNode) {
                this._fadingProgressBar = false;
                if (this._progressIndicatorDelayTimer) {
                    this._progressIndicatorDelayTimer.cancel();
                }
                this._progressIndicatorDelayTimer = Promise.timeout(WinJS.UI._LISTVIEW_PROGRESS_DELAY).then(function () {
                    parent.appendChild(progressBar);
                    AnimationHelper.fadeInElement(progressBar);
                    this._progressIndicatorDelayTimer = null;
                });
            }
            progressStyle[this._rtl() ? "right" : "left"] = x;
            progressStyle.top = y;
        },

        _hideProgressBar: function ListView_hideProgressBar() {
            if (WinJS.UI._PerfMeasurement_disableProgressBar) {
                return;
            }

            if (this._progressIndicatorDelayTimer) {
                this._progressIndicatorDelayTimer.cancel();
                this._progressIndicatorDelayTimer = null;
            }

            var progressBar = this._progressBar;
            if (progressBar.parentNode && !this._fadingProgressBar) {
                this._fadingProgressBar = true;
                AnimationHelper.fadeOutElement(progressBar).then(function () {
                    if (progressBar.parentNode) {
                        progressBar.parentNode.removeChild(progressBar);
                    }
                    this._fadingProgressBar = false;
                });
            }
        },

        _executeCopy: function ListView_executeCopy() {
            var selection = this.selection;
            if (selection.getIndicesCount() > 0) {
                var e = document.createEvent("CustomEvent");
                e.initCustomEvent("itemscopy", false, true, {dataPackage: null});
                var handled = this._element.dispatchEvent(e);
                if (handled && e.detail.dataPackage) {
                    Windows.ApplicationModel.DataTransfer.Clipboard.setContent(e.detail.dataPackage);
                    return true;
                }
            }

            return false;
        },

        _executeDelete: function ListView_executeDelete() {
            var selection = this.selection;
            if (selection.getIndicesCount() > 0 && this.editable) {
                var e = document.createEvent("Event");
                e.initEvent("itemsdelete", false, true);
                var handled = this._element.dispatchEvent(e);
                if (handled) {
                    this._itemsManager.dataSource.beginEdits();
                    var that = this;
                    selection.forEachIndex(function(index) {
                        that._itemsManager.simplerItemAtIndex(index, function (element) {
                            that._itemsManager.dataSource.remove(element.msDataItem.key);
                        });
                    });
                    this._itemsManager.dataSource.endEdits();
                }
            }
        },

        _executePaste: function ListView_executePaste() {
            var clipboardContent = Windows.ApplicationModel.DataTransfer.Clipboard.getContent();       
            if (clipboardContent && this.editable) {
                var e = document.createEvent("CustomEvent");
                e.initCustomEvent("itemspaste", false, true, {dataPackage: clipboardContent});
                this._element.dispatchEvent(e);
            }
        },

        _getPanAxis: function () {
            return this._horizontal() ? "horizontal" : "vertical";
        },

        _configureForZoom: function (isZoomedOut, isCurrentView, triggerZoom, pagesToPrefetch) {
            if (WinJS.validation) {
                if (!this._view.realizePage || typeof this._view.begin !== "number") {
                    // TODO: Replace with proper validation pattern
                    throw new Error("ListView can only be used with SemanticZoom if randomaccess loading behavior is specified.");
                }
            }

            this._isZoomedOut = isZoomedOut;
            this._disableEntranceAnimation = !isCurrentView;

            this._isCurrentZoomView = isCurrentView;

            this._triggerZoom = triggerZoom;
        },

        _setCurrentItem: function (x, y) {
            // First, convert the position into canvas coordinates
            if (this._horizontal()) {
                x += (
                    this._rtl() ?
                        this._canvas.offsetWidth - this._viewportWidth - this.scrollPosition :
                        this.scrollPosition
                );
            } else {
                y += this.scrollPosition;
            }

            var index = this._layout.hitTest(x, y);

            if (index >= 0) {
                if (this._hasKeyboardFocus) {
                    this._changeFocus(index, true);
                } else {
                    this._selection.setFocused(index);
                    this._setFocusOnItem(index);
                }
            }
        },

        _getCurrentItem: function () {
            var indexFocused = this._selection.getFocused();
            
            if (typeof indexFocused !== "number") {
                // Do a hit-test in the viewport center
                this._setCurrentItem(0.5 * this._viewportWidth, 0.5 * this._viewportHeight);

                indexFocused = this._selection.getFocused();
            }

            var listBinding = this._dataSource.createListBinding(),
                promiseItem = listBinding.fromIndex(indexFocused).
                    then(
                        function (item) {
                            listBinding.release();
                            return item;
                        }
                    );

            var that = this;

            var promisePosition = this._getItemOffsetPosition(indexFocused).
                    then(
                        function (posCanvas) {
                            var scrollOffset = parseInt(that._canvas.style[that._startProperty], 10);
                            if (that._horizontal() && that._rtl()) {
                                scrollOffset -= (that._canvas.offsetWidth - that._viewportWidth);
                            }
                            posCanvas[that._startProperty] += scrollOffset;

                            return posCanvas;
                        }
                    );

            return Promise.join({ item: promiseItem, position: promisePosition });
        },

        _beginZoom: function () {
            this._zooming = true;

            if (!this._isCurrentZoomView) {
                this.refresh();
            }

            // Hide the scrollbar and extend the content beyond the ListView viewport

            var horizontal = this._horizontal(),
                scrollOffset = (horizontal && this._rtl() ? this.scrollPosition : -this.scrollPosition);

            this._viewport.style[horizontal ? "overflowX" : "overflowY"] = "visible";
            this._canvas.style[this._startProperty] = scrollOffset + "px";

            this._viewport.style[horizontal ? "overflowY" : "overflowX"] = "visible";
        },

        _positionItem: function (item, position) {
            var that = this;
            function positionItemAtIndex(index) {
                return that._getItemOffsetPosition(index).then(function (posCanvas) {
                    var horizontal = that._horizontal(),
                        rtl = horizontal && that._rtl(),
                        canvasSize = that._canvas[horizontal ? "offsetWidth" : "offsetHeight"],
                        viewportSize = (horizontal ? that._viewportWidth : that._viewportHeight),
                        scrollPosition;

                    if (rtl) {
                        // Align the right edge

                        var right = position.left + position.width;

                        // Ensure the item ends up within the viewport
                        right = Math.max(posCanvas.width, Math.min(that._viewportWidth, right));

                        scrollPosition = (canvasSize - (posCanvas.left + posCanvas.width)) - (that._viewportWidth - right);
                    } else {
                        // Align the leading edge

                        var start = position[that._startProperty],
                            startMax = viewportSize - (horizontal ? posCanvas.width : posCanvas.height);

                        // Ensure the item ends up within the viewport
                        start = Math.max(0, Math.min(startMax, start));

                        scrollPosition = posCanvas[that._startProperty] - start;
                    }

                    // Ensure the scroll position is valid
                    var adjustedScrollPosition = Math.max(0, Math.min(canvasSize - viewportSize, scrollPosition)),
                        scrollAdjustment = (rtl ? -1 : 1) * (adjustedScrollPosition - scrollPosition);

                    scrollPosition = adjustedScrollPosition;

                    // Since a zoom is in progress, adjust the div position
                    var scrollOffset = (rtl ? scrollPosition : -scrollPosition);
                    that._canvas.style[that._startProperty] = scrollOffset + "px";

                    if (that._hasKeyboardFocus) {
                        that._changeFocus(index, true);
                    } else {
                        that._selection.setFocused(index);
                        that._setFocusOnItem(index);
                    }

                    that._raiseViewLoading(true);
                    that._view.realizePage(scrollPosition, true);

                    return (
                        horizontal ?
                            { x: scrollAdjustment, y : 0 } :
                            { x: 0, y : scrollAdjustment }
                    );
                });
            }

            var itemIndex = (
                !item ?
                    0 :
                this._isZoomedOut ?
                    item.groupIndexHint : 
                    item.firstItemIndexHint
            );

            if (typeof itemIndex === "number") {
                return positionItemAtIndex(itemIndex);
            } else {
                // We'll need to obtain the index from the data source
                var listBinding = this._dataSource.createListBinding(),
                    itemPromise;

                var key = (this._isZoomedOut ? item.groupKey : item.firstItemKey);
                if (typeof key === "string" && listBinding.fromKey) {
                    itemPromise = listBinding.fromKey(key);
                } else {
                    var description = (this._isZoomedOut ? item.groupDescription : item.firstItemDescription);

                    if (WinJS.validation) {
                        if (description === undefined) {
                            // TODO: Replace with proper validation pattern
                            throw new Error("Item must provide index, key or description of corresponding item.");
                        }
                    }

                    itemPromise = listBinding.fromDescription(description);
                }
               
                return itemPromise.
                    then(
                        function (item) {
                            listBinding.release();
                            return Promise.timeout().
                                then(
                                    function () {
                                        return positionItemAtIndex(item.index);
                                    }
                                );
                        }
                    );
            }
        },

        _endZoom: function (isCurrentView) {
            // Crop the content again and re-enable the scrollbar

            var horizontal = this._horizontal(),
                scrollOffset = parseInt(this._canvas.style[this._startProperty], 10);

            this._viewport.style[horizontal ? "overflowX" : "overflowY"] = "auto";
            this._viewport.style[horizontal ? "overflowY" : "overflowX"] = "hidden";
            this._canvas.style[this._startProperty] = "0px";
            this.scrollPosition = (horizontal && this._rtl() ? scrollOffset : -scrollOffset);
            this._disableEntranceAnimation = !isCurrentView;

            this._isCurrentZoomView = isCurrentView;
            this._zooming = false;
        },

        _handlePointer: function (pointerId) {
            var currentMode = this._modes[this._modes.length - 1],
                handled = false;
            if (currentMode instanceof WinJS.UI._SelectionMode) {
                // If the mode has a pressedItem and gesture recognizer, it already set capture on that item when the event was received, so there's no need to set capture again.
                handled = currentMode.pressedItem && currentMode.gestureRecognizer;
            }

            if (!handled) {
                this._viewport.msSetPointerCapture(pointerId);
            }
        },
        
        _getItemOffsetPosition: function (index) {
            var items = this._view.items,
                elementAtIndex = items.itemAt(index);

            function elementOffsetPosition(element) {
                var elementRoot = items.rootElement(element);

                return {
                    left: elementRoot.offsetLeft + (element === elementRoot ? 0 : element.offsetLeft),
                    top: elementRoot.offsetTop + (element === elementRoot ? 0 : element.offsetTop),
                    width: element.offsetWidth,
                    height: element.offsetHeight
                };
            }

            var that = this;
            return new Promise(function (complete) {
                // See if an element already exists for the item, in which case it has been positioned
                if (elementAtIndex) {
                    complete(elementOffsetPosition(elementAtIndex));
                } else {
                    that._itemsCount(function (count) {
                        that._layout.startLayout(0, 0, count).
                            then(
                                function () {
                                    var promisePosition = that._layout.getItemOffset(index).
                                            then(
                                                function () {
                                                    return that._layout.getItemPosition(index);
                                                }
                                            ),
                                        indexRealized = that._view.begin,
                                        elementRealized = items.itemAt(indexRealized),
                                        promiseResult;

                                    // Otherwise, see if there's at least one item that has been realized
                                    if (elementRealized) {
                                        // There is, so use the heuristic that its offsets relative to its computed position are likely to
                                        // be the same as those of the item at the given index.
                                        var offsetPosRealized = elementOffsetPosition(elementRealized);

                                        promiseResult = Promise.join([promisePosition, that._layout.getItemPosition(indexRealized)]).
                                            then(
                                                function (results) {
                                                    var pos = results[0],
                                                        posRealized = results[1];

                                                    return {
                                                        left: pos.left + (offsetPosRealized.left - posRealized.left),
                                                        top: pos.top + (offsetPosRealized.top - posRealized.top),
                                                        width: offsetPosRealized.width,
                                                        height: offsetPosRealized.height
                                                    };
                                                }
                                            );
                                    } else {
                                        // There's no way to determine the offsets, just return the calculated position
                                        promiseResult = promisePosition.
                                            then(
                                                function (pos) {
                                                    return {
                                                        left: pos.left,
                                                        top: pos.top,
                                                        width: pos.totalWidth,
                                                        height: pos.totalHeight
                                                    };
                                                }
                                            );
                                    }

                                    promiseResult.
                                        then(
                                            function (result) {
                                                that._layout.endLayout();
                                                complete(result);
                                            }
                                        );
                                }
                            ); 
                    });
                }
            });
        },

        _changeFocus: function (newFocus, skipSelection, ctrlKeyDown) {

            // Selecting modifes the tree so this needs to be done before the focus is set
            if (!skipSelection && this._selectFocused(ctrlKeyDown)) {
                this._selection.set(new WinJS.UI.ListViewItems([newFocus]));
            }

            var targetItem = this._view.items.itemAt(newFocus);
            this._unsetFocusOnItem(!!targetItem);
            this._hasKeyboardFocus = true;
            this._selection.setFocused(newFocus);
            this.ensureVisible(newFocus);
            this._setFocusOnItem(newFocus);
        },

        _defaultInvoke: function (itemIndex) {
            if (this._isZoomedOut) {
                this._triggerZoom();
            }
        },

        _selectionAllowed: function ListView_selectionAllowed() {
            return this._selectionMode !== WinJS.UI.SelectionMode.none;
        },

        _multiSelection: function ListView_multiSelection() {
            var SelectionMode = WinJS.UI.SelectionMode;
            return this._selectionMode === SelectionMode.multi || this._selectionMode === SelectionMode.extended;
        },

        _selectOnTap: function ListView_selectOnTap() {
            return this._tap === WinJS.UI.Tap.selectAndInvoke;
        },

        _selectFocused: function ListView_selectFocused(ctrlKeyDown) {
            var SelectionMode = WinJS.UI.SelectionMode;
            return (this._selectionMode === SelectionMode.single || (this._selectionMode === SelectionMode.extended && !ctrlKeyDown)) && this._selectOnTap();
        },

        _fadeOutCanvas: function ListView_fadeOutCanvas(complete) {
            if (!this._fadingCanvasOut) {
                this._fadingCanvasOut = true;
                var that = this;
                AnimationHelper.fadeOutElement(this._canvas).then(function() {
                    that._fadingCanvasOut = false;
                    that._canvas.style.opacity = 1.0;
                    complete();
                });
            }
        },

        _animateListEntrance: function (firstTime) {
            if (this._disableEntranceAnimation) {
                return;
            }
            
            AnimationHelper.animateEntrance(this._canvas, firstTime); 
        },

        _resetMargins: function (item) {
            if (item.msMarginCache) {
                setMargins(item.style, item.msMarginCache);
                item.msMarginCache = null;
            }
        }
    })
});

})(this, WinJS);


WinJS.Namespace.define("WinJS.UI", {});

(function (global, WinJS, undefined) {

var utilities = WinJS.Utilities,
    Promise = WinJS.Promise;

// Virtualized scroll view
WinJS.Namespace.define("WinJS.UI", {
    _ScrollView: function (scrollViewSite) {
        this.site = scrollViewSite;
        this.items = new WinJS.UI._ItemsContainer(scrollViewSite);
        this.pagesToPrefetch = 1;
        this.begin = 0;
        this.end = 0;
        this.realizePass = 1;
        this.addedHeaders = [];
        this.addedItems = [];
        this.dummyFirstChild = document.createElement("div");
        this.site._canvas.appendChild(this.dummyFirstChild);
        this.firstLayoutPass = true;
        this.viewReset = false;
    }
});

WinJS.UI._ScrollView.prototype = {
    createItem: function ScrollView_createItem(itemIndex, available, unavailable) {
        var that = this;
        
        var something = this.site._itemsManager.simplerItemAtIndex(itemIndex, function (element) {
            that.site._groups.addItem(that.site._itemsManager, itemIndex, element, function () {
                available(itemIndex, element);
            });
        }, 
        function () {
            unavailable(itemIndex);
        },
        function (placeholder) {
            that.items.setPlaceholderAt(itemIndex, placeholder);
        });
        return something;
    },

    addItem: function ScrollView_addItem(fragment, itemIndex, element, currentPass) {
        if (this.realizePass === currentPass) {
            var groupIndex = this.site._groups.groupFromItem(itemIndex);
            if (groupIndex !== null) {
                var group = this.site._groups.group(groupIndex);
                if (!group.element && group.startIndex === itemIndex) {
                    this.addHeader(fragment, groupIndex);
                }
            }

            var layoutIndex = this.items.getLayoutIndex(itemIndex);
            if (layoutIndex !== WinJS.UI._INVALID_INDEX) {

                if (element.parentNode !== fragment) {
                    fragment.appendChild(element);
                }

                var that = this;

                function layoutItem(root) {
                    // setItemAt needs to be called after fragment.appendChild. SetItemAt fulfills a promise for items requested
                    // by the keyboard focus handler. That handler will explicitly call .focus() on the element, so in order for
                    // the focus handler to work, the element needs to be in a tree prior to focusing.
                    that.items.setItemAt(itemIndex, {
                        index: itemIndex,
                        element: element,
                        visible: true
                    });

                    that.site._layout.layoutItem(layoutIndex, root);
                }

                if (this.site._isSelected(itemIndex)) {
                    this.site._renderSelection(itemIndex, element, true, true).then(layoutItem);
                } else {
                    layoutItem(element);
                }
            } 
        }
    },

    finalItem: function ScrollView_finalItem(callback) {
        this.site._itemsCount(function (count) {
            callback(count - 1);
        });
    },

    hideItem: function ScrollView_hideItem(itemData, root) {
        if (itemData.display === undefined) {
            itemData.display = root.style.display;
            root.style.display = "none";
        }
    },

    updateItem: function ScrollView_updateItem(itemData, itemIndex, itemIsReadyCallback) {
        var layoutIndex = this.items.getLayoutIndex(itemIndex),
            element = this.items.rootElement(itemData.element);
        
        if (layoutIndex !== WinJS.UI._INVALID_INDEX) {
            this.site._layout.layoutItem(layoutIndex, element);
            if (itemData.display !== undefined) {
                element.style.display = itemData.display;
                itemData.display = undefined;
            }
        } else {
            this.hideItem(itemData, element);
        }

        itemIsReadyCallback(itemData.element);

        return itemData.element;
    },

    realizeItems: function ScrollView_realizeItems(fragment, begin, end, count, currentPass, itemsAreReadyCallback) {
        var waitFor = (this.site._groups.groupByFunction && this.site._rtl() || this.firstLayoutPass ? end : -1),
            firstItem, lastItem,
            counter = end - begin,
            newElements = [],
            that = this,
            notificationHandler = {
                changed: function (newItem, oldItem) {
                    for (var i = 0, len = newElements.length; i < len; i++) {
                        var newElement = newElements[i];
                        if (newElement.element === oldItem) {
                            newElement.element = newItem;
                        }
                    }
                }
            };

        if (that.site._groups.pinnedItem) {
            waitFor = Math.max(waitFor, that.site._groups.pinnedItem);
        }

        this.site._registerNotificationHandler(notificationHandler);

        if (!this.firstLayoutPass) {
            var scrollbarPos = this.site.scrollPosition,
                firstPromise = this.site.layout.calcFirstDisplayedItem(scrollbarPos, false),
                lastPromise = this.site.layout.calcLastDisplayedItem(scrollbarPos, this.site._getViewportLength(), false);
            
            firstPromise.then(function (first) {
                that._firstIndexDisplayed = first;
            });

            lastPromise.then(function (last) {
                that._lastIndexDisplayed = last;
            });
            Promise.join([firstPromise, lastPromise]).then(function () {
                var showProgress = true;
                for (var i = that._firstIndexDisplayed; i <= that._lastIndexDisplayed; i++) {
                    if (that.items.itemAt(i)) {
                        showProgress = false;
                        break;
                    }
                }

                if (showProgress) {
                    that.site._showProgressBar(that.site._element, "50%", "50%");
                } else {
                    that.site._hideProgressBar();
                }
            });
        }

        function itemIsReady(element) {
            that.addedItems.push({
                element: element,
                data: that.site._itemsManager.itemObject(element)
            });

            delivered();
        }

        function delivered() {
            if (--counter === 0) {
                that.site._unregisterNotificationHandler(notificationHandler);

                for (var i = 0, len = newElements.length; i < len; i++) {
                    that.addItem(fragment, newElements[i].itemIndex, newElements[i].element, currentPass);
                }

                var newEnd = that.site._layout.endLayout();
                if (that.firstLayoutPass) {
                    that.site._animateListEntrance(!that.viewReset);
                }
                that.firstLayoutPass = false;
                if (newEnd) {
                    that.realizeItems(fragment, end, Math.min(count, newEnd), currentPass, itemsAreReadyCallback);
                } else {
                    itemsAreReadyCallback(firstItem, lastItem);
                }
            }
        }

        function newItemIsReady(itemIndex, element) {
            if (itemIndex < waitFor) {
                newElements.push({
                    element: element,
                    itemIndex: itemIndex
                });
            } else {
                that.addItem(fragment, itemIndex, element, currentPass);
                if (that._lastIndexDisplayed && itemIndex >= that._firstIndexDisplayed && itemIndex <= that._lastIndexDisplayed) {
                    that.site._hideProgressBar();
                }
            }
            
            itemIsReady(element);
        }

        if (counter > 0) {
            for (var itemIndex = begin; itemIndex < end; itemIndex++) {
                var itemData = this.items.itemDataAt(itemIndex);
                if (!itemData) {
                    lastItem = this.createItem(itemIndex, newItemIsReady, delivered);
                } else {
                    lastItem = this.updateItem(itemData, itemIndex, itemIsReady);
                }
                if (!firstItem) {
                    firstItem = lastItem;
                }
            }
        } else {
            itemsAreReadyCallback(firstItem, lastItem);
        }
    },

    addHeader: function ScrollView_addHeader(fragment, groupIndex) {
        var element = this.site._groups.renderGroup(groupIndex);
        if (element) {
            if (!groupIndex) {
                fragment.insertBefore(element, fragment.firstChild);
            } else if (element.parentNode !== fragment) {
                fragment.appendChild(element);
            }

            this.site._groups.setHeader(groupIndex, element);

            this.site._layout.layoutHeader(groupIndex, element);
        
            this.addedHeaders.push({
                element: element,
                data: this.site._groups.group(groupIndex).userData
            });
        }
    },

    updateHeader: function ScrollView_updateHeader(group, groupIndex) {
        this.site._layout.layoutHeader(groupIndex, group.element);
    },

    updateHeaders: function ScrollView_updateHeaders(fragment, begin, end) {
        var that = this;

        function updateGroup(index) {
            var group = that.site._groups.group(index);
            if (group) {
                if (group.element) {
                    that.updateHeader(group, index);
                } else {
                    that.addHeader(fragment, index);
                }
            }
        }

        var groupIndex = this.site._groups.groupFromItem(begin),
            groupEnd = this.site._groups.groupFromItem(end);
        if (groupIndex !== null) {
            groupEnd++;

            if (groupIndex > 0) {
                updateGroup(0);
            }

            for (; groupIndex < groupEnd; groupIndex++) {
                updateGroup(groupIndex);
            }
        }
    },

    purgePlaceholders: function ScrollView_purgePlaceholders() {
        var im = this.site._itemsManager,
            placeholders = this.items.placeholders;

        var keys = Object.keys(placeholders);
        for (var i = 0, len = keys.length; i < len; i++) {
            var index = parseInt(keys[i], 10);
            if (index !== 0 && (index < this.begin || index >= this.end)) {
                var item = placeholders[index];
                delete placeholders[index];
                im.releaseItem(item);
            }
        }
    },

    addItemsToPool: function ScrollView_addItemsToPool() {
        if (!this.site._usingChildNodes) {
            var site = this.site,
                canvas = this.site._canvas,
                im = site._itemsManager,
                items = this.items.itemData,
                keys = Object.keys(items),
                focusedItemPurged = false,
                len, 
                i;
            
            for (i = 0, len = keys.length; i < len; i++) {
                var index = parseInt(keys[i], 10);
                if (index !== 0 && (index < this.begin || index >= this.end)) {
                    if (site._selection.getFocused() === index) {
                        site._unsetFocusOnItem();
                        focusedItemPurged = true;
                    }
                    var item = items[index].element,
                        root = this.items.rootElement(item);
                    
                    if (item !== root) {
                        canvas.removeChild(root);
                        utilities.addClass(item, WinJS.UI._itemClass);
                        site._resetMargins(item);
                    }

                    if (item._customAnimationStage) {
                        item._animating = false;
                        item._customAnimationStage.removeItemFromStage(item);
                    }

                    delete items[index];
                    site._itemsPool.addToPool(index, im.itemObject(item), item);    
                    im.releaseItem(item);
                }
            }

            var itemData = items[0];
            if (itemData && this.begin > 0) {
                this.hideItem(itemData, this.items.rootElement(itemData.element));
            }

            if (focusedItemPurged) {
                // If the focused item was purged, we'll still want to focus on it if it comes into view sometime in the future.
                // calling _setFocusOnItem once the item is removed from this.items will set up a promise that will be fulfilled
                // if the item ever gets reloaded
                site._setFocusOnItem(site._selection.getFocused());
            }

            var beginGroup = site._groups.groupFromItem(this.begin);
            if (beginGroup !== null) {
                var endGroup = site._groups.groupFromItem(this.end) + 1;
                for (i = 1, len = site._groups.groups.length; i < len; i++) {
                    var group = site._groups.groups[i];
                    if (group.element && i !== 0 && (i < beginGroup || i >= endGroup)) {
                        site._headersPool.addToPool(i, group.userData, group.element);    
                        delete group.element;
                        delete group.left;
                        delete group.top;
                    }
                }
            }
        }
    },

    // This function removes items which are outside of current viewport and prefetched area
    purgeItems: function ScrollView_purgeItems() {
        this.site._itemsPool.clear();
        this.site._headersPool.clear();
    },

    deferAriaSetup: function ScrollView_deferAriaSetup(count) {
        var that = this,
            elementId = that.site._element.id ? that.site._element.id : that.site._element.uniqueID;

        if (this.deferTimeout) {
            clearTimeout(this.deferTimeout);
            this.deferTimeout = null;
        }
        
        function getId(index) {
            return elementId + "_" + index;
        }

        this.deferTimeout = setTimeout(function () {
            this.deferTimeout = null;
            that.items.each(function (index, item) {
                item = that.items.rootElement(item);
                item.setAttribute("role", that.site._itemRole);
                item.setAttribute("aria-setsize", count);
                item.setAttribute("aria-posinset", index);
                item.tabIndex = 0;
                item.id = getId(index);
                var nextItem = that.items.itemAt(index + 1);
                if (nextItem) {
                    item.setAttribute("aria-flowto", getId(index + 1));
                }
                if (!index) {
                    that.site._element.setAttribute("aria-flowto", item.id );
                }
            });
        }, WinJS.UI._DEFERRED_ACTION);
    },

    realizePage: function ScrollView_realizePage(scrollbarPos, forceRelayout, realizePageEndedCallback) {
        var that = this,
            currentPass = ++this.realizePass,
            itemsManager = this.site._itemsManager;

        function pageRealized(addedItems, addedHeaders) {
            that.site._hideProgressBar();

            that.site._raiseViewComplete(addedItems, addedHeaders);

            if (realizePageEndedCallback) {
                realizePageEndedCallback();
            }   
        }

        this.site._raiseViewLoading();
        if (this.firstLayoutPass) {
            this.site._showProgressBar(this.site._element, "50%", "50%");
        }

        this.site._itemsCount(function (count) {
            if (!that.destroyed && that.realizePass === currentPass) {
                if (count !== 0) {
                    var viewportLength = that.site._getViewportLength();
                    that.site._layout.startLayout(
                        Math.max(0, scrollbarPos - that.pagesToPrefetch * viewportLength),
                        scrollbarPos + (1 + that.pagesToPrefetch) * viewportLength,
                        count
                    ).then(function (range) {
                        if (range) {
                            that.site._groups.dirty = true;

                            var begin, end;
                            if (!that.site._usingChildNodes) {
                                begin = Math.max(0, range.begin);
                                end = Math.min(count, range.end);
                            } else {
                                begin = 0;
                                end = count;
                            }

                            if ((forceRelayout || begin !== that.begin || end !== that.end) && (begin < end)) {
                                that.begin = begin;
                                that.end = end;

                                that.addedHeaders = [];
                                that.addedItems = [];
                                that.purgePlaceholders();
                                that.addItemsToPool();
                                that.realizeItems(that.site._canvas, that.begin, that.end, count, currentPass, function (firstItem, lastItem) {
                                    if (that.realizePass === currentPass) {
                                    
                                        that.updateHeaders(that.site._canvas, that.begin, that.end);

                                        that.updateScrollbar();

                                        that.site._layout.getItemPosition(that.begin).then(function (position) {
                                            that.site._groups.pinItem(that.begin, { left: position.left });
                                        });

                                        // Items outside of current viewport and prefetched area can be removed  
                                        that.purgeItems();

                                        that.deferAriaSetup(count);

                                        pageRealized(that.addedItems, that.addedHeaders);
                                    }
                                });

                            } else {
                                that.updateScrollbar();
                                pageRealized();
                            }
                        } else {
                            pageRealized();
                        }
                    });
                } else {
                    that.updateScrollbar();
                    pageRealized();
                }
            }
        });
    },

    onScroll: function ScrollView_onScroll(scrollbarPos, scrollLength, viewportSize) {
        var that = this;

        this.realizePage(scrollbarPos, false, function () {
            // TODO: This is temporary workaround for the lack of virtual scrollbar range in M2. 
            if (scrollbarPos === 0) {
                // If the user hit the beginning of the list apply the fix immediately
                that.fixScrollbarRange(scrollbarPos);
            } 
        });
    },

    onResize: function ScrollView_onResize(scrollbarPos, viewportSize) {
        this.realizePage(scrollbarPos, true);
    },

    reset: function ScrollView_reset() {
        var itemData = this.items.itemDataAt(0);
        if (itemData && itemData.display !== undefined) {
            itemData.element.style.display = itemData.display;
        }
        
        var site = this.site;
        this.items.each(function (index, item) {
            site._resetMargins(item);
        });
        this.firstLayoutPass = true;
        this.viewReset = true;
        site._unsetFocusOnItem();
        this.items.removeItems();
        site._groups.removeGroups();
        utilities.empty(site._canvas);
        site._canvas.appendChild(this.dummyFirstChild);
    },

    reload: function ScrollView_reload(viewportSize) {
        this.reset();
        this.realizePage(0, true);
        this.site._setFocusOnItem(this.site._selection.getFocused());
    },

    refresh: function ScrollView_refresh(scrollbarPos, scrollLength, viewportSize, newCount) {
        this.realizePage(scrollbarPos, true);
    },

    updateScrollbar: function ScrollView_updateScrollbar(absolute) {
        var that = this;
        
        if (this.site._cachedCount > 0) {
            this.site._layout.getScrollbarRange(this.site._cachedCount).then(function (range) {
                that.site._setCanvasLength(absolute ? range.end - range.begin : range.end);
            });
        } else {
            this.site._setCanvasLength(0);
        }
    },

    update: function ScrollView_update(count) {
        this.site._layout.update(count);
        this.site._groups.dirty = true;
    },

    fixScrollbarRange: function ScrollView_fixScrollbarRange(scrollbarPos) {
        var that = this,
            fixedPos = scrollbarPos;
        if (this.site._groups.length() && this.site._groups.group(0).offset) {

            this.updateScrollbar(true);

            this.site._layout.calcFirstDisplayedItem(scrollbarPos).then(function (firstDisplayed) {
                that.site._layout.getItemPosition(firstDisplayed).then(function (position) {
                    that.site._layout.getScrollbarRange().then(function (scrollbarRange) {
                        if (scrollbarRange.begin < 0) {
                            var start = position[that.site._startProperty], 
                                itemPos = start - scrollbarRange.begin;

                            that.site._groups.pinItem(firstDisplayed, { left: itemPos });
                
                            that.realizePage(itemPos, true);
                            
                            msSetImmediate(function () {
                                that.site.scrollPosition = itemPos;
                            });
                        }
                    });
                });
            });
        }
    },

    cleanUp: function ScrollView_cleanUp() {
        var itemsManager = this.site._itemsManager;
        this.items.each(function (index, item) {
            itemsManager.releaseItem(item);
        });
        this.site._unsetFocusOnItem();
        this.items.removeItems();
        this.site._groups.removeGroups();
        utilities.empty(this.site._canvas);

        this.destroyed = true;
    }
};
})(this, WinJS);


WinJS.Namespace.define("WinJS.UI", {});

(function (global, WinJS, undefined) {

var utilities = WinJS.Utilities,
    Promise = WinJS.Promise;

WinJS.Namespace.define("WinJS.UI", {
    ListViewItems: WinJS.Class.derive(Array, function (elements) {
        if (elements !== undefined) {
            this._set(elements);
        }
    }, {

        forEachIndex: function (callback) {
            for(var i = 0, len = this.length; i < len; i++) {
                var range = this[i];
                for(var n = range.begin; n <= range.end; n++) {
                    callback(n);
                }
            }
        },

	    getIndicesCount: function () {
            var count = 0;
            for(var i = 0, len = this.length; i < len; i++) {
                var range = this[i];
                count += range.end - range.begin + 1;
            }
            return count;
        },

	    getAllIndices: function () {
            var indices = [];
            for(var i = 0, len = this.length; i < len; i++) {
                var range = this[i];
                for(var n = range.begin; n <= range.end; n++) {
                    indices.push(n);
                }
            }
            return indices;
        },
        
        _set: function (elements) {
            this.splice(0, this.length);

            if (!Array.isArray(elements) && !(elements instanceof WinJS.UI.ListViewItems)) {
                elements = [elements];
            }
            for (var i = 0, count = elements.length; i < count; i++) {
                var item = elements[i];
                if (typeof item === "number") {
                    this.push({
                        begin: item,
                        end: item
                    });
                } else {
                    this.push({
                        begin: item.begin,
                        end: item.end
                    });
                }
            }

            this._mergeAdjacent();
        },

        _add: function (index) {
            var ranges = [];
            for(var i = 0, len = this.length; i <= len; i++) {
                var prev = i > 0 ? this[i - 1].end : -1,
                    current = i < len ? this[i].begin : Number.MAX_VALUE;
                
                if (index > prev && index < current) {
                    ranges.push({
                        begin: index,
                        end: index
                    }); 
                }
                if (i < len) {
                    ranges.push(this[i]); 
                }
            }

            this._set(ranges);
        },

        _remove: function (index) {
            var ranges = [];
            for(var i = 0, len = this.length; i < len; i++) {
                var range = this[i];
                if (index === range.begin && index === range.end) {
                    continue;
                } else if (index === range.begin) {
                    ranges.push({
                        begin: range.begin + 1,
                        end: range.end
                    }); 
                } else if (index === range.end) {
                    ranges.push({
                        begin: range.begin,
                        end: range.end - 1
                    });
                } else if (index > range.begin && index < range.end) {
                    ranges.push({
                        begin: range.begin,
                        end: index - 1
                    }); 
                    ranges.push({
                        begin: index + 1,
                        end: range.end
                    }); 
                } else {
                    ranges.push(range); 
                }
            }
            this._set(ranges);
        },

        _mergeAdjacent: function () {
            var n = 0;
            for(var i = 1, len = this.length; i < len; i++) {
                var previous = this[n],
                    current = this[i];
                if (previous.end + 1 === current.begin) {
                    previous.end = current.end;
                } else {
                    this[++n] = current;
                }
            }
            this.splice(n + 1, this.length - n - 1);
        }
    })
});


// This component is responsible for holding selection state
WinJS.Namespace.define("WinJS.UI", {
    _SelectionManager: function (site) {
        this.site = site;
        this.selected = new WinJS.UI.ListViewItems();
        this.focused = 0;
    }
});

WinJS.UI._SelectionManager.prototype = {
    set: function (newSelection) {
        if (this.fireSelectionChanging(newSelection)) {
            this.selected = newSelection;
            this.site._updateSelection();
            this.fireSelectionChanged();
        }
    },

    isSelected: function (index) {
        for(var i = 0, len = this.selected.length; i < len; i++) {
            var range = this.selected[i];
            if (index >= range.begin && index <= range.end) {
                return true;
            }
        }
        return false;
    },

    get: function () {
        return this.selected;
    },

    fireSelectionChanging: function (newSelection) {
        var eventObject = document.createEvent("CustomEvent");
        eventObject.initCustomEvent("selectionchanging", true, true, {
            newSelection: newSelection
        });
        return this.site._element.dispatchEvent(eventObject);
    },

    fireSelectionChanged: function () {
        var eventObject = document.createEvent("CustomEvent");
        eventObject.initCustomEvent("selectionchanged", true, false, null);
        this.site._element.dispatchEvent(eventObject);
    },

    getFocused: function () {
        return this.focused;
    },

    setFocused: function (index) {
        this.focused = index;
    },

    clear: function () {
        this.set(new WinJS.UI.ListViewItems());
    },

    add: function (index) {
        if (!this.isSelected(index)) {
            var newSelection = new WinJS.UI.ListViewItems(this.selected);
            newSelection._add(index);
            this.set(newSelection);
        }
    },

    remove: function (index) {
        if (this.isSelected(index)) {
            var newSelection = new WinJS.UI.ListViewItems(this.selected);
            newSelection._remove(index);
            this.set(newSelection);
        }
    }
};

})(this, WinJS);

