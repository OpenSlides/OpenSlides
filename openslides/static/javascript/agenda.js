function hideLine(object) {
    if (object == []) {
        return;
    }
    object.hide();
    id = object.children('td.tabledrag-hide').children('input.menu-mlid').attr('value');
    $('.menu-plid[value=\'' + id + '\']').parent().parent().each(function() {
        hideLine($(this));
    });
}

function hideClosedSlides(hide) {
    if (hide) {
        $('#hidelink').attr('title','show');
        $('#hidelink').removeClass('hide').addClass('show');
        $('.close_link.closed').parent().parent().each(function() {
            hideLine($(this));
        });
        hidden = $('#menu-overview tr:hidden').size();
        $('#hiddencount').text(', davon ' + hidden + ' verborgen.');
    } else {
        $('#menu-overview tr').show();
        $('#hidelink').attr('title','hide');
        $('#hidelink').removeClass('show').addClass('hide');
        $('#hiddencount').text('');
    }
    return false;
}

$(function() {
    $('.activate_link').click(function(event) {
        event.preventDefault();
        $.ajax({
            type: 'GET',
            url: $(this).attr('href'),
            dataType: 'json',
            data: '',
            success: function(data) {
                $('.activeline').removeClass('activeline').addClass('inactiveline');
                $('#item_row_' + data.active).removeClass('inactiveline').addClass('activeline');
            },
            error: function () {
                alert("Ajax Error");
            }
        });
    });
    $('.close_link').click(function(event) {
        event.preventDefault();
        slide = $(this);
        $.ajax({
            type: 'GET',
            url: slide.attr('href'),
            dataType: 'json',
            success: function(data) {
                if (data.closed) {
                    newclass = 'closed';
                } else {
                    newclass = 'open';
                }
                slide.removeClass('closed open').addClass(newclass);
                slide.attr('href', data.link);
            }
        });
    });
    // hide closed items
    $('#action_field span').after($('<a id="hidelink" class="hidelink hide" title="hide" href="#"><span></span></a>').click(function () {
        if ($.cookie('Slide.HideClosed') == 1) {
            $.cookie('Slide.HideClosed', 0);
            hideClosedSlides(false);
        } else {
            $.cookie('Slide.HideClosed', 1);
            hideClosedSlides(true);
        }
    }));
    if ($.cookie('Slide.HideClosed') === null) {
        $.cookie('Slide.HideClosed', 0);
    } else if ($.cookie('Slide.HideClosed') == 1) {
        hideClosedSlides(true);
    }

    // control beamer
    $('.beamer_edit').click(function(event) {
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
    $('.beamer_countdown').click(function(event) {
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
