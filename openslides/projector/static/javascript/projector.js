/**
 * OpenSlides projector functions
 *
 * :copyright: 2011, 2012 by OpenSlides team, see AUTHORS.
 * :license: GNU GPL, see LICENSE for more details.
 */

content_hash = null;

function presentation_reload() {
    
    if ($('#config > #ajax').html() == 'on') {
        $.ajax({
            type: 'GET',
            url: '/projector/',
            dataType: 'json',
            success: function(data) {
                $('#currentTime').removeClass('ajax_error');
                var new_content_hash = data['content_hash'];
                if (new_content_hash != content_hash) {
                    $('#content').html(data.content);
                    content_hash = new_content_hash;
                }
                $('#scrollcontent').html(data.scrollcontent);
                document.title = data.title;
                $('#currentTime').html(data.time);
                $('#content').clearQueue();
                // content font-size
                $('#content').animate({'font-size': data.bigger + '%'}, 200);
                $('#content #sidebar').css({'font-size': '18px'}, 0);
                $('#scrollcontent').animate({'font-size': data.bigger + '%'}, 200);
                // content position
                $('#scrollcontent').animate({'margin-top': data.up + 'em'}, 200);
                // overlays
                $('#overlays div').remove();
                $('#overlays span').remove();
                $.each(data['overlays'], function (index, value){
                    if (value[0] != "Countdown")
                        $('#overlays').append('<span id="overlay_transparent"></span>')
                    $('#overlays').append('<div id="overlay_' + value[0] + '">' + value[1] + '</div>');
                });
                setTimeout("presentation_reload()", 1000);
            },
            error: function () {
                $('#currentTime').addClass('ajax_error');
                setTimeout("presentation_reload()", 1000);
            }
        });
    }
}

function switchajax() {
    if ($('#config > #ajax').html() == 'on') {
        $('#config > #ajax').html('off');
        $('#ajaxswitcher').html('<a href="#" onClick="switchajax()">Ajax Anschalten</a>');
    } else {
        $('#config > #ajax').html('on');
        $('#ajaxswitcher').html('<a href="#" onClick="switchajax()">Ajax Ausschalten</a>');
    }
}

$(document).ready(function() {
    switchajax();
    switchajax();
    presentation_reload();
});
