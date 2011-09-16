/// <loc filename="metadata\controls_loc_oam.xml" format="messagebundle" />
/// <reference path='base.js' />
/// <reference path='ui.js' />
/// <reference path='animations.js' />
 
/*
  © Microsoft. All rights reserved.

  This library is supported for use in Windows Tailored Apps only.

  Build: 6.2.8100.0 
  Version: 0.5 
*/
 


(function (WinJS, undefined) {
    var Control = WinJS.Class.define(null, {
        raiseEvent: function (type, details) {
            /// <summary locid="170">
            /// Raises an event of the specified type and with additional properties.
            /// </summary>
            /// <param name="type" locid="171">
            /// The type (name) of the event.
            /// </param>
            /// <param name="details" locid="172">
            /// The set of additional properties to be attached to the event object when the event is raised.
            /// </param>
            /// <returns type="Boolean" locid="173">
            /// Boolean indicating whether preventDefault was called on the event.
            /// </returns>
            this.dispatchEvent(type, details);
        }
    });
    WinJS.Class.mix(Control, WinJS.UI.DOMEventMixin);

    WinJS.Namespace.defineWithParent(WinJS, "UI", {
        /// <summary locid="1">DatePicker control allows users to pick a date value</summary>
        /// <name locid="2">Date Picker</name>
        /// <htmlSnippet><![CDATA[<div data-win-control="WinJS.UI.DatePicker"></div>]]></htmlSnippet>
        /// <event name="change" locid="3">Raised when the current date changes</event>
        /// <resource type="javascript" src="/winjs/js/base.js" shared="true" />
        /// <resource type="javascript" src="/winjs/js/ui.js" shared="true" />
        /// <resource type="javascript" src="/winjs/js/controls.js" shared="true" />
        /// <resource type="css" src="/winjs/css/ui-dark.css" shared="true" />
        DatePicker: WinJS.Class.derive(Control, function (element, options) {
            /// <summary locid="4">DatePicker control</summary>
            /// <param name="element" type="HTMLElement" domElement="true" locid="5">
            /// The DOM element to be associated with the DatePicker control.
            /// </param>
            /// <param name="options" type="object" locid="6">
            /// The set of options to be applied initially to the DatePicker control.
            /// </param>
            /// <returns type="WinJS.UI.DatePicker" locid="7">A constructed DatePicker control.</returns>

            // Default to current date
            this._currentDate = new Date();

            // Default to +/- 100 years
            this._minYear = this._currentDate.getFullYear() - 100;
            this._maxYear = this._currentDate.getFullYear() + 100;

            element = element || document.createElement("div");
            WinJS.UI.setControl(element, this);

            // Set options BEFORE setting the element, so they can influence things
            WinJS.UI.setOptions(this, options);
            this._setElement(element);
            this._updateLayout();
        }, {
            _currentDate: null,
            _disabled: false,
            _dateElement: null,
            _dateControl: null,
            _monthElement: null,
            _monthControl: null,
            _minYear: null,
            _maxYear: null,
            _yearElement: null,
            _yearControl: null,

            _addAccessibilityAttributes: function () {
                //see http://www.w3.org/TR/wai-aria/rdf_model.png for details
                this._domElement.setAttribute("role", "group");
                // UNDONE: localize these strings
                //
                this._dateElement.setAttribute("aria-label", "Select Day");
                this._monthElement.setAttribute("aria-label", "Select Month");
                this._yearElement.setAttribute("aria-label", "Select Year");
            },

            _addControlsInOrder: function () {
                // TODO: Get localization info from WinRT to put this in correct order
                var e = this._domElement;
                e.appendChild(this._monthElement);
                e.appendChild(this._dateElement);
                e.appendChild(this._yearElement);
            },

            _clearControlElements: function () {
                if (this._monthElement) {
                    this._domElement.removeChild(this._monthElement);
                    this._monthElement = null;
                }

                if (this._dateElement) {
                    this._domElement.removeChild(this._dateElement);
                    this._dateElement = null;
                }

                if (this._yearElement) {
                    this._domElement.removeChild(this._yearElement);
                    this._yearElement = null;
                }
            },

            _createControlElements: function () {
                if (!this._monthElement) {
                    this._monthElement = document.createElement("select");
                    this._monthElement.className = "win-datepicker-month";
                }

                if (!this._dateElement) {
                    this._dateElement = document.createElement("select");
                    this._dateElement.className = "win-datepicker-date";
                }

                if (!this._yearElement) {
                    this._yearElement = document.createElement("select");
                    this._yearElement.className = "win-datepicker-year";
                }
            },

            _createControls: function () {
                var that = this;

                this._yearControl = null;
                var yearSource = new Object();
                yearSource.getLength = function () { return Math.max(0, that.maxYear - that.minYear + 1); };
                yearSource.getValue = function (index) { return that.minYear + index; };
                this._yearControl = new WinJS.UI._Select(this._yearElement, {
                    dataSource: yearSource,
                    disabled: this.disabled,
                    index: this.current.getFullYear() - this.minYear
                });

                this.monthControl = null;
                this._monthControl = new WinJS.UI._Select(this._monthElement, {
                    dataSource: ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"],
                    disabled: this.disabled,
                    index: this.current.getMonth(),
                    titleProvider: function (value) {
                        return that._getMonthName(value);
                    }
                });

                this._dateControl = null;
                this._dateControl = new WinJS.UI._Select(this._dateElement, {
                    dataSource: this._getDateSource(),
                    disabled: this.disabled,
                    index: this.current.getDate() - 1
                });

                this._wireupEvents();
                this._updateValues();

            },

            /// <field type="Date" locid="8">The current date of the DatePicker.</field>
            current: {
                get: function () { 
                    var d = this._currentDate;
                    var y = d.getFullYear();
                    return new Date(Math.max(Math.min(this.maxYear, y), this.minYear), d.getMonth(), d.getDate(), 0, 0, 0, 0);
                },
                set: function (value) {
                    var newDate;
                    if (typeof (value) === "string") {
                        newDate = new Date();
                        newDate.setTime(Date.parse(value));
                    }
                    else {
                        newDate = value;
                    }

                    var oldDate = this._currentDate;
                    if (oldDate != newDate) {
                        this._currentDate = newDate;
                        this._updateDisplay();
                    }
                }
            },

            /// <field type="Boolean" locid="9">Whether the DatePicker is disabled.</field>
            disabled: {
                get: function () { return this._disabled; },
                set: function (value) {
                    if (this._disabled !== value) {
                        this._disabled = value;
                        if (this._monthControl) {
                            this._monthControl.disabled = value;
                        }
                        if (this._dateControl) {
                            this._dateControl.disabled = value;
                        }
                        if (this._yearControl) {
                            this._yearControl.disabled = value;
                        }
                    }
                }
            },

            /// <field type="HTMLElement" domElement="true" locid="10">
            /// The DOM element which is the DatePicker
            /// </field>
            element: {
                get: function () { return this._domElement; }
            },

            _drawControls: function () {
                this._createControlElements();
                this._addControlsInOrder();
                this._createControls();
                this._addAccessibilityAttributes();
            },

            _getDateSource: function () {
                var temp = new Date();
                var year = this.current.getFullYear();
                // The +1 is needed to make using a day of 0 work correctly
                var month = this._monthControl.index + 1; // index is always correct, unlike getMonth which changes when the date is invalid
                temp.setFullYear(year, month, 0);

                if (this._dateControl) {
                    var date = this._dateControl.value;
                }

                var dateSource = [];
                var maxValue = temp.getDate();
                for (var i = 1; i <= maxValue; i++) {
                    var v = "" + i;
                    if (i < 10) { v = "0" + v; }
                    dateSource.push(v);
                }

                if (date > dateSource.length) {
                    // Fix invalid date caused by month/year change
                    this.current.setMonth(this._monthControl.index);
                    this._dateControl.index = dateSource.length - 1;
                }

                return dateSource;
            },

            _getMonthName: function (month) {
                // TODO: This should be localized using WinRT apis
                return ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][month - 1];
            },

            _getWeekDayName: function (date) {
                var now = new Date();
                now.setFullYear(this._yearControl.value, this._monthControl.index, date);

                // TODO: This should be localized using WinRT apis
                return ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][now.getDay()];
            },

            _setElement: function (element) {
                this._domElement = element;
                WinJS.Utilities.addClass(this._domElement, "win-datepicker");
                this._drawControls();
            },

            /// <field type="Number" integer="true" locid="11">The minimum year available for picking.</field>
            minYear: {
                get: function () { return this._minYear; },
                set: function (value) {
                    if (this._minYear !== value) {
                        this._minYear = value;
                        if (this._minYear > this._maxYear) {
                            this._maxYear = this._minYear;
                        }

                        if (this._yearControl) {
                            //Since the dataSource do change in this case, but the dataSource
                            //is dynamic, so simply triggering set will cause the underlying _Select
                            //to redraw
                            this._yearControl.dataSource = this._yearControl.dataSource;
                        }

                        this._updateDisplay();
                    }
                }
            },

            /// <field type="Number" integer="true" locid="12">The maximum year available for picking.</field>
            maxYear: {
                get: function () { return this._maxYear; },
                set: function (value) {
                    if (this._maxYear !== value) {
                        this._maxYear = value;
                        if (this._maxYear < this._minYear) {
                            this._minYear = this._maxYear;
                        }

                        if (this._yearControl) {
                            //Since the dataSource do change in this case, but the dataSource
                            //is dynamic, so simply triggering set will cause the underlying _Select
                            //to redraw
                            this._yearControl.dataSource = this._yearControl.dataSource;
                        }

                        this._updateDisplay();
                    }
                }
            },

            _updateLayout: function () {
                if (!this._domElement)
                    return;
                this._updateValues();
            },

            _updateValues: function () {
                if (this._yearControl) {
                    this._yearControl.index = this.current.getFullYear() - this.minYear;
                }

                if (this._monthControl) {
                    this._monthControl.index = this.current.getMonth();
                }

                if (this._dateControl) {
                    this._dateControl.dataSource = this._getDateSource();
                    this._dateControl.index = this.current.getDate() - 1;
                }
            },

            _updateDisplay: function () {
                //Render display index based on constraints (minYear and maxYear constraints)
                //Will not modify current date

                if (this._yearControl) {
                    if (this.current.getFullYear() < this.minYear) {
                        this._yearControl.displayIndex = 0;
                    }
                    else if (this.current.getFullYear() > this.maxYear) {
                        this._yearControl.displayIndex = this._yearControl.dataSource.getLength() - 1;
                    }
                    else {
                        this._yearControl.displayIndex = this.current.getFullYear() - this.minYear;
                    }

                }

                if (this._monthControl) {
                    this._monthControl.displayIndex = this.current.getMonth();
                }

                if (this._dateControl) {
                    this._dateControl.dataSource = this._getDateSource();
                    this._dateControl.displayIndex = this.current.getDate() - 1;
                }
            },

            _raiseEvent: function (name, args) {
                if (this._domElement) {
                    this.raiseEvent(name, args);
                }
            },

            _redrawControl: function () {
                if (this._domElement) {
                    this._clearControlElements();
                    this._drawControls();
                }
            },

            _wireupEvents: function () {
                var that = this;

                var daysInMonth = function (month, year) {
                    // Same logic as in dateSource, we rely on the behavior of
                    // JS date object that "0" date is really the last day of
                    // the previous month
                    //
                    return new Date(year, month+1, 0).getDate();
                };

                var dateHandler = function () {
                    that._currentDate.setDate(that._dateControl.value);
                    // "change" bubbles from the underlying list
                };

                var updateDateDataSource = function () {
                    // Changing the month (or year, if the current date is 2/29) changes the day range, and could have made the day selection invalid
                    that._dateControl.dataSource = that._getDateSource();
                };

                var monthHandler = function () {
                    var days = daysInMonth(that._monthControl.index, that._yearControl.value);
                    if (days < that._dateControl.value) {
                        that._currentDate.setDate(days);
                    }
                    that._currentDate.setMonth(that._monthControl.index);
                    updateDateDataSource();
                    // "change" bubbles from the underlying list
                };

                var yearHandler = function () {
                    var days = daysInMonth(that._monthControl.index, that._yearControl.value);
                    if (days < that._dateControl.value) {
                        that._currentDate.setDate(days);
                    }
                    that._currentDate.setYear(that._yearControl.value);
                    updateDateDataSource();
                    // "change" bubbles from the underlying list
                };

                this._dateElement.addEventListener("change", dateHandler, false);
                this._monthElement.addEventListener("change", monthHandler, false);
                this._yearElement.addEventListener("change", yearHandler, false);
            }
        })
    })

    WinJS.Class.mix(WinJS.UI.DatePicker, WinJS.Utilities.createEventProperties("change"));
    
})(WinJS);



(function (WinJS, undefined) {
    var Control = WinJS.Class.define(null, {
        raiseEvent: function (type, details) {
            /// <summary>
            /// Raises an event of the specified type and with additional properties.
            /// </summary>
            /// <param name='type'>
            /// The type (name) of the event.
            /// </param>
            /// <param name='details'>
            /// The set of additional properties to be attached to the event object when the event is raised.
            /// </param>
            /// <returns type='Boolean'>
            /// Boolean indicating whether preventDefault was called on the event.
            /// </returns>
            this.dispatchEvent(type, details);
        }
    });
    WinJS.Class.mix(Control, WinJS.UI.DOMEventMixin);

    WinJS.Namespace.defineWithParent(WinJS, "UI", {
        /// <summary locid="13">TimePicker control allows users to select time value</summary>
        /// <name locid="14">Time Picker</name>
        /// <htmlSnippet><![CDATA[<div data-win-control="WinJS.UI.TimePicker"></div>]]></htmlSnippet>
        /// <event name="change" locid="15">Raised when the time changes</event>
        /// <resource type="javascript" src="/winjs/js/base.js" shared="true" />
        /// <resource type="javascript" src="/winjs/js/ui.js" shared="true" />
        /// <resource type="javascript" src="/winjs/js/controls.js" shared="true" />
        /// <resource type="css" src="/winjs/css/ui-dark.css" shared="true" />
        TimePicker: WinJS.Class.derive(Control, function (element, options) {
            /// <summary locid="16">TimePicker control</summary>
            /// <param name="element" type="HTMLElement" domElement="true" locid="17">
            /// The DOM element to be associated with the TimePicker control.
            /// </param>
            /// <param name="options" type="object" locid="18">
            /// The set of options to be applied initially to the TimePicker control.
            /// </param>
            /// <returns type="WinJS.UI.TimePicker" locid="19">A constructed TimePicker control.</returns>

            // Default to current time
            this._currentTime = new Date();

            element = element || document.createElement("div");
            WinJS.UI.setControl(element, this);

            WinJS.UI.setOptions(this, options);
            this._setElement(element);
            this._updateLayout();
        }, {
            _currentTime: null,
            _disabled: false,
            _hourElement: null,
            _hourControl: null,
            _minuteElement: null,
            _minuteControl: null,
            _ampmElement: null,
            _ampmControl: null,
            _minuteIncrement: 1,

            _addAccessibilityAttributes: function () {
                //see http://www.w3.org/TR/wai-aria/rdf_model.png for details
                this._domElement.setAttribute("role", "group");
                // UNDONE: localize these strings
                //
                this._hourElement.setAttribute("aria-label", "Select Hour");
                this._minuteElement.setAttribute("aria-label", "Select Minute");
                this._ampmElement.setAttribute("aria-label", "Select AM PM");
            },

            _addControlsInOrder: function () {
                // TODO: Get localization info from WinRT to put this in correct order
                this._domElement.appendChild(this._hourElement);
                this._domElement.appendChild(this._minuteElement);
                this._domElement.appendChild(this._ampmElement);
            },

            /// <field type="Date" locid="20">The current date (and time) of the TimePicker.</field>
            current: {
                get: function () { 
                    var cur = this._currentTime;
                    if (cur) {
                        var time = new Date();
                        time.setHours(cur.getHours()); // accounts for AM/PM
                        time.setMinutes(this._getMinutesIndex(cur) * this.minuteIncrement);
                        time.setSeconds(0);
                        time.setMilliseconds(0);
                        return time;
                    }
                    else {
                        return cur; 
                    }
                },
                set: function (value) {
                    var that = this;
                    var newTime;
                    if (typeof (value) === "string") {
                        newTime = new Date();
                        newTime.setTime(Date.parse(newTime.toLocaleDateString() + " " + value));
                    }
                    else {
                        newTime = value;
                    }

                    var oldTime = this.currentTime;
                    if (oldTime !== newTime) {
                        this._currentTime = newTime;

                        this._updateDisplay();
                    }
                }
            },

            /// <field type="Boolean" locid="21">Whether the TimePicker is disabled.</field>
            disabled: {
                get: function () { return this._disabled; },
                set: function (value) {
                    if (this._disabled !== value) {
                        this._disabled = value;
                        if (this._hourControl) {
                            this._hourControl.disabled = value;
                        }
                        if (this._minuteControl) {
                            this._minuteControl.disabled = value;
                        }
                        if (this._ampmControl) {
                            this._ampmControl.disabled = value;
                        }
                    }
                }
            },

            /// <field type="HTMLElement" domElement="true" locid="22">
            /// The DOM element which is the TimePicker
            /// </field>
            element: {
                get: function () { return this._domElement; }
            },

            _getHoursAmpm: function (time) {
                // TODO: Use WinRT localization apis to do this correctly
                var hours24 = time.getHours();
                if (hours24 === 0) {
                    return { hours: 12, ampm: 0 };
                }
                else if (hours24 < 12) {
                    return { hours: hours24, ampm: 0 };
                }
                else {
                    return { hours: hours24 - 12, ampm: 1 };
                }
            },

            _getHoursIndex: function (hours) {
                if (hours === 12) {
                    return 0;
                }
                return hours;
            },

            _getMinutesIndex: function (time) {
                return parseInt(time.getMinutes() / this.minuteIncrement);
            },

            /// <field type="Number" integer="true" locid="23">Constrains the TimePicker minute element to multiples of the provided increment.</field>
            minuteIncrement: {
                //prevent divide by 0, and leave user's input intact
                get: function () { return Math.max(1, Math.abs(this._minuteIncrement | 0) % 60); },
                set: function (value) {
                    if (this._minuteIncrement != value) {
                        this._minuteIncrement = value;
                        if (this._minuteControl) {
                            //Update dataSource to trigger redrawn, since it is dynamic
                            //dataSource we will need set it to itself to trigger
                            this._minuteControl.dataSource = this._minuteControl.dataSource;
                            this._updateDisplay();
                        }
                    }
                }

            },

            _raiseEvent: function (name, args) {
                if (this._domElement) {
                    this.raiseEvent(name, args);
                }
            },

            _setElement: function (element) {
                this._domElement = element;
                WinJS.Utilities.addClass(this._domElement, "win-timepicker");

                this._hourElement = document.createElement("select");
                WinJS.Utilities.addClass(this._hourElement, "win-timepicker-hour");

                this._minuteElement = document.createElement("select");
                WinJS.Utilities.addClass(this._minuteElement, "win-timepicker-minute");

                this._ampmElement = document.createElement("select");
                WinJS.Utilities.addClass(this._ampmElement, "win-timepicker-ampm");

                this._addControlsInOrder();

                //TODO: this needs to take into account of formatting (from glob API)
                var that = this;
                var minutesSource = new Object();
                minutesSource.getLength = function () { return 60 / that.minuteIncrement; }
                minutesSource.getValue = function (index) {
                    var display = index * that.minuteIncrement;
                    if (display < 10) {
                        return "0" + display.toString();
                    }
                    else {
                        return display.toString();
                    }
                };

                var hoursAmpm = this._getHoursAmpm(this.current);
                this._hourControl = new WinJS.UI._Select(this._hourElement, {
                    dataSource: [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
                    disabled: this.disabled,
                    index: this._getHoursIndex(hoursAmpm.hours)
                });
                this._minuteControl = new WinJS.UI._Select(this._minuteElement, {
                    dataSource: minutesSource,
                    disabled: this.disabled,
                    index: this._getMinutesIndex(this.current)
                });
                this._ampmControl = new WinJS.UI._Select(this._ampmElement, {
                    dataSource: ["AM", "PM"],
                    disabled: this.disabled,
                    index: hoursAmpm.ampm
                });

                this._wireupEvents();
                this._updateValues();
                this._addAccessibilityAttributes();
            },

            _updateLayout: function () {
                if (!this._domElement)
                    return;
                this._updateValues();
            },

            _updateValues: function () {
                if (this._ampmControl && this._minuteControl && this._hourControl) {
                    var hoursAmpm = this._getHoursAmpm(this.current);
                    this._ampmControl.index = hoursAmpm.ampm;
                    this._hourControl.index = this._getHoursIndex(hoursAmpm.hours);
                    this._minuteControl.index = this._getMinutesIndex(this.current);
                }
            },

            _updateDisplay: function () {
                //Render display index based on constraints (minuteIncrement)
                //Will not modify current time

                var hoursAmpm = this._getHoursAmpm(this.current);

                if (this._ampmControl) {
                    this._ampmControl.displayIndex = hoursAmpm.ampm;
                }

                if (this._hourControl) {
                    this._hourControl.displayIndex = this._getHoursIndex(hoursAmpm.hours);
                }

                if (this._minuteControl) {
                    this._minuteControl.displayIndex = this._getMinutesIndex(this.current);
                }
            },

            _wireupEvents: function () {
                var that = this;

                //TODO: need to check with glob api
                var fixupHour = function () {
                    var hour = that._hourControl.value;
                    if (that._ampmControl.index === 1) {
                        if (hour !== 12) {
                            hour += 12;
                        }
                    }
                    else if (hour == 12) {
                        hour = 0;
                    }
                    return hour;
                };

                var hourHandler = function () {
                    var hour = fixupHour();
                    that._currentTime.setHours(hour);
                    // "change" bubbles from the underlying list
                };

                var minuteHandler = function () {
                    that._currentTime.setMinutes(that._minuteControl.value);
                    // "change" bubbles from the underlying list
                };

                var ampmHandler = function () {
                    var hour = fixupHour();
                    that._currentTime.setHours(hour);
                    // "change" bubbles from the underlying list
                };

                this._hourElement.addEventListener("change", hourHandler, false);
                this._minuteElement.addEventListener("change", minuteHandler, false);
                this._ampmElement.addEventListener("change", ampmHandler, false);
            }
        })
    });
    
    
    WinJS.Class.mix(WinJS.UI.TimePicker, WinJS.Utilities.createEventProperties("change"));
})(WinJS);



(function (WinJS, undefined) {
    var Control = WinJS.Class.define(null, {
        raiseEvent: function (type, eventProperties) {
            this.dispatchEvent(type, eventProperties);
        }
    });
    WinJS.Class.mix(Control, WinJS.UI.DOMEventMixin);

    WinJS.Namespace.defineWithParent(WinJS, "UI", {
        _Select: WinJS.Class.derive(Control, function (element, options) {
            WinJS.UI.setOptions(this, options);
            this._setElement(element);
        }, {
            _disabled: false,
            _index: 0,
            _dataSource: null,
            titleProvider: null,

            dataSource: {
                get: function () { return this._dataSource; },
                set: function (value) {
                    // Support dynamic collections
                    if (!value.getValue) {
                        value.getValue = function (index) { return value[index]; };
                    }

                    if (!value.getLength) {
                        value.getLength = function () { return value.length; }
                    }

                    if (!value.min) {
                        value.min = function () { return value.getValue(0); };
                    }

                    if (!value.max) {
                        value.max = function () { return value.getValue(value.getLength() - 1); };
                    }

                    this._dataSource = value;
                    //Update layout as data source change
                    this._updateLayout();
                }
            },

            disabled: {
                get: function () { return this._disabled; },
                set: function (value) {
                    if (typeof (value) == "boolean") {
                        if (this._disabled != value) {
                            this._disabled = value;
                            this._toggleDisable(this._disabled);
                        }
                    }
                }
            },

            _createSelectElement: function () {
                WinJS.Utilities.empty(this._domElement);
                this._toggleDisable(this.disabled);
                var dataSourceLength = this._dataSource.getLength();
                for (var i = 0; i < dataSourceLength; i++) {
                    var option = document.createElement("option");
                    option.value = this._dataSource.getValue(i);
                    if (this.titleProvider) {
                        option.text = "" + this.titleProvider(this._dataSource.getValue(i));
                    }
                    else {
                        option.text = "" + option.value;
                    }
                    this._domElement.appendChild(option);
                }
                this._domElement.selectedIndex = this._index;
                this._wireupEvents();
            },

            //Programmatically changing selectedIndex of the select element only
            //no event will be fired when this is changed
            displayIndex: {
                set: function (value) {
                    if (this._domElement) {
                        if (this._domElement.selectedIndex != value) {
                            this._domElement.selectedIndex = value;
                            //Sync display and internal index without firing events
                            //As current doesn't change
                            this._index = value;
                        }
                    }
                }
            },

            index: {
                get: function () {
                    if (this._dataSource) {
                        return Math.max(0, Math.min(this._index, this._dataSource.getLength() - 1));
                    }
                    return this._index;
                },
                set: function (value) {
                    if (this._index !== value) {
                        if (value < 0) {
                            value = 0;
                        }

                        if (this._dataSource) {
                            var dataSourceLength = this._dataSource.getLength();
                            if (value >= dataSourceLength) {
                                value = dataSourceLength - 1;
                            }
                        }

                        if (this._index !== value) {
                            this._index = value;
                            if (this._domElement) {
                                if (this._domElement) {
                                    this._domElement.selectedIndex = this._index;
                                }

                                //Notify other components that index has changed after
                                //state are being set properly
                                this.raiseEvent("change", {});
                            }
                        }
                    }
                }
            },

            _setElement: function (element) {
                this._domElement = element;
                // Mark this as a tab stop
                this._domElement.tabIndex = 0;
                this._createSelectElement();
                //update runtime accessibility value after initialization
            },

            _toggleDisable: function (disabled) {
                if (this._domElement) {
                    this._domElement.removeAttribute("disabled");
                    if (disabled) {
                        this._domElement.setAttribute("disabled", "disabled");
                    }
                }
            },

            _updateLayout: function () {
                if (this._domElement) {
                    this._createSelectElement();
                }
            },

            value: {
                get: function () {
                    if (this._dataSource) {
                        return this._dataSource.getValue(this.index);
                    }
                    return null;
                }
            },

            _wireupEvents: function () {
                var that = this;
                var _onChange = function (e) {
                    //Should be set to _index to prevent events from firing twice
                    that._index = that._domElement.selectedIndex;
                };
                this._domElement.addEventListener("change", _onChange, false);
            }
        })
    })
})(WinJS);


WinJS.Namespace.define("WinJS.UI", {});

(function (global) {

var utilities = WinJS.Utilities;

// Error messages
var elementIsInvalid = "Invalid argument: Rating control expects a valid DOM element as the first argument.",
    maxRatingIsInvalid = "Invalid argument: maxRating must be an integer number greater than zero.",
    maxRatingCannotBeUpdated = "Invalid argument: maxRating cannot be set after instantiation.",
    userRatingIsInvalid = "Invalid argument: userRating must be an integer number greater or equal to zero and less than or equal to maxRating.",
    averageRatingIsInvalid = "Invalid argument: averageRating must be zero or a number greater than or equal to one and less than or equal to maxRating.",
    readOnlyIsInvalid = "Invalid argument: readOnly must be a boolean value.",
    enableClearIsInvalid = "Invalid argument: enableClear must be a boolean value.",
    tooltipStringsIsInvalid = "Invalid argument: tooltipStrings must be null or an array of strings.",
    invalidCreation = "Invalid constructor call: Please use the \"new\" operator to create a rating control.",
    elementCannotBeUpdated = "The element can not be updated.";

// Constants definition
var DEFAULT_MAX_RATING = 5,
    DEFAULT_READ_ONLY = false,
    CANCEL = "cancel",
    CHANGE = "change",
    PREVIEW_CHANGE = "previewchange",
    CLEAR_YOUR_RATING = "Clear your rating",
    PT_TOUCH = 2; // pointer type to indicate a touch event

// CSS class names
var msRating = "win-rating",
    msRatingAverageEmpty = "win-rating-star win-rating-average-empty",
    msRatingAverageFull = "win-rating-star win-rating-average-full",
    msRatingUserEmpty = "win-rating-star win-rating-user-empty",
    msRatingUserFull = "win-rating-star win-rating-user-full",
    msRatingTentativeEmpty = "win-rating-star win-rating-tentative-empty",
    msRatingTentativeFull = "win-rating-star win-rating-tentative-full",
    msRatingDisabledEmpty = "win-rating-star win-rating-disabled-empty",
    msRatingDisabledFull = "win-rating-star win-rating-disabled-full";

// Rating control implementation
WinJS.Namespace.defineWithParent(WinJS, "UI", {
    /// <summary locid="24">
    /// The Rating control allows users to give a number on a scale of 1 to maxRating (5 being the default).
    /// </summary>
    /// <htmlSnippet><![CDATA[<div data-win-control="WinJS.UI.Rating"></div>]]></htmlSnippet>
    /// <event name="previewchange" bubbles="false" locid="25">Raised when the user is choosing a new tentative rating</event>
    /// <event name="cancel" bubbles="false" locid="26">Raised when the user canceled the change that was being previewed</event>
    /// <event name="change" bubbles="false" locid="27">Raised when the rating is getting a new userRating</event>
    /// <part name="rating" class="win-rating" locid="28">The Rating control itself</part>
    /// <part name="average-empty" class="win-rating-star win-rating-average-empty" locid="29">The empty star when showing the average rating</part>
    /// <part name="average-full" class="win-rating-star win-rating-average-full" locid="30">The full star when showing the average rating</part>
    /// <part name="user-empty" class="win-rating-star win-rating-user-empty" locid="31">The empty star when showing the user rating</part>
    /// <part name="user-full" class="win-rating-star win-rating-user-full" locid="32">The full star when showing the user rating</part>
    /// <part name="tentative-empty" class="win-rating-star win-rating-tentative-empty" locid="33">The empty star when showing the tentative rating</part>
    /// <part name="tentative-full" class="win-rating-star win-rating-tentative-full" locid="34">The full star when showing the tentative rating</part>
    /// <part name="disabled-empty" class="win-rating-star win-rating-disabled-empty" locid="35">The empty star when the control is disabled</part>
    /// <part name="disabled-full" class="win-rating-star win-rating-disabled-full" locid="36">The full star when the control is disabled</part>
    /// <resource type="javascript" src="/winjs/js/base.js" shared="true" />
    /// <resource type="javascript" src="/winjs/js/ui.js" shared="true" />
    /// <resource type="javascript" src="/winjs/js/controls.js" shared="true" />
    /// <resource type="css" src="/winjs/css/ui-dark.css" shared="true" />
    Rating: WinJS.Class.define(function (element, options) {
        /// <summary locid="37">
        /// Constructs the Rating control
        /// </summary>
        /// <param name="element" domElement="true" locid="38">
        /// The DOM element to be associated with the Rating control.
        /// </param>
        /// <param name="options" type="object" locid="39">
        /// The set of options to be applied initially to the Rating control.
        /// </param>
        /// <returns type="WinJS.UI.Rating" locid="40">
        /// A Rating control.
        /// </returns>
        if (!(this instanceof WinJS.UI.Rating)) {
            throw new Error(invalidCreation);
        }

        if (!element) {
            throw new Error(elementIsInvalid);
        }

        var rating = utilities.data(element).rating;
        if (rating) {
            return rating;
        }

        this._element = element;
        this._offsetFirstStar = null;
        this._starWidth = null;
        this._lastEventWasChange = false;
        this._tentativeRating = -1;
        this._captured = false;
        this._pointerDownFocus = false;
        this._elements = [];
        this._elementsClassName = [];
        this._toolTips = [];
        this._clearElement = null;
        this._enableClear = true;

        this._maxRating = DEFAULT_MAX_RATING;
        this._userRating = 0;
        this._averageRating = 0;
        this._readOnly = DEFAULT_READ_ONLY;
        this._tooltipStrings = [];

        // Element that is used for showing average rating
        this._averageRatingElement = null;
        this._elementWidth = null;
        this._elementPadding = null;
        this._elementBorder = null;
        this._floatingValue = 0;

        this._setControlSize(options);
        this._createControl();
        this._setOptions(options);
        this._events();
        this._setAccessibilityProperties();

        WinJS.UI.setOptions(this, options);
        // Remember ourselves
        WinJS.UI.setControl(element, this);
        utilities.data(element).rating = this;
    }, {
        /// <field type="Number" locid="41">
        /// The number for the maximum rating
        /// </field>
        maxRating: {
            get: function () {
                return this._maxRating;
            },
            set: function (value) {
                if (value !== this._maxRating) {
                    throw new Error(maxRatingCannotBeUpdated);
                }
            }
        },

        /// <field type="Number" locid="42">
        /// The number for the user rating (from 1 to maxRating, integer number)
        /// </field>
        userRating: {
            get: function () {
                return this._userRating;
            },
            set: function (value) {
                if ((typeof value !== "number") || (value < 0) || (value > this._maxRating) || (Math.floor(value) !== value)) {
                    throw new Error(userRatingIsInvalid);
                }
                this._userRating = value;
                this._updateControl();
            }
        },

        /// <field type="Number" locid="43">
        /// The number for the average rating (0, or from 1 to maxRating, float number)
        /// </field>
        averageRating: {
            get: function () {
                return this._averageRating;
            },
            set: function (value) {
                if ((typeof value !== "number") || ((value < 1) && (value !== 0)) || (value > this._maxRating)) {
                    throw new Error(averageRatingIsInvalid);
                }
                this._averageRating = value;
                this._updateControl();
            }
        },

        /// <field type="Boolean" locid="44">
        /// Whether the control can be modified by users
        /// </field>
        readOnly: {
            get: function () {
                return this._readOnly;
            },
            set: function (value) {
                if (typeof value !== "boolean") {
                    throw new Error(readOnlyIsInvalid);
                }
                this._readOnly = value;
                if (this._readOnly) {
                    this._clearTooltips();
                }
                this._updateControl();
            }
        },

        /// <field type="Boolean" locid="45">
        /// Whether the control allow clear rating functionality
        /// </field>
        enableClear: {
            get: function () {
                return this._enableClear;
            },
            set: function (value) {
                if (typeof value !== "boolean") {
                    throw new Error(enableClearIsInvalid);
                }
                this._enableClear = value;
                this._updateControl();
            }
        },

        /// <field type="Array" locid="46">
        /// Array of strings for the tooltip for each value (index 0 for userRating of 1 and so on).
        /// </field>
        tooltipStrings: {
            get: function () {
                return this._tooltipStrings;
            },
            set: function (value) {
                if (typeof value !== "object") {
                    throw new Error(tooltipStringsIsInvalid);
                }
                this._updateTooltips(value);
            }
        },

        /// <field type="HTMLElement" locid="47">
        /// The element that rating is attached to
        /// </field>
        element: {
            get: function () {
                return this._element;
            },
            set: function (value) {
                if (this._element !== value) {
                    throw new Error(elementCannotBeUpdated);
                }
            }
        },

        /// <summary locid="48">
        /// Adds an event listener
        /// </summary>
        /// <param name="eventName" type="String" locid="49">Event name</param>
        /// <param name="eventCallback" type="Function" locid="50">The event handler function to associate with this event</param>
        /// <param name="capture" type="Boolean" locid="51">Whether the event handler should be called during the capturing phase</param>
        addEventListener: function (eventName, eventCallBack, capture) {
            this._element.addEventListener(eventName, eventCallBack, capture);
        },

        /// <summary locid="52">
        /// Removes an event listener
        /// </summary>
        /// <param name="eventName" type="String" locid="49">Event name</param>
        /// <param name="eventCallback" type="Function" locid="50">The event handler function to associate with this event</param>
        /// <param name="capture" type="Boolean" locid="51">Whether the event handler should be called during the capturing phase</param>
        removeEventListener: function (eventName, eventCallBack, capture) {
            return this._element.removeEventListener(eventName, eventCallBack, capture);
        },

        // Hide the help star if the control is not showing average rating
        _hideAverageRating: function () {
            var style = this._averageRatingElement.style;
            style.paddingLeft = "0px";
            style.paddingRight = "0px";
            style.borderLeft = "0px";
            style.borderRight = "0px";
            style.msBoxFlex = 0;
            style.display = "none";
            style.width = this._resizeStringValue(this._averageRatingElement.currentStyle.width, 0);
        },

        _createControl: function () {
            // rating control could have more than one class name
            utilities.addClass(this._element, msRating);

            // create control
            for (var i = 0; i <= this._maxRating; i++) {
                var oneStar = document.createElement("div");
                this._element.appendChild(oneStar);
                oneStar.id = this._element.id + "_" + i;
                oneStar.className = msRatingUserEmpty;
                this._elementsClassName[i] = msRatingUserEmpty;
                this._elements[i] = oneStar;
                this._tooltipStrings[i] = i + 1;
            }
            this._averageRatingElement = this._elements[this._maxRating];
            this._averageRatingElement.className = msRatingAverageFull;
            this._elementsClassName[this._maxRating] = msRatingAverageFull;
            this._tooltipStrings[this._maxRating] = CLEAR_YOUR_RATING;
            // make invisible the last star
            this._hideAverageRating();

            // add focus capability relative to element's position in the document
            this._element.tabIndex = "0";
        },

        _setAccessibilityProperties: function () {
            this._element.setAttribute("role", "slider");
            this._element.setAttribute("aria-valuemin", 1);
            this._element.setAttribute("aria-valuemax", this._maxRating);
            this._updateAccessibilityProperties();
        },

        _updateAccessibilityProperties: function () {
            var element = this._element;
            element.setAttribute("aria-readOnly", this._readOnly);
            if (this._tentativeRating > 0) {
                element.setAttribute("aria-label", "Tentative Rating");
                element.setAttribute("aria-valuenow", this._tentativeRating);
                element.setAttribute("aria-valuetext", this._tooltipStrings[this._tentativeRating - 1]);
            } else if (this._tentativeRating === 0) {
                element.setAttribute("aria-valuenow", "undefined");
                element.setAttribute("aria-label", "Tentative Rating");
                element.setAttribute("aria-valuetext", "");
            } else if (this._userRating !== 0) {
                element.setAttribute("aria-valuenow", this._userRating);
                element.setAttribute("aria-label", "User Rating");
                element.setAttribute("aria-valuetext", this._tooltipStrings[this._userRating - 1]);
            } else if (this._averageRating !== 0) {
                element.setAttribute("aria-valuenow", this._averageRating);
                element.setAttribute("aria-label", "Average Rating");
                element.setAttribute("aria-valuetext", this._averageRating);
            } else {
                element.setAttribute("aria-valuenow", "undefined");
                element.setAttribute("aria-label", "Average Rating");
                element.setAttribute("aria-valuetext", "");
            }
        },

        _ensureTooltips: function () {
            if (this._toolTips.length === 0) {
                for (var i = 0; i < this._maxRating; i++) {
                    this._toolTips[i] = new WinJS.UI.Tooltip(this._elements[i]);
                }
            }
        },

        // decrement tentative rating by one
        _decrementRating: function () {
            this._closeTooltip();
            var firePreviewChange = true;
            if ((this._tentativeRating === 0) || ((this._tentativeRating === -1) && (this._userRating === 0))) {
                firePreviewChange = false;
            }

            if (this._tentativeRating > 0) {
                this._tentativeRating--;
            } else if (this._tentativeRating === -1) {
                if (this._userRating !== 0) {
                    if (this._userRating > 0) {
                        this._tentativeRating = this._userRating - 1;
                    } else {
                        this._tentativeRating = 0;
                    }
                } else {
                    this._tentativeRating = 0;
                }
            }

            if ((this._tentativeRating === 0) && !this._enableClear) {
                this._tentativeRating = 1;
                firePreviewChange = false;
            }

            this._showTentativeRating(firePreviewChange, "keyboard");
        },

        _events: function () {
            var that = this;
            function ratingHandler(eventName) {
                return {
                    name: eventName,
                    lowerCaseName: eventName.toLowerCase(),
                    handler: function (event) {
                        var fn = that["_on" + eventName];
                        if (fn) {
                            fn.apply(that, [event]);
                        }
                    }
                };
            }

            var eventsRegisteredInLowerCase = [
                    ratingHandler("KeyDown"),
                    ratingHandler("Blur"),
                    ratingHandler("Focus")
                    ];
            var events = [
                    ratingHandler("MSPointerDown"),
                    ratingHandler("MSPointerMove"),
                    ratingHandler("MSPointerUp"),
                    ratingHandler("MSPointerOut"),
                    ratingHandler("DOMNodeInserted"),
                    ratingHandler("DOMAttrModified")
                    ];

            var i;
            for (i = 0; i < eventsRegisteredInLowerCase.length; ++i) {
                this._element.addEventListener(eventsRegisteredInLowerCase[i].lowerCaseName, eventsRegisteredInLowerCase[i].handler, false);
            }
            for (i = 0; i < events.length; ++i) {
                this._element.addEventListener(events[i].name, events[i].handler, false);
            }
        },

        _onDOMNodeInserted: function(eventObject) {
            if (eventObject.target === this._element) {
                this._recalculateStarProperties();
                this._updateControl();
            }
        },

        _recalculateStarProperties: function () {
            this._elementWidth = this._elements[0].currentStyle.width;
            if (this._element.currentStyle.direction === "rtl") {
                this._elementPadding = this._elements[0].currentStyle.paddingRight;
                this._elementBorder = this._elements[0].currentStyle.borderRight;
            } else {
                this._elementPadding = this._elements[0].currentStyle.paddingLeft;
                this._elementBorder = this._elements[0].currentStyle.borderLeft;
            }
        },

        _getStarNumber: function (star) {
            for (var i = 0; i < this._maxRating; i++) {
                if (this._elements[i] === star) {
                    return i;
                }
            }
            // check if it is the average star
            if (this._elements[this._maxRating] === star) {
                return Math.floor(this._averageRating);
            }

            return -1;
        },

        // Hide the help star if the control is not showing average rating
        _hideAverageStar: function () {
            // check if this average rating control
            if (this._averageRating !== 0) {
                // hide the empty star
                this._resetAverageStar(false);
            }
        },

        // increase tentative rating by one
        _incrementRating: function () {
            this._closeTooltip();
            var firePreviewChange = true;
            if ((this._tentativeRating === this._maxRating) || ((this._tentativeRating === -1) && (this._userRating === this._maxRating))) {
                firePreviewChange = false;
            }

            if (this._tentativeRating !== -1) {
                if (this._tentativeRating < this._maxRating) {
                    this._tentativeRating++;
                }
            } else {
                if (this._userRating !== 0) {
                    if (this._userRating < this._maxRating) {
                        this._tentativeRating = this._userRating + 1;
                    } else {
                        this._tentativeRating = this._maxRating;
                    }
                } else {
                    this._tentativeRating = 1;
                }
            }
            this._showTentativeRating(firePreviewChange, "keyboard");
        },

        _onDOMAttrModified: function (eventObject) {
            if ((eventObject.attrName === "dir") || (eventObject.attrName === "style.direction")) {
                this._calculateOffset();
                this._resetAverageStar(true);
                this._updateControl();
            }
        },

        _onMSPointerDown: function (eventObject) {
            eventObject.preventManipulation();
            this._pointerDownFocus = true;
            this._element.focus();
            this._element.msSetPointerCapture(eventObject.pointerId);
            this._captured = true;
            if (eventObject.pointerType === PT_TOUCH) {
                var starNum = this._getStarNumber(eventObject.srcElement);
                if (starNum >= 0) {
                    // increase number by one (stars beginning from 0)
                    this._tentativeRating = starNum + 1;

                    // if the control is read only don't hover stars
                    if (!this._readOnly) {
                        // change states for all stars
                        this._setStarClasses(msRatingTentativeFull, starNum, msRatingTentativeEmpty);
                        // hide help star
                        this._hideAverageStar();
                        this._updateAccessibilityProperties();
                        this._openTooltip("touch");
                        this._raiseEvent(PREVIEW_CHANGE, this._tentativeRating);
                    }
                }
            } else if (!this._readOnly) {
                this._openTooltip("mousedown");
            }
        },

        _onPointerMove: function (eventObject, tooltipType) {
            this._calculateOffset();

            var offsetPointer = eventObject.offsetX;
            var obj = eventObject.target;
            while (obj !== null) {
                offsetPointer += obj.offsetLeft;
                obj = obj.offsetParent;
            }

            var starNum = (offsetPointer - this._offsetFirstStar) / this._starWidth;
            if (this._element.currentStyle.direction === "rtl") {
                starNum *= -1;
            }
            if (starNum < 0) {
                starNum = 0;
            }

            var firePreviewChange = false;
            var newTentativeRating = Math.min(Math.ceil(starNum), this._maxRating);
            if ((newTentativeRating === 0) && !this._enableClear) {
                newTentativeRating = 1;
            }
            if (newTentativeRating !== this._tentativeRating) {
                this._closeTooltip();
                firePreviewChange = true;
            }

            this._tentativeRating = newTentativeRating;
            this._showTentativeRating(firePreviewChange, tooltipType);
        },

        _onPointerUp: function () {
            this._closeTooltip();
            var fireOnChange = false;
            if (this._userRating !== this._tentativeRating) {
                fireOnChange = true;
            }

            if (!this._readOnly) {
                if (this._tentativeRating === 0) {
                    this._clearRating();
                } else {
                    this._setOptions({ userRating: this._tentativeRating });
                }
            }

            if (fireOnChange) {
                this._raiseEvent(CHANGE, this._userRating);
            }
        },

        _onMSPointerMove: function (eventObject) {
            if (eventObject.pointerType === PT_TOUCH) {
                this._onPointerMove(eventObject, "touch");
            } else {
                if (this._captured) {
                    this._onPointerMove(eventObject, "mousedown");
                } else {
                    this._onPointerMove(eventObject, "mouseover");
                }
            }
        },

        _onMSPointerUp: function (eventObject) {
            this._element.msReleasePointerCapture(eventObject.pointerId);
            this._captured = false;
            this._onPointerUp();
        },

        _calculateOffset: function () {
            this._starWidth = this._elements[0].offsetWidth;
            this._offsetFirstStar = 0;
            var obj = this._elements[0];
            if (this._element.currentStyle.direction === "rtl") {
                this._offsetFirstStar = obj.offsetWidth;
            }
            do {
                this._offsetFirstStar += obj.offsetLeft;
                obj = obj.offsetParent;
            } while (obj !== null);
        },

        _clearRating: function () {
            this._userRating = 0;
            this._updateControl();
        },

        _onBlur: function () {
            if (!this._captured) {
                this._showCurrentRating();
                if (!this._readOnly && !this._lastEventWasChange) {
                    this._raiseEvent(CANCEL, null);
                }
            }
        },

        _onFocus: function () {
            if (!this._pointerDownFocus) {
                // if the control is read only don't hover stars
                if (!this._readOnly) {
                    // change states for all previous stars
                    // but only if user didnt vote
                    if (this._userRating === 0) {
                        for (var i = 0; i < this._maxRating; i++) {
                            this._elements[i].className = msRatingTentativeEmpty;
                        }
                    }
                    // hide the help star
                    this._hideAverageStar();
                }

                if (this._userRating !== 0) {
                    this._raiseEvent(PREVIEW_CHANGE, this._userRating);
                } else {
                    this._raiseEvent(PREVIEW_CHANGE, 0);
                }
                this._tentativeRating = this._userRating;
                this._updateAccessibilityProperties();
            }
            this._pointerDownFocus = false;
        },

        _onKeyDown: function (eventObject) {
            var Key = utilities.Key;
            var keyCode = eventObject.keyCode;
            var rtlString = this._element.currentStyle.direction;
            var handled = true;
            switch (keyCode) {
                case Key.enter: // Enter
                    this._closeTooltip();
                    // check tentative rating
                    if (this._tentativeRating >= 0) {
                        // check onchange event
                        var fireOnChange = false;
                        if (this._userRating !== this._tentativeRating) {
                            fireOnChange = true;
                        }
                        this._setOptions({ userRating: this._tentativeRating });
                        if (fireOnChange) {
                            this._raiseEvent(CHANGE, this._userRating);
                        }
                    }
                    break;
                case Key.escape: // escape
                    this._showCurrentRating();

                    if (!this._readOnly && !this._lastEventWasChange) {
                        this._raiseEvent(CANCEL, null);
                    }

                    break;
                case Key.leftArrow: // Arrow Left
                    if (rtlString === "rtl") {
                        this._incrementRating();
                    } else {
                        this._decrementRating();
                    }
                    break;
                case Key.upArrow: // Arrow Up
                    this._incrementRating();
                    break;
                case Key.rightArrow: // Arrow Right
                    if (rtlString === "rtl") {
                        this._decrementRating();
                    } else {
                        this._incrementRating();
                    }
                    break;
                case Key.downArrow: // Arrow Down
                    this._decrementRating();
                    break;
                default:
                    var number = 0;
                    if ((keyCode >= Key.num0) && (keyCode <= Key.num9)) {
                        number = Key.num0;
                    } else if ((keyCode >= Key.numPad0) && (keyCode <= Key.numPad9)) {
                        number = Key.numPad0;
                    }

                    if (number > 0) {
                        var firePreviewChange = false;
                        var newTentativeRating = Math.min(keyCode - number, this._maxRating);
                        if ((newTentativeRating === 0) && !this._enableClear) {
                            newTentativeRating = 1;
                        }
                        if (newTentativeRating !== this._tentativeRating) {
                            this._closeTooltip();
                            firePreviewChange = true;
                        }
                        this._tentativeRating = newTentativeRating;
                        this._showTentativeRating(firePreviewChange, "keyboard");
                    } else {
                        handled = false;
                    }
            }

            if (handled) {
                eventObject.stopPropagation();
                eventObject.preventDefault();
            }
        },

        _onMSPointerOut: function (eventObject) {
            // skip pointer out events between the stars
            if (!this._captured && (this._getStarNumber(eventObject.toElement) < 0) && (this._element !== eventObject.toElement)) {
                this._showCurrentRating();
                // do not fire cancel event if we are changing rating on the same control
                if (((this._getStarNumber(eventObject.fromElement) < 0) || (this._getStarNumber(eventObject.toElement) < 0)) && !this._lastEventWasChange) {
                    this._raiseEvent(CANCEL, null);
                }
            }
        },

        _raiseEvent: function (eventName, tentativeRating) {
            this._lastEventWasChange = (eventName === CHANGE);
            if (document.createEvent) {
                var event = document.createEvent("Event");
                event.initEvent(eventName, false, false);
                event.tentativeRating = tentativeRating;
                this._element.dispatchEvent(event);
            }
        },

        _resetNextElement: function (prevState) {
            if (this._averageRatingElement.nextSibling !== null) {
                var style = this._averageRatingElement.nextSibling.style;
                style.msBoxFlex = 1;
                var direction = this._element.currentStyle.direction;
                if (prevState) { 
                    if (direction === "rtl") {
                        direction = "ltr";
                    } else {
                        direction = "rtl";
                    }
                }
                if (direction === "rtl") {
                    style.paddingRight = this._elementPadding;
                    style.borderRight = this._elementBorder;
                } else {
                    style.paddingLeft = this._elementPadding;
                    style.borderLeft = this._elementBorder;
                }
                style.backgroundPosition = "left";
                style.backgroundSize = "100% 100%";
                style.width = this._elementWidth;
                style.textIndent = this._resizeStringValue(this._elementWidth, 0);
            }
        },

        _resetAverageStar: function (prevState) {
            this._resetNextElement(prevState);
            this._hideAverageRating();
        },

        _resizeStringValue: function (string, factor) {
            var number = parseFloat(string);
            if (isNaN(number)) {
                return string;
            }
            var unit = string.substring(number.toString(10).length);
            number = number * factor;
            return (number + unit);
        },

        _setControlSize: function (options) {
            if (options !== undefined) {
                if ("maxRating" in options) {
                    if ((typeof options.maxRating === "number") && (options.maxRating > 0) && (Math.floor(options.maxRating) === options.maxRating)) {
                        this._maxRating = options.maxRating;
                    } else {
                        throw new Error(maxRatingIsInvalid);
                    }
                }
            }
        },

        _setCurrentStarClasses: function (classNameBeforeThreshold, threshold, classNameAfterThreshold) {
            for (var i = 0; i < this._maxRating; i++) {
                if (i <= threshold) {
                    this._elementsClassName[i] = classNameBeforeThreshold;
                } else {
                    this._elementsClassName[i] = classNameAfterThreshold;
                }
            }
        },

        _updateTooltips: function (value) {
            var i, max = 0;
            if (value !== null) {
                max = ((value.length <= this._maxRating + 1) ? value.length : this._maxRating + 1);
                for (i = 0; i < max; i++) {
                    this._tooltipStrings[i] = value[i];
                }
            } else {
                for (i = 0; i < this._maxRating; i++) {
                    this._tooltipStrings[i] = i + 1;
                }
                this._tooltipStrings[this._maxRating] = CLEAR_YOUR_RATING;
            }
        },

        _setOptions: function (options) {
            if (options !== undefined) {
                if ("userRating" in options) {
                    this._userRating = options.userRating;
                }
                if ("averageRating" in options) {
                    this._averageRating = options.averageRating;
                }
                if ("readOnly" in options) {
                    this._readOnly = options.readOnly;
                    this._element.tabIndex = (this._readOnly ? "-1" : "0");
                }
                if ("tooltipStrings" in options) {
                    this._updateTooltips(options.tooltipStrings);
                }
                if ("enableClear" in options) {
                    this._enableClear = options.enableClear;
                }
            }

            this._updateControl();
        },

        _setStarClasses: function (classNameBeforeThreshold, threshold, classNameAfterThreshold) {
            for (var i = 0; i < this._maxRating; i++) {
                if (i <= threshold) {
                    this._elements[i].className = classNameBeforeThreshold;
                } else {
                    this._elements[i].className = classNameAfterThreshold;
                }
            }
        },

        _updateFloatingStar: function () {
            var style = this._averageRatingElement.style;
            var nextStyle = this._averageRatingElement.nextSibling.style;
            if (this._element.currentStyle.direction == "rtl") {
                style.backgroundPosition = "right";
                style.paddingRight = this._elementPadding;
                style.borderRight = this._elementBorder;
                nextStyle.paddingRight = "0px";
                nextStyle.borderRight = "0px";
                nextStyle.textIndent = "-" + this._resizeStringValue(this._elementWidth, this._floatingValue);
            } else {
                style.backgroundPosition = "left";
                nextStyle.backgroundPosition = "right";
                style.paddingLeft = this._elementPadding;
                style.borderLeft = this._elementBorder;
                nextStyle.paddingLeft = "0px";
                nextStyle.borderLeft = "0px";
                nextStyle.textIndent = "-" + this._resizeStringValue(this._elementWidth, this._floatingValue);
            }
            style.width = this._resizeStringValue(this._elementWidth, this._floatingValue);
            style.msBoxFlex = this._floatingValue;
            style.backgroundSize = (100 / this._floatingValue) + "% 100%";
            style.display = this._averageRatingElement.nextSibling.currentStyle.display;
            nextStyle.msBoxFlex = 1 - this._floatingValue;
            nextStyle.width = this._resizeStringValue(this._elementWidth, 1 - this._floatingValue);
            nextStyle.backgroundSize = (100 / (1 - this._floatingValue)) + "% 100%";
        },

        // show current rating
        _showCurrentRating: function () {
            this._closeTooltip();
            // reset tentative rating
            this._tentativeRating = -1;
            // if the control is read only then we didn't change anything on hover
            if (!this._readOnly) {
                if (this._elementsClassName !== null) {
                    for (var i = 0; i < this._maxRating; i++) {
                        this._elements[i].className = this._elementsClassName[i];
                    }
                    // check for average value
                    if ((this._averageRating !== 0) && (this._userRating === 0)) {
                        this._updateFloatingStar();
                    }
                }
            }
            this._updateAccessibilityProperties();
        },

        _showTentativeRating: function (firePreviewChange, tooltipType) {
            // if the control is read only don't hover stars
            if ((!this._readOnly) && (this._tentativeRating >= 0)) {
                this._setStarClasses(msRatingTentativeFull, this._tentativeRating - 1, msRatingTentativeEmpty);

                // hide the empty star
                this._hideAverageStar();
            }

            this._updateAccessibilityProperties();

            if (!this._readOnly && firePreviewChange) {
                this._openTooltip(tooltipType);
                this._raiseEvent(PREVIEW_CHANGE, this._tentativeRating);
            }
        },

        _openTooltip: function (tooltipType) {
            this._ensureTooltips();
            if (this._tentativeRating > 0) {
                this._toolTips[this._tentativeRating - 1].innerHTML = this._tooltipStrings[this._tentativeRating - 1];
                this._toolTips[this._tentativeRating - 1].open(tooltipType);
            } else if (this._tentativeRating === 0) {
                this._clearElement = document.createElement("div");
                var style = this._clearElement.style;
                style.visible = "hidden";
                style.position = "relative";
                style.width = "0px";
                style.height = "0px";
                this._elements[0].appendChild(this._clearElement);
                var distance = this._elements[0].offsetWidth + parseInt(this._elementPadding, 10);
                if (this._element.currentStyle.direction === "rtl") {
                    style.left = distance + "px";
                } else {
                    style.left = -distance + "px";
                }
                style.top = -(this._element.offsetHeight) + "px";
                this._toolTips[this._maxRating] = new WinJS.UI.Tooltip(this._clearElement);
                this._toolTips[this._maxRating].innerHTML = this._tooltipStrings[this._maxRating];
                this._toolTips[this._maxRating].open(tooltipType);
            }
        },

        _closeTooltip: function (tooltipType) {
            if (this._toolTips.length !== 0) {
                if (this._tentativeRating > 0) {
                    this._toolTips[this._tentativeRating - 1].close();
                } else if (this._tentativeRating === 0) {
                    if (this._clearElement !== null) {
                        this._toolTips[this._maxRating].close();
                        this._elements[0].removeChild(this._clearElement);
                        this._clearElement = null;
                    }
                }
            }
        },

        _clearTooltips: function () {
            if (this._toolTips.length !== 0) {
                for (var i = 0; i < this._maxRating; i++) {
                    this._toolTips[i].innerHTML = null;
                }
            }
        },

        _updateControl: function () {
            var i;
            // check for average rating (if user rating is specified then we are not showing average rating)
            if ((this._averageRating !== 0) && (this._userRating === 0)) {
                if ((this._averageRating >= 1) && (this._averageRating <= this._maxRating)) {
                    for (i = 0; i < this._maxRating; i++) {
                        if ((i + 1) < this._averageRating) {
                            this._elements[i].className = msRatingAverageFull;
                            this._elementsClassName[i] = msRatingAverageFull;
                        } else {
                            this._elements[i].className = msRatingAverageEmpty;
                            this._elementsClassName[i] = msRatingAverageEmpty;
                        }
                        // check if it is floating star
                        if ((i < this._averageRating) && ((i + 1) >= this._averageRating)) {
                            this._resetNextElement(false);

                            this._element.insertBefore(this._elements[this._maxRating], this._elements[i]);

                            this._floatingValue =  this._averageRating - i;
                            this._elementWidth = this._elements[i].currentStyle.width;

                            if (this._element.currentStyle.direction == "rtl") {
                                this._elementPadding = this._elements[i].currentStyle.paddingRight;
                                this._elementBorder = this._elements[i].currentStyle.borderRight;
                            } else {
                                this._elementPadding = this._elements[i].currentStyle.paddingLeft;
                                this._elementBorder = this._elements[i].currentStyle.borderLeft;
                            }

                            this._updateFloatingStar();
                        }
                    }
                }
            }

            // check if it is user rating control
            if (this._userRating !== 0) {
                if ((this._userRating >= 1) && (this._userRating <= this._maxRating)) {
                    for (i = 0; i < this._maxRating; i++) {
                        if (i < this._userRating) {
                            if (this._readOnly) {
                                this._elements[i].className = msRatingDisabledFull;
                                this._elementsClassName[i] = msRatingDisabledFull;
                            } else {
                                this._elements[i].className = msRatingUserFull;
                                this._elementsClassName[i] = msRatingUserFull;
                            }
                        } else {
                            if (this._readOnly) {
                                this._elements[i].className = msRatingDisabledEmpty;
                                this._elementsClassName[i] = msRatingDisabledEmpty;
                            } else {
                                this._elements[i].className = msRatingUserEmpty;
                                this._elementsClassName[i] = msRatingUserEmpty;
                            }
                        }
                    }

                    // hide helping floating star
                    this._resetAverageStar(false);
                }
            }

            // update hearts if the rating is not set
            if ((this._userRating === 0) && (this._averageRating === 0)) {
                for (i = 0; i < this._maxRating; i++) {
                    if (this._readOnly) {
                        this._elements[i].className = msRatingDisabledEmpty;
                        this._elementsClassName[i] = msRatingDisabledEmpty;
                    } else {
                        this._elements[i].className = msRatingUserEmpty;
                        this._elementsClassName[i] = msRatingUserEmpty;
                    }
                }

                // hide helping floating star
                this._resetAverageStar(false);
            }

            this._updateAccessibilityProperties();
        }
    })
});

})(this, WinJS);


(function (global) {

// Error messages
var elementIsInvalid = "Invalid argument: Toggle control expects a valid DOM element as the first argument.",
    invalidCreation = "Invalid constructor call: Please use the \"new\" operator to create a toggle switch.";

// Const definitions
var LABEL_ON = "On",
    LABEL_OFF = "Off";

// CSS class names
var msToggle = "win-toggle",
    msToggleSwitch = "win-toggle-switch",
    msToggleTitle = "win-toggle-title",
    msToggleLabelOn = "win-toggle-label-on",
    msToggleLabelOff = "win-toggle-label-off";

var Control = WinJS.Class.define(null, {
    raiseEvent: function (type, eventProperties) {
        this.dispatchEvent(type, eventProperties);
    }
});

var utilities = WinJS.Utilities;

WinJS.Class.mix(Control, WinJS.UI.DOMEventMixin);

WinJS.Namespace.defineWithParent(WinJS, "UI", {
    /// <summary locid="53">
    /// The Toggle control is similar to a light switch with 2 positions: on or off
    /// </summary>
    /// <htmlSnippet><![CDATA[<div data-win-control="WinJS.UI.Toggle"></div>]]></htmlSnippet>
    /// <event name="change" bubbles="true" locid="54">Raised when the switch is flipped</event>
    /// <part name="toggle" class="win-toggle" locid="55">The Toggle control itself</part>
    /// <part name="switch" class="win-toggle-switch" locid="56">The slider part that allows user to switch the state</part>
    /// <part name="title" class="win-toggle-title" locid="57">The main text for this Toggle control</part>
    /// <part name="label-on" class="win-toggle-label-on" locid="58">The text for when the switch is on (defaults to On)</part>
    /// <part name="label-off" class="win-toggle-label-off" locid="59">The text for when the switch is off (defaults to Off)</part>
    /// <resource type="javascript" src="/winjs/js/base.js" shared="true" />
    /// <resource type="javascript" src="/winjs/js/ui.js" shared="true" />
    /// <resource type="javascript" src="/winjs/js/controls.js" shared="true" />
    /// <resource type="css" src="/winjs/css/ui-dark.css" shared="true" />
    Toggle: WinJS.Class.derive(Control, function (element, options) {
        /// <summary locid="60">
        /// Constructs the Toggle control
        /// </summary>
        /// <param name="element" domElement="true" locid="61">
        /// The DOM element to be associated with the Toggle control.
        /// </param>
        /// <param name="options" type="object" locid="62">
        /// The set of options to be applied initially to the Toggle control.
        /// </param>
        /// <returns type="WinJS.UI.Toggle" locid="63">
        /// A Toggle control.
        /// </returns>
        if (!(this instanceof WinJS.UI.Toggle)) {
            throw new Error(invalidCreation);
        }

        if (!element) {
            throw new Error(elementIsInvalid);
        }

        var toggle = utilities.data(element).toggle;
        if (toggle) {
            return toggle;
        }

        // Elements
        this._domElement = null;
        this._switchElement = null;
        this._titleElement = null;
        this._labelElement = null;

        // Strings
        this._labelOn = LABEL_ON;
        this._labelOff = LABEL_OFF;

        // Variable
        this._spaceKeyDown = false;
        this._valueChanged = false;
        this._mouseDownWithoutMove = false;

        this._setElement(element);
        this._setDefaultOptions();
        WinJS.UI.setOptions(this, options);
        this._domElement.setAttribute("aria-checked", this._checked);
        WinJS.UI.setControl(element, this);
        utilities.data(element).toggle = this;
    }, {
        // Properties

        /// <field type="Boolean" locid="64">
        /// Whether the state is On (checked is true) or Off (false)
        /// </field>
        checked: {
            get: function () {
                return this._checked;
            },
            set: function (value) {
                this._checked = !!value; // Sanitize the value so _checked will be only true or false (ex: null/undefined will be translated into false)
                this._setChecked(value);
            }
        },
        /// <field type="Boolean" locid="65">
        /// Whether the control is enabled
        /// </field>
        disabled: {
            get: function () {
                return this._switchElement.disabled;
            },
            set: function (value) {
                var disabled = !!value; // Sanitize for a bool
                this._domElement.disabled = disabled;
                this._switchElement.disabled = disabled; // This is necessary to apply the css
                this._domElement.setAttribute("aria-disabled", disabled);
            }
        },
        /// <field type="String" locid="66">
        /// The text for when the switch is On
        /// </field>
        labelOn: {
            get: function () {
                return this._labelOn;
            },
            set: function (value) {
                this._labelOn = value;
                if (this._checked) { // It's On now
                    this._labelElement.innerHTML = this._labelOn;
                }
            }
        },
        /// <field type="String" locid="67">
        /// The text for when the switch is Off
        /// </field>
        labelOff: {
            get: function () {
                return this._labelOff;
            },
            set: function (value) {
                this._labelOff = value;
                if (!this._checked) { // It's Off now
                    this._labelElement.innerHTML = this._labelOff;
                }
            }
        },
        /// <field type="String" locid="57">
        /// The main text for this Toggle control
        /// </field>
        title: {
            get: function () {
                return this._titleElement.innerHTML;
            },
            set: function (value) {
                this._titleElement.innerHTML = value;
            }
        },

        _addControlsInOrder: function () {
            this._domElement.appendChild(this._titleElement);
            this._domElement.appendChild(this._labelElement);
            this._domElement.appendChild(this._switchElement);
        },

        _setChecked: function (value) {
            if (value) { // On state
                utilities.addClass(this._labelElement, msToggleLabelOn);
                this._labelElement.innerHTML = this._labelOn;
                this._switchElement.valueAsNumber = 1; // Update the slider visual
            } else { // Off state
                utilities.addClass(this._labelElement, msToggleLabelOff);
                this._labelElement.innerHTML = this._labelOff;
                this._switchElement.valueAsNumber = 0; // Update the slider visual
            }
        },

        _setDefaultOptions: function () {
            this.labelOn = LABEL_ON;
            this.labelOff = LABEL_OFF;
            this.title = "";
            this.checked = false;
            this.disabled = false;
        },

        _setElement: function (element) {
            this._domElement = element;
            utilities.addClass(this._domElement, msToggle);

            this._switchElement = document.createElement("input");
            this._switchElement.type = "range";
            this._switchElement.max = 1;
            this._switchElement.step = 1;
            utilities.addClass(this._switchElement, msToggleSwitch);

            this._titleElement = document.createElement("div");
            var id = utilities.generateID("toggle-");
            this._titleElement.setAttribute("id", id);
            utilities.addClass(this._titleElement, msToggleTitle);

            this._labelElement = document.createElement("div");
            utilities.addClass(this._labelElement, msToggleLabelOff);

            this._addControlsInOrder();

            this._wireupEvents();
            this._domElement.setAttribute("role", "checkbox");
            this._domElement.setAttribute("aria-labelledby", id);
        },

        _valueHandler: function (fTapped) {
            var oldValue = this._checked;
            if (fTapped) {
                this.checked = !this.checked;
            } else {
                this.checked = this._switchElement.valueAsNumber;
            }

            if (oldValue !== this._checked) {
                this._domElement.setAttribute("aria-checked", this._checked);
                this.raiseEvent("change");
                this._valueChanged = true;
            } else {
                this._valueChanged = false;
            }
        },

        _wireupEvents: function () {
            var that = this;
            var touchUpHandler = function (event) {
                that._valueHandler(false);
            };
            var reloadChangeHandler = function (event) {
                if (event.propertyName === "defaultValue") {
                    that.checked = that._switchElement.valueAsNumber;
                }
            };
            var spaceDownHandler = function (event) {
                if (event.keyCode === utilities.Key.space && !that._spaceKeyDown) { // Spacebar
                    that._switchElement.valueAsNumber = (that._switchElement.valueAsNumber + 1) % 2;
                    that._spaceKeyDown = true;
                }
            };
            var keyUpHandler = function (event) {
                if (event.keyCode === utilities.Key.space || (event.keyCode >= utilities.Key.end && event.keyCode <= utilities.Key.downArrow)) { // Spacebar and arrow, home/end key
                    that._valueHandler(false);
                    if (event.keyCode === 32) {
                        that._spaceKeyDown = false;
                    }
                }
            };
            var tapHandler = function () {
                if (!that._valueChanged) {
                    that._valueHandler(true);
                }
            };
            this._switchElement.addEventListener("MSPointerUp", touchUpHandler, false);
            this._switchElement.addEventListener("MSGestureTap", tapHandler, false);
            this._switchElement.addEventListener("keydown", spaceDownHandler, false);
            this._switchElement.addEventListener("keyup", keyUpHandler, false);
            this._switchElement.attachEvent("onpropertychange", reloadChangeHandler);
            this._switchElement.addEventListener("change", function (ev) { ev.stopPropagation(); }, true);
        }
    })
});

})(WinJS);


// Semantic Zoom control

(function (global) {

    var Utilities = WinJS.Utilities,
        UI = WinJS.UI;

    // Private statics

    var semanticZoomClass = "win-semanticzoom";

    var zoomChangedEvent = "zoomchanged";

    var bounceFactor = 1.05;

    var canvasSizeMax = 4096;

    var outgoingOpacityTransitionDuration = 0.333;
    var incomingOpacityTransitionDuration = 0.333;
    var outgoingScaleTransitionDuration = 0.333;
    var incomingScaleTransitionDuration = 0.333;
    var bounceInDuration = 0.167;
    var bounceBackDuration = 0.333;
    var correctionTransitionDuration = 0.333;

    var outgoingElementTransition = "-ms-transform " + outgoingScaleTransitionDuration + "s ease-in, opacity " + outgoingOpacityTransitionDuration + "s ease-in";
    var incomingElementTransition = "-ms-transform " + incomingScaleTransitionDuration + "s ease-in, opacity " + incomingOpacityTransitionDuration + "s ease-in";
    var bounceInTransition = "-ms-transform " + bounceInDuration + "s ease-in";
    var bounceBackTransition = "-ms-transform " + bounceBackDuration + "s ease-in";
    var correctionTransition = "-ms-transform " + correctionTransitionDuration + "s ease-in";

    var pinchDistance = 10;
    var abandonEventsDistance = 10;

    var PinchDirection = {
        none: 0,
        zoomedIn: 1,
        zoomedOut: 2
    };

    var PT_TOUCH = 2;

    function scaleElement(element, scale) {
        element.style["-ms-transform"] = "scale(" + scale + ")";
    }

    var origin = { x: 0, y: 0 };

    function translateElement(element, offset) {
        element.style["-ms-transform"] = "translate(" + offset.x + "px, " + offset.y + "px)";
    }

    function onSemanticZoomResize(ev) {
        WinJS.UI.getControl(ev.srcElement)._onResize();
    }

    WinJS.Namespace.define("WinJS.UI", {

        /// <summary locid="68">
        /// The SemanticZoom allows the user to zoom in and out between two child controls
        /// </summary>
        /// <htmlSnippet><![CDATA[<div data-win-control="WinJS.UI.SemanticZoom"><div data-win-control="ZoomedInControlType"></div><div data-win-control="ZoomedOutControlType"></div></div>]]></htmlSnippet>
        /// <part name="semanticZoom" class="win-semanticzoom" locid="69">The SemanticZoom itself</part>
        /// <resource type="javascript" src="/winjs/js/base.js" shared="true" />
        /// <resource type="javascript" src="/winjs/js/ui.js" shared="true" />
        /// <resource type="javascript" src="/winjs/js/animations.js" shared="true" />
        /// <resource type="javascript" src="/winjs/js/controls.js" shared="true" />
        /// <resource type="css" src="/winjs/css/controls.css" shared="true" />
            SemanticZoom: WinJS.Class.define(function (element, options) {
            /// <summary locid="70">
            /// Constructs a SemanticZoom
            /// </summary>
            /// <param name="element" domElement="true" locid="71">
            /// The DOM element to be associated with the SemanticZoom control.
            /// </param>
            /// <param name="options" type="object" locid="72">
            /// The set of options to be applied initially to the SemanticZoom control.
            /// </param>
            /// <returns type="WinJS.UI.SemanticZoom" locid="73">
            /// A SemanticZoom control.
            /// </returns>

            var that = this;

            this._element = element;
            Utilities.addClass(this._element, semanticZoomClass);

            this._zoomedOut = false;
            this._zoomFactor = 0.65;   // Value used by the shell

            function identity(item) { return item; }
            this._zoomedInItem = identity;
            this._zoomedOutItem = identity;

            if (options) {
                if (options.initiallyZoomedOut) {
                    this._zoomedOut = true;
                }

                var zoomFactor = options.zoomFactor;
                if (zoomFactor !== undefined) {
                    if (typeof zoomFactor === "number" && 0.2 <= zoomFactor && zoomFactor <= 0.8) {
                        this._zoomFactor = zoomFactor;
                    } else {
                        throw new Error("Invalid zoomFactor");  // TODO: Use proper validation pattern, once known
                    }
                }

                if (options.zoomedInItem) {
                    this._zoomedInItem = options.zoomedInItem;
                }

                if (options.zoomedOutItem) {
                    this._zoomedOutItem = options.zoomedOutItem;
                }
            }

            this._locked = false;

            this._zoomInProgress = false;
            this._bouncing = false;
            this._zooming = false;
            this._aligning = false;
            this._correcting = false;
            this._gesturing = false;
            this._gestureEnding = false;

            this._adjustment = null;

            // Zoomed in and zoomed out controls must be on the first two child elements
            // TODO: Plenty of opportunities for validation here

            var children = Utilities.children(this._element);
            this._elementIn = children[0];
            this._elementOut = children[1];

            // Ensure the child controls have the same height as the SemanticZoom element
            
            this._elementIn.style.height = this._elementOut.style.height = this._element.offsetHeight + "px";

            // Create the child controls if they haven't been created already

            UI.processAll(this._elementIn);
            UI.processAll(this._elementOut);

            this._viewIn = WinJS.UI.getControl(this._elementIn).zoomableView;
            this._viewOut = WinJS.UI.getControl(this._elementOut).zoomableView;

            // Configure the controls for zooming

            var axisIn = this._viewIn.getPanAxis(),
                axisOut = this._viewOut.getPanAxis();
            this._pansHorizontallyIn = (axisIn === "horizontal" || axisIn === "both");
            this._pansVerticallyIn = (axisIn === "vertical" || axisIn === "both");
            this._pansHorizontallyOut = (axisOut === "horizontal" || axisOut === "both");
            this._pansVerticallyOut = (axisOut === "vertical" || axisOut === "both");

            function zoomFromCurrent(zoomOut) {
                that._zoom(zoomOut, null, false, true);
            }

            var pagesToPrefetchIn = 1 / this._zoomFactor - 1,
                pagesToPrefetchOut = bounceFactor - 1;

            this._viewIn.configureForZoom(false, !this._zoomedOut, function () { zoomFromCurrent(true); }, pagesToPrefetchIn);
            this._viewOut.configureForZoom(true, this._zoomedOut, function () { zoomFromCurrent(false); }, pagesToPrefetchOut);

            // Remove the children and place them beneath new divs that will serve as canvases and viewports

            this._element.removeChild(this._elementOut);
            this._element.removeChild(this._elementIn);
            this._element.innerHTML = "";
            this._viewportIn = document.createElement("div");
            this._viewportOut = document.createElement("div");
            this._element.appendChild(this._viewportIn);
            this._element.appendChild(this._viewportOut);
            this._canvasIn = document.createElement("div");
            this._canvasOut = document.createElement("div");
            this._viewportIn.appendChild(this._canvasIn);
            this._viewportOut.appendChild(this._canvasOut);
            this._canvasIn.appendChild(this._elementIn);
            this._canvasOut.appendChild(this._elementOut);

            // Set layout behavior

            function setLayout(element, position, overflow) {
                var style = element.style;
                style.position = position;
                style.overflow = overflow;
            }
            setLayout(this._element, "relative", "hidden");
            setLayout(this._viewportIn, "absolute", "visible");
            setLayout(this._viewportOut, "absolute", "visible");
            setLayout(this._canvasIn, "absolute", "hidden");
            setLayout(this._canvasOut, "absolute", "hidden");
            setLayout(this._elementIn, "absolute", "visible");
            setLayout(this._elementOut, "absolute", "visible");

            this._canvasLeftIn = 0;
            this._canvasTopIn = 0;
            this._canvasLeftOut = 0;
            this._canvasTopOut = 0;

            // Set scales and opacity

            if (this._zoomedOut) {
                scaleElement(this._canvasIn, this._zoomFactor);
            } else {
                scaleElement(this._canvasOut, 1 / this._zoomFactor);
            }

            var styleViewportIn = this._viewportIn.style,
                styleViewportOut = this._viewportOut.style,
                styleCanvasIn = this._canvasIn.style,
                styleCanvasOut = this._canvasOut.style;

            styleCanvasIn.opacity = (this._zoomedOut ? 0 : 1);
            styleCanvasOut.opacity = (this._zoomedOut ? 1 : 0);

            // Enable animation

            styleViewportIn["-ms-transition-property"] = "-ms-transform";
            styleViewportIn["-ms-transition-duration"] = "0s";
            styleViewportIn["-ms-transition-timing-function"] = "linear";

            styleViewportOut["-ms-transition-property"] = "-ms-transform";
            styleViewportOut["-ms-transition-duration"] = "0s";
            styleViewportOut["-ms-transition-timing-function"] = "linear";

            // Register event handlers

            this._element.attachEvent("onresize", onSemanticZoomResize);
            this._element.addEventListener("mousewheel", function (ev) { return that._onMouseWheel(ev); }, true);
            this._element.addEventListener("focus", function (ev) { that._hasKeyboardFocus = true; }, true);
            this._element.addEventListener("blur", function (ev) { that._hasKeyboardFocus = false; }, true);
            this._element.addEventListener("keydown", function (ev) { return that._onKeyDown(ev); }, true);
            this._element.addEventListener("MSPointerDown", this._onPointerDownBubbling.bind(this), false);
            this._element.addEventListener("MSPointerDown", this._onPointerDownCapturing.bind(this), true);
            this._element.addEventListener("MSPointerMove", this._onPointerMove.bind(this), true);
            this._element.addEventListener("MSPointerUp", this._onPointerUp.bind(this), false);
            this._element.addEventListener("MSLostPointerCapture", this._onLostPointerCapture.bind(this), false);
            this._element.addEventListener("MSManipulationStateChanged", this._onManipulationStateChanged.bind(this), true);
            this._viewportIn.addEventListener("MSTransitionEnd", function (ev) { return that._onViewportTransitionEnd(ev); }, false);
            this._canvasIn.addEventListener("MSTransitionEnd", function (ev) { return that._onCanvasTransitionEnd(ev); }, false);
            this._resetPointerRecords();

            // Associate the control with the element

            WinJS.UI.setControl(element, this);

            that._onResize();

            msSetImmediate(function () {
                // Present the initial view

                that._setVisibility();
            });
        }, {
            // Public members

            /// <field type="Boolean" locid="74">
            /// True if the zoomed out view is currently being displayed
            /// </field>
            zoomedOut: {
                get: function () {
                    return this._zoomedOut;
                },
                set: function (value) {
                    this._zoom(!!value);
                }
            },

            /// <field type="Boolean" locid="75">
            /// If true, the zoom level cannot be changed
            /// </field>
            locked: {
                get: function () {
                    return this._locked;
                },
                set: function (value) {
                    this._locked = !!value;
                }
            },

            /// <summary locid="48">
            /// Adds an event listener
            /// </summary>
            /// <param name="eventName" type="String" locid="49">Event name</param>
            /// <param name="eventCallback" type="Function" locid="50">The event handler function to associate with this event</param>
            /// <param name="capture" type="Boolean" locid="51">Whether the event handler should be called during the capturing phase</param>
            addEventListener: function (eventName, eventHandler, useCapture) {
                return this._element.addEventListener(eventName, eventHandler, useCapture);
            },

            /// <summary locid="52">
            /// Removes an event listener
            /// </summary>
            /// <param name="eventName" type="String" locid="49">Event name</param>
            /// <param name="eventCallback" type="Function" locid="50">The event handler function to associate with this event</param>
            /// <param name="capture" type="Boolean" locid="51">Whether the event handler should be called during the capturing phase</param>
            removeEventListener: function (eventName, eventHandler, useCapture) {
                return this._element.removeEventListener(eventName, eventHandler, useCapture);
            },

            // Private members

            _onResize: function () {
                msSetImmediate((function() {
                    function positionElement(element, left, top, width, height) {
                        var style = element.style;
                        style.left = left + "px";
                        style.top = top + "px";
                        style.width = width + "px";
                        style.height = height + "px";
                    }

                    var viewportWidth = this._element.clientWidth,
                        viewportHeight = this._element.clientHeight,
                        scaleFactor = 1 / this._zoomFactor,
                        excess = 0.5 * (scaleFactor - 1);

                    var multiplierIn = 2 * scaleFactor - 1,
                        canvasInWidth = Math.min(canvasSizeMax, (this._pansHorizontallyIn ? multiplierIn : 1) * viewportWidth),
                        canvasInHeight = Math.min(canvasSizeMax, (this._pansVerticallyIn ? multiplierIn : 1) * viewportHeight);

                    this._canvasLeftIn = 0.5 * (canvasInWidth - viewportWidth),
                    this._canvasTopIn = 0.5 * (canvasInHeight - viewportHeight);
                    positionElement(this._viewportIn, 0, 0, viewportWidth, viewportHeight);
                    positionElement(this._canvasIn, -this._canvasLeftIn, -this._canvasTopIn, canvasInWidth, canvasInHeight);
                    positionElement(this._elementIn, this._canvasLeftIn, this._canvasTopIn, viewportWidth, viewportHeight);

                    var multiplierOut = 2 * bounceFactor - 1,
                        canvasOutWidth = (this._pansHorizontallyOut ? multiplierOut : 1) * viewportWidth,
                        canvasOutHeight = (this._pansVerticallyOut ? multiplierOut : 1) * viewportHeight;

                    this._canvasLeftOut = 0.5 * (canvasOutWidth - viewportWidth),
                    this._canvasTopOut = 0.5 * (canvasOutHeight - viewportHeight);
                    positionElement(this._viewportOut, 0, 0, viewportWidth, viewportHeight);
                    positionElement(this._canvasOut, -this._canvasLeftOut, -this._canvasTopOut, canvasOutWidth, canvasOutHeight);
                    positionElement(this._elementOut, this._canvasLeftOut, this._canvasTopOut, viewportWidth, viewportHeight);
                }).bind(this));
            },

            _onMouseWheel: function (ev) {
                if (ev.ctrlKey) {
                    this._zoom(ev.wheelDelta < 0, this._getPointerLocation(ev));

                    ev.stopPropagation();
                    ev.preventDefault();
                }
            },

            _onKeyDown: function (ev) {
                var handled = false;

                if (ev.ctrlKey) {
                    var Key = Utilities.Key;

                    switch (ev.keyCode) {
                        case Key.add:
                        case Key.equal:
                            this._zoom(false);
                            handled = true;
                            break;

                        case Key.subtract:
                        case Key.dash:
                            this._zoom(true);
                            handled = true;
                            break;
                    }
                }

                if (handled) {
                    ev.stopPropagation();
                    ev.preventDefault();
                }
            },

            _handlePointerDown: function (ev) {
                this._pointerCount++;
                var location = this._getPointerLocation(ev),
                    newRecord = {};
                newRecord.startX = newRecord.currentX = location.x;
                newRecord.startY = newRecord.currentY = location.y;
                this._pointerRecords[ev.pointerId] = newRecord;

                var targetSurface = this._element;
                // When we get more than one pointer, we need to explicitly set msPointerCapture on every pointer we've got to the SemanticZoom.
                // This will fire lostCapture events on any descendant elements that had called setCapture earlier (for example, ListView items),
                // and let the hosted control know that the pointer is no longer under its control.
                if (this._pointerCount > 1) {
                    var contactKeys = Object.keys(this._pointerRecords);
                    for (var i = 0; i < contactKeys.length; i++) {
                        targetSurface.msSetPointerCapture(parseInt(contactKeys[i]));
                    }
                } 
                ev.preventManipulation();
            },

            // There are two MSPointerDown event handlers. We do this because:
            // 1 - The SemanticZoom requires that SetCapture be called somewhere in the viewable region. To ensure that happens, SemanticZoom sets capture on itself during the capture phase.
            //     If the underlying control decides it wants to set capture on one of its own elements, it's free to do so.
            // 2 - Once more than one pointer is down, the pointers will belong to SemanticZoom. We'll take over everything and handle it until only one pointer remains.
            _onPointerDownCapturing: function (ev) {
                if (ev.pointerType !== PT_TOUCH || this._ignoreGestures) {
                    return;
                }

                var targetSurface = this._element;
                targetSurface.msSetPointerCapture(ev.pointerId);

                if (this._pointerCount >= 1) {
                    ev.stopImmediatePropagation();
                    ev.cancelBubble = true;
                    this._handlePointerDown(ev);
                }
            },

            _onPointerDownBubbling: function (ev) {
                if (ev.pointerType !== PT_TOUCH || this._ignoreGestures) {
                    return;
                }

                if (this._pointerCount === 0) {
                    this._startedZoomedOut = this._zoomedOut;
                    this._handlePointerDown(ev);
                }
            },

            // SemanticZoom uses MSPointerMove messages to recognize a pinch. It has to use pointer messages instead of GestureUpdate for a few reasons:
            // 1 - MSGestureUpdate events' scale property (the property that determines pinches) is based on a scalar value. We want our pinch threshold to be pixel based
            // 2 - MSGestureUpdate events' scale property doesn't work when multiple contacts are on multiple surfaces. When that happens .scale will always stay 1.0.
            _onPointerMove: function (ev) {
                if (ev.pointerType !== PT_TOUCH || this._ignoreGestures) {
                    return;
                }

                function distance(startX, startY, endX, endY) {
                    return Math.sqrt((endX - startX) * (endX - startX) + (endY - startY) * (endY - startY));
                }

                function midpoint(point1, point2) {
                    return {
                        x: 0.5 * (point1.currentX + point2.currentX),
                        y: 0.5 * (point1.currentY + point2.currentY)
                    };
                }

                var pointerRecord = this._pointerRecords[ev.pointerId],
                    location = this._getPointerLocation(ev);

                // We listen to MSPointerDown on the bubbling phase of its event, but listen to MSPointerMove on the capture phase.
                // MSPointerDown can be stopped from bubbling if the underlying control doesn't want the SemanticZoom to interfere for whatever reason.
                // When that happens, we won't have a pointer record for the event we just got, so there's no sense in doing additional processing.
                if (!pointerRecord) {
                    return;
                }
                pointerRecord.currentX = location.x;
                pointerRecord.currentY = location.y;
                // First thing to check is if we've only got one pointer. If this point has moved a certain distance away from its start location,
                // then we'll let the zoomable view take control of the pointer and set capture for it whereever necessary.
                if (this._pointerCount === 1) {
                    if (distance(pointerRecord.startX, pointerRecord.startY, pointerRecord.currentX, pointerRecord.currentY) >= abandonEventsDistance && this._pinchedDirection === PinchDirection.none) {
                        this._ignoreGestures = true;
                        (this.zoomedOut ? this._viewOut : this._viewIn).handlePointer(ev.pointerId);
                    }
                } else {
                    if (this._pointerCount === 2) {
                        // The order in which these contacts are stored and retrieved from contactKeys is unimportant.  Any two points will suffice." 
                        var contactKeys = Object.keys(this._pointerRecords),
                            point1 = this._pointerRecords[contactKeys[0]],
                            point2 = this._pointerRecords[contactKeys[1]];
                        var contactDistance = distance(point1.currentX, point1.currentY, point2.currentX, point2.currentY);
                        if (this._firstPinchDistance === -1) {
                            this._firstPinchDistance = contactDistance;
                        } else {
                            var that = this;
                            function processPinchGesture(zoomingOut) {
                                var pinchDirection = (zoomingOut ? PinchDirection.zoomedOut : PinchDirection.zoomedIn),
                                    gestureReversed = (zoomingOut ? (that._pinchedDirection === PinchDirection.zoomedIn && !that._zoomingOut) : (that._pinchedDirection === PinchDirection.zoomedOut && that._zoomingOut)),
                                    canZoomInGesturedDirection = (zoomingOut ? !that._zoomedOut : that._zoomedOut);
                                if (that._pinchedDirection === PinchDirection.none) {
                                    if (canZoomInGesturedDirection) {
                                        that._bouncing = false;
                                        that._zoom(zoomingOut, midpoint(point1, point2), true);
                                        that._pinchedDirection = pinchDirection;
                                        that._firstPinchDistance = contactDistance;
                                    } else if (!that._bouncing) {
                                        that._firstPinchDistance = contactDistance;
                                        that._playBounce(true, midpoint(point1, point2));
                                    }

                                } else if (gestureReversed) {
                                    that._zoom(zoomingOut, midpoint(point1, point2), true);
                                    that._pinchedDirection = pinchDirection;
                                }
                            }
                            var change = contactDistance - this._firstPinchDistance;
                            if (Math.abs(change)  >= pinchDistance) {
                                processPinchGesture(change <= -pinchDistance);
                            }
                        }

                        // When two or more pointers are down, we want to hide all of their move events from the underlying view.
                        ev.stopImmediatePropagation();
                    } else {
                        // When more than two pointers are down, we're not going to interpret that as a pinch, so we reset the distance we'd recorded when it was
                        // just two pointers down.
                        this._firstPinchDistance = -1;
                        ev.stopImmediatePropagation();
                    }
                }

                // If the pointerCount isn't 2, we're no longer making a pinch. This generally happens if you try pinching, find you can't zoom in the pinched direction,
                // then release one finger. When that happens we need to animate back to normal state. 
                if (this._pointerCount !== 2 && this._bouncing) {
                    this._playBounce(false);
                }
            },

            _onPointerUp: function (ev) {
                if (ev.pointerType !== PT_TOUCH) {
                    return;
                }

                if (this._pointerRecords[ev.pointerId]) {
                    delete this._pointerRecords[ev.pointerId];
                    this._pointerCount--;
                    if (this._pointerCount === 0) {
                        if (this._bouncing) {
                            this._playBounce(false);
                        }
                        if (this._pinchedDirection !== PinchDirection.none) {
                            this._correctControlPositions();
                        }

                        this._resetPointerRecords();
                    }

                    if (this._pointersCount === 1) {
                        // If there's only one pointer left, we might want to give it back to the panning region. We need to reset the
                        // record's startX and startY so it won't immediately trigger the threshold for independent manipulation.
                        var pointerRecord = this._pointerRecords[Object.keys(this._pointerRecords)[0]];
                        pointerRecord.startX = pointerRecord.currentX;
                        pointerRecord.startY = pointerRecord.currentY;
                    }
                }
            },

            _onLostPointerCapture: function (ev) {
                if (this._ignoreGestures) {
                    // When we're trying to ignore gestures and we get lost capture events, we generally won't get pointer up events from any
                    // subsequent touch downs. Instead, we'll get lost capture events. We'll treat those the same as pointerUp events.
                    this._onPointerUp(ev);
                }
            },

            _onManipulationStateChanged: function (ev) {
                if (ev.currentState === 0) {
                    this._resetPointerRecords();
                }
            },

            _zoom: function (zoomOut, zoomCenter, gesture, centerOnCurrent) {
                if (this._locked || this._gestureEnding) {
                    return;
                }

                if (this._zoomInProgress) {
                    if (this._gesturing === !gesture) {
                        return;
                    }

                    if (zoomOut !== this._zoomingOut) {
                        // Reverse the zoom that's currently in progress
                        this._startAnimations(zoomOut);

                        if (!this._gesturing && this._adjustment) {
                            this._startCorrectionAnimations();
                        }
                    }
                } else if (zoomOut !== this._zoomedOut) {
                    this._zooming = true;
                    this._aligning = true;
                    this._gesturing = !!gesture;

                    if (zoomCenter) {
                        (zoomOut ? this._viewIn : this._viewOut).setCurrentItem(zoomCenter.x, zoomCenter.y);
                    }

                    this._zoomInProgress = true;

                    (zoomOut ? this._viewportOut : this._viewportIn).style.visibility = "visible";

                    this._viewIn.beginZoom();
                    this._viewOut.beginZoom();

                    // To simplify zoomableView implementations, only call getCurrentItem between beginZoom and endZoom
                    if (centerOnCurrent) {
                        var that = this;
                        (zoomOut ? this._viewIn : this._viewOut).getCurrentItem().then(function (current) {
                            var position = current.position;

                            // Pass in current item to avoid calling getCurrentItem again
                            that._prepareForZoom(zoomOut, {
                                x: position.left + 0.5 * position.width,
                                y: position.top + 0.5 * position.height
                            }, WinJS.Promise.wrap(current));
                        });
                    } else {
                        this._prepareForZoom(zoomOut, zoomCenter || {});
                    }
                }
            },

            _prepareForZoom: function (zoomOut, zoomCenter, completedCurrentItem) {
                var that = this;
                var centerX = zoomCenter.x,
                    centerY = zoomCenter.y;

                if (typeof centerX !== "number" || !this._pansHorizontallyIn || !this._pansHorizontallyOut) {
                    centerX = 0.5 * this._element.clientWidth;
                }

                if (typeof centerY !== "number" || !this._pansVerticallyIn || !this._pansVerticallyOut) {
                    centerY = 0.5 * this._element.clientHeight;
                }

                function setZoomCenters(adjustmentIn, adjustmentOut) {
                    that._canvasIn.style["-ms-transform-origin"] = (that._canvasLeftIn + centerX - adjustmentIn.x) + "px " + (that._canvasTopIn + centerY - adjustmentIn.y) + "px";
                    that._canvasOut.style["-ms-transform-origin"] = (that._canvasLeftOut + centerX - adjustmentOut.x) + "px " + (that._canvasTopOut + centerY - adjustmentOut.y) + "px";
                }

                setZoomCenters(origin, origin);

                this._alignViews(zoomOut, centerX, centerY, completedCurrentItem).then(function (adjustment) {
                    that._aligning = false;
                    if (adjustment.x !== 0 || adjustment.y !== 0) {
                        that._adjustment = adjustment;

                        // Overwrite the zoom centers
                        if (!that.gesturing) {
                            if (zoomOut) {
                                setZoomCenters(origin, adjustment);
                            } else {
                                setZoomCenters(adjustment, origin);
                            }
                        }

                        translateElement((zoomOut ? that._viewportOut : that._viewportIn), adjustment);

                        if (!that._gesturing || that._gestureEnding) {
                            // Wait for change to -ms-transition-property to be processed

                            // Set _correcting to true now in case an animation completes before _startCorrectionAnimations is called
                            that._correcting = true;
                            setTimeout(function () {
                                that._startCorrectionAnimations();
                            }, 250);
                        }
                    } else {
                        that._gestureEnding = false;
                        if (!that._zooming && !that._gesturing && !that._correcting) {
                            that._completeZoom();
                        }
                    }
                });

                this._zoomingOut = zoomOut;
                setTimeout(function () {
                    that._startAnimations(zoomOut);
                }, 20);
            },

            _alignViews: function (zoomOut, centerX, centerY, completedCurrentItem) {
                var multiplier = (1 - this._zoomFactor),
                    offsetLeft = multiplier * centerX,
                    offsetTop = multiplier * centerY;

                var that = this;
                if (zoomOut) {
                    return (completedCurrentItem || this._viewIn.getCurrentItem()).then(function (current) {
                        var positionIn = current.position,
                            positionOut = {
                                left: positionIn.left * that._zoomFactor + offsetLeft,
                                top: positionIn.top * that._zoomFactor + offsetTop,
                                width: positionIn.width * that._zoomFactor,
                                height: positionIn.height * that._zoomFactor
                            };

                        return that._viewOut.positionItem(that._zoomedOutItem(current.item), positionOut);
                    });
                } else {
                    return (completedCurrentItem || this._viewOut.getCurrentItem()).then(function (current) {
                        var positionOut = current.position,
                            positionIn = {
                                left: (positionOut.left - offsetLeft) / that._zoomFactor,
                                top: (positionOut.top - offsetTop) / that._zoomFactor,
                                width: positionOut.width / that._zoomFactor,
                                height: positionOut.height / that._zoomFactor
                            };

                        return that._viewIn.positionItem(that._zoomedInItem(current.item), positionIn);
                    });
                }
            },

            _correctControlPositions: function () {
                this._gesturing = false;

                if (this._zoomingOut === this._zoomedOut) {
                    this._adjustment = null;
                }

                if (this._aligning) {
                    // Assume a correction might be needed until the alignment is known
                    this._gestureEnding = true;
                } else {
                    if (this._adjustment) {
                        this._gestureEnding = true;
                        var that = this;
                        setTimeout(function () {
                            that._startCorrectionAnimations();
                        }, 150);
                    } else if (!this._aligning && !this._zooming) {
                        this._completeZoom();
                    }
                }
            },

            _startAnimations: function (zoomOut) {
                this._zoomingOut = zoomOut;
                this._canvasIn.style["-ms-transition"] = (zoomOut ? outgoingElementTransition : incomingElementTransition);
                this._canvasOut.style["-ms-transition"] = (zoomOut ? incomingElementTransition : outgoingElementTransition);
                scaleElement(this._canvasIn, (zoomOut ? this._zoomFactor : 1));
                scaleElement(this._canvasOut, (zoomOut ? 1 : 1 / this._zoomFactor));
                this._canvasIn.style.opacity = (zoomOut ? 0 : 1);
                this._canvasOut.style.opacity = (zoomOut ? 1 : 0);
            },

            _startCorrectionAnimations: function () {
                this._correcting = true;

                this._viewportIn.style["-ms-transition"] = correctionTransition;
                this._viewportOut.style["-ms-transition"] = correctionTransition;

                var correction = {
                    x: -this._adjustment.x,
                    y: -this._adjustment.y
                };

                translateElement(this._viewportIn, (
                    !this._zoomingOut ?
                        origin :
                    !this._zoomedOut ?
                        correction :
                        this._adjustment
                ));

                translateElement(this._viewportOut, (
                    this._zoomingOut ?
                        origin :
                    this._zoomedOut ?
                        correction :
                        this._adjustment
                ));
            },

            _onCanvasTransitionEnd: function (ev) {
                if (ev.srcElement === this._canvasIn && ev.propertyName === "-ms-transform") {
                    this._zooming = false;

                    if (!this._aligning && !this._gesturing && !this._correcting && !this._gestureEnding) {
                        this._completeZoom();
                    }
                }
            },

            _onViewportTransitionEnd: function (ev) {
                if (ev.srcElement === this._viewportIn && ev.propertyName === "-ms-transform") {
                    this._correcting = false;
                    this._gestureEnding = false;

                    if (!this._zooming) {
                        this._completeZoom();
                    }
                }
            },

            _completeZoom: function () {
                if (!this._zoomInProgress) {
                    return;
                }

                this._gestureEnding = false;

                this._viewIn.endZoom(!this._zoomingOut);
                this._viewOut.endZoom(this._zoomingOut);

                this._zoomInProgress = false;

                var zoomChanged = false;
                if (this._zoomingOut !== this._zoomedOut) {
                    this._zoomedOut = this._zoomingOut;
                    zoomChanged = true;
                }

                this._setVisibility();

                if (this._adjustment) {
                    this._adjustment = null;

                    this._viewportIn.style["-ms-transition-duration"] = "0s";
                    this._viewportOut.style["-ms-transition-duration"] = "0s";

                    translateElement((this._zoomingOut ? this._viewportIn : this._viewportOut), origin);
                }

                if (zoomChanged) {
                    // Dispatch the zoomChanged event
                    var ev = document.createEvent("CustomEvent");
                    ev.initCustomEvent(zoomChangedEvent, true, true, this._zoomedOut);
                    this._element.dispatchEvent(ev);

                    if (this._hasKeyboardFocus) {
                        (this._zoomedOut ? this._elementOut : this._elementIn).focus();
                    }
                }
            },

            _setVisibility: function () {
                function setVisibility(element, isVisible) {
                    element.style.visibility = (isVisible ? "visible" : "hidden");
                }
                setVisibility(this._viewportIn, !this._zoomedOut);
                setVisibility(this._viewportOut, this._zoomedOut);
            },

            _resetPointerRecords: function () {
                this._firstPinchDistance = -1;
                this._ignoreGestures = false;
                this._pinchedDirection = PinchDirection.none;
                this._pointerCount = 0;
                this._pointerRecords = {};
            },

            _getPointerLocation: function (ev) {
                var pointerX = ev.offsetX,
                    pointerY = ev.offsetY,
                    curr = ev.target;

                while (curr !== this._element) {
                    pointerX += curr.offsetLeft - curr.scrollLeft;
                    pointerY += curr.offsetTop - curr.scrollTop;
                    curr = curr.parentNode;
                }

                return {
                    x: pointerX,
                    y: pointerY
                };
            },

            _playBounce: function (beginBounce, center) {
                if (this._bouncing === beginBounce) {
                    return;
                }

                this._bouncing = beginBounce;
                if (beginBounce) {
                    this._bounceCenter = center;
                } else {
                    this._aligned = true;
                }

                var targetElement = (this._zoomedOut ? this._canvasOut : this._canvasIn),
                    canvasLeft = (this._zoomedOut ? this._canvasLeftIn : this._canvasLeftOut),
                    canvasTop = (this._zoomedOut ? this._canvasTopIn : this._canvasTopOut);

                targetElement.style["-ms-transform-origin"] = (canvasLeft + this._bounceCenter.x) + "px " + (canvasTop + this._bounceCenter.y) + "px";
                targetElement.style["-ms-transition"] = beginBounce ? bounceInTransition : bounceBackTransition;
                var scale = (beginBounce ? (this._zoomedOut ? 2 - bounceFactor : bounceFactor) : 1);
                scaleElement(targetElement, scale);
            }
        })

    });

    // The Semantic Zoom processes its own descendents
    UI.SemanticZoom.isDeclarativeControlContainer = true;

})(this);


(function (WinJS) {
    var thisWinUI = WinJS.UI;
    var utilities = thisWinUI.Utilities;

    // Class Names
    var overlayClass = "win-overlay";

    // Hook into event
    var overlayMouseEvent = false;

    function _onDocumentMouseDown(mouseEvent) {
        // Get all the overlays
        var elements = document.querySelectorAll(".win-overlay");
        var len = elements.length;

        // Hide all of them that are lightDismiss, except the one touched
        for (var bar = 0; bar < len; bar++) {
            // Don't bother if it's already hidden, not light dismiss, or if it's an appbar and this is an edgy mouse
            var overlay = WinJS.UI.getControl(elements[bar]);
            if (overlay && overlay.lightDismiss && !overlay.hidden && (mouseEvent.button !== 2 || !WinJS.Utilities.hasClass(elements[bar], "win-appbar"))) {
                var clicked;
                for (clicked = 0; clicked < mouseEvent._clickedBars.length; clicked++) {
                    // Stored overlay div that got clicked on (if any) is in mouseEvent._clickedBars
                    if (elements[bar] === mouseEvent._clickedBars[clicked]) {
                        break;
                    }
                }

                // If we didn't find our bar in the clicked list, then hide it
                if (clicked >= mouseEvent._clickedBars.length) {
                    overlay.hide();
                }
            }
        }
    }

    function _onDocumentMouseDownCapture(mouseEvent) {
        // Reset our clicked bars
        mouseEvent._clickedBars = [];
    }

    // Helper to get DOM elements from input single object or array or IDs/toolkit/dom elements
    function _resolveElements(elements) {
        // No input is just an empty array
        if (!elements) {
            return [];
        }

        // Make sure it's in array form.
        if (!Array.isArray(elements)) {
            elements = [elements];
        }

        // Make sure we have a DOM element for each one, (could be string id name or toolkit object)
        var i,
            realElements = new Array(elements.length);
        for (i = 0; i < elements.length; i++) {
            if (elements[i]) {
                if (typeof elements[i] === "string") {
                    realElements[i] = document.getElementById(elements[i]);
                } else if (elements[i].element) {
                    realElements[i] = elements[i].element;
                } else {
                    realElements[i] = elements[i];
                }
            }
        }

        return realElements;
    }

    function _animError(err) {
        var e = document.getElementById("win-appbar-error-debug");
        if (e) {
            e.innerText = err.Message;
        }
    }

    WinJS.Namespace.define("WinJS.UI", {
        _Overlay: WinJS.Class.define(
        /// <summary locid="76">
        /// Constructs the Overlay control and associates it with the underlying DOM element.
        /// </summary>
        /// <param name="element" type="HTMLElement" domElement="true" locid="77">
        /// The DOM element to be associated with the Overlay control.
        /// </param>
        /// <param name="options" type="object" domElement="false" locid="78">
        /// The set of options to be applied initially to the Overlay control.
        /// </param>
        /// <returns type="WinJS.UI._Overlay" locid="79">A fully constructed Overlay control.</returns>
        function (element, options) {
            this._baseOverlayConstructor(element, options);
        }, {
            /// <field type="HTMLElement" domElement="true" locid="80">The DOM element the Overlay is attached to</field>
            element: {
                get: function () {
                    return this._element;
                }
            },

            /// <summary locid="81">
            /// Shows the Overlay, if hidden, regardless of other state
            /// </summary>
            /// <returns type="undefined" locid="82" />
            show: function () {
                // We call our base _baseShow because AppBar may need to override show
                this._baseShow();
            },

            /// <summary locid="83">
            /// Hides the Overlay, if visible, regardless of other state
            /// </summary>
            /// <returns type="undefined" locid="82" />
            hide: function () {
                // We call our base _baseHide because AppBar may need to override show
                this._baseHide();
            },

            /// <summary locid="84">
            /// Show elements within this overlay
            /// </summary>
            /// <param name="elements" type="Array" locid="85">Required. Element or Elements to show, either String, DOM elements, or WinJS objects.</param>
            /// <param name="immediate" type="Boolean" locid="86">Optional. True, show the elements immediately, without animation.</param>
            /// <returns type="undefined" locid="82" />
            showElements: function (elements, immediate) {
                if (!elements) {
                    throw new Error(thisWinUI._Overlay.requiresElements);
                }

                this.showAndHideElements(elements, undefined, immediate);
            },

            /// <summary locid="87">
            /// Hide elements within this overlay
            /// </summary>
            /// <param name="elements" type="Array" locid="88">Required. Element or Elements to hide, either String, DOM elements, or WinJS objects.</param>
            /// <param name="immediate" type="Boolean" locid="89">Optional. True, hide the elements immediately, without animation.</param>
            /// <returns type="undefined" locid="82" />
            hideElements: function (elements, immediate) {
                if (!elements) {
                    throw new Error(thisWinUI._Overlay.requiresElements);
                }

                this.showAndHideElements(undefined, elements, immediate);
            },

            /// <summary locid="90">
            /// Show some elements and hide others within this array
            /// </summary>
            /// <param name="showElements" type="Array" locid="91">Optional. Element or Elements to show, either String, DOM elements, or WinJS objects.</param>
            /// <param name="hideElements" type="Array" locid="92">Optional. Element or Elements to hide, either String, DOM elements, or WinJS objects.</param>
            /// <param name="immediate" type="Boolean" locid="89">Optional. True, hide the elements immediately, without animation.</param>
            /// <returns type="undefined" locid="82" />
            showAndHideElements: function (showElements, hideElements, immediate) {
                if (!showElements && !hideElements) {
                    throw new Error(thisWinUI._Overlay.requiresElements);
                }

                // Normalize our inputs to all-dom object arrays.
                // (Note: this won't be the original object when set, _resolveElements will return a different
                // object.  Eg: we're not stomping on the caller's input references)
                showElements = _resolveElements(showElements);
                hideElements = _resolveElements(hideElements);

                var i;

                // Now we (hopefully) have all DOM objects, so show & hide them all
                // Can't do fast loop if we have to find siblings
                if (immediate) {
                    // Immediate mode (not animated)
                    for (i = 0; i < showElements.length; i++) {
                        if (showElements[i] && showElements[i].style) {
                            showElements[i].style.visibility = "";
                            showElements[i].style.display = "";
                        }
                    }
                    for (i = 0; i < hideElements.length; i++) {
                        if (hideElements[i] && hideElements[i].style) {
                            hideElements[i].style.visibility = "hidden";
                            hideElements[i].style.display = "none";
                        }
                    }
                } else {
                    // Animate them if necessary
                    // Animation has 3 parts:  "hiding", "showing", and "moving"
                    // PVL has "addToList" and "deleteFromList", both of which allow moving parts.
                    // So we'll set up "add" for showing, and use "delete" for "hiding" + moving,
                    // then trigger both at the same time.

                    // In case they're in different DIVs we also need to check the parents so 
                    // that we're only animating siblings.  If input elements have different
                    // parents, we'll run a set of animations for each parent.
                    var parentDiv,
                        toShow,
                        toHide;

                    while (showElements.length > 0 || hideElements.length > 0) {
                        // Get a starting element for this animation
                        if (showElements.length > 0) {
                            toShow = [showElements.shift()];
                            toHide = [];
                            // Make sure it's real.  If it isn't, don't do this one
                            if (!toShow[0] || !toShow[0].style) {
                                continue;
                            }
                            parentDiv = toShow[0].parentNode;
                        } else {
                            toShow = [];
                            toHide = [hideElements.shift()];
                            // Make sure it's not already hidden.  If it is, don't do this one
                            if (!toHide[0] || !toHide[0].style) {
                                continue;
                            }
                            parentDiv = toHide[0].parentNode;
                        }

                        // Get all the rest of the elements that have the same parent
                        // show
                        for (i = 0; i < showElements.length; i++) {
                            // If this one's animatable and has the same parent, use it
                            if (showElements[i] && showElements[i].style && showElements[i].parentNode === parentDiv) {
                                // Same parent, use this one
                                toShow.push(showElements[i]);
                                showElements.splice(i, 1);
                                i--;
                            }
                        }
                        // hide
                        for (i = 0; i < hideElements.length; i++) {
                            // If this one's animatable and has the same parent, use it
                            if (hideElements[i] && hideElements[i].style && hideElements[i].parentNode === parentDiv) {
                                // Same parent, use this one
                                toHide.push(hideElements[i]);
                                hideElements.splice(i, 1);
                                i--;
                            }
                        }

                        // Get all of our interesting siblings
                        var children = parentDiv.childNodes,
                            siblings = [];
                        for (i = 0; i < children.length; i++) {
                            if (!children[i].style) {
                                // not a helpful one,
                                continue;
                            }
                            var j;
                            for (j = 0; j < toShow.length; j++) {
                                if (children[i] === toShow[j]) {
                                    break;
                                }
                            }
                            if (j >= toShow.length) {
                                for (j = 0; j < toHide.length; j++) {
                                    if (children[i] === toHide[j]) {
                                        break;
                                    }
                                }
                                if (j >= toHide.length) {
                                    siblings.push(children[i]);
                                }
                            }
                        }

                        // Don't animate ones that don't need animated
                        for (i = 0; i < toShow.length; i++) {
                            // If this one's visible already, skip it
                            if (!toShow[i] || !toShow[i].style ||
                               (toShow[i].style.visibility !== "hidden" && toShow[i].style.opacity !== "0")) {
                                // Don't need to animate this one
                                toShow.splice(i, 1);
                                i--;
                            }
                        }
                        for (i = 0; i < toHide.length; i++) {
                            // If this one's hidden already, skip it
                            if (!toHide[i] || !toHide[i].style ||
                                (toHide[i].style.visibility === "hidden" || toHide[i].style.opacity === "0")) {
                                // Don't need to animate this one
                                toHide.splice(i, 1);
                                i--;
                            }
                        }

                        // Now we have the show, hide & siblings lists
                        var showAnim,
                            hideAnim;

                        if (!immediate) {
                            showAnim = WinJS.UI.Animation.createAddToListAnimation(toShow, toHide.length == 0 ? siblings : undefined);
                            hideAnim = WinJS.UI.Animation.createDeleteFromListAnimation(toHide, siblings);
                        }

                        // Update us
                        for (i = 0; i < toShow.length; i++) {
                            toShow[i].style.visibility = "";
                            toShow[i].style.display = "";
                            toShow[i].style.position = "";
                            toShow[i].style.opacity = 1;
                        }

                        if (!immediate) {
                            for (i = 0; i < toHide.length; i++) {
                                // Need to fix our position
                                var rect = toHide[i].getBoundingClientRect(),
                                style = window.getComputedStyle(toHide[i]);

                                // Use the bounding box, adjusting for margins
                                toHide[i].style.top = (rect.top - parseInt(style.marginTop)) + "px";
                                toHide[i].style.left = (rect.left - parseInt(style.marginLeft)) + "px";
                                toHide[i].style.opacity = 0;
                                toHide[i].style.position = "fixed";
                            }
                        } else {
                            // Immediate, just a little visibility
                            for (i = 0; i < toHide.length; i++) {
                                toHide[i].style.visibility = "hidden";
                                toHide[i].style.display = "none";
                            }
                        }

                        // Start animations
                        if (!immediate) {
                            if (toShow.length > 0) {
                                showAnim.execute();
                            }

                            // hide needs extra cleanup when done
                            if (toHide.length > 0) {
                                (function (theAnim, toUpdate) {
                                    theAnim.execute().
                                    then(function () {
                                        // Update us
                                        var i;
                                        for (i = 0; i < toUpdate.length; i++) {
                                            toUpdate[i].style.visibility = "hidden";
                                            toUpdate[i].style.display = "none";
                                            toUpdate[i].style.position = "";
                                            toUpdate[i].style.opacity = 1;
                                        }
                                    }, function (err) {
                                        // Update us
                                        var i;
                                        for (i = 0; i < toUpdate.length; i++) {
                                            toUpdate[i].style.visibility = "hidden";
                                            toUpdate[i].style.display = "none";
                                            toUpdate[i].style.position = "";
                                            toUpdate[i].style.opacity = 1;
                                        }
                                        _animError(err);
                                    });
                                } (hideAnim, toHide));
                            }
                        }
                    }
                }
            },

            // Is the overlay "hidden"?
            /// <field type="Boolean" locid="93">Read only, true if an overlay is currently not visible.</field>
            hidden: {
                get: function () {
                    return (this._element.style.visibility === "hidden" ||
                            this._element.msAnimating === "hiding");
                }
            },

            /// <summary locid="94">
            /// Add an event listener to the DOM element for this Overlay
            /// </summary>
            /// <param name="type" type="String" locid="95">Required. Event type to add, "beforehide", "afterhide", "beforeshow", or "aftershow"</param>
            /// <param name="listener" type="Function" locid="96">Required. The event handler function to associate with this event.</param>
            /// <param name="useCapture" type="Boolean" locid="97">Required. True, register for the event capturing phase.  False for the event bubbling phase.</param>
            /// <returns type="undefined" locid="82" />
            addEventListener: function (type, listener, useCapture) {
                return this._element.addEventListener(type, listener, useCapture);
            },

            /// <summary locid="98">
            /// Remove an event listener to the DOM element for this Overlay
            /// </summary>
            /// <param name="type" type="String" locid="95">Required. Event type to add, "beforehide", "afterhide", "beforeshow", or "aftershow"</param>
            /// <param name="listener" type="Function" locid="96">Required. The event handler function to associate with this event.</param>
            /// <param name="useCapture" type="Boolean" locid="97">Required. True, register for the event capturing phase.  False for the event bubbling phase.</param>
            /// <returns type="undefined" locid="82" />
            removeEventListener: function (type, listener, useCapture) {
                return this._element.removeEventListener(type, listener, useCapture);
            },

            _baseOverlayConstructor: function (element, options) {
                // Make sure there's an input element
                if (!element) {
                    element = document.createElement("div");
                }

                // Check to make sure we weren't duplicated
                var overlay = WinJS.UI.getControl(element);
                if (overlay) {
                    throw new Error(thisWinUI._Overlay.duplicateConstruction);
                }

                this._element = element;
                this._autoHide = 0;
                this._lightDismiss = false;
                this._doNext = "";

                // Remember ourselves
                WinJS.UI.setControl(element, this);

                // Attach our css class
                WinJS.Utilities.addClass(this._element, overlayClass);

                // Make sure autohide timer is set correctly
                this._resetAutoHideTimer();

                // We don't want to be selectable, set UNSELECTABLE
                var unselectable = this._element.getAttribute("unselectable");
                if (unselectable == null || unselectable === undefined) {
                    this._element.setAttribute("unselectable", "on");
                }

                // Hook up mouse to test for light dismiss;
                var that = this;
                element.addEventListener("mousedown", that._onMouseDown, false);
                element.addEventListener("focusin", that._onFocusIn, false);
                element.addEventListener("focusout", that._onFocusOut, false);

                // Make sure top mouse tests for light dismiss
                // Attach event handler
                if (!overlayMouseEvent) {
                    document.addEventListener("mousedown", _onDocumentMouseDown, false);
                    document.addEventListener("mousedown", _onDocumentMouseDownCapture, true);
                    overlayMouseEvent = true;
                }

                // Base animation is popIn/popOut
                this._currentAnimateIn = this._baseAnimateIn;
                this._currentAnimateOut = this._baseAnimateOut;
            },

            // Turn off or restart the autohide counter
            _resetAutoHideTimer: function (clear) {
                // Clear any old timer
                if (this._autoHideTimeout) {
                    clearTimeout(this._autoHideTimeout);
                    this._autoHideTimeout = null;
                }

                if (!clear && this._autoHide > 0 && this._element.style.visibility != "hidden") {
                    var temp = this;
                    this._autoHideTimeout = setTimeout(function () { temp.hide(); }, this._autoHide);
                }
            },

            _onMouseDown: function (mouseEvent) {
                // If we're autohide, need to reset the timer
                var overlay = WinJS.UI.getControl(mouseEvent.currentTarget);
                if (overlay) {
                    // Reset autohide timer
                    overlay._resetAutoHideTimer();
                }
                // Remember the bar so lightDismiss knows what to touch
                mouseEvent._clickedBars.push(mouseEvent.currentTarget);
            },

            _onFocusIn: function (event) {
                // If we have focus, turn off the autohide
                var overlay = WinJS.UI.getControl(event.currentTarget);
                if (overlay) {
                    // Reset autohide timer
                    overlay._resetAutoHideTimer(true);
                }
            },

            _onFocusOut: function (event) {
                // If we lost focus, turn back on the autohide
                var overlay = WinJS.UI.getControl(event.currentTarget);
                if (overlay) {
                    // Reset autohide timer
                    overlay._resetAutoHideTimer(false);
                }
            },

            _baseShow: function () {
                // If we are already animating, just remember this for later
                if (this._element.msAnimating) {
                    this._doNext = "show";
                    return false;
                }

                // "hiding" would need to cancel.
                if (this._element.style.visibility != "visible") {
                    // Let us know we're showing.
                    this._element.msAnimating = "showing";

                    // Send our "beforeShow" event
                    this._sendEvent(thisWinUI._Overlay.beforeShow);

                    // Make sure it's visible, and fully opaque.
                    // Do the popup thing, sending event afterward
                    var that = this;
                    this._currentAnimateIn().
                    then(function () {
                        that._baseEndShow();
                    }, function (err) {
                        that._baseEndShow();
                        _animError(err);
                    });
                    return true;
                }
                return false;
            },

            _baseEndShow: function () {
                // After showing, send the after showing event
                this._sendEvent(thisWinUI._Overlay.afterShow);

                // Make sure it's visible after showing
                this._element.setAttribute("aria-hidden", "false");

                // turn on our autohidetimer
                // Reset the timer
                this._resetAutoHideTimer(false);
                this._element.msAnimating = "";

                // If we had something queued, do that
                this._checkDoNext();
            },

            _baseHide: function () {
                // If we are already animating, just remember this for later
                if (this._element.msAnimating) {
                    this._doNext = "hide";
                    return false;
                }

                // Clear the timer
                this._resetAutoHideTimer(true);

                // "showing" would need to cancel.
                if (this._element.style.visibility != "hidden") {
                    // Let us know we're hiding, accessibility as well.
                    this._element.msAnimating = "hiding";
                    this._element.setAttribute("aria-hidden", "true");

                    // Send our "beforeHide" event
                    this._sendEvent(thisWinUI._Overlay.beforeHide);

                    // If we our visibility is empty, then this is the first time, just hide it
                    if (this._element.style.visibility === "") {
                        // Initial hiding, just hide it
                        this._element.style.opacity = 0;
                        this._baseEndHide();
                    } else {
                        // Make sure it's hidden, and fully transparent.
                        var that = this;
                        this._currentAnimateOut().
                        then(function () {
                            that._baseEndHide();
                        }, function (err) {
                            that._baseEndHide();
                            _animError(err);
                        });
                    }
                    return true;
                }
                return false;
            },

            _baseEndHide: function () {
                // After hiding, send our "afterHide" event
                this._element.style.visibility = "hidden";
                this._element.msAnimating = "";

                this._sendEvent(thisWinUI._Overlay.afterHide);

                // If we had something queued, do that
                this._checkDoNext();
            },

            _checkDoNext: function () {
                // If we had something queued, do that
                if (this._doNext) {
                    if (this._doNext === "hide") {
                        this.hide();
                    } else if (this._doNext === "show") {
                        this.show();
                    }
                    this._doNext = "";
                }
            },

            // default animations
            _baseAnimateIn: function () {
                this._element.style.opacity = 1;
                this._element.style.visibility = "visible";
                return WinJS.UI.Animation.showPopup(this._element, { top: '20px', left: '20px' });
            },

            _baseAnimateOut: function () {
                this._element.style.opacity = 0;
                return WinJS.UI.Animation.hidePopup(this._element, { top: '20px', left: '20px' });
            },

            // Send one of our events 
            _sendEvent: function (eventName) {
                var event = document.createEvent("Event");
                event.initEvent(eventName, true, true);
                event.currentTarget = this._element;
                this._element.dispatchEvent(event);
            }
        })
    });

    // Statics
    thisWinUI._Overlay._clickEatingDiv = false;
    thisWinUI._Overlay._flyoutAppBarCommandEvent = false;

    thisWinUI._Overlay._hideFlyouts = function (testElement) {
        var elements = testElement.querySelectorAll('.win-flyout,.win-settingspane');
        var len = elements.length;
        for (var i = 0; i < len; i++) {
            var element = elements[i];
            if (element.style.visibility !== "hidden") {
                var flyout = WinJS.UI.getControl(element);
                if (flyout) {
                    flyout.hide();
                }
            }
        }
    }

    thisWinUI._Overlay._hideAllFlyouts = function () {
        thisWinUI._Overlay._hideFlyouts(document);
    }

    thisWinUI._Overlay._createClickEater = function () {
        // Make sure we have a click eating div
        if (!thisWinUI._Overlay._clickEatingDiv) {
            clickEatingDiv = document.createElement("div");
            clickEatingDiv.style.backgroundColor = "White";
            clickEatingDiv.style.opacity = "0";
            clickEatingDiv.style.visibility = "hidden";
            clickEatingDiv.style.width = "100%";
            clickEatingDiv.style.height = "100%";
            clickEatingDiv.style.left = "0px";
            clickEatingDiv.style.top = "0px";
            clickEatingDiv.style.position = "absolute";
            clickEatingDiv.style.zIndex = 1000;
            clickEatingDiv.addEventListener("mousedown", thisWinUI._Overlay._hideClickEater, true);
            clickEatingDiv.addEventListener("click", thisWinUI._Overlay._hideClickEater, true);
            document.body.appendChild(clickEatingDiv);
            thisWinUI._Overlay._clickEatingDiv = clickEatingDiv;
        }
    }

    thisWinUI._Overlay._hideClickEater = function (event) {
        event.stopPropagation();
        event.preventDefault();
        thisWinUI._Overlay._clickEatingDiv.style.visibility = "hidden";
        thisWinUI._Overlay._hideAllFlyouts();
        thisWinUI.AppBar._hideLightDismissAppBars();
    }

    // Callback for Esc Key (to light dismiss)
    thisWinUI._Overlay._onKeyDown = function (event) {
        // Hide Flyouts on escape key press
        if (event.key == "Esc") {
            thisWinUI._Overlay._hideAllFlyouts();
            thisWinUI.AppBar._hideLightDismissAppBars();
        }
    }

    thisWinUI._Overlay._hideIfLostFocus = function (overlay, focusEvent) {
        // If we're still showing we haven't really lost focus
        if (overlay.hidden || overlay.element.msAnimating === "showing") {
            return;
        }
        var element = document.activeElement;
        while (element && element != document.body) {
            if (element === overlay._element) {
                return;
            }
            element = element.parentNode;
        }

        overlay.hide();
    }

    thisWinUI._Overlay._checkMouseDown = function (event) {
        if (event.button === 2) {
            thisWinUI._Overlay._hideAllFlyouts();
            // Don't light dismiss appbars because edgy will do that
        }
    }

    thisWinUI._Overlay._addFlyoutEventHandlers = function (event) {
        if (!thisWinUI._Overlay._flyoutAppBarCommandEvent) {
            // Dismiss on esc, blur & resize
            document.addEventListener("keydown", thisWinUI._Overlay._onKeyDown, false);
            window.addEventListener("blur", thisWinUI._Overlay._hideAllFlyouts, false);
            document.addEventListener("mousedown", thisWinUI._Overlay._checkMouseDown, false);

            // Catch edgy events too (try/catch so it behaves in designer as well)
            try {
                var cmdUI = Windows.UI.Input.ApplicationCommand.getForCurrentView();
                cmdUI.addEventListener("invoking", thisWinUI._Overlay._hideAllFlyouts);
                cmdUI.addEventListener("invoked", thisWinUI._Overlay._hideAllFlyouts);

                // in case orientation/snapped changes, then dismiss
                // Can't use the following because layoutchanged doesn't know about "portrait"
                // Windows.UI.ViewManagement.ApplicationLayout.getForCurrentView().addEventListener("layoutchanged", thisWinUI._Overlay._hideAllFlyouts);
                function listener(mql) {
                    if (mql.matches) {
                        thisWinUI._Overlay._hideAllFlyouts();
                    }
                }
                var mqlFull = msMatchMedia("all and (-ms-view-state: full-screen)");
                mqlFull.addListener(listener);
                var mqlSnapped = msMatchMedia("all and (-ms-view-state: snapped)");
                mqlSnapped.addListener(listener);
                var mqlFill = msMatchMedia("all and (-ms-view-state: fill)");
                mqlFill.addListener(listener);
                var mqlPortrait = msMatchMedia("all and (-ms-view-state: device-portrait)");
                mqlPortrait.addListener(listener);
            } catch (e) {
            }
            thisWinUI._Overlay._flyoutAppBarCommandEvent = true;
        }
    }

    thisWinUI._Overlay._ensureFocus = function (element) {
        if (element.focus) {
            try {
                // If we can focus it, return
                element.focus();
                if (element == document.activeElement) {
                    return true;
                }
            } catch (e) { }
        }

        // Unable to set active, try the children
        var children = element.childNodes;
        var i;
        for (i = 0; i < children.length; i++) {
            if (thisWinUI._Overlay._ensureFocus(children[i])) {
                return true;
            }
        }

        return false;
    }

    // Events
    thisWinUI._Overlay.beforeShow = "beforeshow";
    thisWinUI._Overlay.beforeHide = "beforehide";
    thisWinUI._Overlay.afterShow = "aftershow";
    thisWinUI._Overlay.afterHide = "afterhide";

    // Errors
    // TODO: it seems like noElement should be a Controls namespace error instead of a dedicated Overlay one
    thisWinUI._Overlay.duplicateConstruction = "Invalid argument: Controls may only be instantiated one time for each DOM element";
    thisWinUI._Overlay.badLightDismiss = "Invalid argument: The lightDismiss property requires a true or false boolean";
    thisWinUI._Overlay.badAutoHide = "Invalid argument: An autoHide property must be a non-negative number";
    thisWinUI._Overlay.requiresElements = "Invalid argument: elements must not be empty";
})(WinJS);

   


(function (WinJS) {
    var thisWinUI = WinJS.UI;

    // Class Names
    var appBarClass = "win-appbar";

    // Constants for position
    var appBarPositionTop = "top",
        appBarPositionBottom = "bottom";

    // Hook into event
    var appBarCommandEvent = false;

    // Callback for AppBar Edgy Event Command
    function _toggleAppBars() {
        var bars = _getDynamicBars();

        // If they're all visible hide them, otherwise show them all
        if (bars._visible && !bars._hidden) {
            _hideAllBars(bars);
        }
        else {
            _showAllBars(bars);
        }
    }

    // _repositionBottomAppBar is temporary to move the bottom AppBar when the soft keyboard show up. 
    // This code will be removed when the automatic layout work will be done 
    function _repositionBottomAppBar() {
        var elements = document.querySelectorAll('.win-appbar');
        var len = elements.length;

        for (var i = 0; i < len; i++) {
            var bar = WinJS.UI.getControl(elements[i]);
            if (bar && (bar._position === appBarPositionBottom)) {
                var bottomPos = document.body.clientHeight - window.innerHeight;
                elements[i].style.bottom = bottomPos + "px";
            }
        }
    }

    function _hideAllTransient() {
        var bars = _getDynamicBars();
        _hideAllBars(bars);
        // Also hide light dismiss ones
        thisWinUI.AppBar._hideLightDismissAppBars();
    }

    // Get all the transient bars and return them
    // returns array of appbar objects
    // array also has _hidden and/or _visible set if ANY are hidden of visible
    function _getDynamicBars() {
        var elements = document.querySelectorAll('.win-appbar');
        var len = elements.length;
        var appbars = [];
        appbars._visible = false;
        appbars._hidden = false;
        for (var i = 0; i < len; i++) {
            var element = elements[i];
            if (element.disabled) {
                // Skip disabled appbars
                continue;
            }
            var appbar = WinJS.UI.getControl(element);
            if (appbar && appbar.transient) {
                appbars.push(appbar);
                if (appbar.hidden || element.msAnimating) {
                    appbars._hidden = true;
                } else {
                    appbars._visible = true;
                }
            }
        }

        return appbars;
    }

    // Show or hide all bars
    function _hideAllBars(bars) {
        var len = bars.length;
        for (var i = 0; i < len; i++) {
            // Skip ones that are already animating
            if (!bars[i].hidden && !bars[i]._element.msAnimating) {
                bars[i].hide();
            }
        }
    }

    function _showAllBars(bars) {
        var len = bars.length;
        for (var i = 0; i < len; i++) {
            // Skip ones that are already animating
            if (bars[i].hidden && !bars[i]._element.msAnimating) {
                bars[i].show();
            }
        }
    }

    function _checkMouseDown(event) {
        if (event.button === 2) {
            _toggleAppBars();
        }
    }

    WinJS.Namespace.define("WinJS.UI", {
        /// <summary locid="99">Constructs the AppBar control and associates it with the underlying DOM element.</summary>
        /// <name locid="100">Application Bar</name>
        /// <htmlSnippet><![CDATA[<div data-win-control="WinJS.UI.AppBar"></div>]]></htmlSnippet>
        /// <event name="beforeshow" locid="101">Raised just before showing an appbar.</event>
        /// <event name="aftershow" locid="102">Raised immediately after an appbar is fully shown.</event>
        /// <event name="beforehide" locid="103">Raised just before hiding an appbar.</event>
        /// <event name="afterhide" locid="104">Raised immediately after an appbar is fully hidden.</event>
        /// <part name="appbar" class="win-appbar" locid="105">The Appbar control itself</part>
        /// <resource type="javascript" src="/winjs/js/base.js" shared="true" />
        /// <resource type="javascript" src="/winjs/js/ui.js" shared="true" />
        /// <resource type="javascript" src="/winjs/js/binding.js" shared="true" />
        /// <resource type="javascript" src="/winjs/js/animations.js" shared="true" />
        /// <resource type="javascript" src="/winjs/js/controls.js" shared="true" />
        /// <resource type="css" src="/winjs/css/ui-dark.css" shared="true" />
        AppBar: WinJS.Class.derive(WinJS.UI._Overlay, function (element, options) {
            /// <summary locid="106">Constructs the AppBar control</summary>
            /// <param name="element" type="HTMLElement" domElement="true" locid="107">
            /// The DOM element to be associated with the AppBar control.
            /// </param>
            /// <param name="options" type="object" locid="108">
            /// The set of options to be applied initially to the AppBar control.
            /// </param>
            /// <returns type="WinJS.UI.AppBar" locid="109">A constructed AppBar control.</returns>

            // Call the base overlay constructor helper
            this._baseOverlayConstructor(element, options);

            // Attach our css class
            WinJS.Utilities.addClass(this._element, appBarClass);

            // Need to initialize base stuff
            this._position = null;
            this._transient = false;

            if (options) {
                if (options.transient) {
                    this.transient = options.transient;
                    // When constructing, hide transient appbars immediately
                    this._element.style.visibility = "hidden";
                    this._element.style.opacity = 0;
                }
                if (options.position) {
                    this.position = options.position;
                }
                if (options.autoHide) {
                    this.autoHide = options.autoHide;
                }
                if (options.lightDismiss) {
                    this.lightDismiss = options.lightDismiss;
                }
            }

            // Make sure we have a position
            if (this._position === null) {
                // Default position's supposed to be "bottom"
                this.position = appBarPositionBottom;
            }

            // _repositionBottomAppBar is temporary to move the bottom AppBar when the soft keyboard show up. 
            // This code will be removed when the automatic layout work will be done 
            window.addEventListener("resize", _repositionBottomAppBar, false);

            // Ensure our peristent bars are correctly initialized (default)
            if (this._transient === false) {
                // Default is persistent, which may be immediately visible
                if (this._element.style.visibility !== "hidden") {
                    this._element.style.visibility = "visible";
                    this._element.style.opacity = 1;
                }
            }

            // Make sure we have an ARIA role
            var role = this._element.getAttribute("role");
            if (role == null || role == "" || role === undefined) {
                this._element.setAttribute("role", "toolbar");
            }
            var label = this._element.getAttribute("aria-label");
            if (label == null || label == "" || label === undefined) {
                this._element.setAttribute("aria-label", thisWinUI.AppBar._ariaLabel);
            }

            // Make sure ARIA's in sync with our visibility
            this._element.setAttribute("aria-hidden", (this._element.style.visibility === "hidden"));

            // Attach event handler
            if (!appBarCommandEvent) {
                // Want to hide transient on blur
                window.addEventListener("blur", thisWinUI.AppBar._hideLightDismissAppBars, false);
                document.addEventListener("mousedown", _checkMouseDown, false);

                // We'll trigger on invoking.  Could also have invoked or canceled
                // Eventually we may want click up on invoking and drop back on invoked.
                // Try/catch so it'll behave in the designer.
                try {
                    var cmdUI = Windows.UI.Input.ApplicationCommand.getForCurrentView();
                    cmdUI.addEventListener("invoking", _toggleAppBars);
                    cmdUI.addEventListener("invoked", _toggleAppBars);
                    // in case orientation/snapped changes, then dismiss
                    // Can't use the following because layoutchanged doesn't know about "portrait"
                    // Windows.UI.ViewManagement.ApplicationLayout.getForCurrentView().addEventListener("layoutchanged", thisWinUI.AppBar._hideLightDismissAppBars);
                    function listener(mql) {
                        if (mql.matches) {
                            thisWinUI.AppBar._hideLightDismissAppBars();
                        }
                    }
                    var mqlFull = msMatchMedia("all and (-ms-view-state: full-screen)");
                    mqlFull.addListener(listener);
                    var mqlSnapped = msMatchMedia("all and (-ms-view-state: snapped)");
                    mqlSnapped.addListener(listener);
                    var mqlFill = msMatchMedia("all and (-ms-view-state: fill)");
                    mqlFill.addListener(listener);
                    var mqlPortrait = msMatchMedia("all and (-ms-view-state: device-portrait)");
                    mqlPortrait.addListener(listener);
                } catch (e) {
                }

                appBarCommandEvent = true;
            }

            // Make sure flyout event handlers are hooked up (this aids light dismiss)
            thisWinUI._Overlay._addFlyoutEventHandlers();
        }, {
            // Public Properties

            /// <field type="String" locid="110">The Overlay position of the AppBar.  Values are "top", "bottom" or undefined.</field>
            position: {
                get: function () {
                    return this._position;
                },
                set: function (value) {
                    if (typeof value !== "string") {
                        throw new Error(thisWinUI.AppBar.badPosition);
                    }

                    // Don't change initial state
                    if (this._position !== null) {
                        // If the position change, we may need to hide (& reshow?)
                        if (this._position !== value || this._element.style.visibility != "hidden" || this._element.msAnimating == "showing") {
                            // Animate away from old position if necessary
                            this.hide();
                            // and then animate back in later (this show will be deferred because hide has started already)
                            this.show();
                        }
                    }

                    // Set Position
                    this._position = value;

                    if (this._position == appBarPositionTop) {
                        this._element.style.position = "fixed";
                        this._element.style.top = "0px";
                        this._element.style.bottom = "auto";
                    } else if (this._position == appBarPositionBottom) {
                        this._element.style.position = "fixed";
                        var bottomPos = document.body.clientHeight - window.innerHeight;
                        // this._element.style.bottom = "0px";
                        this._element.style.bottom = bottomPos + "px";
                        this._element.style.top = "auto";
                    }

                    // Make sure our animations are correct
                    this._assignAnimations();
                }
            },

            /// <field type="Boolean" locid="111">Whether the AppBar is transient.</field>
            transient: {
                get: function () {
                    return this._transient;
                },
                set: function (value) {
                    if (typeof value !== "boolean") {
                        throw new Error(thisWinUI.AppBar.badTransient);
                    }
                    this._transient = value;
                    // Note: caller has to call .show() if they also want it visible
                }
            },

            /// <field type="Number" locid="112">The number of milliseconds before a visible AppBar hides itself, where 0 is never</field>
            autoHide: {
                get: function () {
                    return this._autoHide;
                },
                set: function (value) {
                    if (typeof value !== "number" || value < 0) {
                        throw new Error(thisWinUI._Overlay.badAutoHide);
                    }
                    this._autoHide = value;
                    this._resetAutoHideTimer();
                }
            },

            /// <field type="Boolean" locid="113">Dismiss a visible AppBar if it loses focus within the application.</field>
            lightDismiss: {
                get: function () {
                    return this._lightDismiss;
                },
                set: function (value) {
                    if (typeof value !== "boolean") {
                        throw new Error(thisWinUI._Overlay.badLightDismiss);
                    }
                    this._lightDismiss = value;
                }
            },

            /// <summary locid="114">
            /// Shows the AppBar, if hidden, regardless of other state
            /// </summary>
            /// <returns type="undefined" locid="82" />
            show: function () {
                // We call our base _baseShow because AppBar may need to override show
                // "hiding" would need to cancel.
                this._baseShow();
            },

            /// <summary locid="115">
            /// Hides the AppBar, if visible, regardless of other state
            /// </summary>
            /// <returns type="undefined" locid="82" />
            hide: function () {
                // We call our base _baseHide because AppBar may need to override hide
                if (this._baseHide()) {
                    // Extra work if we succeeded
                    // Need to hide any child flyouts as well (eg: appbar flyout)
                    thisWinUI._Overlay._hideFlyouts(this._element);
                }
            },

            _assignAnimations: function () {
                // Make sure the animations are correct for our current position
                if (this._position === appBarPositionTop || this._position === appBarPositionBottom) {
                    // Top or Bottom
                    this._currentAnimateIn = this._animateSlideIn;
                    this._currentAnimateOut = this._animateSlideOut;
                } else {
                    // Default for in the middle of nowhere
                    this._currentAnimateIn = this._baseAnimateIn;
                    this._currentAnimateOut = this._baseAnimateOut;
                }
            },

            // appbar animations
            _animateSlideIn: function () {
                var where,
                    height = this._element.offsetHeight;
                if (this._position === appBarPositionTop) {
                    // Top Bar
                    where = { top: '-' + height + 'px', left: '0px' };
                    this._element.style.top = "0px";
                    this._element.style.bottom = "auto";
                } else {
                    // Bottom Bar
                    var bottomPos = document.body.clientHeight - window.innerHeight;
                    where = { top: height + 'px', left: '0px' };
                    // this._element.style.bottom = "0px";
                    this._element.style.bottom = bottomPos + "px";
                    this._element.style.top = "auto";
                }

                this._element.style.opacity = 1;
                this._element.style.visibility = "visible";
                return WinJS.UI.Animation.showEdgeUI(this._element, where);
            },

            _animateSlideOut: function () {
                var where,
                    height = this._element.offsetHeight;
                if (this._position === appBarPositionTop) {
                    // Top Bar
                    where = { top: height + 'px', left: '0px' };
                    this._element.style.top = "-" + height + "px";
                    this._element.style.bottom = "auto";
                } else {
                    // Bottom Bar
                    where = { top: '-' + height + 'px', left: '0px' };
                    var bottomPos = document.body.clientHeight - window.innerHeight;
                    // this._element.style.bottom = "-" + height + "px";
                    this._element.style.bottom = bottomPos - height + "px";
                    this._element.style.top = "auto";
                }
                return WinJS.UI.Animation.showEdgeUI(this._element, where);
            }
        })
    });

    // Statics

    // Overlay class calls this for global light dismiss events
    thisWinUI.AppBar._hideLightDismissAppBars = function (event) {
        var elements = document.querySelectorAll('.win-appbar');
        var len = elements.length;
        var appbars = [];
        for (var i = 0; i < len; i++) {
            var appbar = WinJS.UI.getControl(elements[i]);
            if (appbar && appbar.lightDismiss && !appbar.hidden) {
                appbars.push(appbar);
            }
        }

        _hideAllBars(appbars);
    }

    // Labels
    thisWinUI.AppBar._ariaLabel = "Application Command Bar";

    // Errors
    thisWinUI.AppBar.badPosition = "Invalid argument: The position property must be 'top', 'bottom', or 'other'";
    thisWinUI.AppBar.badTransient = "Invalid argument: An transient property requires a true or false boolean";
})(WinJS);



(function (WinJS) {
    var thisWinUI = WinJS.UI;

    // Class Names
    var flyoutClass = "win-flyout";
    var menuClass = "win-menu";

    function doBlur(e) {

    }

    function doLostFocus(e) {

    }

    WinJS.Namespace.define("WinJS.UI", {
        /// <summary locid="116">Constructs the Flyout control and associates it with the underlying DOM element.</summary>
        /// <name locid="117">Flyout</name>
        /// <htmlSnippet><![CDATA[<div data-win-control="WinJS.UI.Flyout"></div>]]></htmlSnippet>
        /// <event name="beforeshow" locid="118">Raised just before showing a flyout.</event>
        /// <event name="aftershow" locid="119">Raised immediately after a flyout is fully shown.</event>
        /// <event name="beforehide" locid="120">Raised just before hiding a flyout.</event>
        /// <event name="afterhide" locid="121">Raised immediately after a flyout is fully hidden.</event>
        /// <part name="flyout" class="win-flyout" locid="122">The Flyout control itself</part>
        /// <resource type="javascript" src="/winjs/js/base.js" shared="true" />
        /// <resource type="javascript" src="/winjs/js/ui.js" shared="true" />
        /// <resource type="javascript" src="/winjs/js/binding.js" shared="true" />
        /// <resource type="javascript" src="/winjs/js/animations.js" shared="true" />
        /// <resource type="javascript" src="/winjs/js/controls.js" shared="true" />
        /// <resource type="css" src="/winjs/css/ui-dark.css" shared="true" />
        Flyout: WinJS.Class.derive(WinJS.UI._Overlay, function (element, options) {
            /// <summary locid="116">
            /// Constructs the Flyout control and associates it with the underlying DOM element.
            /// </summary>
            /// <param name="element" type="HTMLElement" domElement="true" locid="77">
            /// The DOM element to be associated with the Overlay control.
            /// </param>
            /// <param name="options" type="object" domElement="false" locid="123">
            /// The set of options to be applied initially to the Flyout control.
            /// </param>
            /// <returns type="WinJS.UI.Flyout" locid="124">A fully constructed Flyout control.</returns>

            // Flyout constructor

            // Call the base overlay constructor helper
            this._baseOverlayConstructor(element, options);

            // Flyouts are supposed to always be light-dismiss
            this._lightDismiss = true;
            this._autoHide = 0;

            // Make a click eating div
            thisWinUI._Overlay._createClickEater();

            // Start flyouts hidden
            this.hide();

            // Attach our css class
            WinJS.Utilities.addClass(this._element, flyoutClass);

            // Make sure we have an ARIA role
            var role = this._element.getAttribute("role");
            if (role == null || role == "" || role === undefined) {
                if (WinJS.Utilities.hasClass(this._element, menuClass)) {
                    this._element.setAttribute("role", "menu");
                } else {
                    this._element.setAttribute("role", "dialog");
                }
            }
            var label = this._element.getAttribute("aria-label");
            if (label == null || label == "" || label === undefined) {
                this._element.setAttribute("aria-label", thisWinUI.Flyout._ariaLabel);
            }

            // Base animation is popIn, but our flyout has different args
            this._currentAnimateIn = this._appbarFlyoutAnimateIn;
            this._currentAnimateOut = this._appbarFlyoutAnimateOut;

            // Make sure flyout event handlers are hooked up
            thisWinUI._Overlay._addFlyoutEventHandlers();

            // Need to hide ourselves if we lose focus
            var that = this;
            this._element.addEventListener("focusout", function (e) { thisWinUI._Overlay._hideIfLostFocus(that, e); }, false);
        }, {
            /// <summary locid="125">
            /// Shows the Flyout, if hidden, regardless of other state
            /// </summary>
            /// <param name="anchor" type="HTMLElement" domElement="true" locid="126">
            /// The DOM element to anchor the flyout.
            /// </param>
            /// <param name="placement" type="object" domElement="false" locid="127">
            /// The placement of the flyout to the anchor: 'top', 'bottom', 'left', or 'right'.
            /// </param>
            /// <returns type="undefined" locid="82" />
            show: function (anchor, placement) {
                // We expect an anchor
                if (!anchor) {
                    // If we have _nextLeft, etc., then we were continuing an old animation, so that's OK
                    if (this._nextLeft !== undefined) {
                        throw new Error(thisWinUI.Flyout._noAnchor);
                    }
                } else {
                    // Remember the anchor so that if we lose focus we can go back
                    if (typeof anchor === "string") {
                        anchor = document.getElementById(anchor);
                    } else if (anchor.element) {
                        anchor = anchor.element;
                    }
                    this._anchor = anchor;
                }

                // and we expect a placement
                if (!placement) {
                    placement = 'top';
                }

                // Set up the new position, and prep the offset for showPopup
                if (anchor) {
                    var anchorRect = anchor.getBoundingClientRect(),
                        originalRect = this._element.getBoundingClientRect(),
                        flyoutStyle = window.getComputedStyle(this._element),
                        flyoutRect = new Object();

                    // We have to fix our flyoutRect with the margins (only need height and width)
                    flyoutRect.width = (originalRect.right + parseInt(flyoutStyle.marginRight)) - (originalRect.left - parseInt(flyoutStyle.marginLeft));
                    flyoutRect.height = (originalRect.bottom + parseInt(flyoutStyle.marginBottom)) - (originalRect.top - parseInt(flyoutStyle.marginTop));

                    // See if it's vertical
                    if (placement === 'top') {
                        if (this._fitTop(anchorRect, flyoutRect) || this._fitBottom(anchorRect, flyoutRect)) {
                            this._centerHorizontally(anchorRect, flyoutRect);
                        } else if (this._fitLeft(anchorRect, flyoutRect) || this._fitRight(anchorRect, flyoutRect)) {
                            this._centerVertically(anchorRect, flyoutRect);
                        } else {
                            this._fitFailed(anchorRect, flyoutRect);
                        }
                    } else if (placement === 'bottom') {
                        if (this._fitBottom(anchorRect, flyoutRect) || this._fitTop(anchorRect, flyoutRect)) {
                            this._centerHorizontally(anchorRect, flyoutRect);
                        } else if (this._fitLeft(anchorRect, flyoutRect) || this._fitRight(anchorRect, flyoutRect)) {
                            this._centerVertically(anchorRect, flyoutRect);
                        } else {
                            this._fitFailed(anchorRect, flyoutRect);
                        }
                    } else if (placement === 'left') {
                        if (this._fitLeft(anchorRect, flyoutRect) || this._fitRight(anchorRect, flyoutRect)) {
                            this._centerVertically(anchorRect, flyoutRect);
                        } else if (this._fitTop(anchorRect, flyoutRect) || this._fitBottom(anchorRect, flyoutRect)) {
                            this._centerHorizontally(anchorRect, flyoutRect);
                        } else {
                            this._fitFailed(anchorRect, flyoutRect);
                        }
                    } else if (placement === 'right') {
                        if (this._fitRight(anchorRect, flyoutRect) || this._fitLeft(anchorRect, flyoutRect)) {
                            this._centerVertically(anchorRect, flyoutRect);
                        } else if (this._fitTop(anchorRect, flyoutRect) || this._fitBottom(anchorRect, flyoutRect)) {
                            this._centerHorizontally(anchorRect, flyoutRect);
                        } else {
                            this._fitFailed(anchorRect, flyoutRect);
                        }
                    } else {
                        // Not a legal placement value
                        throw new Error(thisWinUI.Flyout._noPlacement);
                    }
                }

                // If we are already animating don't change position (yet)
                if (!this._element.msAnimating) {
                    this._element.style.top = this._nextTop + 'px';
                    this._element.style.left = this._nextLeft + 'px'; ;
                    this._element.style.bottom = 'auto';
                    this._element.style.right = 'auto';
                    this._nextLeft = undefined;
                    this._nextTop = undefined;
                }

                // Need click-eating div to be visible
                thisWinUI._Overlay._clickEatingDiv.style.visibility = "visible";

                // We call our base _baseShow to handle the actual animation
                if (this._baseShow()) {
                    // Make sure we have focus
                    this._element.visiblity = "visible";
                    this._element.opacity = 1;
                    thisWinUI._Overlay._ensureFocus(this._element);
                }
            },

            /// <summary locid="128">
            /// Hides the Flyout, if visible, regardless of other state
            /// </summary>
            /// <returns type="undefined" locid="82" />
            hide: function () {
                if (this._baseHide()) {
                    // Change focus
                    if (this._anchor !== undefined) {
                        thisWinUI._Overlay._ensureFocus(this._anchor);
                    }

                    // Need click-eating div to be hidden
                    thisWinUI._Overlay._clickEatingDiv.style.visibility = "hidden";
                }
            },

            // See if we can fit in various places
            _fitTop: function (anchorRect, flyoutRect) {
                this._nextTop = anchorRect.top - flyoutRect.height;
                this._nextAnimOffset = { top: '30px', left: '0px' };
                return (this._nextTop >= 0 && this._nextTop + flyoutRect.height < window.innerHeight);
            },

            _fitBottom: function (anchorRect, flyoutRect) {
                this._nextTop = anchorRect.bottom;
                this._nextAnimOffset = { top: '-30px', left: '0px' };
                return (this._nextTop >= 0 && this._nextTop + flyoutRect.height < window.innerHeight);
            },

            _fitLeft: function (anchorRect, flyoutRect) {
                this._nextLeft = anchorRect.left - flyoutRect.width;
                this._nextAnimOffset = { top: '0px', left: '30px' };
                return (this._nextLeft >= 0 && this._nextLeft + flyoutRect.width < window.innerWidth);
            },

            _fitRight: function (anchorRect, flyoutRect) {
                this._nextLeft = anchorRect.right;
                this._nextAnimOffset = { top: '0px', left: '-30px' };
                return (this._nextLeft >= 0 && this._nextLeft + flyoutRect.width < window.innerWidth);
            },

            _centerVertically: function (anchorRect, flyoutRect) {
                this._nextTop = anchorRect.top + anchorRect.height / 2 - flyoutRect.height / 2;
                if (this._nextTop < 0) {
                    this._nextTop = 0;
                } else if (this._nextTop + flyoutRect.height >= window.innerHeight) {
                    this._nextTop = window.innerHeight - flyoutRect.height;
                }
            },

            _centerHorizontally: function (anchorRect, flyoutRect) {
                this._nextLeft = anchorRect.left + anchorRect.width / 2 - flyoutRect.width / 2;
                if (this._nextLeft < 0) {
                    this._nextLeft = 0;
                } else if (this._nextLeft + flyoutRect.width >= window.innerWidth) {
                    this._nextLeft = window.innerWidth - flyoutRect.width;
                }
            },

            _fitFailed: function (anchorRect, flyoutRect) {
                // This is intentionally ugly so people avoid it
                this._nextLeft = -30;
                this._nextTop = -30;
                this._nextAnimOffset = { top: '200px', left: '-60px' };
            },

            // appbar flyout animations
            _appbarFlyoutAnimateIn: function () {
                this._element.style.opacity = 1;
                this._element.style.visibility = "visible";
                return WinJS.UI.Animation.showPopup(this._element, this._nextAnimOffset);
            },

            _appbarFlyoutAnimateOut: function () {
                this._element.style.opacity = 0;
                return WinJS.UI.Animation.hidePopup(this._element, this._nextAnimOffset);
            }
        })
    });

    // Statics

    // Labels
    thisWinUI.Flyout._ariaLabel = "Untitled Flyout";

    // Errors
    thisWinUI.Flyout._noAnchor = "Invalid argument: Showing flyout requires a DOM element as its first parameter.";
    thisWinUI.Flyout._noPlacement = "Invalid argument: Showing flyout requires 'top', 'bottom', 'left', or 'right' as its second parameter.";

})(WinJS);



(function (WinJS) {
    var thisWinUI = WinJS.UI;

    // Class Names
    var settingsPaneClass = "win-settingspane",
        narrowClass = "win-narrow",
        wideClass = "win-wide";

    // Constants for width
    var settingsNarrow = "narrow",
        settingsWide = "wide";

    function _onSettingsCommand(command) {
        try {
            var id = command.id;
            WinJS.UI.getControl(document.getElementById(id)).show();
        } catch (e) {
        }
    }

    WinJS.Namespace.define("WinJS.UI", {
        /// <summary locid="129">Constructs the SettingsPane control and associates it with the underlying DOM element.</summary>
        /// <name locid="130">Settings Pane</name>
        /// <htmlSnippet><![CDATA[<div data-win-control="WinJS.UI.SettingsPane"></div>]]></htmlSnippet>
        /// <event name="beforeshow" locid="131">Raised just before showing a settings pane.</event>
        /// <event name="aftershow" locid="132">Raised immediately after a settings pane is fully shown.</event>
        /// <event name="beforehide" locid="133">Raised just before hiding a settings pane.</event>
        /// <event name="afterhide" locid="134">Raised immediately after a settings pane is fully hidden.</event>
        /// <part name="settings" class="win-settingspane" locid="135">The Settings Pane control itself</part>
        /// <resource type="javascript" src="/winjs/js/base.js" shared="true" />
        /// <resource type="javascript" src="/winjs/js/ui.js" shared="true" />
        /// <resource type="javascript" src="/winjs/js/binding.js" shared="true" />
        /// <resource type="javascript" src="/winjs/js/wwaapp.js" shared="true" />
        /// <resource type="javascript" src="/winjs/js/animations.js" shared="true" />
        /// <resource type="javascript" src="/winjs/js/controls.js" shared="true" />
        /// <resource type="css" src="/winjs/css/ui-dark.css" shared="true" />
        SettingsPane: WinJS.Class.derive(WinJS.UI._Overlay, function (element, options) {
            /// <summary locid="136">Constructs a SettingsPane control</summary>
            /// <param name="element" type="HTMLElement" domElement="true" locid="137">
            /// The DOM element to be associated with the SettingsPane control.
            /// </param>
            /// <param name="options" type="object" locid="138">
            /// The set of options to be applied initially to the SettingsPane control.
            /// </param>
            /// <returns type="WinJS.UI.SettingsPane" locid="139">A constructed SettingsPane control.</returns>

            // Call the base overlay constructor helper
            this._baseOverlayConstructor(element, options);

            // Settings Panes are supposed to always be light-dismiss
            this._lightDismiss = true;
            this._autoHide = 0;

            // remember our options
            if (options) {
                if (options.commandId) {
                    if (typeof options.commandId !== "string") {
                        throw new Error(thisWinUI.SettingsPane.badCommandId);
                    }
                    this._commandId = options.commandId;
                    this._element.id = this._commandId;
                } else {
                    this._commandId = this._element.id;
                }

                if (options.label) {
                    if (typeof options.label !== "string") {
                        throw new Error(thisWinUI.SettingsPane.badLabel);
                    }
                    this._label = options.label;
                }

                if (options.width) {
                    this.width = options.width;
                }
            }

            // Make a click eating div
            thisWinUI._Overlay._createClickEater();

            // Start settings hidden
            this.hide();

            // Attach our css class
            WinJS.Utilities.addClass(this._element, settingsPaneClass);

            // Make sure we have an ARIA role
            var role = this._element.getAttribute("role");
            if (role == null || role == "" || role === undefined) {
                this._element.setAttribute("role", "dialog");
            }
            var label = this._element.getAttribute("aria-label");
            if (label == null || label == "" || label === undefined) {
                this._element.setAttribute("aria-label", thisWinUI.SettingsPane._ariaLabel);
            }

            // Hook up our settings event listener, try/catch so it works in designer
            try {
                var n = Windows.UI.ApplicationSettings,
                    command;
                if (this._commandId === "KnownSettingsCommand.About") {
                    command = new n.SettingsCommand(n.KnownSettingsCommand.about, _onSettingsCommand);
                } else if (this._commandId === "KnownSettingsCommand.Account") {
                    command = new n.SettingsCommand(n.KnownSettingsCommand.account, _onSettingsCommand);
                } else if (this._commandId === "KnownSettingsCommand.Help") {
                    command = new n.SettingsCommand(n.KnownSettingsCommand.help, _onSettingsCommand);
                } else if (this._commandId === "KnownSettingsCommand.Preferences") {
                    command = new n.SettingsCommand(n.KnownSettingsCommand.preferences, _onSettingsCommand);
                } else if (this._commandId === "KnownSettingsCommand.TermsOfUse") {
                    command = new n.SettingsCommand(n.KnownSettingsCommand.termsOfUse, _onSettingsCommand);
                } else if (this._commandId === "KnownSettingsCommand.ConnectedServices") {
                    command = new n.SettingsCommand(n.KnownSettingsCommand.connectedServices, _onSettingsCommand);
                } else if (this._commandId === "KnownSettingsCommand.Privacy") {
                    command = new n.SettingsCommand(n.KnownSettingsCommand.privacy, _onSettingsCommand);
                } else {
                    // Custom Settings Command
                    command = new n.SettingsCommand(this._commandId, this._label, _onSettingsCommand);
                }

                // Go ahead and append it
                n.SettingsPane.getForCurrentView().applicationCommands.append(command);
            } catch (e) {
            }

            // Make sure flyout event handlers are hooked up
            thisWinUI._Overlay._addFlyoutEventHandlers();

            // Need to hide ourselves if we lose focus
            var that = this;
            this._element.addEventListener("focusout", function (e) { thisWinUI._Overlay._hideIfLostFocus(that, e); }, false);

            // Need to clear the SettingsPane appcommands vector on page unload
            window.addEventListener("beforeunload", function () {
                try {
                    Windows.UI.ApplicationSettings.SettingsPane.getForCurrentView().applicationCommands.clear();
                } catch (e) {
                }
            }, false);

            // Make sure animations are hooked up
            this._currentAnimateIn = this._animateSlideIn;
            this._currentAnimateOut = this._animateSlideOut;
        }, {
            // Public Properties

            /// <field type="String" locid="140">Command Id of the settings pane</field>
            commandId: {
                get: function () {
                    return this._commandId;
                }
            },

            /// <field type="String" locid="141">Label for the settings command</field>
            label: {
                get: function () {
                    return this._label;
                }
            },

            /// <field type="String" locid="142">Width of the settings pane, "narrow", or "wide"</field>
            width: {
                get: function () {
                    return this._width;
                },

                set: function (value) {
                    if (value === this._width) {
                        return;
                    }
                    // Get rid of old class
                    if (this._width === settingsNarrow) {
                        WinJS.Utilities.removeClass(this._element, narrowClass);
                    } else if (this._width === settingsWide) {
                        WinJS.Utilities.removeClass(this._element, wideClass);
                    }
                    this._width = value;

                    // Attach our new css class
                    if (this._width === settingsNarrow) {
                        WinJS.Utilities.addClass(this._element, narrowClass);
                    } else if (this._width === settingsWide) {
                        WinJS.Utilities.addClass(this._element, wideClass);
                    }
                }
            },

            /// <summary locid="143">
            /// Shows the Settings Pane, if hidden, regardless of other state
            /// </summary>
            /// <returns type="undefined" locid="82" />
            show: function () {
                // We call our base _baseShow because AppBar may need to override show
                if (this._baseShow()) {
                    // Need click-eating div to be visible
                    thisWinUI._Overlay._clickEatingDiv.style.visibility = "visible";
                    // Make sure we have focus
                    // TODO: This isn't working for some reason
                    thisWinUI._Overlay._ensureFocus(this._element);
                }
            },

            /// <summary locid="144">
            /// Hides the Settings Pane, if visible, regardless of other state
            /// </summary>
            /// <returns type="undefined" locid="82" />
            hide: function () {
                if (this._baseHide()) {
                    // Change focus
                    if (this._anchor !== undefined && this._anchor.setActive !== undefined) {
                        this._anchor.setActive();
                        this._anchor = undefined;
                    }

                    // Need click-eating div to be hidden
                    thisWinUI._Overlay._clickEatingDiv.style.visibility = "hidden";
                }
            },

            // settings pane animations
            _animateSlideIn: function () {
                var where,
                    width = this._element.offsetWidth;
                // Slide in from right side or left side?
                if (document.body["dir"] === "rtl") {
                    // RTL
                    where = { top: '0px', left: '-' + width + 'px' };
                    this._element.style.right = "auto";
                    this._element.style.left = "0px";
                } else {
                    // From right side
                    where = { top: '0px', left: width + 'px' };
                    this._element.style.right = "0px";
                    this._element.style.left = "auto";
                }

                this._element.style.opacity = 1;
                this._element.style.visibility = "visible";
                return WinJS.UI.Animation.showEdgeUI(this._element, where);
            },

            _animateSlideOut: function () {
                var where,
                    width = this._element.offsetWidth;
                if (document.body["dir"] === "rtl") {
                    // RTL
                    where = { top: '0px', left: width + 'px' };
                    this._element.style.right = "auto";
                    this._element.style.left = "-" + width + "px";
                } else {
                    // From right side
                    where = { top: '0px', left: '-' + width + 'px' };
                    this._element.style.right = "-" + width + "px";
                    this._element.style.left = "auto";
                }
                return WinJS.UI.Animation.showEdgeUI(this._element, where);
            }
        })
    });

    // Statics
    thisWinUI.SettingsPane.show = function () {
        // Show the main settings pane
        try {
            var n = Windows.UI.ApplicationSettings.SettingsPane.show();
        } catch (err) { }
        // And hide the WWA one
        var elements = document.querySelectorAll('div[data-win-control="WinJS.UI.SettingsPane"]');
        var len = elements.length;
        for (var i = 0; i < len; i++) {
            var settingsPane = WinJS.UI.getControl(elements[i]);
            if (settingsPane) {
                settingsPane.hide();
            }
        }
    }

    // Labels
    thisWinUI.SettingsPane._ariaLabel = "Untitled Settings Pane";

    // Errors
    thisWinUI.SettingsPane.badCommandId = "Invalid argument: The commandId property must be a string";
    thisWinUI.SettingsPane.badLabel = "Invalid argument: The label property must be a string";
})(WinJS);



(function (global) {

    var lastCloseTime = 0;
    var utilities = WinJS.Utilities;

    // Error messages
    var elementIsInvalid = "Invalid argument: Tooltip control expects a valid DOM element as the first argument.",
    invalidCreation = "Invalid creation: Tooltip control.",
    optionIsInvalid = "Invalid option: Tooltip placement only takes four possible values: top, bottom, left, right",
    elementCannotBeUpdated = "The anchor element can not be updated.";

    // Constants definition
    var DEFAULT_PLACEMENT = "top",
    DELAY_INITIAL_TOUCH_SHORT = 200,
    DELAY_INITIAL_TOUCH_LONG = 1000,
    DEFAULT_MOUSE_HOVER_TIME = 500, // half second
    DEFAULT_MESSAGE_DURATION = 5000, // 5 secs
    DELAY_RESHOW = 0,
    RESHOW_THRESHOLD = 200,
    HIDE_DELAY_MAX = 300000, // 5 mins
    OFFSET_MOUSE = 12,
    OFFSET_TOUCH = 32,
    SAFETY_NET_GAP = 1, // We set a 1-pixel gap between the right or bottom edge of the tooltip and the viewport to avoid possible re-layout
    PT_TOUCH = 2; // pointer type to indicate a touch event

    var EVENTS_INVOKE = { "focus": "", "MSPointerOver": "" },
    EVENTS_DISMISS = { "MSPointerDown": "", "blur": "", "MSPointerOut": "" },
    EVENTS_BY_CHILD = { "MSPointerOver": "", "MSPointerOut": "" };

    // CSS class names
    var msTooltip = "win-tooltip",
    msTooltipPhantom = "win-tooltip-phantom",
    msTooltipAppear = "win-animation-appear",
    msTooltipDisappear = "win-animation-disappear",
    msAnimationNameAppear = "win-tooltip-fade-in",
    msAnimationNameDisappear = "win-tooltip-fade-out";

    // Global attributes
    var mouseHoverTime = DEFAULT_MOUSE_HOVER_TIME,
    messageDuration = DEFAULT_MESSAGE_DURATION,
    isLeftHanded = false;

    // Set system attributes if it is in WWA, otherwise, use the default values
    if (window.Windows) { // in WWA
        var uiSettings = new Windows.UI.ViewManagement.UISettings();
        mouseHoverTime = uiSettings.mouseHoverTime;
        messageDuration = uiSettings.messageDuration * 1000;  // uiSettings.messageDuration is in seconds.
        var handedness = uiSettings.handPreference;
        isLeftHanded = (handedness == Windows.UI.ViewManagement.HandPreference.leftHanded);
    }

    // Tooltip control implementation
    WinJS.Namespace.defineWithParent(WinJS, "UI", {
        /// <summary locid="145">
        /// The Tooltip control allows a rich tooltip to be set on HTML elements
        /// </summary>
        /// <htmlSnippet><![CDATA[<div data-win-control="WinJS.UI.Tooltip" data-win-options="{innerHTML:'The tip content goes here'}"></div>]]></htmlSnippet>
        /// <event name="beforeopen" bubbles="false" locid="146">Raised when the tooltip is about to start showing itself</event>
        /// <event name="opened" bubbles="false" locid="147">Raised when the tooltip is showing</event>
        /// <event name="beforeclose" bubbles="false" locid="148">Raised when the tooltip is about to become hidden</event>
        /// <event name="closed" bubbles="false" locid="149">Raised when the tooltip is now hidden</event>
        /// <part name="tooltip" class="win-tooltip" locid="150">The Tooltip control itself</part>
        /// <resource type="javascript" src="/winjs/js/base.js" shared="true" />
        /// <resource type="javascript" src="/winjs/js/ui.js" shared="true" />
        /// <resource type="javascript" src="/winjs/js/controls.js" shared="true" />
        /// <resource type="css" src="/winjs/css/ui-dark.css" shared="true" />
        Tooltip: WinJS.Class.define(function (anchorElement, options) {
            /// <summary locid="151">
            /// Constructs the Tooltip control
            /// </summary>
            /// <param name="element" domElement="true" locid="152">
            /// The DOM element to be associated with the Tooltip control.
            /// </param>
            /// <param name="options" type="object" locid="153">
            /// The set of options to be applied initially to the Tooltip control.
            /// </param>
            /// <returns type="WinJS.UI.Tooltip" locid="154">
            /// A Tooltip control.
            /// </returns>
            if (!(this instanceof WinJS.UI.Tooltip)) {
                throw new Error(invalidCreation);
            }

            if (!anchorElement) {
                throw new Error(elementIsInvalid);
            }

            var tooltip = utilities.data(anchorElement).tooltip;
            if (tooltip) {
                return tooltip;
            }

            // Need to initialize properties
            this._placement = DEFAULT_PLACEMENT;
            this._infotip = false;
            this._innerHTML = null;
            this._contentElement = null;
            this._lastContentType = "html";
            this._anchorElement = anchorElement;
            this._domElement = null;
            this._phantomDiv = null;
            this._triggerByOpen = false;

            // Remember ourselves
            WinJS.UI.setControl(anchorElement, this);

            // If anchor element's title is defined, set as the default tooltip content
            if (anchorElement.title) {
                this._innerHTML = this._anchorElement.title;
                this._anchorElement.removeAttribute("title");
            }

            WinJS.UI.setOptions(this, options);
            this._events();
            utilities.data(anchorElement).tooltip = this;
        }, {
            /// <field type="String" locid="155">
            /// The HTML content of the tooltip
            /// </field>
            innerHTML: {
                get: function () {
                    return this._innerHTML;
                },
                set: function (value) {
                    this._innerHTML = value;
                    if (this._domElement) {
                        // If we set the innerHTML to null or "" while tooltip is up, we should close it
                        if (!this._innerHTML || this._innerHTML === "") {
                            this._onDismiss();
                            return;
                        }
                        this._domElement.innerHTML = value;
                        this._position();
                    }
                    this._lastContentType = "html";
                }
            },

            /// <field type="HTMLElement" locid="156">
            /// The element that tooltip is attached to
            /// </field>
            element: {
                get: function () {
                    return this._anchorElement;
                },
                set: function (value) {
                    if (this._anchorElement !== value) {
                        throw new Error(elementCannotBeUpdated);
                    }
                }
            },

            /// <field type="HTMLElement" locid="157">
            /// The content of the tooltip in terms of a dom element
            /// </field>
            contentElement: {
                get: function () {
                    return this._contentElement;
                },
                set: function (value) {
                    this._contentElement = value;
                    if (this._domElement) {
                        // If we set the contentElement to null while tooltip is up, we should close it
                        if (!this._contentElement) {
                            this._onDismiss();
                            return;
                        }
                        this._domElement.innerHTML = "";
                        this._domElement.appendChild(this._contentElement);
                        this._position();
                    }
                    this._lastContentType = "element";
                }
            },

            /// <field type="String" locid="158">
            /// The desired position for the tooltip: top, bottom, left or right.
            /// </field>
            placement: {
                get: function () {
                    return this._placement;
                },
                set: function (value) {
                    if (value !== "top" && value !== "bottom" && value !== "left" && value !== "right") {
                        throw new Error(optionIsInvalid);
                    }
                    this._placement = value;
                    if (this._domElement) {
                        this._position();
                    }
                }
            },

            /// <field type="Boolean" locid="159">
            /// Set to true if the tooltip contains a lot of information and should be showing for longer
            /// than the usual short tooltips (default value is false).
            /// </field>
            infotip: {
                get: function () {
                    return this._infotip;
                },
                set: function (value) {
                    this._infotip = !!value; //convert the value to boolean
                }
            },

            /// <summary locid="48">
            /// Adds an event listener
            /// </summary>
            /// <param name="eventName" type="String" locid="49">Event name</param>
            /// <param name="eventCallback" type="Function" locid="50">The event handler function to associate with this event</param>
            /// <param name="capture" type="Boolean" locid="51">Whether the event handler should be called during the capturing phase</param>
            addEventListener: function (eventName, eventCallBack, capture) {
                if (this._anchorElement) {
                    this._anchorElement.addEventListener(eventName, eventCallBack, capture);
                }
            },

            /// <summary locid="52">
            /// Removes an event listener
            /// </summary>
            /// <param name="eventName" type="String" locid="49">Event name</param>
            /// <param name="eventCallback" type="Function" locid="50">The event handler function to associate with this event</param>
            /// <param name="capture" type="Boolean" locid="51">Whether the event handler should be called during the capturing phase</param>
            removeEventListener: function (eventName, eventCallBack, capture) {
                if (this._anchorElement) {
                    this._anchorElement.removeEventListener(eventName, eventCallBack, capture);
                }
            },

            /// <summary locid="160">
            /// Opens the tooltip
            /// </summary>
            /// <param name="type" type="String" locid="161">The type of tooltip to be opened: touch, mouseover, mousedown, keyboard</param>
            open: function (type) {
                // Open takes precedence over other triggering events
                // Once tooltip is opened using open(), it can only be closed by time out(mouseover or keyboard) or explicitly by close().
                this._triggerByOpen = true;

                if (type !== "touch" && type !== "mouseover" && type !== "mousedown" && type !== "keyboard") {
                    type = "default";
                }

                switch (type) {
                    case "touch":
                        this._onInvoke("touch", "never");
                        break;
                    case "mouseover":
                    case "keyboard":
                        this._onInvoke("mouse", "auto");
                        break;
                    case "mousedown":
                        this._onInvoke("nodelay", "never");
                    case "default":
                        this._onInvoke("nodelay", "never");
                        break;
                }

            },

            /// <summary locid="162">
            /// Closes the tooltip
            /// </summary>
            close: function () {
                this._onDismiss();
            },

            _cleanUpDOM: function () {
                if (this._domElement) {
                    document.body.removeChild(this._phantomDiv);
                    document.body.removeChild(this._domElement);
                    this._domElement = null;
                    this._phantomDiv = null;
                }
            },

            _createTooltipDOM: function () {
                this._cleanUpDOM();

                this._domElement = document.createElement("div");

                var id = WinJS.Utilities.generateID("tooltip-");
                this._domElement.setAttribute("id", id);

                // Set the direction of tooltip according to anchor element's
                var dir = document.defaultView.getComputedStyle(this._anchorElement, null).direction;
                this._domElement.style.direction = dir;

                // Make the tooltip non-focusable
                this._domElement.setAttribute("tabindex", -1);

                // Set the aria tags for accessibility
                this._domElement.setAttribute("role", "tooltip");
                this._anchorElement.setAttribute("aria-describedby", id);

                // Set the tooltip content
                if (this._lastContentType === "element") { // Last update through contentElement option
                    this._domElement.appendChild(this._contentElement);
                } else { // Last update through innerHTML option
                    this._domElement.innerHTML = this._innerHTML;
                }

                // Add handler for animation events
                this._registerEventToListener(this._domElement, "MSAnimationEnd", this);

                document.body.appendChild(this._domElement);
                utilities.addClass(this._domElement, msTooltip);

                // Create a phantom div on top of the tooltip div to block all interactions
                this._phantomDiv = document.createElement("div");
                this._phantomDiv.setAttribute("tabindex", -1);
                document.body.appendChild(this._phantomDiv);
                utilities.addClass(this._phantomDiv, msTooltipPhantom);
                var zIndex = document.defaultView.getComputedStyle(this._domElement, null).zIndex + 1;
                this._phantomDiv.style.zIndex = zIndex;
            },

            _raiseEvent: function (type, eventProperties) {
                if (this._anchorElement) {
                    var customEvent = document.createEvent("CustomEvent");
                    customEvent.initCustomEvent(type, false, false, eventProperties);
                    this._anchorElement.dispatchEvent(customEvent);
                }
            },

            _registerEventToListener: function (element, eventType, listener) {
                element.addEventListener(eventType,
                function (event) {
                    listener._handleEvent(event);
                },
                false);
            },

            _events: function () {
                for (var eventType in EVENTS_INVOKE) {
                    this._registerEventToListener(this._anchorElement, eventType, this);
                }

                for (eventType in EVENTS_DISMISS) {
                    this._registerEventToListener(this._anchorElement, eventType, this);
                }
            },

            _handleEvent: function (event) {
                var eventType = event.type;
                if (eventType == "MSAnimationEnd") {
                    this._onAnimationEnd(event);
                } else if (!this._triggerByOpen) {
                    // If the anchor element has children, we should ignore events that are caused within the anchor element
                    // Please note that we are not using event.target here as in bubbling phases from the child, the event target 
                    // is usually the child
                    if (eventType in EVENTS_BY_CHILD) {
                        var elem = event.relatedTarget;
                        while (elem !== null && elem !== this._anchorElement && elem !== document.body) {
                            elem = elem.parentNode;
                        }
                        if (elem === this._anchorElement) {
                            return;
                        }
                    }
                    if (eventType in EVENTS_INVOKE) {
                        if (event.pointerType == PT_TOUCH) {
                            this._onInvoke("touch", "never");
                            this._showTrigger = "touch";
                        } else {
                            this._onInvoke("mouse", "auto");
                            this._showTrigger = "non-touch";
                        }
                    } else if (eventType in EVENTS_DISMISS) {
                        var eventTrigger = "non-touch";
                        if (event.pointerType == PT_TOUCH) {
                            if (eventType == "MSPointerDown") {
                                return;
                            }
                            eventTrigger = "touch";
                        }
                        if (eventTrigger != this._showTrigger) {
                            return;
                        }
                        this._onDismiss();
                    }
                }
            },

            _onAnimationEnd: function (event) {
                switch (event.animationName) {
                    case msAnimationNameAppear:
                        if (this._domElement) {
                            utilities.removeClass(this._domElement, msTooltipAppear);
                        }
                        if (this._shouldDismiss) {
                            return;
                        }
                        this._raiseEvent("opened");
                        if (this._domElement) {
                            if (this._hideDelay !== "never") {
                                var that = this;
                                var delay = this._infotip ? Math.min(3 * messageDuration, HIDE_DELAY_MAX) : messageDuration;
                                this._hideDelayTimer = setTimeout(function () {
                                    that._onDismiss();
                                }, delay);
                            }
                        }
                        break;
                    case msAnimationNameDisappear:
                        this._cleanUpDOM();
                        // Once we remove the tooltip from the DOM, we should remove the aria tag from the anchor
                        if (this._anchorElement) {
                            this._anchorElement.removeAttribute("aria-describedby");
                        }
                        lastCloseTime = (new Date()).getTime();
                        this._triggerByOpen = false;
                        this._raiseEvent("closed");
                        break;
                }
            },

            _decideOnDelay: function (type) {
                var value;

                if (type == "nodelay") {
                    value = 0;
                }
                else {
                    value = mouseHoverTime;
                    var curTime = (new Date()).getTime();
                    // If the mouse is moved immediately from another anchor that has 
                    // tooltip open, we should use a shorter delay
                    if (curTime - lastCloseTime <= RESHOW_THRESHOLD) {
                        value = DELAY_RESHOW;
                    } else if (type == "touch") {
                        value = this._infotip ? DELAY_INITIAL_TOUCH_LONG : DELAY_INITIAL_TOUCH_SHORT;
                    }
                }
                return value;
            },

            // This function returns the anchor element's position in the Window coordinates.
            // utilities.getPosition returns the position in document coordinates. 
            _getAnchorPositionWindowCoord: function () {
                var pos = utilities.getPosition(this._anchorElement);
                return {
                    x: pos.left - window.pageXOffset,
                    y: pos.top - window.pageYOffset,
                    width: pos.width,
                    height: pos.height
                };
            },

            _canPositionOnSide: function (placement, viewport, anchor, tip) {
                var availWidth = 0, availHeight = 0;

                switch (placement) {
                    case "top":
                        availWidth = tip.width + this._offset;
                        availHeight = anchor.y;
                        break;
                    case "bottom":
                        availWidth = tip.width + this._offset;
                        availHeight = viewport.height - anchor.y - anchor.height;
                        break;
                    case "left":
                        availWidth = anchor.x;
                        availHeight = tip.height + this._offset;
                        break;
                    case "right":
                        availWidth = viewport.width - anchor.x - anchor.width;
                        availHeight = tip.height + this._offset;
                        break;
                }
                return ((availWidth >= tip.width + this._offset) && (availHeight >= tip.height + this._offset));
            },

            _positionOnSide: function (placement, viewport, anchor, tip) {
                var left = 0, top = 0;

                switch (placement) {
                    case "top":
                    case "bottom":
                        // Align the tooltip to the anchor's center horizontally
                        left = anchor.x + anchor.width / 2 - tip.width / 2;

                        // If the left boundary is outside the window, set it to 0
                        // If the right boundary is outside the window, set it to align with the window right boundary
                        left = Math.min(Math.max(left, 0), viewport.width - tip.width - SAFETY_NET_GAP);

                        top = (placement == "top") ? anchor.y - tip.height - this._offset : anchor.y + anchor.height + this._offset;
                        break;
                    case "left":
                    case "right":
                        // Align the tooltip to the anchor's center vertically
                        top = anchor.y + anchor.height / 2 - tip.height / 2;

                        // If the top boundary is outside the window, set it to 0
                        // If the bottom boundary is outside the window, set it to align with the window bottom boundary
                        top = Math.min(Math.max(top, 0), viewport.height - tip.height - SAFETY_NET_GAP);

                        left = (placement == "left") ? anchor.x - tip.width - this._offset : anchor.x + anchor.width + this._offset;
                        break;
                }

                // Actually set the position
                this._domElement.style.left = left + window.pageXOffset + "px";
                this._domElement.style.top = top + window.pageYOffset + "px";

                // Set the phantom's position and size
                this._phantomDiv.style.left = left + window.pageXOffset + "px";
                this._phantomDiv.style.top = top + window.pageYOffset + "px";
                this._phantomDiv.style.width = tip.width + "px";
                this._phantomDiv.style.height = tip.height + "px";
            },

            _position: function () {
                var viewport = { width: 0, height: 0 };
                var anchor = { x: 0, y: 0, width: 0, height: 0 };
                var tip = { width: 0, height: 0 };

                viewport.width = window.innerWidth;
                viewport.height = window.innerHeight;
                anchor = this._getAnchorPositionWindowCoord();
                tip.width = this._domElement.offsetWidth;
                tip.height = this._domElement.offsetHeight;
                var fallback_order = {
                    "top": ["top", "bottom", "left", "right"],
                    "bottom": ["bottom", "top", "left", "right"],
                    "left": ["left", "right", "top", "bottom"],
                    "right": ["right", "left", "top", "bottom"]
                };
                if (isLeftHanded) {
                    fallback_order.top[2] = "right";
                    fallback_order.top[3] = "left";
                    fallback_order.bottom[2] = "right";
                    fallback_order.bottom[3] = "left";
                }

                // Try to position the tooltip according to the placement preference
                // We use this order:
                // 1. Try the preferred placement
                // 2. Try the opposite placement
                // 3. If the preferred placement is top or bottom, we should try left
                // and right (or right and left if left handed)
                // If the preferred placement is left or right, we should try top and bottom
                var order = fallback_order[this._placement];
                var length = order.length;
                for (var i = 0; i < length; i++) {
                    if (i == length - 1 || this._canPositionOnSide(order[i], viewport, anchor, tip)) {
                        this._positionOnSide(order[i], viewport, anchor, tip);
                        break;
                    }
                }
            },

            _showTooltip: function () {
                // Give a chance to dismiss the tooltip before it starts to show
                if (this._shouldDismiss) {
                    return;
                }
                this._isShown = true;
                this._raiseEvent("beforeopen");

                // If the anchor is not in the DOM tree, we don't create the tooltip
                if (!this._anchorElement.parentNode) {
                    return;
                }
                if (this._shouldDismiss) {
                    return;
                }

                // If the contentElement is set to null or innerHTML set to null or "", we should NOT show the tooltip
                if (this._lastContentType === "element") { // Last update through contentElement option
                    if (!this._contentElement) {
                        this._isShown = false;
                        return;
                    }
                } else { // Last update through innerHTML option
                    if (!this._innerHTML || this._innerHTML === "") {
                        this._isShown = false;
                        return;
                    }
                }

                this._createTooltipDOM();
                this._position();
                utilities.addClass(this._domElement, msTooltipAppear);
            },

            _onInvoke: function (type, hide) {
                // Reset the dismiss flag
                this._shouldDismiss = false;

                // If the tooltip is already shown, ignore the current event
                if (this._isShown) {
                    return;
                }

                // Add a listener for DOM events so that if the anchor is removed, we should remove the tooltip
                var that = this;
                var removeTooltip =
                    function (event) {
                        if (event.target == that._anchorElement && that._domElement) {
                            document.body.removeChild(that._phantomDiv);
                            document.body.removeChild(that._domElement);
                            that._domElement = null;
                            that._phantomDiv = null;
                        }
                        if (event.target == that._anchorElement) {
                            document.body.removeEventListener("DOMNodeRemoved", removeTooltip, false);
                        }
                    };
                document.body.addEventListener("DOMNodeRemoved", removeTooltip, false);

                // Set the hide delay, 
                this._hideDelay = hide;

                // Tooltip display offset differently for touch events and non-touch events
                if (type == "touch") {
                    this._offset = OFFSET_TOUCH;
                } else {
                    this._offset = OFFSET_MOUSE;
                }

                clearTimeout(this._delayTimer);
                clearTimeout(this._hideDelayTimer);

                // Set the delay time
                var delay = this._decideOnDelay(type);
                if (delay > 0) {
                    var that = this;
                    this._delayTimer = setTimeout(function () {
                        that._showTooltip();
                    }, delay);
                } else {
                    this._showTooltip();
                }
            },

            _onDismiss: function () {
                // Set the dismiss flag so that we don't miss dismiss events
                this._shouldDismiss = true;

                // If the tooltip is already dismissed, ignore the current event
                if (!this._isShown) {
                    return;
                }

                this._isShown = false;

                // Reset tooltip state
                this._showTrigger = "non-touch";

                if (this._domElement) {
                    utilities.addClass(this._domElement, msTooltipDisappear);
                    this._raiseEvent("beforeclose");
                } else {
                    this._raiseEvent("beforeclose");
                    this._raiseEvent("closed");
                }
            }
        })
    });

})(this, WinJS);

// ViewBox control

(function (global, undefined) {

    WinJS.Namespace.define("WinJS.UI", {
        /// <summary locid="163">
        /// ViewBox control scales a single child element to fill the available space without
        /// resizing it. The control reacts to changes in the size of the container as well as
        /// changes in size of the child element (for instance if a media query results in
        /// a change in aspect ratio).
        /// </summary>
        /// <name locid="164">View Box</name>
        /// <htmlSnippet><![CDATA[<div data-win-control="WinJS.UI.ViewBox"></div>]]></htmlSnippet>
        /// <resource type="javascript" src="/winjs/js/base.js" shared="true" />
        /// <resource type="javascript" src="/winjs/js/ui.js" shared="true" />
        /// <resource type="javascript" src="/winjs/js/controls.js" shared="true" />
        /// <resource type="css" src="/winjs/css/ui-dark.css" shared="true" />
        ViewBox: WinJS.Class.define(
            function (element, options) {
                /// <summary locid="165">ViewBox control</summary>
                /// <param name="element" type="HTMLElement" domElement="true" mayBeNull="true" locid="166">
                /// The DOM element to function as the scaling box. This element will fill 100% of the width and height allotted to it.
                /// </param>
                /// <param name="options" type="object" optional="true" locid="167">
                /// The set of options to be applied initially to the ViewBox control.
                /// </param>
                /// <returns type="WinJS.UI.ViewBox" locid="168">A constructed ViewBox control.</returns>
                this._element = element || document.createElement("div");
                this._initialize();
                this._updateLayout();
            }, 
            {
                _sizer: null,
                _element: null,

                /// <field type="HTMLElement" domElement="true" locid="169">
                /// The DOM element which functions as the scaling box.
                /// </field>
                element: {
                    get: function () { return this._element; }
                },

                _initialize: function () {
                    var box = this.element;
                    WinJS.UI.setControl(box, this);
                    WinJS.Utilities.addClass(box, "win-viewbox");
                    if (WinJS.validation) {
                        if (box.childElementCount != 1) {
                            throw "WinJS.UI.ViewBox expects to only have one child element";
                        }
                    }
                    var sizer = box.firstElementChild;
                    this._sizer = sizer;
                    if (sizer) {
                        var that = this;
                        var onresize = function() {
                            that._updateLayout();
                        }
                        box.onresize = onresize;
                        sizer.onresize = onresize;
                    }
                },
                _updateLayout: function () {
                    var sizer = this._sizer;
                    var box = this.element;
                    var w = sizer.clientWidth;
                    var h = sizer.clientHeight;
                    var bw = box.clientWidth;
                    var bh = box.clientHeight;
                    var wRatio = bw / w;
                    var hRatio = bh / h;
                    var mRatio = Math.min(wRatio, hRatio);
                    var transX = Math.abs(bw - (w * mRatio)) / 2;
                    var transY = Math.abs(bh - (h * mRatio)) / 2;
                    this._sizer.style["-ms-transform"] = "translate(" + transX + "px," + transY + "px) scale(" + mRatio + ")";
                    this._sizer.style["-ms-transform-origin"] = "top left";
                }
            }
        )
    });

}(this));
