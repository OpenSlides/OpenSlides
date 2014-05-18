/*
 * JavaScript functions for OpenSlides dashboard.
 *
 */

// function that writes the widget list order to a cookie
function saveOrder() {
    $(".column").each(function(index, value){
        var colid = value.id;
        var cookieName = "openslides-dashboard-" + colid;
        // Get the order for this column.
        var order = $('#' + colid).sortable("toArray");
        var cookie_content = [];
        for (var i = 0; i < order.length; i++) {
            widget_id = order[i];
            widget = $('#' + widget_id);
            var is_collabsed = 0;
            var is_pinned = 0;
            if (!widget.find('.collapse').hasClass('in')) {
                is_collabsed = 1;
            }
            if (widget.hasClass('affix')) {
                is_pinned = 1;
            }
            cookie_content[i] = widget_id + '/' + is_collabsed + '/' + is_pinned;
        }
        $.cookie(cookieName, cookie_content);
    });
}

// function that restores the widget list order from a cookie
function restoreOrder() {
    $(".column").each(function(index, value) {
        var colid = value.id;
        var cookieName = "openslides-dashboard-" + colid;
        var cookie = $.cookie(cookieName);
        if ( cookie === undefined ) { return; }
        var widgets = cookie.split(",");
        for (var i = 0, n = widgets.length; i < n; i++ ) {
            var widget_information = widgets[i].split('/');
            var widgetID = widget_information[0];
            var widget = $(".column").find('#' + widgetID);
            widget.appendTo($('#' + colid));
            if (widget_information[1] === "1") {
                widget.find('.collapse').removeClass('in');
                console.log(widget_information[0]);
                widget.find('.collapsebutton').find('.btn').addClass('active');
            }
            if (widget_information[2] === "1") {
                widget.addClass('affix');
                widget.data('spy', 'affix');
                widget.find('.fixbutton').find('.btn').addClass('active');
            }
        }
    });
    $('.collapse')
        .on('hidden', function () { saveOrder(); })
        .on('shown', function () { saveOrder(); });
}

$(function() {
    $( ".column" ).sortable({
        connectWith: ".column",
        handle: ".widget-header",
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
                // change scale level number
                $('#scale_level').html(data['scale_level']);
                if ( data['scale_level'] != 0 )
                    $('#scale_level').addClass('notNull');
                else
                    $('#scale_level').removeClass('notNull');
                // change scroll level number
                $('#scroll_level').html(data['scroll_level']);
                if ( data['scroll_level'] != 0 ) {
                    $('#scroll_level').addClass('notNull');
                    if ( $('#scroll_up_button').hasClass('disabled') )
                        $('#scroll_up_button').removeClass('disabled');
                }
                else {
                    $('#scroll_level').removeClass('notNull');
                    $('#scroll_up_button').addClass('disabled');
                }
            }
        });
    });

    // control countdown
    // TODO: Move Countdown-code into the projector app, or merge the projector
    //       app with the core app.
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
                $('#countdown_time').val(data['countdown_time']);
            }
        });
    });

    $('#countdown_set').click(function(event) {
        // Create a shortcut from the value in the form
        event.preventDefault();
        var times = get_times();
        times.push($("#countdown_time" ).val());
        localStorage.setItem('countdown_shortcut', times.join());
        build_countdown_shortcuts();
    });

    get_times = function() {
        // Loads the time values from the local storages. Converts all values
        // to integers and removes doubles.
        // Returns an empty array if an error occurs
        try {
            return localStorage.getItem('countdown_shortcut').split(',')
            .map(function(value) {
                // converts times into int
                return parseInt(value);
            }).filter(function(value, index, self) {
                // filters doubles
                return self.indexOf(value) === index;
            });
        } catch(err) {
            return [];
        }
    };

    $('.countdown_shortcut_time').click(function(event) {
        // click on a shortcut. Set the form value and simulate a click event.
        event.preventDefault();
        var time = $(this).children('span').html();
        $('#countdown_time').val(time);
        $('#countdown_set').click();
    });

    $('.countdown_shortcut_time .close').click(function(event) {
        // Removes a shortcut.
        event.preventDefault();
        var time = $(this).parent().parent().children('span').html();
        var times = get_times().filter(
            function(value) {
                return value !== parseInt(time);
            }
        );
        localStorage.setItem('countdown_shortcut', times);
        build_countdown_shortcuts();
    });

    build_countdown_shortcuts = function() {
        // Recreates the countdown shortcuts
        var times = get_times();
        $('#countdown_shortcut_storage').empty();
        $.each(times, function(index, time) {
            var element = $('#countdown_shortcut_dummy').clone(withDataAndEvents=true);
            element.attr('id', '');
            $('span', element).html(time);
            element.appendTo('#countdown_shortcut_storage');
        });
    };

    // build shortcuts at start time.
    build_countdown_shortcuts();

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
                    $('#' + data['name'] + '_active').show();
                    $('#' + data['name'] + '_inactive').hide();
                } else {
                    $('#' + data['name'] + '_active').hide();
                    $('#' + data['name'] + '_inactive').show();
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
    $('.fixbutton button').click(function (event) {
        event.preventDefault();
        if($(this).hasClass('active')) {
            $(this).closest('.widget').removeClass('affix');
            $(this).closest('.widget').removeAttr('data-spy');
            saveOrder();
        } else {
            $(this).closest('.widget').addClass('affix');
            $(this).closest('.widget').attr('data-spy', 'affix');
            saveOrder();
        }
    });

    // control pdf pages
    $('.pdf-page-ctl').click(function(event){
        event.preventDefault();
        var link = $(this);
        $.ajax({
            type: 'GET',
            url: link.attr('href'),
            dataType: 'json',
            success: function(data) {
                if (typeof data.current_page !== 'undefined') {
                    $('#page_num').val(data.current_page);
                }
            }
        });
    });

    $('.set-page-form').submit(function() {
        $(this).ajaxSubmit();
        return false;
    });

    $('.go-first-page').click(function() {
        $('#page_num').val('1');
        $('.set-page-form').ajaxSubmit();
    });

    $('.pdf-toggle-fullscreen').click(function(event){
        event.preventDefault();
        var link = $(this);
        $.ajax({
            type: 'GET',
            url: link.attr('href'),
            dataType: 'json',
            success: function(data) {
                if(data.fullscreen) {
                    if (!link.hasClass('btn-primary')) {
                        link.addClass('btn-primary');
                        link.find('i').addClass('icon-white');
                    }
                } else {
                    if (link.hasClass('btn-primary')) {
                        link.removeClass('btn-primary');
                        link.find('i').removeClass('icon-white');
                    }
                }
            }
        });
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
