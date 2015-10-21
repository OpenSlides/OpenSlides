(function () {

'use strict';

angular.module('OpenSlidesApp.mediafiles', [])

.factory('Mediafile', ['DS', function(DS) {
    return DS.defineResource({
        name: 'mediafiles/mediafile',
        computed: {
            is_presentable: ['filetype', function (filetype) {
                var PRESENTABLE_FILE_TYPES = ['application/pdf'];
                return _.contains(PRESENTABLE_FILE_TYPES, filetype);
            }],
            filename: [function () {
                var filename = this.mediafile.name;
                return /\/(.+?)$/.exec(filename)[1];
            }],
            title_or_filename: ['title', 'mediafile', function (title) {
                return title || this.filename;
            }]
        }
    });
}])

.run(['Mediafile', function(Mediafile) {}]);

}());
