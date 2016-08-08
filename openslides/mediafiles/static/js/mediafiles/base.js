(function () {

'use strict';

angular.module('OpenSlidesApp.mediafiles', [])

.factory('Mediafile', [
    'DS',
    'jsDataModel',
    'gettext',
    function(DS, jsDataModel, gettext) {
        var name = 'mediafiles/mediafile';
        return DS.defineResource({
            name: name,
            useClass: jsDataModel,
            verboseName: gettext('Files'),
            verboseNamePlural: gettext('Files'),
            getAllImages: function () {
                var images = [];
                angular.forEach(this.getAll(), function(file) {
                    if (file.is_image) {
                        images.push({title: file.title, value: file.mediafileUrl});
                    }
                });
                return images;
            },
            methods: {
                getResourceName: function () {
                    return name;
                },
                // link name which is shown in search result
                getSearchResultName: function () {
                    return this.title;
                },
                // subtitle of search result
                getSearchResultSubtitle: function () {
                    return "File";
                },
            },
            computed: {
                is_presentable: ['filetype', function (filetype) {
                    var PRESENTABLE_FILE_TYPES = ['application/pdf'];
                    return _.contains(PRESENTABLE_FILE_TYPES, filetype);
                }],
                is_image: ['filetype', function (filetype) {
                    var IMAGE_FILE_TYPES = ['image/png', 'image/jpeg', 'image/gif'];
                    return _.contains(IMAGE_FILE_TYPES, filetype);
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
