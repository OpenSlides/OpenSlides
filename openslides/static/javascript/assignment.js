$(function() {
    $('a.iselected').parent().parent().children('td').addClass('iselected');



    $('.election_link').click(function(event) {
        event.preventDefault();
        line = $(this);
        $.ajax({
            type: 'GET',
            url: line.attr('href'),
            dataType: 'json',
            success: function(data) {
                if (line.hasClass('iselected') && !data.elected) {
                    line.removeClass('iselected')
                    line.parent().parent().children('td').removeClass('iselected')
                } else if (!line.hasClass('iselected') && data.elected) {
                    line.addClass('iselected')
                    line.parent().parent().children('td').addClass('iselected')
                }
                line.attr('href', data.link);
                line.text(data.text);
            },
            error: function () {
                alert("Ajax Error");
            }
        });
    });
    $('.close_link').click(function(event) {
        event.preventDefault();
        slide = $(this);
        $.ajax({
            type: 'GET',
            url: slide.attr('href'),
            dataType: 'json',
            success: function(data) {
                if (data.closed) {
                    newclass = 'closed';
                } else {
                    newclass = 'open';
                }
                slide.removeClass('closed open').addClass(newclass);
                slide.attr('href', data.link);
            }
        });
    });
});
