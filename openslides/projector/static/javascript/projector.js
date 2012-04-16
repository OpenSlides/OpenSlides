function presentation_reload() {
    if ($('#config > #ajax').html() == 'on') {
        $.ajax({
            type: 'GET',
            url: '/projector/',
            dataType: 'json',
            data: '',
            success: function(data) {
                $('#currentTime').removeClass('ajax_error');
                $('#content').html(data.content);
                document.title = data.title;
                $('#currentTime').html(data.time);
                $('#content').clearQueue();
                $('#content').animate({'font-size': data.bigger + '%'}, 200);
                $('#content li').css({'font-size': data.bigger + '%'}, 200);
                $('#content #sidebar').css({'font-size': '16px'}, 0);
                $('#content').animate({'margin-top': data.up + 'em'}, 200);
                $('#overlays li').remove();
                $.each(data['overlays'], function (index, value){
                    $('#overlays ul').append('<li id="overlay' + value[0] + '">' + value[1] + '</li>');
                });
                setTimeout("presentation_reload()", 500);
            },
            error: function () {
                $('#currentTime').addClass('ajax_error');
                setTimeout("presentation_reload()", 1000);
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

// *** Countdown variables and functions ***
var timer_value;
var timer_is_running=false;
var timer_is_visible=false;
var timerIntervalId;

function resetTimer(value) {
    stopTimer()
    timer_value = value;
    updateTimer();
}
function stopTimer() {
  timer_is_running = false;
  clearInterval(timerIntervalId);
}

function startTimer() {
  timer_is_running = true;
  if (timer_value > 0) {
    timerIntervalId = setInterval("decrementTimer()", 1000);
  }
}
function decrementTimer() {
  timer_value--;
  if (timer_value <= 0) {
    timer_value = 0;
    stopTimer();
  }
  updateTimer();
}
function convertSeconds(s) {
  var m = Math.floor(s / 60);
  s %= 60;
  var h = Math.floor(m / 60);
  m %= 60;
  return (h>0?h+':':'') + (h>0&&m<10?'0':'') + m + ':' + (s<10?'0':'') + s;
}

function updateTimer() {
  if (timer_value >= 0) {
    $("#countdown").html(convertSeconds(timer_value));
  }
}
