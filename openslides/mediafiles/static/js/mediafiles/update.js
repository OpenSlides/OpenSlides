(function () {

'use strict';

angular.module('OpenSlidesApp.mediafiles.update', [
    'OpenSlidesApp.mediafiles.resources',
    //TODO: Add deps for operator, User
])

.controller('MediafileUpdateCtrl', [
    '$scope',
    'operator',
    'User',
    'Mediafile',
    'mediafileId',
    'MediafileForm',
    'ErrorMessage',
    function ($scope, operator, User, Mediafile, mediafileId, MediafileForm, ErrorMessage) {
        $scope.alert = {};
        $scope.formFields = MediafileForm.getFormFields();

        // set initial values for form model by create deep copy of motion object
        // so list/detail view is not updated while editing
        $scope.model = angular.copy(Mediafile.get(mediafileId));

        // save mediafile
        $scope.save = function (mediafile) {
            // reset title and uploader_id if empty
            if (!mediafile.title) {
                mediafile.title = mediafile.filename;
            }
            if (!mediafile.uploader_id) {
                mediafile.uploader_id = operator.user.id;
            }
            // inject the changed mediafile (copy) object back into DS store
            Mediafile.inject(mediafile);
            // save change mediafile object on server
            Mediafile.save(mediafile).then(
                function (success) {
                    $scope.closeThisDialog();
                },
                function (error) {
                    Mediafile.refresh(mediafile);
                    $scope.alert = ErrorMessage.forAlert(error);
                }
            );
        };
    }
]);

}());
