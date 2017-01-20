(function () {

'use strict';

angular.module('OpenSlidesApp.core.csv', [])

.factory('CsvDownload', [
    function () {
        return function (contentRows, element, fileName) {
            if (navigator.msSaveBlob && typeof navigator.msSaveBlob === 'function') {
                // Bad browsers
                var blob = new Blob([contentRows.join('\r\n')]);
                navigator.msSaveBlob(blob, fileName);
            } else { // Good browsers
                // %0A is the url encoded linefeed character. Needed to be
                // percentage encoded for the data url.
                element.href = 'data:text/csv;charset=utf-8,' + contentRows.join('%0A');
                element.download = fileName;
                element.target = '_blank';
            }
        };
    }
]);

}());
