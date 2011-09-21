function presentation_reload() {
    if ($('#config > #ajax').html() == 'on') {
        $.ajax({
            type: 'GET',
            url: '/beamer/',
            dataType: 'json',
            data: '',
            success: function(data) {
                $('#content').html(data.content);
                document.title = data.title;
                $('#currentTime').html(data.time);
                $('#content').clearQueue();
                $('#content').animate({'font-size': data.bigger + '%'}, 200);
                $('#content li').css({'font-size': data.bigger + '%'}, 200);
                $('#content #sidebar').css({'font-size': '16px'}, 0);
                $('#content').animate({'margin-top': data.up + 'em'}, 200);
                setTimeout("presentation_reload()", 500);
            },
            error: function () {
                $('#currentTime').addClass('ajax_error');
            }
        });
    }
}

function switchajax() {
    if ($('#config > #ajax').html() == 'on') {
        $('#config > #ajax').html('off');
        $('#ajaxswitcher').html('<a href="#" onClick="switchajax()">Ajax Anschalten</a>');
    } else {
        $('#config > #ajax').html('on');
        $('#ajaxswitcher').html('<a href="#" onClick="switchajax()">Ajax Ausschalten</a>');
    }
}

$(document).ready(function() {
    switchajax();
    switchajax();
    presentation_reload();
});
