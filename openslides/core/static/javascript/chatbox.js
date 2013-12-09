// Functions for OpenSlides manager chatbox

$("button#open-chatbox").click(function(){
    $("div#chatbox").removeClass('hidden');
});

$("button#close-chatbox").click(function(){
    $("div#chatbox").addClass('hidden');
});

$(document).ready(function(){
    //~ var transports = $('#protocols input:checked').map(function(){
        //~ return $(this).attr('id');
    //~ }).get();

    function print_message(message) {
        var chatbox = $('#chatbox-text');
        chatbox.html(chatbox.html() + '<p>' + message + '</p>');
        chatbox.scrollTop(chatbox.scrollTop() + 10000);
    }

    //~ var connection = new SockJS('http://' + window.location.host + '/chatbox', transports);
    var connection = new SockJS('http://' + window.location.host + '/core/chatbox');

    connection.onmessage = function(event) {
        print_message(event.data);
    };

    $("#chatbox-form-send").click(function(){
        var message = $('#chatbox-form-input').val();
        connection.send(message);
        $('#chatbox-form-input').val('').focus();
        return false;
    });
});
