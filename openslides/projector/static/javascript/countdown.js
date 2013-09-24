function update_countdown() {
    var time = new Date().getTime() / 1000;
    var seconds;
    var start = projector.projector_countdown_start;
    var duration = projector.projector_countdown_duration;
    var pause = projector.projector_countdown_pause;

    switch (projector.projector_countdown_state) {
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
    if (seconds !== undefined) {
        seconds = Math.max(0, Math.floor(seconds));
        $('#overlay_countdown_inner').html(seconds);
    }
    setTimeout('update_countdown()', 200);
}
update_countdown();
