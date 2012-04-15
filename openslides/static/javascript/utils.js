$(function () {
    $('.button').click(function () {
        button = $(this);
        button.attr('disabled', 'disabled');
        setTimeout(function () {
            button.removeAttr('disabled');
        }, 1000);
    });
});
