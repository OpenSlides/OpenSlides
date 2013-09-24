/**
 * OpenSlides projector functions
 *
 * :copyright: 2011–2013 by OpenSlides team, see AUTHORS.
 * :license: GNU GPL, see LICENSE for more details.
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

    update_data: function(data) {
       $.each(data, function (key, value) {
            if (key === 'load_file')
                projector.load_file(value);
            else
                projector[key] = value;
        });
    }
};

var updater = {
    socket: null,

    start: function() {
        var url = "ws://" + location.host + "/projector/socket/";
        updater.socket = new WebSocket(url);
        updater.socket.onmessage = function(event) {
            updater.updateProjector(JSON.parse(event.data));
        }
        updater.socket.onclose = function() {
            setTimeout('updater.start()', 5000);
        }
    },

    updateProjector: function(data) {
        $('#content').html(data.content);
        var overlays = data.overlays;
        $.each(overlays, function (key, value) {
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
};
