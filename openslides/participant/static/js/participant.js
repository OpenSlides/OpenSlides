$(document).ready( function () {
   var aTable = $('#dataTable').DataTable();


$("#Anwesend").click(function() {
if ($("#Anwesend").is(":checked")) {
aTable.fnFilter( 'anwesend', 0, true, false );
    console.log("click")
} else {
aTable.fnFilter('.*', 0, true, false);
}
});

} );