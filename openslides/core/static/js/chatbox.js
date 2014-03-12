// Functions for OpenSlides chatbox
$(function() {
    // Chatbox is resizable on two sides (north and west) and
    // one corner (nortwest)
    $("div#chatbox").resizable({ handles: 'n, w, nw' });
});

$("#chatboxbutton").click(function(){
    if ($(this).hasClass('active')) {
        /* close chatbox */
        $("#chatbox").addClass('hidden');
        // Save new chatbox state in cookie
        save_cookie(false);
    } else {
        /* open chatbox */
        $("#chatbox").removeClass('hidden');
        // Scroll chat content to end
        $("#chatbox-text").scrollTop(10000);
        // Set focus to input field
        $("#chatbox-form-input").val('').focus();
        // Save new chatbox state in cookie
        save_cookie(true)
        $.cookie('openslides-chatbox-new-message', 0, { path: "/"});
        // Hide new message number
        $("#newchatmessage").fadeOut();
    }
});

$("#close-chatbox").click(function(){
    $("#chatbox").addClass('hidden');
    $("#chatboxbutton").removeClass('active');
    // Save new chatbox state in cookie
    save_cookie(false);
});

$("#chatbox").resize(function() {
    // If resizing the chatbox window the chatbox text scrolls to latest message.
    // Sets a minimum for width and height.
    $("#chatbox-text").scrollTop(10000);
    $("#chatbox").resizable( "option", "minWidth", 300 );
    $("#chatbox").resizable( "option", "minHeight", 140 );
    save_cookie(true);
});


// Save chatbox state in cookie.
// Parameter 'active': chatbox window is open (true) or closed (false).
function save_cookie(active) {
    var status = {
        'active': active,
        'width': $("#chatbox").width(),
        'height': $("#chatbox").height()
    };
    $.cookie('openslides-chatbox', JSON.stringify(status), { path: "/"});
}

$(document).ready(function(){
    // Load chatbox state from cookie.
    var cookie = $.cookie('openslides-chatbox');
    if (cookie) {
        var status = $.parseJSON(cookie);
        if (status['active']) {
            $("#chatbox").removeClass('hidden');
            $("#chatboxbutton").addClass('active');
            // Scroll chat content to end
            $("#chatbox-text").scrollTop(10000);
            // Set focus to input field
            $('#chatbox-form-input').val('').focus();
        }
        if (status['width']) {
            $("#chatbox").width(status['width']);
        }
        if (status['height']) {
            $("#chatbox").height(status['height']);
        }
    }

    // Load number of new messages from cookie
    if ($.cookie('openslides-chatbox-new-message') > 0) {
        $("#newchatmessage").html($.cookie('openslides-chatbox-new-message'));
        $("#newchatmessage").show(0);
    }

    // Print chat messages into chatbox
    function print_message_into_box(message) {
        var chatcontent = $('#chatbox-text');
        chatcontent.html(chatcontent.html() + '<br>' + message);
        chatcontent.scrollTop(chatcontent.scrollTop() + 10000);
        // if chatbox is hidden show number of new messages and save in cookie
        if ($("#chatbox").hasClass('hidden')){
            new_messages = parseInt($.cookie('openslides-chatbox-new-message')) + 1;
            if (new_messages == 1)
                $("#newchatmessage").fadeIn();
            $("#newchatmessage").html(new_messages);
            $.cookie('openslides-chatbox-new-message', new_messages, { path: "/"});
        }
    }

    var connection = new SockJS('http://' + window.location.host + '/core/chatbox');

    connection.onmessage = function(event) {
        print_message_into_box(event.data);
    };

    $("#chatbox-form").submit(function(){
        var message = $('#chatbox-form-input').val();
        connection.send(message);
        $('#chatbox-form-input').val('').focus();
        return false;
    });
});
