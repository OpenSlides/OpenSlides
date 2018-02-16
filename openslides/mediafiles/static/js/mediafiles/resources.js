(function () {

'use strict';

angular.module('OpenSlidesApp.mediafiles.resources', [
    'gettext',
    'js-data',
    //TODO: Add deps for jsDataModel
])

.factory('Mediafile', [
    'DS',
    'gettext',
    'jsDataModel',
    'Logos',
    'Fonts',
    function (DS, gettext, jsDataModel, Logos, Fonts) {
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
                // return true if a specific relation matches for given searchquery
                // (here: speakers)
                hasSearchResult: function (results) {
                    var mediafile = this;
                    // search for speakers (check if any user.id from already found users matches)
                    return _.some(results, function(result) {
                        if ((result.getResourceName() === "users/user") &&
                                (mediafile.uploader_id === result.id)) {
                            return true;
                        }
                    });
                },
                isUsedAsLogo: function () {
                    var mediafile = this;
                    return _.find(Logos.getAll(), function (logoPlaceholder) {
                        return logoPlaceholder.path === mediafile.mediafileUrl;
                    });
                },
                canBeUsedAsLogo: function () {
                    return this.is_image;
                },
                getLogos: function () {
                    var mediafile = this;
                    return _.filter(Logos.getAll(), function (logoPlaceholder) {
                        return logoPlaceholder.path === mediafile.mediafileUrl;
                    });
                },
                hasLogo: function (logo) {
                    var allUrls = _.map(this.getLogos(), function (logo) {
                       return logo.path;
                    });
                    return _.includes(allUrls, logo.path);
                },
                toggleLogo: function (logo) {
                    if (this.hasLogo(logo)) {
                        Logos.set(logo.key);
                    } else {
                        Logos.set(logo.key, this.mediafileUrl);
                    }
                },
                isUsedAsFont: function () {
                    var mediafile = this;
                    return _.find(Fonts.getAll(), function (font) {
                        return font.path === mediafile.mediafileUrl;
                    });
                },
                canBeUsedAsFont: function () {
                    return this.is_font;
                },
                getFonts: function () {
                    var mediafile = this;
                    return _.filter(Fonts.getAll(), function (font) {
                        return font.path === mediafile.mediafileUrl;
                    });
                },
                hasFont: function (font) {
                    var allUrls = _.map(this.getFonts(), function (font) {
                       return font.path;
                    });
                    return _.includes(allUrls, font.path);
                },
                toggleFont: function (font) {
                    if (this.hasFont(font)) {
                        Fonts.set(font.key);
                    } else {
                        Fonts.set(font.key, this.mediafileUrl);
                    }
                },
            },
            computed: {
                is_pdf: ['filetype', function (filetype) {
                    var PDF_FILE_TYPES = ['application/pdf'];
                    return _.includes(PDF_FILE_TYPES, filetype);
                }],
                is_image: ['filetype', function (filetype) {
                    var IMAGE_FILE_TYPES = ['image/png', 'image/jpeg', 'image/gif'];
                    return _.includes(IMAGE_FILE_TYPES, filetype);
                }],
                is_video: ['filetype', function (filetype) {
                    var VIDEO_FILE_TYPES = [ 'video/quicktime', 'video/mp4', 'video/webm',
                        'video/ogg', 'video/x-flv', 'application/x-mpegURL', 'video/MP2T',
                        'video/3gpp', 'video/x-msvideo', 'video/x-ms-wmv', 'video/x-matroska' ];
                    return _.includes(VIDEO_FILE_TYPES, filetype);
                }],
                is_presentable: ['is_pdf', 'is_image', 'is_video', function (is_pdf, is_image, is_video) {
                    return (is_pdf && !this.mediafile.encrypted) || is_image || is_video;
                }],
                is_font: [function () {
                    var FONT_FILE_EXTENSIONS = ['ttf', 'woff'];
                    var ext = _.last(this.mediafile.name.split('.'));
                    return _.includes(FONT_FILE_EXTENSIONS, ext);
                }],
                mediafileUrl: [function () {
                    return this.media_url_prefix + this.mediafile.name;
                }],
                filename: [function () {
                    var filename = this.mediafile.name;
                    return /\/(.+?)$/.exec(filename)[1];
                }],
                filetype: [function () {
                    return this.mediafile.type || gettext('undefined');
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

.run(['Mediafile', function (Mediafile) {}]);

}());
