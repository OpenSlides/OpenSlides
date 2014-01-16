/*
 * JavaScript functions for countdown.
 *
 */


function update_countdown() {
    var time = projector.get_server_time().getTime() / 1000;
    var totalseconds;
    var min;
    var sec;
    var negative;
    var start = projector.projector_countdown_start;
    var duration = projector.projector_countdown_duration;
    var pause = projector.projector_countdown_pause;

    switch (projector.projector_countdown_state) {
        case 'active':
            totalseconds = start + duration - time;
            break;
        case 'paused':
            totalseconds = start + duration - pause;
            break;
        case 'inactive':
            totalseconds = duration;
            break;
    }
    totalseconds = Math.floor(totalseconds);
    if (totalseconds < 0 ) {
        totalseconds = -totalseconds;
        negative = true;
    }
    min = Math.floor(totalseconds / 60);
    sec = Math.floor(totalseconds - (min * 60));
    if (sec < 10) {
        sec = "0" + sec;
    }
    if (negative) {
        min = "-" + min;
        $('#overlay_countdown_inner').addClass('negative');
    }
    else {
        $('#overlay_countdown_inner').removeClass('negative');
    }
    if(totalseconds !== undefined) {
        $('#overlay_countdown_inner').html(min + ":" + sec);

    }
}
setInterval('update_countdown()', 200);
