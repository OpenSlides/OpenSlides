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
    'mediafile',
    function ($scope, operator, User, Mediafile, mediafile) {
        User.bindAll({}, $scope, 'users');
        $scope.alert = {};
        $scope.users = User.getAll();

        // set initial values for form model by create deep copy of motion object
        // so list/detail view is not updated while editing
        $scope.mediafile = angular.copy(mediafile);

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
