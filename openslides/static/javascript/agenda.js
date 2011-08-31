var Slide = function (json) {
    this.id = json.id;
    this.active = ko.observable(json.active);
};


var ViewModel = {
    slides: []
};

function getSlideByID(id) {
    a = ViewModel.slides;
    for (var i = 0; i < a.length; i++) {
        if (a[i].id == id) {
            return a[i];
        }
    }
    return false;
}

function renderSlide(slide) {
    return
}


$(function() {
    // Set Active Slide with Ajax
    $('.activate_link').click(function(event) {
        event.preventDefault();
        $.ajax({
            type: 'GET',
            url: $(this).attr('href'),
            dataType: 'json',
            data: '',
            success: function(data) {
                $('.activeline').removeClass('activeline').addClass('inactiveline');
                $('#item_row_' + data.active).removeClass('inactiveline').addClass('activeline');
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
    ko.applyBindings(ViewModel);
});
