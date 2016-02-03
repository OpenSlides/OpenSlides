(function () {

'use strict';

angular.module('OpenSlidesApp.mediafiles', [])

.factory('Mediafile', [
    'DS',
    'jsDataModel',
    function(DS, jsDataModel) {
        var name = 'mediafiles/mediafile';
        return DS.defineResource({
            name: name,
            useClass: jsDataModel,
            methods: {
                getResourceName: function () {
                    return name;
                }
            },
            computed: {
                is_presentable: ['filetype', function (filetype) {
                    var PRESENTABLE_FILE_TYPES = ['application/pdf'];
                    return _.contains(PRESENTABLE_FILE_TYPES, filetype);
                }],
                mediafileUrl: [function () {
                    return this.media_url_prefix + this.mediafile.name;
                }],
                filename: [function () {
                    var filename = this.mediafile.name;
                    return /\/(.+?)$/.exec(filename)[1];
                }],
                filetype: [function () {
                    return this.mediafile.type;
                }],
                title_or_filename: ['title', 'mediafile', function (title) {
                    return title || this.filename;
                }]
            },
            relations: {
                belongsTo: {
                    'users/user': {
                        localField: 'uploader',
                        localKey: 'uploader_id',
                    }
                }
            }
        });
    }
])

.run(['Mediafile', function(Mediafile) {}]);

}());
