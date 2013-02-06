/**
 * OpenSlides projector functions
 *
 * :copyright: 2011, 2012 by OpenSlides team, see AUTHORS.
 * :license: GNU GPL, see LICENSE for more details.
 */

// function that writes the widget list order to a cookie
function saveOrder() {
    $(".column").each(function(index, value){
        var colid = value.id;
        var cookieName = "cookie-" + colid;
        // Get the order for this column.
        var order = $('#' + colid).sortable("toArray");
        $.cookie(cookieName, order, { path: "/", expiry: new Date(2012, 1, 1)});
    });
}

// function that restores the widget list order from a cookie
function restoreOrder() {
    $(".column").each(function(index, value) {
        var colid = value.id;
        var cookieName = "cookie-" + colid;
        var cookie = $.cookie(cookieName);
        if ( cookie == null ) { return; }
        var IDs = cookie.split(",");
        for (var i = 0, n = IDs.length; i < n; i++ ) {
            var widgetID = IDs[i];
            var widget = $(".column")
                .find('#' + widgetID)
                .appendTo($('#' + colid));
        }
    });
}

$(function() {
    $( ".column" ).sortable({
        connectWith: ".column",
        stop: function() { saveOrder(); }
    });

    // control the projector view
    $('.projector_edit').click(function(event) {
        event.preventDefault();
        var link = $(this);
        $.ajax({
            type: 'GET',
            url: link.attr('href'),
            dataType: 'json',
            success: function(data) {
            }
        });
    });

    // control countdown
    $('.countdown_control').click(function(event) {
        event.preventDefault();
        var link = $(this);
        var requestData = {};
        if (link.attr('id') == "countdown_set") {
            requestData = { "countdown_time" : $( "#countdown_time" ).val() };
        }
        $.ajax({
            type: 'GET',
            url: link.attr('href'),
            data: requestData,
            dataType: 'json',
            success: function(data) {
                if (data['state'] == 'active') {
                    $('#countdown_play').hide();
                    $('#countdown_stop').show();
                } else {
                    $('#countdown_play').show();
                    $('#countdown_stop').hide();
                }
                $('#countdown_time').val(data['countdown_time'])
            }
        });
    });

    // activate/deactivate overlay
    $('.overlay_activate_link').click(function(event) {
        event.preventDefault();
        var link = $(this);
        $.ajax({
            type: 'GET',
            url: link.attr('href'),
            dataType: 'json',
            success: function(data) {
                if (data['active']) {
                    $('#' + data['def_name'] + '_active').show();
                    $('#' + data['def_name'] + '_inactive').hide();
                } else {
                    $('#' + data['def_name'] + '_active').hide();
                    $('#' + data['def_name'] + '_inactive').show();
                }
            }
        });
    });

    $('#overlay_message').ajaxForm({
        dataType: 'json',
        success: function(data) {
            $('#overlay_message_text').val(data['overlay_message']);
        }
    });

/* comment out this function because '$.browser' has been removed from jquery 1.9, see:
   http://blog.jquery.com/2013/01/15/jquery-1-9-final-jquery-2-0-beta-migrate-final-released/
   TODO: use jquery migrate to have $.browser support for IE8;

    if ($.browser.msie) {
        if ($.browser.version >= 8.0 && $.browser.version < 9.0)
        {
            // scaling bug in IE8.. iframe has to be 4 times bigger
            $( "#iframe" ).css('width', 1024 * 4);
            $( "#iframe" ).css('height', 768 * 4);
        }
        $( "#iframe" ).css('zoom', '0.25');
    }
*/

    restoreOrder();
});
