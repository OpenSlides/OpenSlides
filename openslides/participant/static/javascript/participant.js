/**
 * OpenSlides participants functions
 *
 * :copyright: 2011, 2012 by OpenSlides team, see AUTHORS.
 * :license: GNU GPL, see LICENSE for more details.
 */

$(function() {
    $('.status_link').click(function(event) {
        event.preventDefault();
        link = $(this);
        $.ajax({
            type: 'GET',
            url: link.attr('href'),
            dataType: 'json',
            success: function(data) {
                if (data.active) {
                    newclass = 'active';
                } else {
                    newclass = 'inactive';
                }
                link.removeClass('active inactive').addClass(newclass);
                link.attr('href', data.link);
            }
        });
    });
});