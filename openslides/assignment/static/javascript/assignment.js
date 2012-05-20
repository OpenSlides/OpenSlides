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
    $('.publish_link').click(function(event) {
        event.preventDefault();
        link = $(this);
        $.ajax({
            type: 'GET',
            url: link.attr('href'),
            dataType: 'json',
            success: function(data) {
                if (data.published) {
                    link.addClass('published');
                    //link.attr('title', gettext('Unpublish ballot'))
                } else {
                    link.removeClass('published');
                    //link.attr('title', 'Publish ballot')
                }
            }
        });
    });
});
