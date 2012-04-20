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
   // activate an element to show it on projector
    $('.activate_link').click(function(event) {
        event.preventDefault();
        var link = $(this);
        $.ajax({
            type: 'GET',
            url: $(this).attr('href'),
            dataType: 'json',
            data: '',
            success: function(data) {
                $('.activate_link').removeClass('active');
                $('tr').removeClass('activeline');
                link.parent().parent().parent().addClass('activeline');
                link.addClass('active');
            },
            error: function () {
                alert("Ajax Error");
            }
        });
    });
});


function new_message(text, type) {
    var message = $('#dummy-notification').clone(true);
    $(message).removeAttr('id').addClass(type).children('em').html(text);
    $('#notifications').append(message);
    message.slideDown('fast');
}
