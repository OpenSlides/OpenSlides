/**
 * OpenSlides projector functions
 *
 * :copyright: 2011, 2012 by OpenSlides team, see AUTHORS.
 * :license: GNU GPL, see LICENSE for more details.
 */

$(function() {
    // activate an element to show it on projector
    $('.activate_link').click(function(event) {
        event.preventDefault();
        var link = $(this);
        $.ajax({
            type: 'GET',
            url: $(this).attr('href'),
            dataType: 'json',
            data: '',
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
    $('.projector_countdown_btn').click(function(event) {
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
            }
        });
    });

    $('.projector_countdown_spindown').click(function(event) {
        event.preventDefault();
        var count = parseInt($( "#countdown_time" ).val());

        $( "#countdown_time" ).val( ((count - 1 >= 0) ? count - 1 : count));
    });

    $('.projector_countdown_spinup').click(function(event) {
        event.preventDefault();
        var count = parseInt($( "#countdown_time" ).val());

        $( "#countdown_time" ).val(count + 1);
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
});
