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

function hideLine(object) {
    if (object == []) {
        return;
    }
    object.hide();
    id = object.children('td.tabledrag-hide').children('input.menu-mlid').attr('value');
    $('.menu-plid[value=\'' + id + '\']').parent().parent().each(function() {
        hideLine($(this));
    });
}


function hideClosedSlides(hide) {
    if (hide) {
        $('#hidelink').attr('title','show');
        $('#hidelink').removeClass('hide').addClass('show');
        $('.close_link.closed').parent().parent().each(function() {
            hideLine($(this));
        });
        hidden = $('#menu-overview tr:hidden').size();
        $('#hiddencount').text(' ' + hidden + ' davon verborgen.');
    } else {
        $('#menu-overview tr').show();
        $('#hidelink').attr('title','hide');
        $('#hidelink').removeClass('show').addClass('hide');
        $('#hiddencount').text('');
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
    // hide closed items
    $('#action_field div').after($('<a id="hidelink" class="hidelink hide" title="hide" href="#"><div></div></a>').click(function () {
        if ($.cookie('Slide.HideClosed') == 1) {
            $.cookie('Slide.HideClosed', 0);
            hideClosedSlides(false);
        } else {
            $.cookie('Slide.HideClosed', 1);
            hideClosedSlides(true);
        }
    }));
    if ($.cookie('Slide.HideClosed') === null) {
        $.cookie('Slide.HideClosed', 0);
    } else if ($.cookie('Slide.HideClosed') == 1) {
        hideClosedSlides(true);
    }

    ko.applyBindings(ViewModel);
});
