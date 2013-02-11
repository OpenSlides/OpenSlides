/**
 * OpenSlides participants functions
 *
 * :copyright: 2011, 2012 by OpenSlides team, see AUTHORS.
 * :license: GNU GPL, see LICENSE for more details.
 */

$(function() {
    // change participant status (on/off)
    $('.status_link').click(function(event) {
        event.preventDefault();
        var link = $(this);
        $.ajax({
            type: 'GET',
            url: $(this).attr('href'),
            dataType: 'json',
            success: function(data) {
                if (data.active) {
                    newclass = 'icon-on';
                    link.addClass('btn-success');
                } else {
                    newclass = 'icon-off';
                    link.removeClass('btn-success');
                }
                link.children('i').removeClass('icon-off icon-on').addClass(newclass);
                link.attr('href', data.link);
            }
        });
    });
});
