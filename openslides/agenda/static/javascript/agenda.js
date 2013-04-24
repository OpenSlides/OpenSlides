/**
 * OpenSlides agenda functions
 *
 * :copyright: 2011, 2012 by OpenSlides team, see AUTHORS.
 * :license: GNU GPL, see LICENSE for more details.
 */


function hideClosedSlides(hide) {
    if (hide) {
        $('#hidelink').attr('title', 'show');
        $('#hidelink').removeClass('hide').addClass('show');
        $('.close_link .icon-checked-new').each(function() {
            $(this).parents("li").first().hide();
        });
        var hidden = $(".agenda_list li:hidden").length;
        $('#hiddencount').text(interpolate(gettext(', of which %s are hidden.'), [hidden]));
    } else {
        $('.agenda_list li').show();
        $('#hidelink').attr('title','hide');
        $('#hidelink').removeClass('show').addClass('hide');
        $('#hiddencount').text('');
    }
    return false;
}

$('#speaker_list_changed_form').submit(function() {
    $('#sort_order').val($('#list_of_speakers').sortable("toArray"));
});

$(function() {
    // change participant status (on/off)
    $('.close_link').click(function(event) {
        event.preventDefault();
        var link = $(this);
        $.ajax({
            type: 'GET',
            url: $(this).attr('href'),
            dataType: 'json',
            success: function(data) {
                if (data.closed) {
                    newclass = 'icon-checked-new';
                    link.parent().parent().addClass('offline');
                    link.addClass('btn-success');
                } else {
                    newclass = 'icon-unchecked-new';
                    link.parent().parent().removeClass('offline');
                    link.removeClass('btn-success');
                }
                link.children('i').removeClass('icon-checked-new icon-unchecked-new').addClass(newclass);
                link.attr('href', data.link);
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

    // TODO: Fix this code and reactivate it again
    //# if ($.cookie('Slide.HideClosed') === null) {
        //# $('#hide_closed_items').attr('checked', false);
        //# $.cookie('Slide.HideClosed', 0);
    //# } else if ($.cookie('Slide.HideClosed') == 1) {
        //# hideClosedSlides(true);
        //# $('#hide_closed_items').attr('checked', true);
    //# }

    if ($('#list_of_speakers').length > 0) {
        $('#list_of_speakers').sortable({axis: "y", containment: "parent", update: function(event, ui) {
            $('#speaker_list_changed_form').show();
        }});
        $('#list_of_speakers').disableSelection();
    }
});
