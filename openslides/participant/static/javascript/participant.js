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
        group = $(this).parent();
        $.ajax({
            type: 'GET',
            url: link.attr('href'),
            dataType: 'json',
            success: function(data) {
                if (data.active) {
                    group.children('.status_link.deactivate').show();
                    group.children('.status_link.activate').hide();
                } else {
                    group.children('.status_link.deactivate').hide();
                    group.children('.status_link.activate').show();
                }
            }
        });
    });
});
