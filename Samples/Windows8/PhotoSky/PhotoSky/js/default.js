(function () {
    'use strict';
    // Uncomment the following line to enable first chance exceptions.
    // Debug.enableFirstChanceException(true);

    var homePage;

    function navigateHome() {
        var loc = WinJS.Navigation.location;
        if (loc !== '' && loc !== homePage) {
            WinJS.Navigation.navigate(homePage);
        }

        WinJS.UI.getControl(document.getElementById('appbar')).hide();
    }

    function navigated(e) {
        WinJS.UI.Fragments.clone(e.detail.location, e.detail.state)
            .then(function (frag) {
                var host = document.getElementById('contentHost');
                host.innerHTML = '';
                host.appendChild(frag);
                document.body.focus();

                var backButton = document.querySelector('header[role=banner] .win-backbutton');
                if (backButton) {
                    backButton.addEventListener('click', function () {
                        WinJS.Navigation.back();
                    }, false);
                    if (WinJS.Navigation.canGoBack) {
                        backButton.removeAttribute('disabled');
                    }
                    else {
                        backButton.setAttribute('disabled', 'true');
                    }
                }

                WinJS.Application.queueEvent({ type: 'fragmentappended', location: e.detail.location, fragment: host, state: e.detail.state });
            });
        }

    WinJS.Application.onmainwindowactivated = function (e) {
        if (e.detail.kind === Windows.ApplicationModel.Activation.ActivationKind.launch) {
            homePage = document.body.getAttribute('data-homePage');

            document.body.addEventListener('keyup', function (e) {
                if (e.altKey) {
                    if (e.keyCode === WinJS.Utilities.Key.leftArrow) {
                        WinJS.Navigation.back();
                    }
                    else if (e.keyCode === WinJS.Utilities.Key.rightArrow) {
                        WinJS.Navigation.forward();
                    }
                }
            }, false);


            WinJS.UI.process(document.getElementById('appbar'))
                .then(function () {
                    document.getElementById('home').addEventListener('click', navigateHome, false);
                });

            WinJS.Navigation.navigate(homePage);
        }
    }

    WinJS.Navigation.addEventListener('navigated', navigated);
    WinJS.Application.start();

})();
