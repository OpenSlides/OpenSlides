$(document).ready(function () {
    var aTable = $('#dataTable').DataTable();


    $("#Present").click(function () {
        if ($("#Present").is(":checked")) {
            aTable.fnFilter('anwesend', 0, true, false);
            console.log("click")
        } else {
            aTable.fnFilter('.*', 0, true, false);
        }
    });

});
