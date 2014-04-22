/*
 * JavaScript functions for agenda CurrentListOfSpeakersProjectorView
 */

function reloadListOfSpeakers() {
    $.ajax({
        url: '',
        success: function (data) {
            updater.updateProjector(data);
            setTimeout('reloadListOfSpeakers()', 2000);
        },
        dataType: 'json'
        });
}
