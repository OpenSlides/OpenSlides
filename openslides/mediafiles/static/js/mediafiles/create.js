(function () {

'use strict';

angular.module('OpenSlidesApp.mediafiles.create', [
    'OpenSlidesApp.mediafiles.forms',
])

.controller('MediafileCreateCtrl', [
    '$scope',
    'MediafileForm',
    'ErrorMessage',
    function ($scope, MediafileForm, ErrorMessage) {
        $scope.model = {};
        $scope.alert = {};
        $scope.formFields = MediafileForm.getFormFields(true);

        // upload and save mediafile
        $scope.save = function (mediafile) {
            if (typeof mediafile.getFile === 'function') {
                $scope.activeUpload = MediafileForm.uploadFile(mediafile).then(
                    function (success) {
                        $scope.closeThisDialog();
                    },
                    function (error) {
                        $scope.activeUpload = void 0;
                        $scope.alert = ErrorMessage.forAlert(error);
                    },
                    function (progress) {
                        $scope.progress = parseInt(100.0 * progress.loaded / progress.total);
                    }
                );
            }
        };
        $scope.close = function () {
            // TODO: abort() is not a function. But it is documented in the docs.
            // See https://github.com/danialfarid/ng-file-upload/issues/1844
            /*if ($scope.activeUpload) {
                $scope.activeUpload.abort();
            }*/
            $scope.closeThisDialog();
        };
    }
]);

}());
