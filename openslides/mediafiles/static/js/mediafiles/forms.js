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
    'operator',
    'User',
    function (gettextCatalog, operator, User) {
        return {
            // ngDialog for mediafile form
            getDialog: function (mediafile) {
                var dialog = {
                    className: 'ngdialog-theme-default wide-form',
                    closeByEscape: false,
                    closeByDocument: false,
                };
                if (mediafile) {
                    dialog.template = 'static/templates/mediafiles/mediafile-form.html';
                    dialog.controller = 'MediafileUpdateCtrl';
                    dialog.resolve = {
                        mediafileId: function () {return mediafile ? mediafile.id : void 0;}
                    };
                } else {
                    dialog.template = 'static/templates/mediafiles/mediafile-upload-form.html';
                    dialog.controller = 'MediafileUploadCtrl';
                }
                return dialog;
            },
            getFormFields: function () {
                return [
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
