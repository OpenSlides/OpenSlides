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
    'Upload',
    'operator',
    'User',
    function (gettextCatalog, Upload, operator, User) {
        return {
            // ngDialog for mediafile form
            getDialog: function (mediafile) {
                return {
                    template: 'static/templates/mediafiles/mediafile-form.html',
                    controller: (mediafile) ? 'MediafileUpdateCtrl' : 'MediafileCreateCtrl',
                    className: 'ngdialog-theme-default wide-form',
                    closeByEscape: false,
                    closeByDocument: false,
                    resolve: {
                        mediafileId: function () {return mediafile ? mediafile.id : void 0;}
                    },
                };
            },
            // upload selected file (used by create view only)
            uploadFile: function (mediafile) {
                var file = mediafile.getFile();
                if (!mediafile.title) {
                    mediafile.title = file.name;
                }
                if (!mediafile.uploader_id) {
                    mediafile.uploader_id = operator.user.id;
                }
                return Upload.upload({
                    url: '/rest/mediafiles/mediafile/',
                    method: 'POST',
                    data: {mediafile: file, title: mediafile.title, uploader_id: mediafile.uploader_id, hidden: mediafile.hidden}
                });
            },
            getFormFields: function (isCreateForm) {
                return [
                    {
                        key: 'newFile',
                        type: 'file',
                        templateOptions: {
                            label: gettextCatalog.getString('File'),
                            required: true,
                            change: function (model, files, event, rejectedFiles) {
                                var file = files ? files[0] : void 0;
                                model.getFile = function () {
                                    return file;
                                };
                                model.newFile = file ? file.name : void 0;
                            },
                        },
                        hide: !isCreateForm,
                    },
                    {
                        key: 'title',
                        type: 'input',
                        templateOptions: {
                            label: gettextCatalog.getString('Title'),
                        },
                    },
                    {
                        key: 'hidden',
                        type: 'checkbox',
                        templateOptions: {
                            label: gettextCatalog.getString('Hidden'),
                        },
                        hide: !operator.hasPerms('mediafiles.can_see_hidden'),
                    },
                    {
                        key: 'uploader_id',
                        type: 'select-single',
                        templateOptions: {
                            label: gettextCatalog.getString('Uploaded by'),
                            options: User.getAll(),
                            ngOptions: 'option.id as option.full_name for option in to.options',
                            placeholder: gettextCatalog.getString('Select or search a participant ...')
                        },
                        hide: !operator.hasPerms('mediafiles.can_manage')
                    },
                ];

            }
        };
    }
]);

}());
