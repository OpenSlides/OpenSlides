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
                setTimeout("presentation_reload()",500);

            },
            error: function () {
                alert("Ajax Error");
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
