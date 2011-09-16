/// <loc filename="metadata\animations_loc_oam.xml" format="messagebundle" />
/// <reference path='base.js' />
/// <reference path='ui.js' />
 
/*
  © Microsoft. All rights reserved.

  This library is supported for use in Windows Tailored Apps only.

  Build: 6.2.8100.0 
  Version: 0.5 
*/
 

WinJS.Namespace.define("WinJS.UI", {});

(function (WinJS) {
var thisWinUI = WinJS.UI;  
var mstransform = "-ms-transform";

var OffsetArray = WinJS.Class.define (function (offset, defOffset) {
    // Constructor 
    if (Array.isArray(offset) && offset.length > 0) {
        this.offsetArray = offset;
    } else if (offset && offset.hasOwnProperty("top") && offset.hasOwnProperty("left")) {
        this.offsetArray = [offset];
    } else if (defOffset) {
        this.offsetArray = defOffset;
    } else {
        this.offsetArray = [{ top: "0px", left: "11px" }]; // Default to 11 pixel from the left
    }
}, { // Public Members
    getOffset: function (i) {
        if (i >= this.offsetArray.length) {
            i = this.offsetArray.length - 1;
        };
        return this.offsetArray[i];
    }
});

function makeArray(elements)
{
    if (Array.isArray(elements) || elements instanceof NodeList || elements instanceof HTMLCollection) {
        return elements;
    } else if (elements) {
        return [elements];
    } else {
        return [];
    }
}

function collectOffsetArray(element, offsetArray) {
    var elemArray = makeArray(element);
    for (var i = 0; i < elemArray.length; i++) {
        offsetArray.push({
            top: elemArray[i].offsetTop, 
            left: elemArray[i].offsetLeft
        });
    }
}

function staggerDelay(delay, delayFactor, delayCap) {
    return function (i, initialDelay) {
        var ret = initialDelay;
        for (var j = 0; j < i; j++) {
            delay *= delayFactor;
            ret += delay;
        }
        if (delayCap) {
            ret = Math.min(ret, delayCap);
        }
        return ret;
    };
}

function getRelativeOffset(offsetArray1, offsetArray2) {
    for (var i = 0; i < offsetArray1.length; i++) {
        offsetArray1[i].top -= offsetArray2[i].top;
        offsetArray1[i].left -= offsetArray2[i].left;
    }
}

function setTransform(elem, transform){
    if (elem.style.msTranform !== transform) {
        elem.style.msTransform = transform;
        return true;
    } else {
        return false;
    }
}

function setOffsetTranslateScale(elem, offset, scale) {
    return setTransform(elem, scale + "translateX(" + offset.left + ") translateY(" + offset.top + ")");
}

function clearTransitionTransform(elem) {
    if (elem.style.msTransform === ""){
        return false;
    } else {
        elem.style.msTransform = "";
        return true;
    }
}

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

function animTranslate2DTransform(usedStyle, elemArray, offsetArray, transition) {
    var forceLayout = usedStyle.width;
    var newOffsetArray = [];
    collectOffsetArray(elemArray, newOffsetArray);
    getRelativeOffset(offsetArray, newOffsetArray);
    for (var i = 0; i < elemArray.length; i++) {
        if (offsetArray[i].top !== 0 || offsetArray[i].left !== 0) {
            setTransform(elemArray[i], "translateX(" + offsetArray[i].left + "px) translateY(" + offsetArray[i].top + "px)");
        }
    }
    forceLayout = usedStyle.width;
    return thisWinUI.executeTransition(elemArray, transition);
}

function translateCallback(offsetArray){
    return function (i) { 
        var offset = offsetArray.getOffset(i);
        return mstransform + ":translate(" + offset.left + "," + offset.top + ")";
    };
}

function layoutTranstion(LayoutTransition, target, affected)
{
    var offsetArray = [];
    var targetArray = makeArray(target);
    var affectedArray = makeArray(affected);
    collectOffsetArray(affectedArray, offsetArray);
    var layoutTransition = new LayoutTransition(targetArray, affectedArray, offsetArray);
    return layoutTransition;
}

var ExpandAnimation = WinJS.Class.define ( function (revealedArray, affectedArray, offsetArray) {
    // Constructor 
    this.revealedArray = revealedArray;
    this.affectedArray = affectedArray;
    this.offsetArray = offsetArray;
},{ // Public Members
    execute: function () {
        var usedStyle = window.getComputedStyle(this.revealedArray[0], null);
        var promise1 = thisWinUI.executeAnimation(this.revealedArray, 
            { name: "e_r",
            delay: 200,
            duration: 167,
            timing: "cubic-bezier(0.1, 0.9, 0.2, 1)",
            from: "opacity: 0",
            to: "opacity: 1"}
        );
        var promise2 = animTranslate2DTransform(
            usedStyle, 
            this.affectedArray, 
            this.offsetArray,
            {name: mstransform,
            delay: 0,
            duration: 367,
            timing: "cubic-bezier(0.1, 0.9, 0.2, 1)",
            transition: clearTransitionTransform}
        );
        return WinJS.Promise.join([promise1, promise2]);
    }
});

var CollapseAnimation = WinJS.Class.define ( function (hiddenArray, affectedArray, offsetArray) {
    // Constructor 
    this.hiddenArray = hiddenArray;
    this.affectedArray = affectedArray;
    this.offsetArray = offsetArray;
},{ // Public Members
    execute: function () {
        var usedStyle = window.getComputedStyle(this.hiddenArray[0], null);
        var promise1 = thisWinUI.executeAnimation(this.hiddenArray, 
            { name: "collapse",
            delay: 0,
            duration: 167,
            timing: "cubic-bezier(0.1, 0.9, 0.2, 1)",
            from: "opacity: 1",
            to: "opacity : 0"}
        );
        var promise2 = animTranslate2DTransform(
            usedStyle, 
            this.affectedArray, 
            this.offsetArray,
            {name: mstransform,
            delay: 167,
            duration: 367, 
            timing: "cubic-bezier(0.1, 0.9, 0.2, 1)",
            transition: clearTransitionTransform}
        );
        return WinJS.Promise.join([promise1, promise2]);
    }
});

var RepositionAnimation = WinJS.Class.define ( function (target, elementArray, offsetArray) {
    // Constructor 
    this.elementArray = elementArray;
    this.offsetArray = offsetArray;
},{ // Public Members
    execute: function () {
        var usedStyle = window.getComputedStyle(this.elementArray[0], null);
        return animTranslate2DTransform(
            usedStyle,
            this.elementArray,
            this.offsetArray,
            {name: mstransform,
            delay : 0,
            stagger: staggerDelay(33, 1, 250),
            duration : 367, 
            timing: "cubic-bezier(0.1, 0.9, 0.2, 1)",
            transition: clearTransitionTransform}
        );
    }
});

var AddToListAnimation = WinJS.Class.define ( function (addedArray, affectedArray, offsetArray) {
    // Constructor 
    this.addedArray = addedArray;
    this.affectedArray = affectedArray;
    this.offsetArray = offsetArray;
},{ // Public Members
    execute: function () {
        var usedStyle = window.getComputedStyle(this.addedArray[0], null);
        var promise1 = thisWinUI.executeAnimation(this.addedArray, 
            [{name: "a_s",
            delay: 167,
            duration: 367,
            timing: "cubic-bezier(0.1, 0.9, 0.2, 1)",
            from: mstransform + ":scale(0.85, 0.85)",
            to: mstransform + ":scale(1.0, 1.0)"},
            {name: "a_o",
            delay: 167,
            duration: 167,
            timing: "linear",
            from: "opacity: 0",
            to: "opacity: 1"}]
        );
        var promise2 = animTranslate2DTransform(
            usedStyle, 
            this.affectedArray, 
            this.offsetArray,
            {name: mstransform,
            delay: 0,
            duration: 500,
            timing: "cubic-bezier(0.1, 0.9, 0.2, 1)",
            transition: clearTransitionTransform}
        );
        return WinJS.Promise.join([promise1, promise2]);
    }
});

var DeleteFromListAnimation = WinJS.Class.define ( function (deletedArray, remaningArray, offsetArray) {
    // Constructor 
    this.deletedArray = deletedArray;
    this.remaningArray = remaningArray;
    this.offsetArray = offsetArray;
},{ // Public Members
    execute: function () {
        var usedStyle = window.getComputedStyle(this.deletedArray[0], null);
        var promise1 = thisWinUI.executeAnimation(this.deletedArray, 
            [{name: "d_s",
            delay: 0,
            duration: 367,
            timing: "cubic-bezier(0.1, 0.9, 0.2, 1)",
            from: mstransform + ":scale(1.0, 1.0)",
            to: mstransform + ":scale(0.85, 0.85)"},
            {name: "d_o",
            delay: 0,
            duration: 167,
            timing: "linear",
            from: "opacity: 1",
            to: "opacity: 0"}]
        );
        var promise2 = animTranslate2DTransform(
            usedStyle, 
            this.remaningArray, 
            this.offsetArray,
            {name: mstransform,
            delay: 167,
            duration: 500,
            timing: "cubic-bezier(0.1, 0.9, 0.2, 1)",
            transition: clearTransitionTransform}
        );
        return WinJS.Promise.join([promise1, promise2]);
    }
});

var AddToSearchListAnimation = WinJS.Class.define ( function (addedArray, affectedArray, offsetArray) {
    // Constructor 
    this.addedArray = addedArray;
    this.affectedArray = affectedArray;
    this.offsetArray = offsetArray;
},{ // Public Members
    execute: function () {
        var usedStyle = window.getComputedStyle(this.addedArray[0], null);
        var promise1 = thisWinUI.executeAnimation(this.addedArray, 
            {name: "as_o",
            delay: 0,
            duration: 50,
            timing: "linear",
            from: "opacity: 0",
            to: "opacity: 1"}
        );
        var promise2 = animTranslate2DTransform(
            usedStyle, 
            this.affectedArray, 
            this.offsetArray,
            {name: mstransform,
            delay: 0,
            duration: 300,
            timing: "cubic-bezier(0.1, 0.9, 0.2, 1)",
            transition: clearTransitionTransform}
        );
        return WinJS.Promise.join([promise1, promise2]);
    }
});

var DeleteFromSearchListAnimation = WinJS.Class.define ( function (deletedArray, remaningArray, offsetArray) {
    // Constructor 
    this.deletedArray = deletedArray;
    this.remaningArray = remaningArray;
    this.offsetArray = offsetArray;
},{ // Public Members
    execute: function () {
        var usedStyle = window.getComputedStyle(this.deletedArray[0], null);
        var promise1 = thisWinUI.executeAnimation(this.deletedArray, 
            {name: "ds_o",
            delay: 0,
            duration: 50,
            timing: "linear",
            from: "opacity: 1",
            to: "opacity: 0"}
        );
        var promise2 = animTranslate2DTransform(
            usedStyle, 
            this.remaningArray, 
            this.offsetArray,
            {name: mstransform,
            delay: 0,
            duration: 300,
            timing: "cubic-bezier(0.1, 0.9, 0.2, 1)",
            transition: clearTransitionTransform}
        );
        return WinJS.Promise.join([promise1, promise2]);
    }
});

var PeekAnimation = WinJS.Class.define ( function (target, elementArray, offsetArray) {
    // Constructor 
    this.elementArray = elementArray;
    this.offsetArray = offsetArray;
},{ // Public Members
    execute: function () {
        var usedStyle = window.getComputedStyle(this.elementArray[0], null);
        return animTranslate2DTransform(
            usedStyle,
            this.elementArray,
            this.offsetArray,
            {name: mstransform,
            delay : 0,
            duration : 2000, 
            timing : "cubic-bezier(0.1, 0.9, 0.2, 1)",
            transition: clearTransitionTransform}
        );
    }
});

WinJS.Namespace.defineWithParent(thisWinUI, "Animation", {

    /// <summary locid="1">
    /// expand animation. The usage pattern is
    /// Call this function before expand the element, do real work to expand,
    /// finally call .execute method of the returning ExpandAnimation object
    /// </summary>
    /// <param name="revealed" locid="2">
    /// Single element/element array/Node list of elements to be revealed
    /// </param>
    /// <param name="affected" locid="3">
    /// Single element/element array/Node list of elements affected by the expand
    /// </param>
    /// <returns locid="4">
    /// ExpandAnimation object
    /// </returns>
    createExpandAnimation: function (revealed, affected) {
        return layoutTranstion(ExpandAnimation, revealed, affected);
        },

    /// <summary locid="5">
    /// Collapse clicked, set the element's style.display to "none", animate affected elements
    /// </summary>
    /// <param name="hidden" locid="6">
    /// Single element/element array/Node list of elements to be collapsed. element.style.display becomes "none"
    /// </param>
    /// <param name="affected" locid="7">
    /// Single element/element array/Node list of elements to affected by collapse
    /// </param>
    /// <returns locid="8">
    /// Promise object to track when transition is done
    /// </returns>
    createCollapseAnimation: function (hidden, affected) {
        return layoutTranstion(CollapseAnimation, hidden, affected);
    },

    /// <summary locid="9">
    /// reposition animation. The usage pattern is
    /// Call this function before reposition the elements, reposition the element,
    /// finally call .execute method of the returning RepositionAnimation object
    /// </summary>
    /// <param name="element" locid="10">
    /// Single element/element array/Node list of elements to be repositioned
    /// </param>
    /// <returns locid="11">
    /// RepositionAnimation object
    /// </returns>
    createRepositionAnimation: function (element) {
        return layoutTranstion(RepositionAnimation, null, element);
    },

    /// <summary locid="12">
    /// Fade in element, transition opacity to 1
    /// </summary>
    /// <param name="element" locid="13">
    /// Single element/element array/Node list of elements
    /// </param>
    /// <returns locid="8">
    /// Promise object to track when transition is done
    /// </returns>
    fadeIn: function (shown) {
        return thisWinUI.executeTransition(
            shown,
            {name: "opacity",
            delay: 0,
            duration: 167,
            timing: "linear",
            transition: setOpacityCallback(1)}
        );
    },

    /// <summary locid="14">
    /// Fade out element, Transition opacity to 0
    /// </summary>
    /// <param name="element" locid="13">
    /// Single element/element array/Node list of elements
    /// </param>
    /// <returns locid="8">
    /// Promise object to track when transition is done
    /// </returns>
    fadeOut: function (hidden) {
        return thisWinUI.executeTransition(
            hidden,
            {name: "opacity",
            delay: 0,
            duration: 167,
            timing: "linear",
            transition: setOpacityCallback(0)}
        );
    },

    /// <summary locid="15">
    /// add to list animation. The usage pattern is
    /// Call this function before add the element, do real work to add an element to a list,
    /// finally call .execute method of the returning addtolist object
    /// </summary>
    /// <param name="added" locid="16">
    /// Single element/element array/Node list of elements to be added
    /// </param>
    /// <param name="affected" locid="17">
    /// Single element/element array/Node list of elements affected by the added
    /// </param>
    /// <returns locid="18">
    /// AddToListAnimation object
    /// </returns>
    createAddToListAnimation: function (added, affected) {
        return layoutTranstion(AddToListAnimation, added, affected);
        },

    /// <summary locid="19">
    /// remove from list animation. The usage pattern is
    /// Call this function before delete the element, do real work to remove the element from the list,
    /// finally call .execute method of the returning deleteAnimation object
    /// </summary>
    /// <param name="deleted" locid="20">
    /// Single element/element array/Node list of elements to be deleted
    /// </param>
    /// <param name="remaining" locid="21">
    /// Single element/element array/Node list of elements remaining
    /// </param>
    /// <returns locid="22">
    /// CreateDeleteFromList object
    /// </returns>
    createDeleteFromListAnimation: function (deleted, remaining) {
        return layoutTranstion(DeleteFromListAnimation, deleted, remaining);
        },

    /// <summary locid="23">
    /// similiar to AddToList, just faster to fit the search filtering
    /// Call this function before add the element, do real work to add an element to a list,
    /// finally call .execute method of the returning addtolist object
    /// </summary>
    /// <param name="added" locid="16">
    /// Single element/element array/Node list of elements to be added
    /// </param>
    /// <param name="affected" locid="17">
    /// Single element/element array/Node list of elements affected by the added
    /// </param>
    /// <returns locid="18">
    /// AddToListAnimation object
    /// </returns>
    createAddToSearchListAnimation: function (added, affected) {
        return layoutTranstion(AddToSearchListAnimation, added, affected);
        },

    /// <summary locid="24">
    /// similiar to remove from list animation, just faster to fit search filtering. The usage pattern is
    /// Call this function before delete the element, do real work to remove the element from the list,
    /// finally call .execute method of the returning deleteAnimation object
    /// </summary>
    /// <param name="deleted" locid="20">
    /// Single element/element array/Node list of elements to be deleted
    /// </param>
    /// <param name="remaining" locid="21">
    /// Single element/element array/Node list of elements remaining
    /// </param>
    /// <returns locid="4">
    /// ExpandAnimation object
    /// </returns>
    createDeleteFromSearchListAnimation: function (deleted, remaining) {
        return layoutTranstion(DeleteFromSearchListAnimation, deleted, remaining);
        },

    /// <summary locid="25">
    /// Show Edge UI, slide in from the edge for UI objects like appbar
    /// </summary>
    /// <param name="element" locid="26">
    /// Single element/element array/Node list of elements to be slidein
    /// </param>
    /// <param name="offset" locid="27">
    /// optional offset array of slide in. If length of offset is less than element, the last value of offset will be repeated
    /// </param>
    /// <returns locid="28">
    /// promise object
    /// </returns>
    showEdgeUI: function (element, offset) {
        var offsetArray = new OffsetArray(offset);
        return thisWinUI.executeAnimation(element, 
            {name: "showEdgeUI",
            delay: 0,
            duration: 367,
            timing: "cubic-bezier(0.1, 0.9, 0.2, 1)",
            fromCallback: translateCallback(offsetArray),
            to: mstransform + ":translate(0px, 0px)"
            }
        );
    },

    /// <summary locid="29">
    /// slide in a large object like keyboard from the edge
    /// </summary>
    /// <param name="element" locid="30">
    /// Single element/element array/Node list of elements to be slided in
    /// </param>
    /// <param name="offset" locid="27">
    /// optional offset array of slide in. If length of offset is less than element, the last value of offset will be repeated
    /// </param>
    /// <returns locid="28">
    /// promise object
    /// </returns>
    showPanel: function (element, offset) {
        var offsetArray = new OffsetArray(offset);
        return thisWinUI.executeAnimation(element, 
            {name: "showPanel",
            delay: 0,
            duration: 733,
            timing: "cubic-bezier(0.1, 0.9, 0.2, 1)",
            fromCallback: translateCallback(offsetArray),
            to: mstransform + ":translate(0px, 0px)"
            }
        );
    },

    /// <summary locid="31">
    /// hide Edge UI animation, slide out the element out to the edge
    /// </summary>
    /// <param name="element" locid="32">
    /// Single element/element array/Node list of elements to be slide out
    /// </param>
    /// <param name="offset" locid="33">
    /// optional offset array of slide out. If length of offset is less than element, the last value of offset will be repeated
    /// </param>
    /// <returns locid="28">
    /// promise object
    /// </returns>
    hideEdgeUI: function (element, offset) {
        var offsetArray = new OffsetArray(offset);
        return thisWinUI.executeAnimation(element, 
            {name: "hideEdgeUI",
            delay: 0,
            duration: 367,
            timing: "cubic-bezier(0.1, 0.9, 0.2, 1)",
            from: mstransform + ":translate(0px, 0px)",
            toCallback: translateCallback(offsetArray)
            }
        );
    },

    /// <summary locid="34">
    /// Slide out a large panel to the edge
    /// </summary>
    /// <param name="element" locid="32">
    /// Single element/element array/Node list of elements to be slide out
    /// </param>
    /// <param name="offset" locid="33">
    /// optional offset array of slide out. If length of offset is less than element, the last value of offset will be repeated
    /// </param>
    /// <returns locid="28">
    /// promise object
    /// </returns>
    hidePanel: function (element, offset) {
        var offsetArray = new OffsetArray(offset);
        return thisWinUI.executeAnimation(element, 
            {name: "hidePanel",
            delay: 0,
            duration: 733,
            timing: "cubic-bezier(0.1, 0.9, 0.2, 1)",
            from: mstransform + ":translate(0px, 0px)",
            toCallback: translateCallback(offsetArray)
            }
        );
    },

    /// <summary locid="35">
    /// Execute show Popup animation.
    /// </summary>
    /// <param name="element" locid="36">
    /// Single element/element array/Node list of elements to be shown like a popup
    /// </param>
    /// <param name="offset" locid="37">
    /// optional offset array of pop-in. If length of offset is less than element, the last value of offset will be repeated
    /// </param>
    /// <returns locid="28">
    /// promise object
    /// </returns>
    showPopup: function (element, offset) {
        var offsetArray = new OffsetArray(offset,[{ top: "50px", left: "0px" }]);
        return thisWinUI.executeAnimation(
            element,
            [{ name: "sp_o",
            delay: 83,
            duration: 83,
            timing: "linear",
            from: "opacity: 0",
            to: "opacity : 1"},
            {  name: " sp_t", 
            delay: 0,
            duration: 367, 
            timing: "cubic-bezier(0.1, 0.9, 0.2, 1)",
            fromCallback: translateCallback(offsetArray),
            to: mstransform + ":translate(0px, 0px)"}]
        );
    },

    /// <summary locid="38">
    /// Hide popup ui
    /// </summary>
    /// <param name="element" locid="39">
    /// Single element/element array/Node list of elements to be hidden
    /// </param>
    /// <returns locid="28">
    /// promise object
    /// </returns>
    hidePopup: function (element) {
        return thisWinUI.executeAnimation(
            element, 
            {name: "hp_o",
            delay: 0,
            duration: 83,
            timing: "linear",
            from: "opacity: 1",
            to: "opacity : 0"}
        );
    },

    /// <summary locid="40">
    /// Execute pointer down animation. Set element style transform property
    /// </summary>
    /// <param name="element" locid="41">
    /// Single element/element array/Node list of elements to responding to pointer down
    /// </param>
    /// <returns locid="28">
    /// promise object
    /// </returns>
    pointerDown: function (element) {
       return thisWinUI.executeTransition(
            element,
            {name: mstransform,
            delay: 0,
            duration: 167,
            timing: "cubic-bezier(0.1, 0.9, 0.2, 1)",
            transition: function (elem) {return setTransform(elem, "scale(0.95, 0.95)");}}
        );
    },

    /// <summary locid="42">
    /// Execute pointer up animation. Set element style transform property
    /// </summary>
    /// <param name="element" locid="43">
    /// Single element/element array/Node list of elements respond to pointer up
    /// </param>
    /// <returns locid="28">
    /// promise object
    /// </returns>
    pointerUp: function (element) {
       return thisWinUI.executeTransition(
            element, 
            {name: mstransform,
            delay: 0,
            duration: 167,
            timing: "cubic-bezier(0.1, 0.9, 0.2, 1)",
            transition: clearTransitionTransform}
        );
    },

    /// <summary locid="44">
    /// Execute drag start animation. Set element style transform property on dragSource and affected
    /// </summary>
    /// <param name="dragSource" locid="45">
    /// Single element/element array/Node list of elements being dragged.
    /// </param>
    /// <param name="affected" locid="46">
    /// Single element/element array/Node list of elements that are drag targets
    /// </param>
    /// <returns locid="28">
    /// promise object
    /// </returns>
    dragSourceStart: function (dragSource, affected) {
        var promise1 = thisWinUI.executeTransition(
            dragSource,
            [{name: mstransform,
            delay: 0,
            duration: 240, 
            timing : "cubic-bezier(0.1, 0.9, 0.2, 1)",
            transition: function (elem) { return setTransform(elem, "scale(1.05 , 1.05)");}},
            {name: "opacity",
            delay: 0,
            duration: 240,
            timing: "cubic-bezier(0.1, 0.9, 0.2, 1)",
            transition: setOpacityCallback(0.65)}]
            );
        var promise2 = thisWinUI.executeTransition(
            affected, 
            {name: mstransform,
            delay: 0,
            duration: 240, 
            timing: "cubic-bezier(0.1, 0.9, 0.2, 1)",
            transition: function (elem) { return setTransform(elem, "scale(.95, .95)");}}
            );
        return WinJS.Promise.join([promise1, promise2]);
    },

    /// <summary locid="47">
    /// Execute drag end animation. Set element style transform property on dragSource and affected
    /// </summary>
    /// <param name="dragSource" locid="45">
    /// Single element/element array/Node list of elements being dragged.
    /// </param>
    /// <param name="offset" locid="48">
    /// optional offset array of drop. If length of offset is less than element, the last value of offset will be repeated
    /// </param>
    /// <param name="affected" locid="46">
    /// Single element/element array/Node list of elements that are drag targets
    /// </param>
    /// <returns locid="28">
    /// promise object
    /// </returns>
    dragSourceEnd: function (dragSource, offset, affected) {
        var flexOffset = new OffsetArray(offset);
        var affectedArray = makeArray(affected);
// optimization, no promise object to scale to 1.0
        thisWinUI.executeTransition(
            dragSource,
            [{name: mstransform,
            delay: 0,
            duration : 500, 
            timing : "cubic-bezier(0.1, 0.9, 0.2, 1)",
            transition: clearTransitionTransform},
            {name: "opacity",
            delay: 0,
            duration: 500,
            timing: "cubic-bezier(0.1, 0.9, 0.2, 1)",
            transition: setOpacityCallback(1.0)}]
        );

        var promise1 = thisWinUI.executeAnimation(
            dragSource,
            {name: " dragEnd",
            delay: 0,
            duration: 500,
            timing: "cubic-bezier(0.1, 0.9, 0.2, 1)",
            fromCallback: translateCallback(flexOffset),
            to: mstransform + ":translate(0px, 0px)"}
        );

       var promise2 = thisWinUI.executeTransition(
            affectedArray,
            {name: mstransform,
            delay : 0,
            duration : 500, 
            timing : "cubic-bezier(0.1, 0.9, 0.2, 1)",
            transition: clearTransitionTransform}
        );
        return WinJS.Promise.join([promise1, promise2]);
    },

    /// <summary locid="49">
    /// Execute transitionContent animation
    /// </summary>
    /// <param name="incoming" locid="50">
    /// Single element/element array/Node list of elements for incoming page
    /// </param>
    /// <param name="offset" locid="51">
    /// optional offset array of entrance. If length of offset is less than element, the last value of offset will be repeated
    /// </param>
    /// <param name="outgoing" locid="52">
    /// Single element/element array/Node list of elements for outgoing page, set opacity to 0.
    /// </param>
    /// <returns locid="28">
    /// promise object
    /// </returns>
    transitionContent: function (incoming, offset, outgoing) {
        var offsetArray = new OffsetArray(offset,[{ top: "0px", left: "40px" }]);
        var promise1 = thisWinUI.executeAnimation(
            incoming, 
            [{name: "opacity",
            delay: 160,
            duration: 400,
            timing: "cubic-bezier(0.1, 0.9, 0.2, 1)",
            from: "opacity: 0.0",
            to: "opacity : 1.0"},
            {name: mstransform,
            delay: 0,
            duration: 1000,
            timing: "cubic-bezier(0.1, 0.9, 0.2, 1)",
            fromCallback: translateCallback(offsetArray),
            to: mstransform + ":translate(0px, 0px)"}]
        );
        var promise2 = thisWinUI.executeTransition(
            outgoing,
            {name: "opacity",
            delay: 150,
            duration: 80,
            timing: "linear",
            transition: setOpacityCallback(0)}
        ); 
        return WinJS.Promise.join([promise1, promise2]);
    },

    /// <summary locid="53">
    /// Execute reveal animation.
    /// </summary>
    /// <param name="background" locid="54">
    /// Single element/element array/Node list of elements that acts as the background for the revealed content.
    /// </param>
    /// <param name="content" locid="55">
    /// Single element/element array/Node list of elements that acts as the content being revealed.
    /// </param>
    /// <param name="offset" locid="56">
    /// optional offset array of content entrance. If length of offset is less than the number of content elements, the last value of offset will be repeated
    /// </param>
    /// <param name="outline" locid="57">
    /// Single element/element array/Node list of elements that acts as an outline for the tapped element.
    /// </param>
    /// <param name="tapped" locid="58">
    /// Single element/element array/Node list of elements that acts as the tapped element.
    /// </param>
    /// <returns locid="28">
    /// promise object
    /// </returns>
    reveal: function (background, content, offset, outline, tapped) {
        var offsetArray = new OffsetArray(offset,[{ top: "0px", left: "-10px" }]);
        var promise1 = thisWinUI.executeAnimation(
            content, 
            {name: "reveal_content",
            delay: 0,
            duration: 450,
            timing: "cubic-bezier(0.1, 0.9, 0.2, 1)",
            fromCallback: translateCallback(offsetArray),
            to: mstransform + ":translate(0px, 0px)"
            }
        );

        var promise2 = thisWinUI.executeTransition(
            outline,
            {name: "opacity",
            delay: 0,
            duration: 50,
            timing: "linear",
            transition: setOpacityCallback(1)}
        );

        var promise3 = thisWinUI.executeTransition(
            tapped, 
            {name: mstransform,
             delay: 0,
             duration: 200,
             timing: "cubic-bezier(0.1, 0.9, 0.2, 1)",
             transition: function (elem) { return setTransform(elem, "scale(1.05 , 1.05)");}}
        );

        return WinJS.Promise.join([promise1, promise2, promise3]);
    },

    /// <summary locid="59">
    /// Execute hide animation.
    /// </summary>
    /// <param name="background" locid="60">
    /// Single element/element array/Node list of elements that acts as the background for the hidden content.
    /// </param>
    /// <param name="content" locid="61">
    /// Single element/element array/Node list of elements that acts as the content being hidden.
    /// </param>
    /// <param name="offset" locid="62">
    /// optional offset array of content exit. If length of offset is less than the number of content elements, the last value of offset will be repeated
    /// </param>
    /// <param name="outline" locid="57">
    /// Single element/element array/Node list of elements that acts as an outline for the tapped element.
    /// </param>
    /// <param name="tapped" locid="58">
    /// Single element/element array/Node list of elements that acts as the tapped element.
    /// </param>
    /// <returns locid="28">
    /// promise object
    /// </returns>
    hide: function (background, content, offset, outline, tapped) {
        var offsetArray = new OffsetArray(offset,[{ top: "0px", left: "10px" }]);
        var promise1 = thisWinUI.executeAnimation(
            content, 
            {name: "hide_content",
            delay: 0,
            duration: 200,
            timing: "cubic-bezier(0.1, 0.9, 0.2, 1)",
            fromCallback: translateCallback(offsetArray),
            to: mstransform + ":translate(0px, 0px)"
            }
        );

        var promise2 = thisWinUI.executeTransition(
            outline,
            {name: "opacity",
            delay: 0,
            duration: 50,
            timing: "linear",
            transition: setOpacityCallback(0)}
        );

        var promise3 = thisWinUI.executeTransition(
            tapped, 
            {name: mstransform,
             delay: 0,
             duration: 100,
             timing: "cubic-bezier(0.1, 0.9, 0.2, 1)",
             transition: clearTransitionTransform}
        );

        return WinJS.Promise.join([promise1, promise2, promise3]);
    },

    /// <summary locid="63">
    /// Execute dragBetweenEnter animation. Set element style transform property
    /// </summary>
    /// <param name="target" locid="64">
    /// Single element/element array/Node list of elements that dragsource enter in between
    /// </param>
    /// <returns locid="28">
    /// promise object
    /// </returns>
    dragBetweenEnter: function (target, offset) {
        var flexOffset = new OffsetArray(offset,[{ top: "-40px", left: "0px" }, { top: "40px", left: "0px" }]);
        return thisWinUI.executeTransition(
            target,
            {name: mstransform,
            delay: 0,
            duration: 60,
            timing: "cubic-bezier(0.1, 0.9, 0.2, 1)",
            transitionCallback: function (i) { return function (elem) { return setOffsetTranslateScale(elem, flexOffset.getOffset(i), "scale(.95, .95)");};} }
        );
    },

    /// <summary locid="65">
    /// Execute dragBetweenLeave animation. Set element style transform property
    /// </summary>
    /// <param name="target" locid="66">
    /// Single element/element array/Node list of elements to be dragsource leave in between
    /// </param>
    /// <returns locid="28">
    /// promise object
    /// </returns>
    dragBetweenLeave: function (target) {
        return thisWinUI.executeTransition(
            target, 
            {name: mstransform,
            delay: 0,
            duration: 60,
            timing: "cubic-bezier(0.1, 0.9, 0.2, 1)",
            transition: function (elem) { return setTransform(elem, "scale(.95, .95)");}}
        );
    },

    /// <summary locid="67">
    /// Slide back an cross slide selected object when pointer is released.
    /// </summary>
    /// <param name="selected" locid="68">
    /// Single element/element array/Node list of elements to selected
    /// </param>
    /// <param name="selection" locid="69">
    /// Single element/element array/Node list of elements that is the selection mark
    /// </param>
    /// <returns locid="28">
    /// promise object
    /// </returns>
    crossSlideSelect: function (selected, selection) {
        var promise1 = thisWinUI.executeTransition(
            selected,
            {name: mstransform,
            delay: 0,
            duration: 300,
            timing: "cubic-bezier(0.1, 0.9, 0.2, 1)",
            transition: clearTransitionTransform}
        );

        var promise2 = thisWinUI.executeAnimation(
            selection, 
            {name: "cs_selection",
             delay: 0,
             duration: 300,
             timing: "cubic-bezier(0.1, 0.9, 0.2, 1)",
             from: "opacity: 0.0",
             to: "opacity : 1.0"}
        );
        return WinJS.Promise.join([promise1, promise2]);
    },

    /// <summary locid="70">
    /// Slide back an cross slide deselected object when pointer is released.
    /// </summary>
    /// <param name="deselected" locid="71">
    /// Single element/element array/Node list of elements to deselected
    /// </param>
    /// <param name="selection" locid="69">
    /// Single element/element array/Node list of elements that is the selection mark
    /// </param>
    /// <returns locid="28">
    /// promise object
    /// </returns>
    crossSlideDeselect: function (deselected, selection) {
        var promise1 = thisWinUI.executeTransition(
            deselected,
            {name: mstransform,
            delay: 0,
            duration: 300,
            timing: "cubic-bezier(0.1, 0.9, 0.2, 1)",
            transition: clearTransitionTransform}
        );

        var promise2 = thisWinUI.executeAnimation(
            selection, 
            {name: "cs_deselection",
             delay: 0,
             duration: 300,
             timing: "cubic-bezier(0.1, 0.9, 0.2, 1)",
             from: "opacity: 1.0",
             to: "opacity : 0.0"}
        );
        return WinJS.Promise.join([promise1, promise2]);
    },

    /// <summary locid="72">
    /// object revealed by cross slide
    /// </summary>
    /// <param name="target" locid="2">
    /// Single element/element array/Node list of elements to be revealed
    /// </param>
    /// <param name="offset" locid="73">
    /// optional offset array of reveal. If length of offset is less than element, the last value of offset will be repeated
    /// </param>
    /// <returns locid="28">
    /// promise object
    /// </returns>
    crossSlideReveal: function (target, offset) {
        var offsetArray = new OffsetArray(offset,[{ top: "-10px", left: "0px" }]);
        return thisWinUI.executeAnimation(target, 
            {name: "cs_reveal",
            delay: 0,
            duration: 500,
            timing: "linear",
            fromCallback: translateCallback(offsetArray),
            to: mstransform + ":translate(0px, 0px)"
            }
        );
    },

    /// <summary locid="74">
    /// Execute enterPage animation
    /// </summary>
    /// <param name="element" locid="13">
    /// Single element/element array/Node list of elements
    /// </param>
    /// <param name="offset" locid="51">
    /// optional offset array of entrance. If length of offset is less than element, the last value of offset will be repeated
    /// </param>
    /// <returns locid="28">
    /// promise object
    /// </returns>
    enterPage: function (element, offset) {
        var offsetArray = new OffsetArray(offset,[{ top: "0px", left: "100px" }]);
        var promise = thisWinUI.executeAnimation(element, 
            [{name: "ep_o",
            delay: 0,
            stagger: staggerDelay(83, 1, 250),
            duration: 330, 
            timing: "cubic-bezier(0.1, 0.9, 0.2, 1)",
            from: "opacity: 0",
            to: "opacity : 1"},
            {name: "eo_t",
            delay: 0,
            stagger: staggerDelay(83, 1, 250),
            duration: 1000, 
            timing: "cubic-bezier(0.1, 0.9, 0.2, 1)",
            fromCallback: translateCallback(offsetArray),
            to: mstransform + ":translate(0px, 0px)"}]
        );
        return promise;
    },

    /// <summary locid="75">
    /// Execute transitionPage animation
    /// </summary>
    /// <param name="incoming" locid="50">
    /// Single element/element array/Node list of elements for incoming page
    /// </param>
    /// <param name="offset" locid="51">
    /// optional offset array of entrance. If length of offset is less than element, the last value of offset will be repeated
    /// </param>
    /// <param name="outgoing" locid="76">
    /// Single element/element array/Node list of elements for outgoing page
    /// </param>
    /// <returns locid="28">
    /// promise object
    /// </returns>
    transitionPage: function (incoming, offset, outgoing) {
        var offsetArray = new OffsetArray(offset,[{ top: "0px", left: "100px" }]);
        var promise1 = thisWinUI.executeAnimation(incoming, 
            [{name: "tp_o",
            delay: 83,
            stagger: staggerDelay(83, 1, 250),
            duration: 330, 
            timing: "cubic-bezier(0.1, 0.9, 0.2, 1)",
            from: "opacity: 0",
            to: "opacity : 1"},
            {name: "tp_t",
            delay: 83,
            stagger: staggerDelay(83, 1, 250),
            duration: 1000, 
            timing: "cubic-bezier(0.1, 0.9, 0.2, 1)",
            fromCallback: translateCallback(offsetArray),
            to: mstransform + ":translate(0px, 0px)"}]
        );

        var promise2 = thisWinUI.executeAnimation(
            outgoing, 
            { name: "tp_o2",
            delay: 0,
            duration: 160,
            timing: "cubic-bezier(0.1, 0.9, 0.2, 1)",
            from: "opacity: 1",
            to: "opacity : 0"}
        );
    return WinJS.Promise.join([promise1, promise2]);
    },

    /// <summary locid="77">
    /// Execute crossFade animation
    /// </summary>
    /// <param name="incoming" locid="78">
    /// Single element/element array/Node list of elements for incoming elements, set opacity to 1
    /// </param>
    /// <param name="outgoing" locid="79">
    /// Single element/element array/Node list of elements for outgoing elements, set opacity to 0
    /// </param>
    /// <returns locid="28">
    /// promise object
    /// </returns>
    crossFade: function (incoming, outgoing) {
        var promise1 = thisWinUI.executeTransition(
            incoming,
            {name: "opacity",
            delay: 0,
            duration: 167,
            timing: "linear",
            transition: setOpacityCallback(1)}
        );

        var promise2 = thisWinUI.executeTransition(
            outgoing,
            {name: "opacity",
            delay: 0,
            duration: 167,
            timing: "linear",
            transition: setOpacityCallback(0)}
        );
    return WinJS.Promise.join([promise1, promise2]);
    },

    /// <summary locid="80">
    /// peek animation. The usage pattern is
    /// Call this function before reposition the elements, reposition the element,
    /// finally call .execute method of the returning PeekAnimation object
    /// </summary>
    /// <param name="element" locid="81">
    /// Single element/element array/Node list of elements to be translated for peek
    /// </param>
    /// <returns locid="82">
    /// PeekAnimation object
    /// </returns>
    createPeekAnimation: function (element) {
        return layoutTranstion(PeekAnimation, null, element);
    },

    /// <summary locid="83">
    /// Execute updateBadge animation
    /// </summary>
    /// <param name="incoming" locid="84">
    /// Single element/element array/Node list of elements for incoming badge
    /// </param>
    /// <param name="outgoing" locid="85">
    /// Single element/element array/Node list of elements for outgoing badge
    /// </param>
    /// <param name="inOffset" locid="86">
    /// optional offset array of incoming. If length of offset is less than element, the last value of offset will be repeated
    /// </param>
    /// <param name="outOffset" locid="86">
    /// optional offset array of incoming. If length of offset is less than element, the last value of offset will be repeated
    /// </param>
    /// <returns locid="28">
    /// promise object
    /// </returns>
    updateBadge: function (incoming, inOffset, outgoing, outOffset) {
        var inOffsetArray = new OffsetArray(inOffset,[{ top: "24px", left: "0px" }]);
        var outOffsetArray = new OffsetArray(outOffset,[{ top: "-24px", left: "0px" }]);
        var promise1 = thisWinUI.executeAnimation(
            incoming, 
            [{name: "ub_o",
            delay: 0,
            duration: 367,
            timing: "cubic-bezier(0.1, 0.9, 0.2, 1)",
            from: "opacity: 0.0",
            to: "opacity : 1.0"},
            {name: "ub_t",
            delay: 0,
            duration: 1333,
            timing: "cubic-bezier(0.1, 0.9, 0.2, 1)",
            fromCallback: translateCallback(inOffsetArray),
            to: mstransform + ":translate(0px, 0px)"}]
        ); 
        var promise2 = thisWinUI.executeAnimation(
            outgoing,
            [{name: "ub_o2",
            delay: 0,
            duration: 167,
            timing: "cubic-bezier(0.1, 0.9, 0.2, 1)",
            from: "opacity: 1.0",
            to: "opacity : 0.0"},
            {name: "ub_t2",
            delay: 0,
            duration: 367,
            timing: "cubic-bezier(0.1, 0.9, 0.2, 1)",
            from: mstransform + ":translate(0px, 0px)",
            toCallback: translateCallback(outOffsetArray)}]
        ); 
        return WinJS.Promise.join([promise1, promise2]);
    }
});

})(WinJS);

