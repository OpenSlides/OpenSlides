/*
 * JavaScript functions for projector.
 *
 */

$(document).ready(function() {
    if ($('#content.reload').length > 0) {
        updater.start();
    }
});

var projector = {
    _loaded_files: {},

    load_file: function(src) {
        if (projector._loaded_files[src] === undefined) {
            projector._loaded_files[src] = document.createElement('script');
            projector._loaded_files[src].setAttribute("type","text/javascript");
            projector._loaded_files[src].setAttribute("src", src);
            $('head').append(projector._loaded_files[src]);
        }
    },

    scroll: function(value) {
        $('#content').css('margin-top', -10 * value + 'em');
    },

    scale: function(value) {
        $('#content').css('font-size', 100 + 20 * value  + '%');
    },

    get_server_time: function () {
        var date = new Date();
        date.setTime(date.getTime() - projector.server_time_offset);
        return date;
    },

    set_server_time: function(value) {
        var local_time = Date.parse(new Date().toUTCString());
        projector.server_time_offset = local_time - value * 1000;
    },

    update_data: function(data) {
        $.each(data, function (key, value) {
            if (key === 'load_file')
                projector.load_file(value);
            else if (key === 'call') {
                try {
                    eval(value);
                } catch (e) {}
            } else
                projector[key] = value;
        });
    }
};

var updater = {
    socket: null,

    start: function() {
        var url = "http://" + location.host + "/projector/socket";
        updater.socket = new SockJS(url);
        updater.socket.onmessage = function(event) {
            updater.updateProjector(event.data);
        }
        updater.socket.onclose = function() {
            setTimeout('updater.start()', 5000);
        }
    },

    updateProjector: function(data) {
        if (data.content) {
            $('#content').removeClass('fullscreen');
            $('#footer').removeClass('black');
            $('body').removeClass('black');
            $('#content').html(data.content);
        }
        if (data.overlays) {
            $.each(data.overlays, function (key, value) {
                var overlay = $('#overlays #overlay_' + key)
                if (!value)
                    overlay.remove();
                else {
                    if (overlay.length) {
                        overlay.html(value.html)
                    } else {
                        $('#overlays').append(value.html);
                    }
                    projector.update_data(value.javascript);
                }
            });
        }
        if (data.calls) {
            $.each(data.calls, function (call, argument) {
                projector[call](argument);
            });
        }
    }
};
