(function () {

'use strict';

angular.module('OpenSlidesApp.mediafiles.upload', [
    'OpenSlidesApp.mediafiles.forms',
    'ngFileUpload',
])

.controller('MediafileUploadCtrl', [
    '$scope',
    '$q',
    'User',
    'Upload',
    'operator',
    'gettextCatalog',
    'ErrorMessage',
    function ($scope, $q, User, Upload, operator, gettextCatalog, ErrorMessage) {
        User.bindAll({}, $scope, 'users');
        $scope.alert = {};
        $scope.files = [];
        $scope.uploading = false;
        var idCounter = 0; // Used for uniqly identifing each file in $scope.files.

        // Convert bytes to human readable si units.
        var humanFileSize = function (bytes) {
            if(Math.abs(bytes) < 1000) {
                return bytes + ' B';
            }
            var units = ['kB','MB','GB','TB','PB','EB','ZB','YB'];
            var i = -1;
            do {
                bytes /= 1000;
                i++;
            } while(bytes >= 1000 && i < units.length - 1);

            return bytes.toFixed(1) + ' ' + units[i];
        };

        $scope.addFiles = function (files) {
            files = _.map(files, function (file) {
                idCounter += 1;
                // This is a client side representation used for the template
                return {
                    id: idCounter,
                    file: file,
                    title: file.name,
                    hidden: false,
                    uploader_id: operator.user.id,
                    name: file.name,
                    size: file.size,
                    humanSize: humanFileSize(file.size),
                    type: file.type,
                    progress: 0,
                };
            });
            // Add each file, that is not a duplicate to $scope.files
            _.forEach(files, function (file) {
                var duplicate = _.some($scope.files, function (_file) {
                    return file.name === _file.name &&
                        file.size === _file.size &&
                        file.type === _file.type;
                });
                if (!duplicate) {
                    $scope.files.push(file);
                }
            });
        };

        $scope.removeFile = function (id) {
            $scope.files = _.filter($scope.files, function (file) {
                return file.id !== id;
            });
        };

        // Add files via drag and drop
        $scope.$watch('dropFiles', function () {
            if ($scope.dropFiles) {
                $scope.addFiles($scope.dropFiles);
            }
        });

        // upload all files
        $scope.upload = function () {
            $scope.uploading = true;
            var promises = _.map($scope.files, function (file) {
                // clear error
                file.error = void 0;

                // Check, if all necessary fields are set.
                if (!file.title) {
                    file.title = file.file.name;
                }
                if (!file.uploader_id) {
                    file.uploader_id = operator.user.id;
                }

                return Upload.upload({
                    url: '/rest/mediafiles/mediafile/',
                    method: 'POST',
                    data: {
                        mediafile: file.file,
                        title: file.title,
                        uploader_id: file.uploader_id,
                        hidden: file.hidden
                    },
                }).then(
                    function (success) {
                        $scope.removeFile(file.id);
                    },
                    function (error) {
                        file.error = ErrorMessage.forAlert(error).msg;
                        return error;
                    },
                    function (progress) {
                        file.progress = parseInt(100.0 * progress.loaded / progress.total);
                    }
                );
            });

            $q.all(promises).then(function (success) {
                var errors = _.filter(success, function (entry) {
                    return entry;
                });

                if (errors.length) {
                    $scope.uploading = false;
                    var message = gettextCatalog.getString('Some files could not be uploaded');
                    $scope.alert = { type: 'danger', msg: message, show: true };
                } else {
                    $scope.close();
                }
            });
        };

        $scope.clear = function () {
            $scope.uploading = false;
            $scope.files = [];
        };

        $scope.close = function () {
            $scope.closeThisDialog();
        };
    }
])

.run([
    'gettext',
    function (gettext) {
        gettext('Some files could not be uploaded');
    }
]);

}());
