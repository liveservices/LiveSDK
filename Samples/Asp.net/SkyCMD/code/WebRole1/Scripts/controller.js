$(document).ready(function () {
    window.$document = $(document);
    window.$body = $('body');

    WL.init({ client_id: '00000000480868B7' });
    var datamodel = new skycmd.datamodel();
    $('#container').text('loading...');
    var context = {
        currentId: '',
        pwd: '',
        pathStack: [],
        songQueue: []
    };
    datamodel.checkLoginStatus(function () {
        var terminal = new skycmd.terminal($('#container'), datamodel, context);
        $('#container').focus();
    });

    $('#music').bind('ended', function (e) {
        if (context.songQueue.length > 0) {
            var song = context.songQueue[0];
            context.songQueue.splice(0, 1);
            $('#music').html('<source src="' + song.source + '" type="audio/mpeg" />');
            setTimeout(function () {
                $('#music')[0].pause();
                $('#music')[0].play();
            }, 0);
        }
    });
});
