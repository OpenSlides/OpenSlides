$(function () {
    $('.button').click(function (event) {
        button = $(this);
        if (button.hasClass('disabled')) {
            event.preventDefault();
        } else {
            button.addClass('disabled');
            setTimeout(function () {
                button.removeClass('disabled');
            }, 1000);
        }
    });
});


function new_message(text, type) {
    message = $('#dummy-notification').clone(true);
    $(message).show().addClass(type).children('em').html(text);
    $('#notifications').append(message);
}
