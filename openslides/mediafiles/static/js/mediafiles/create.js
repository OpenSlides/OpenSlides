(function () {

'use strict';

angular.module('OpenSlidesApp.mediafiles.create', [
    'OpenSlidesApp.mediafiles.forms',
    //TODO: Add deps for User
])

.controller('MediafileCreateCtrl', [
    '$scope',
    'User',
    'MediafileForm',
    function ($scope, User, MediafileForm) {
        User.bindAll({}, $scope, 'users');
        $scope.mediafile = {};
        $scope.alert = {};
        $scope.users = User.getAll();

        // upload and save mediafile
        $scope.save = function (mediafile) {
            MediafileForm.uploadFile(mediafile).then(
                function (success) {
                    $scope.closeThisDialog();
                },
                function (error) {
                    var message = '';
                    for (var e in error.data) {
                        message += e + ': ' + error.data[e] + ' ';
                    }
                    $scope.alert = {type: 'danger', msg: message, show: true};
                }
            );
        };
    }
]);

}());
