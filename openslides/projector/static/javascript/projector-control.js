/**
 * OpenSlides projector functions
 *
 * :copyright: 2011, 2012 by OpenSlides team, see AUTHORS.
 * :license: GNU GPL, see LICENSE for more details.
 */

// function that writes the portlet list order to a cookie
function saveOrder() {
    $(".column").each(function(index, value){
        var colid = value.id;
        var cookieName = "cookie-" + colid;
        // Get the order for this column.
        var order = $('#' + colid).sortable("toArray");
        // For each portlet in the column
        for ( var i = 0, n = order.length; i < n; i++ ) {
            // Determine if it is 'opened' or 'closed'
            var v = $('#' + order[i] ).find('.portlet-content').is(':visible');
            // Modify the array we're saving to indicate what's open and
            //  what's not.
            order[i] = order[i] + ":" + v;
        }
        $.cookie(cookieName, order, { path: "/", expiry: new Date(2012, 1, 1)});
    });
}

// function that restores the portlet list order from a cookie
function restoreOrder() {
    $(".column").each(function(index, value) {
        var colid = value.id;
        var cookieName = "cookie-" + colid
        var cookie = $.cookie(cookieName);
        if ( cookie == null ) { return; }
        var IDs = cookie.split(",");
        for (var i = 0, n = IDs.length; i < n; i++ ) {
            var toks = IDs[i].split(":");
            if ( toks.length != 2 ) {
                continue;
            }
            var portletID = toks[0];
            var visible = toks[1]
            var portlet = $(".column")
                .find('#' + portletID)
                .appendTo($('#' + colid));
            if (visible === 'false') {
                portlet.find(".ui-icon").toggleClass("ui-icon-minus");
                portlet.find(".ui-icon").toggleClass("ui-icon-plus");
                portlet.find(".portlet-content").hide();
            }
        }
    });
}

$(function() {
    $( ".column" ).sortable({
        connectWith: ".column",
        stop: function() { saveOrder(); }
    });

    $(".portlet")
         .addClass("ui-widget ui-widget-content")
         .addClass("ui-helper-clearfix ui-corner-all")
         .find(".portlet-header")
         .addClass("ui-widget-header ui-corner-all")
         .prepend('<span class="ui-icon ui-icon-minus"></span>')
         .end()
         .find(".portlet-content");

    restoreOrder();

    $(".portlet-header .ui-icon").click(function() {
        $(this).toggleClass("ui-icon-minus");
        $(this).toggleClass("ui-icon-plus");
        $(this).parents(".portlet:first").find(".portlet-content").toggle();
        saveOrder(); // This is important
    });

    if ($.browser.msie) {
        if ($.browser.version >= 8.0 && $.browser.version < 9.0)
        {
            /* scaling bug in IE8.. iframe has to be 4 times bigger */
            $( "#iframe" ).css('width', 1024 * 4);
            $( "#iframe" ).css('height', 768 * 4);
        }
        $( "#iframe" ).css('zoom', '0.25');
    }

    // activate an element to show it on projector
    $('.activate_link').click(function(event) {
        event.preventDefault();
        var link = $(this);
        $.ajax({
            type: 'GET',
            url: $(this).attr('href'),
            dataType: 'json',
            success: function(data) {
                $('.activate_link').removeClass('active');
                $('li').removeClass('activeline');
                $('div').removeClass('activeline');
                link.addClass('active');
                link.parent().addClass('activeline');
            },
            error: function () {
                alert("Ajax Error");
            }
        });
    });

    $('a.overlay').click(function(event) {
        event.preventDefault();
        var link = $(this);
        $.ajax({
            type: 'GET',
            url: $(this).attr('href'),
            dataType: 'json',
            success: function(data) {
                if (data['active']) {
                    $('#' + data['def_name'] + '_active').show();
                    $('#' + data['def_name'] + '_inactive').hide();
                } else {
                    $('#' + data['def_name'] + '_active').hide();
                    $('#' + data['def_name'] + '_inactive').show();
                }
            },
        });
    });

    // control the projector
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

    $('.countdown_visible_link').click(function(event) {
        event.preventDefault();
        var link = $(this);
        $.ajax({
            type: 'GET',
            url: link.attr('href'),
            dataType: 'json',
            success: function(data) {
                if (data.countdown_visible == "True") {
                    newclass = 'open';
                } else {
                    newclass = 'closed';
                }
                link.removeClass('closed open').addClass(newclass);
                link.attr('href', data.link);
            }
        });
    });

    $('#overlay_message').ajaxForm({
        dataType: 'json',
        success: function(data) {
            $('#overlay_message_text').val(data['overlay_message']);
        }
    });
});
