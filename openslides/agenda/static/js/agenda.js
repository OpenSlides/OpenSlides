/*
 * JavaScript functions for agenda.
 *
 */

function hideClosedSlides(hide) {
    if (hide) {
        $('#hidelink').attr('title', 'show');
        $('#hidelink').removeClass('hide').addClass('show');
        $('.agenda_list .icon-checked-new').each(function() {
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

$('#coming_speakers_changed_form').submit(function() {
    $('#sort_order').val($('#coming_speakers').sortable("toArray"));
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

    if ($('#coming_speakers').length > 0) {
        $('#coming_speakers').sortable({axis: "y", containment: "parent", update: function(event, ui) {
            $('#coming_speakers_changed_form').show();
        }});
        $('#coming_speakers').disableSelection();
    }


    /*
     * function for sorting agenda items
     *
     */
    var $agenda_list = $('ol.agenda_list');
    var rebuildOpenersClosers = function ( ) {
        $agenda_list.find("li").each(function() {
            var $li = $(this);
            if ($li.find("> ol").length > 0) $li.find("> div .opener_closer").show();
            else $li.find("> div .opener_closer").hide();
        });
    }
    var rebuildNesting = function( $root, level, parent_id ) {
        var $children = $root.find('> li'),
            curr_weight = -50;
        
        $children.each(function() {
            var $child = $(this),
                $curr_element = $child.find('> div'),
                my_id = $curr_element.find('.menu-mlid').val();
            $curr_element.find('.menu-plid').val(parent_id);
            $curr_element.find('.menu-weight').val(curr_weight);
            curr_weight++;
            $child.find('> ol').each(function() {
                rebuildNesting( $(this), level + 1, my_id );
            });
        });
    };
    if ($agenda_list.hasClass("sortable")) $agenda_list.nestedSortable({
        forcePlaceholderSize: true,
        handle: 'div',
        helper: 'clone',
        items: 'li',
        opacity: .6,
        placeholder: 'placeholder',
        revert: 250,
        tabSize: 25,
        tolerance: 'pointer',
        toleranceElement: '> div',
        isTree: true,
        expandOnHover: 700,
        startCollapsed: true,
        update: function (event, ui) {
            var $this = $(this);
            rebuildNesting($this, 0, 0);
            $('#changed-order-message').show();
            rebuildOpenersClosers();
        }
    });
    rebuildOpenersClosers();
    $agenda_list.find(".opener_closer .opener").click(function(ev) {
        ev.preventDefault();
        $(this).parents("li").first().removeClass("closed");
    });
    $agenda_list.find(".opener_closer .closer").click(function(ev) {
        ev.preventDefault();
        $(this).parents("li").first().addClass("closed");
    });
});
