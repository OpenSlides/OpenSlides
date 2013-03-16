
$(function() {
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
	
	$('.a.drag-handle').click(function (ev) {
		ev.preventDefault();
	});
	
	$('ol.agenda_list').nestedSortable({
		handle: 'div',
		items: 'li',
		tolerance: 'intersect',
		toleranceElement: '> div',
		placeholder: 'ui-sortable-placeholder',
		forcePlaceholderSize: true,
		start: function (event, ui) {
			ui.placeholder.html(ui.item.clone());
		},
		helper: false,
		axis: "y",
		update: function (event, ui) {
			var $this = $(this);
			rebuildNesting($this, 0, 0);
			$('#changed-order-message').show();
		}
    });
});
