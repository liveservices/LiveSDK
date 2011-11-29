/**
* Demo controller to switch scenarios
* @autho Andrew Dodson
* @since May 2011
*/
$.get("../css/demo.css", function (s) {
    var el = document.createElement('style');
    el.type = "text/css";
    try {
        el.innerHTML = s; // MOZ
    }
    catch (e) {
        try {
            el.innerText = s; // WEBKIT
        } catch (e) {
            el.setAttribute("type", "text/css");
            el.styleSheet.cssText = s; // IE
        }
    }
    document.getElementsByTagName('head')[0].appendChild(el);
});

$(document).ready(function () {

    // inject the switcher into the page
    var $c = $('<div class="controls"><div class="tool"><a href="../"><img src="../img/home_icon.png"/></a></div>' +
		'<div class="tool"><span>Site Type</span><div class="selected"></div><div class="options"><a href="../music/">Music</a><a href="../news/">News</a><a href="../shopping/">Shopping</a><a href="../social/">Social</a><a href="../sports/">Sports</a><a href="../travel/">Travel</a><a href="../games/">Games</a></div></div>' +
		'<div class="tool" style="display:none;"><span>Login Method</span><div class="selected"></div><div class="options"><a href="#dedicated">Dedicated Connect</a><a href="#prepop">Pre populating the Create Account</a><a href="#linked">Linking with existing accounts</a></div></div>' +
	'</div>').prependTo("body");

    if (window.location.pathname.match(/news/)) {
        $c.find(".tool").show();
    }


    $c.find("> div.tool:eq(1) div.selected").html($("a[href*=" + window.location.pathname.match(".*\/([a-z]+)\/")[1] + "]", $c).html() + " Context");

    $(window).bind("hashchange", function (e) {

        // is there a valid hash tag
        var v = (window.location.hash || $("> div.tool:eq(2) div.options a", $c).attr("href")).replace(/#/, '');

        $c.find("> div:eq(2) div.selected").html($("> div.tool:eq(2) div.options a[href*=" + v + "]", $c).html());

        // Add class to the page
        $("body").attr("class", v);
    });

    $(window).trigger("hashchange");
});


/**
* Default page
*/

WL.Event.subscribe("auth.login", function (e) {
    $("html").addClass("connected").removeClass("unconnected");
});
WL.Event.subscribe("auth.logout", function (e) {
    $("html").addClass("unconnected").removeClass("connected");
});



/**
* MODAL controls
*/

/**
* Add many live events at once
* @param object { "selector event" => function, ...} 
* @return
*/
jQuery.live = function (o) {
    // Bind all events listeners to this Widget
    var x, m;
    for (x in o) {
        if (o.hasOwnProperty(x)) {
            m = x.match(/(.* )?([a-z]+)$/);
            $(m[1] || window)[m[1] ? 'live' : 'bind'](m[2], o[x]);
        } 
    }
};


$.live({
    'div.modal a.close click': function () {
        $(this).parents(".modal").trigger('close');
    },
    'div.modal close': function () {
        $(this).hide().find(".toggle.switch").removeClass('switch');
    },
    'body click': function (e) {
        /*
        if($(this).parents(".modal").length===0&&!$(this).hasClass("modal")){
        $('.modal').trigger('close');
        }
        */
    },
    'a.modal click': function () {
        $("div." + $(this).attr("class").replace(/\s+/, '.')).toggle();
    }
});

$.fn.close = function () {

    var $m = $(this);

    $m.find(".toggle:first").addClass('switch');

    var i = 3;
    (function self() {
        $m.find(".countdown").html("Closing in " + i--);
        if (i === 0) {
            $m.trigger("close");
        }
        else {
            setTimeout(self, 1000);
        }
    })();
}