function update_clock()
{
    var currentTime = new Date();
    var currentHours = currentTime.getHours();
    var currentMinutes = currentTime.getMinutes();
    currentHours = normalise(currentHours);
    currentMinutes = normalise(currentMinutes);
    $('#currentTime').html(currentHours + ':' + currentMinutes);
    setTimeout('update_clock()', 200);
}

update_clock();
function normalise(i)
{
    if(i < 10)
    {
        i = "0" + i;
    }
    return i;
}
