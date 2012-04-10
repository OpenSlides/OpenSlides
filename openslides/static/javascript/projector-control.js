$(function() {
    // activate an element to show it on projector
    $('.activate_link').click(function(event) {
        event.preventDefault();
        link = $(this);
        $.ajax({
            type: 'GET',
            url: $(this).attr('href'),
            dataType: 'json',
            data: '',
            success: function(data) {
                $('.activate_link').removeClass('active');
                $('li').removeClass('activeline');
                link.addClass('active');
            },
            error: function () {
                alert("Ajax Error");
            }
        });
    });

    // control the projector
    $('.projector_edit').click(function(event) {
        event.preventDefault();
        link = $(this);
        $.ajax({
            type: 'GET',
            url: link.attr('href'),
            dataType: 'json',
            success: function(data) {
            }
        });
    });

    // control countdown
    $('.projector_countdown').click(function(event) {
        event.preventDefault();
        link = $(this);
        $.ajax({
            type: 'GET',
            url: link.attr('href'),
            dataType: 'json',
            success: function(data) {
            }
        });
    });
    $('.countdown_visible_link').click(function(event) {
        event.preventDefault();
        link = $(this);
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
