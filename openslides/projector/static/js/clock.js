/*
 * JavaScript functions for clock.
 *
 */

function update_clock() {
    var currentTime = projector.get_server_time()
    var currentHours = currentTime.getHours();
    var currentMinutes = currentTime.getMinutes();
    currentHours = normalise(currentHours);
    currentMinutes = normalise(currentMinutes);
    $('#currentTime').html(currentHours + ':' + currentMinutes);
}

setInterval('update_clock()', 200);

function normalise(i) {
    if (i < 10) {
        i = "0" + i;
    }
    return i;
}
