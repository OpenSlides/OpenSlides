/*
 * function for sorting assignment items
 *
 */
var $assignment_list = $('ol.assignment_list');
var sort_form = $('#manual_sort_form');

sort_form.submit(function( event ) {
    var $children = $assignment_list.find('> li');
    var sort_order = 1;
    $children.each(function() {
        var curr_element = this;
        sort_form.append($('<input>').attr({
            'type': 'hidden',
            'name': curr_element.id,
            'value': sort_order
        }));
        sort_order++;
    });
});


if ($assignment_list.hasClass("sortable")) {
    $assignment_list.nestedSortable({
        forcePlaceholderSize: true,
        handle: 'a',
        helper: 'clone',
        items: 'li',
        opacity: .6,
        placeholder: 'placeholder',
        revert: 250,
        tabSize: 25,
        tolerance: 'pointer',
        toleranceElement: '> a',
        isTree: true,
        expandOnHover: 700,
        startCollapsed: true,
        update: function (event, ui) {
            $('#changed-order-message').show();
        }
    });
}
