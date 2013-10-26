function update_countdown() {
    var time = new Date().getTime() / 1000;
    var seconds;
    var minutes_digit;
    var seconds_digit;
    var hours_digit;
    var start = projector.projector_countdown_start;
    var duration = projector.projector_countdown_duration;
    var pause = projector.projector_countdown_pause;
    switch(projector.projector_countdown_state) {
        case 'active':
            seconds = start + duration - time;
            break;
        case 'paused':
            seconds = start + duration - pause;
            break;
        case 'inactive':
            seconds = duration;
            break;
    }
    if(seconds > 60) {
        hours_digit    = Math.floor(seconds / 3600);
        minutes_digit  = Math.floor((seconds - (hours_digit * 3600)) / 60);
        seconds_digit  = Math.floor(seconds - (hours_digit * 3600) - (minutes_digit * 60));
        minutes_digit  = normalise(minutes_digit);
        seconds_digit  = normalise(seconds_digit);
        if(hours_digit > 0) {
            hours_digit  = normalise(hours_digit);
            seconds      = hours_digit + ":" + minutes_digit + ":" + seconds_digit;
        } else {
            seconds = minutes_digit + ":" + seconds_digit;
        }
    } else {
        seconds = Math.max(0, Math.floor(seconds));
    }
    if(seconds !== undefined) {
        $('#overlay_countdown_inner').html(seconds);
    }
    setTimeout('update_countdown()', 200);
}
update_countdown();

function normalise(i) {
    if(i < 10) {
        i = "0" + i;
    }
    return i;
}

