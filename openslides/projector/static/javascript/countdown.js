function update_countdown() {
    var time = new Date().getTime() / 1000;
    var seconds;
    var minutes;
    var secs;
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
    if (seconds > 60 && seconds < 3600 )
    {
        minutes = Math.floor(seconds / 60); 
        secs = Math.floor(seconds -  (minutes* 60));
       
       minutes = normalise(minutes);
       secs = normalise(secs);
        
       seconds =  minutes+ ":" + secs;
   }
   else
   {
       seconds = Math.max(0,Math.floor(seconds));
   }
   if(seconds >= 3600)
   {
       hours = Math.floor(seconds / 3600);
       
       minutes = Math.floor((seconds - (hours * 3600)) / 60);

       secs = Math.floor(seconds -  (hours * 3600) - (minutes * 60) );

       hours = normalise(hours);
       minutes = normalise(minutes);
       secs = normalise(secs);
       
       seconds = hours + ":"+ minutes + ":" + secs;
       
   }
   
    if (seconds !== undefined) {
        $('#overlay_countdown_inner').html(seconds);
        
    }
    setTimeout('update_countdown()', 200);
}
update_countdown();

function normalise(i)
{
    if(i < 10)
    {
        i = "0" + i;
    }
    return i;
}

