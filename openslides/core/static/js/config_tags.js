/*
 * Functions to alter the tags via ajax-commands.
 */

$(function() {
  // The HTML-input field, in which the tag-name can be altered
  var insert_element = $('#tag-edit');

  // Boolean value to block second insert-ajax-requests before the pk was returned
  var insert_is_blocked = false;

  // Clears the HTML-input field to add new tags
  $('#tag-save').click(function(event) {
    event.preventDefault();
    insert_element.val('');
    // This is the important line, where the name-attribute of the html-element is set to new
    insert_element.attr('name', 'new');
    insert_is_blocked = false;
  });

  // The same happens, if the enter key (keycode==13) was pressed inside the input element
  insert_element.keypress(function(event) {
    if ( event.which == 13 ) {
      event.preventDefault();
      $('#tag-save').trigger('click');
    }
  });

  // Change the tag which will be updated
  $('.tag-edit').click(function(event) {
    event.preventDefault();
    var edit_element = $(this);
    insert_element.val(edit_element.parents('.tag-row').children('.tag-name').html());
    // This is the important line, where the name-attribute of the html-elemtnt is set to edit
    insert_element.attr('name', 'edit-' + edit_element.parents('.tag-row').attr('id'));
    insert_is_blocked = false;
  });

  // Code when the delete button of a tag is clicked. Send the ajax-request and
  // remove the tag-element from the DOM, when the request was a success.
  $('.tag-del').click(function(event) {
    event.preventDefault();
    var delete_element = $(this);
    $.ajax({
      method: 'POST',
      data: {
        name: 'delete-' + delete_element.parents('.tag-row').attr('id')},
      dataType: 'json',
      success: function(data) {
        if (data.action == 'deleted') {
          delete_element.parents('.tag-row').remove();
        }
      }
    });
  });

  // Send the changed data, when new input is in the insert element.
  // Use the 'input'-event instead of the 'change'-event, so new data is send
  // event when the element does not loose the focus.
  insert_element.on('input', function(event) {
    // Only send data, if insert_is_blocked is false
    if (!insert_is_blocked) {
      // block the insert when a new tag is send to the server
      if (insert_element.attr('name') == 'new') {
        insert_is_blocked = true;
      }

      $.ajax({
        // Sends the data to the current page
        method: 'POST',
        data: {
          name: insert_element.attr('name'),
          value: insert_element.val()},
        dataType: 'json',
        success: function(data) {
          if (data.action == 'created') {
            // If a new tag was created, use the hidden dummy-tag as template
            // to create a new tag-line
            // Known bug: the element is added at the end of the list and
            // not in alphabetic order. This will be fixed with angular
            var new_element = $('#dummy-tag').clone(withDataAndEvents=true);
            new_element.attr('id', 'tag-' + data.pk);
            new_element.children('.tag-name').html(insert_element.val());
            new_element.appendTo('#tag-table');
            new_element.slideDown();

            // Set the insert-element to edit the new created tag and unblock the
            // ajax-method
            insert_element.attr('name', 'edit-tag-' + data.pk);
            insert_is_blocked = false;

          } else if (data.action == 'updated') {
            // If a existing tag was altered, change it.
            $('#tag-' + data.pk).children('.tag-name').html(insert_element.val());
          }

          if (data.error) {
            insert_element.parent().addClass('error');
            if (insert_element.attr('name') == 'new') {
                // Remove the block, even if an error happend, so we can send a
                // new name for the tag
                insert_is_blocked = false;
            }
          } else {
            insert_element.parent().removeClass('error');
          };
        },
      });
    }
  });
});
