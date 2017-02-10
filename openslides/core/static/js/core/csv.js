(function () {

'use strict';

angular.module('OpenSlidesApp.core.csv', [])

.factory('CsvDownload', [
    'Config',
    'FileSaver',
    function (Config, FileSaver) {
        var utf8_BOM = decodeURIComponent('%EF%BB%BF');
        return function (contentRows, filename) {
            var separator = Config.get('general_csv_separator').value;
            var rows = _.map(contentRows, function (row) {
                return row.join(separator);
            });
            var blob = new Blob([utf8_BOM + rows.join('\n')]);
            FileSaver.saveAs(blob, filename);
        };
    }
]);

}());
