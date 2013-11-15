// function that writes the widget list order to a cookie
function saveOrder() {
    $(".column").each(function(index, value){
        var colid = value.id;
        var cookieName = "cookie-" + colid;
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
        $.cookie(cookieName, cookie_content, { path: "/", expiry: new Date(2012, 1, 1)});
    });
}

// function that restores the widget list order from a cookie
function restoreOrder() {
    $(".column").each(function(index, value) {
        var colid = value.id;
        var cookieName = "cookie-" + colid;
        var cookie = $.cookie(cookieName);
        if ( cookie === null ) { return; }
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
                $('#scale_level').html(data['scale_level']);
                $('#scroll_level').html(data['scroll_level']);
                if ( data['scroll_level'] === 0 )
                    $('#scroll_up_button').addClass('disabled');
                else {
                    if ( $('#scroll_up_button').hasClass('disabled') )
                        $('#scroll_up_button').removeClass('disabled');
                }
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
                $('#countdown_time').val(data['countdown_time']);
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
