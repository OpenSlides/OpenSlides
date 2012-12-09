/**
 * OpenSlides agenda functions
 *
 * :copyright: 2011, 2012 by OpenSlides team, see AUTHORS.
 * :license: GNU GPL, see LICENSE for more details.
 */

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
        $('#hidelink').attr('title', 'show');
        $('#hidelink').removeClass('hide').addClass('show');
        $('.close_link.closed').parent().parent().each(function() {
            hideLine($(this));
        });
        hidden = $('#menu-overview tr:hidden').size();
        $('#hiddencount').text(interpolate(gettext(', of which %s are hidden.'), [hidden]));
    } else {
        $('#menu-overview tr').show();
        $('#hidelink').attr('title','hide');
        $('#hidelink').removeClass('show').addClass('hide');
        $('#hiddencount').text('');
    }
    return false;
}

$(function() {
    $('.close_link a').click(function(event) {
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
                slide.parent().removeClass('closed open').addClass(newclass);
                slide.attr('href', data.link);
            }
        });
    });
    // filter to show/hide closed items
    $('#hide_closed_items').click(function(event) {
        // show all items
        if ($.cookie('Slide.HideClosed') == 1) {
            $.cookie('Slide.HideClosed', 0);
            hideClosedSlides(false);
            $('#hide_closed_items').attr('checked', false);
        }
        else { // hide closed items
            $.cookie('Slide.HideClosed', 1);
            hideClosedSlides(true);
            $('#hide_closed_items').attr('checked', true);
        }
    });
    if ($.cookie('Slide.HideClosed') === null) {
        $('#hide_closed_items').attr('checked', false);
        $.cookie('Slide.HideClosed', 0);
    } else if ($.cookie('Slide.HideClosed') == 1) {
        hideClosedSlides(true);
        $('#hide_closed_items').attr('checked', true);
    }
});
