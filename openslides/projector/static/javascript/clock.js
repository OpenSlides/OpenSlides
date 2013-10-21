function update_clock() {
    var currentTime = new Date();
    var currentHours = currentTime.getHours();
    var currentMinutes = currentTime.getMinutes();
    if(currentMinutes < 10)
    {
        currentMinutes = "0" + currentMinutes
    }
    $('#currentTime').html(currentHours + ':' + currentMinutes);
    setTimeout('update_clock()', 200);
}
update_clock();
