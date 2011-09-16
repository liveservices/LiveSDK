(function () {
    'use strict';

    // Custom event raised after the fragment is appended to the DOM.
    WinJS.Application.addEventListener('fragmentappended', function handler(e) {
        if (e.location === '/html/detailPage.html') { fragmentLoad(e.fragment, e.state); }
    });

    function fragmentLoad(elements, options) {
        var item = options && options.item ? options.item : getItem();
        elements.querySelector('.pageTitle').textContent = item.group.title;

        WinJS.UI.processAll(elements)
            .then(function () {
                elements.querySelector('.title').textContent = item.title;
                elements.querySelector('.content').innerHTML = item.content;
            });
    }

    // The getItem() function contains sample data.
    // TODO: Replace with custom data.
    function getItem() {
        var group = {
            key: 'group0',
            title: 'Collection title lorem 0'
        };

        return {
            group: group,
            title: 'ǺSed nisl nibh, eleifend posuere laoreet egestas, porttitor quis lorem.',
            subtitle: 'Phasellus faucibus',
            backgroundColor: 'rgba(209, 211, 212, 1)',
            content: (new Array(16)).join('<p>Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam erat volutpat. Ut wisi enim ad minim veniam, quis nostrud exerci tation ullamcorper suscipit lobortis nisl ut aliquip ex ea commodo consequat. Duis autem vel eum iriure dolor in hendrerit in vulputate velit esse molestie consequat, vel illum dolore eu feugiat nulla facilisis at vero eros et accumsan et iusto odio dignissim qui blandit praesent luptatum zzril delenit augue duis dolore te feugait nulla facilisi. Nam liber tempor cum soluta nobis eleifend option congue nihil imperdiet doming id quod mazim placerat facer possim assum. Typi non habent claritatem insitam; est usus legentis in iis qui facit eorum claritatem. Investigationes demonstraverunt lectores legere me lius quod ii legunt saepius. Claritas est etiam processus dynamicus, qui sequitur mutationem consuetudium lectorum. Mirum est notare quam littera gothica, quam nunc putamus parum claram, anteposuerit litterarum formas humanitatis per seacula quarta decima et quinta decima. Eodem modo typi, qui nunc nobis videntur parum clari, fiant sollemnes in futurum.</p>'),
        };
    }

    WinJS.Namespace.define('detailPage', {
        fragmentLoad: fragmentLoad,
    });
})();
