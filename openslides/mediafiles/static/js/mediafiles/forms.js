(function () {

'use strict';

angular.module('OpenSlidesApp.mediafiles.forms', [
    'gettext',
    'ngFileUpload',
    'ui.router',
    //TODO: Add deps for operator, User
])

// Service for mediafile form
.factory('MediafileForm', [
    'gettextCatalog',
    '$state',
    'Upload',
    'operator',
    'User',
    function (gettextCatalog, $state, Upload, operator, User) {
        return {
            // ngDialog for mediafile form
            getDialog: function (mediafile) {
                var resolve;
                if (mediafile) {
                    resolve = {
                        mediafile: function(Assignment) {return mediafile;}
                    };
                }
                return {
                    template: 'static/templates/mediafiles/mediafile-form.html',
                    controller: (mediafile) ? 'MediafileUpdateCtrl' : 'MediafileCreateCtrl',
                    className: 'ngdialog-theme-default wide-form',
                    closeByEscape: false,
                    closeByDocument: false,
                    resolve: (resolve) ? resolve : null
                };
            },
            // upload selected file (used by create view only)
            uploadFile: function (mediafile) {
                if (!mediafile.title) {
                    mediafile.title = mediafile.newFile.name;
                }
                if (!mediafile.uploader_id) {
                    mediafile.uploader_id = operator.user.id;
                }
                return Upload.upload({
                    url: '/rest/mediafiles/mediafile/',
                    method: 'POST',
                    data: {mediafile: mediafile.newFile, title: mediafile.title, uploader_id: mediafile.uploader_id, hidden: mediafile.hidden}
                });

            }
        };
    }
]);

}());
