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

$(function() {
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
    ko.applyBindings(ViewModel);
});
