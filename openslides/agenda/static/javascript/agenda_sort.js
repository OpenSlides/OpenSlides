
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
	
	$('ol.agenda_list').nestedSortable({
		forcePlaceholderSize: true,
		handle: 'div',
		helper:	'clone',
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
		}
    });
});
