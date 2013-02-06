/**
 * OpenSlides assignment functions
 *
 * :copyright: 2011, 2012 by OpenSlides team, see AUTHORS.
 * :license: GNU GPL, see LICENSE for more details.
 */

$(function() {
    $('a.elected').parent().parent().children('td').addClass('elected');

    $('.election_link').click(function(event) {
        event.preventDefault();
        line = $(this);
        $.ajax({
            type: 'GET',
            url: line.attr('href'),
            dataType: 'json',
            success: function(data) {
                if (line.hasClass('elected') && !data.elected) {
                    line.removeClass('elected')
                    line.parent().parent().children('td').removeClass('elected')
                } else if (!line.hasClass('elected') && data.elected) {
                    line.addClass('elected')
                    line.parent().parent().children('td').addClass('elected')
                }
                line.attr('href', data.link);
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
    // change publish status of ballot
    $('.publish_link').click(function(event) {
        event.preventDefault();
        var link = $(this);
        $.ajax({
            type: 'GET',
            url: $(this).attr('href'),
            dataType: 'json',
            success: function(data) {
                if (data.published) {
                    newclass = 'icon-checked-new_white';
                    link.addClass('btn-primary');
                } else {
                    newclass = 'icon-unchecked-new';
                    link.removeClass('btn-primary');
                }
                link.children('i').removeClass('icon-checked-new_white icon-unchecked-new').addClass(newclass);
                link.attr('href', data.link);
            }
        });
    });});
