(function () {

'use strict';

angular.module('OpenSlidesApp.mediafiles.site', ['ngFileUpload', 'OpenSlidesApp.mediafiles'])

.config([
    'mainMenuProvider',
    'gettext',
    function (mainMenuProvider, gettext) {
        mainMenuProvider.register({
            'ui_sref': 'mediafiles.mediafile.list',
            'img_class': 'paperclip',
            'title': gettext('Files'),
            'weight': 600,
            'perm': 'mediafiles.can_see',
        });
    }
])

.config([
    '$stateProvider',
    function($stateProvider) {
        $stateProvider
            .state('mediafiles', {
                url: '/mediafiles',
                abstract: true,
                template: "<ui-view/>",
            })
            .state('mediafiles.mediafile', {
                abstract: true,
                template: "<ui-view/>",
            })
            .state('mediafiles.mediafile.list', {
                resolve: {
                    mediafiles: function(Mediafile) {
                        return Mediafile.findAll();
                    },
                    users: function(User) {
                        return User.findAll();
                    },
                }
            })
    }
])

.controller('MediafileListCtrl', [
    '$scope',
    '$http',
    'ngDialog',
    'Mediafile',
    'MediafileForm',
    'User',
    function($scope, $http, ngDialog, Mediafile, MediafileForm, User) {
        Mediafile.bindAll({}, $scope, 'mediafiles');
        User.bindAll({}, $scope, 'users');

        // setup table sorting
        $scope.sortColumn = 'title';
        $scope.filterPresent = '';
        $scope.reverse = false;

        function updatePresentedMediafiles() {
            var projectorElements = _.map(Projector.get(1).elements, function(element) { return element });
            $scope.presentedMediafiles = _.filter(projectorElements, function (element) {
                return element.name === 'mediafiles/mediafile';
            });
        }

        $scope.$watch(function() {
           return Projector.get(1).elements;
        }, updatePresentedMediafiles);

        updatePresentedMediafiles();

        // function to sort by clicked column
        $scope.toggleSort = function ( column ) {
            if ( $scope.sortColumn === column ) {
                $scope.reverse = !$scope.reverse;
            }
            $scope.sortColumn = column;
        };
        // define custom search filter string
        $scope.getFilterString = function (mediafile) {
            return [
                mediafile.title,
                mediafile.mediafile.type,
                mediafile.mediafile.name,
                mediafile.uploader.get_short_name()
            ].join(" ");
        }

        // open new/edit dialog
        $scope.openDialog = function (mediafile) {
            ngDialog.open(MediafileForm.getDialog(mediafile));
        };

        // *** delete mode functions ***
        $scope.isDeleteMode = false;
        // check all checkboxes
        $scope.checkAll = function () {
            angular.forEach($scope.mediafiles, function (mediafile) {
                mediafile.selected = $scope.selectedAll;
            });
        };
        // uncheck all checkboxes if isDeleteMode is closed
        $scope.uncheckAll = function () {
            if (!$scope.isDeleteMode) {
                $scope.selectedAll = false;
                angular.forEach($scope.mediafiles, function (mediafile) {
                    mediafile.selected = false;
                });
            }
        };
        // delete all selected mediafiles
        $scope.deleteMultiple = function () {
            angular.forEach($scope.mediafiles, function (mediafile) {
                if (mediafile.selected)
                    Mediafile.destroy(mediafile.id);
            });
            $scope.isDeleteMode = false;
            $scope.uncheckAll();
        };
        // delete single mediafile
        $scope.delete = function (mediafile) {
            Mediafile.destroy(mediafile.id);
        };

        // show document on projector
        $scope.showPdf = function (mediafile) {
            var postUrl,
                data;
            if($scope.presentedMediafiles.length > 0) {
                // update first mediafile, at the moment there should not be more
                var uuid = $scope.presentedMediafiles[0].uuid;
                postUrl = '/rest/core/projector/1/update_elements/';
                data = {};
                data[uuid] = {
                    mediafile: mediafile.id,
                    numPages: mediafile.mediafile.pages,
                    page: 1,
                    pageFit: true,
                    scale: 1,
                    visible: true
                };
            } else {
                postUrl = '/rest/core/projector/1/activate_elements/';
                data = [{
                    name: 'mediafiles/mediafile',
                    visible: true,
                    numPages: mediafile.mediafile.pages,
                    pageFit: true,
                    scale: 1,
                    mediafile: mediafile.id,
                    page: 1
                }];
            }
            $http.post(postUrl, data);
        };

        function sendMediafileCommand(data) {
            var mediafileElement = getCurrentlyPresentedMediafile();
            var updateData = _.extend({}, mediafileElement);
            _.extend(updateData, data);
            var postData = {};
            postData[mediafileElement.uuid] = updateData;
            $http.post('/rest/core/projector/1/update_elements/', postData);
        }

        function getCurrentlyPresentedMediafile() {
            return $scope.presentedMediafiles[0];
        }

        $scope.mediafileGoPrevious = function () {
            var mediafileElement = getCurrentlyPresentedMediafile();
            if (mediafileElement.page <= 1) {
                return;
            }
            sendMediafileCommand({
                page: parseInt(mediafileElement.page) - 1
            });
        };
        $scope.mediafileGoNext = function () {
            var mediafileElement = getCurrentlyPresentedMediafile();
            if (mediafileElement.page >= mediafileElement.numPages) {
                return;
            }
            sendMediafileCommand({
                page: parseInt(mediafileElement.page) + 1
            });
        };
        $scope.mediafileZoomIn = function () {
            var mediafileElement = getCurrentlyPresentedMediafile();
            sendMediafileCommand({
                pageFit: false,
                scale: parseFloat(mediafileElement.scale) + 0.2
            });
        };
        $scope.mediafileFit = function () {
            sendMediafileCommand({
                pageFit: true
            });
        };
        $scope.mediafileZoomOut = function () {
            var mediafileElement = getCurrentlyPresentedMediafile();
            sendMediafileCommand({
                pageFit: false,
                scale: parseFloat(mediafileElement.scale) - 0.2
            });
        };
        $scope.mediafileChangePage = function(pageNum) {
            sendMediafileCommand({
                pageToDisplay: pageNum
            });
        };
        $scope.mediafileRotate = function () {
            var rotation;
            var currentRotation = $scope.mediafile.rotation;
            if (currentRotation === 0) {
                rotation = 90;
            } else if (currentRotation === 90) {
                rotation = 180;
            } else if (currentRotation === 180) {
                rotation = 270;
            } else {
                rotation = 0;
            }
            sendMediafileCommand({
                rotation: rotation
            });
        };
    }
])

.controller('MediafileCreateCtrl', [
    '$scope',
    'MediafileForm',
    'User',
    function($scope, MediafileForm, User) {
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
        }
    }
])

.controller('MediafileUpdateCtrl', [
    '$scope',
    'operator',
    'Mediafile',
    'User',
    'mediafile',
    function($scope, operator, Mediafile, User, mediafile) {
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
            Mediafile.save(mediafile, { method: 'PATCH' }).then(
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
        }
    }
])

// Service for mediafile form
.factory('MediafileForm', [
    '$state',
    'operator',
    'Upload',
    'gettextCatalog',
    'User',
    function ($state, operator, Upload, gettextCatalog, User) {
        return {
            // ngDialog for mediafile form
            getDialog: function (mediafile) {
                if (mediafile) {
                    var resolve = {
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
                }
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
                    data: {mediafile: mediafile.newFile, title: mediafile.title, uploader_id: mediafile.uploader_id}
                });

            }
        };
    }
]);

}());
