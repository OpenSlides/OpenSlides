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
                        return User.findAll().catch(
                            function () {
                                return null;
                            }
                        );
                    },
                }
            });
    }
])

.controller('MediafileListCtrl', [
    '$scope',
    '$http',
    'ngDialog',
    'Mediafile',
    'MediafileForm',
    'User',
    'Projector',
    'ProjectionDefault',
    function($scope, $http, ngDialog, Mediafile, MediafileForm, User, Projector, ProjectionDefault) {
        Mediafile.bindAll({}, $scope, 'mediafiles');
        User.bindAll({}, $scope, 'users');
        $scope.$watch(function() {
            return Projector.lastModified();
        }, function() {
            $scope.projectors = Projector.getAll();
            updatePresentedMediafiles();
        });
        $scope.$watch(function () {
            return Projector.lastModified();
        }, function () {
            var projectiondefault = ProjectionDefault.filter({name: 'mediafiles'})[0];
            if (projectiondefault) {
                $scope.defaultProjectorId = projectiondefault.projector_id;
            }
        });

        function updatePresentedMediafiles () {
            $scope.presentedMediafiles = [];
            Projector.getAll().forEach(function (projector) {
                var projectorElements = _.map(projector.elements, function(element) { return element; });
                var mediaElements = _.filter(projectorElements, function (element) {
                    return element.name === 'mediafiles/mediafile';
                });
                mediaElements.forEach(function (element) {
                    $scope.presentedMediafiles.push(element);
                });
            });
            if ($scope.presentedMediafiles.length) {
                $scope.isMeta = false;
            } else {
                $scope.isMeta = true;
            }
        }

        updatePresentedMediafiles();

        // setup table sorting
        $scope.sortColumn = 'title';
        $scope.filterPresent = '';
        $scope.reverse = false;

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
        };

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

        // ** PDF presentation functions **/
        // show document on projector
        $scope.showMediafile = function (projectorId, mediafile) {
            var isProjectedId = mediafile.isProjected();
            if (isProjectedId > 0) {
                $http.post('/rest/core/projector/' + isProjectedId + '/clear_elements/');
            }
            if (isProjectedId != projectorId) {
                var postUrl = '/rest/core/projector/' + projectorId + '/prune_elements/';
                var data = [{
                        name: 'mediafiles/mediafile',
                        id: mediafile.id,
                        numPages: mediafile.mediafile.pages,
                        page: 1,
                        scale: 'page-fit',
                        rotate: 0,
                        visible: true,
                        playing: false,
                        fullscreen: mediafile.is_pdf
                }];
                $http.post(postUrl, data);
            }
        };

        var sendMediafileCommand = function (mediafile, data) {
            var updateData = _.extend({}, mediafile);
            _.extend(updateData, data);
            var postData = {};
            postData[mediafile.uuid] = updateData;

            // Find Projector where the mediafile is projected
            $scope.projectors.forEach(function (projector) {
                if (_.find(projector.elements, function (e) {return e.uuid == mediafile.uuid;})) {
                    $http.post('/rest/core/projector/' + projector.id + '/update_elements/', postData);
                }
            });
        };

        $scope.getTitle = function (mediafile) {
            return Mediafile.get(mediafile.id).title;
        };

        $scope.getType = function(presentedMediafile) {
            var mediafile = Mediafile.get(presentedMediafile.id);
            return mediafile.is_pdf ? 'pdf' : mediafile.is_image ? 'image' : 'video';
        };

        $scope.mediafileGoToPage = function (mediafile, page) {
            if (parseInt(page) > 0) {
                sendMediafileCommand(
                    mediafile,
                    {page: parseInt(page)}
                );
            }
        };
        $scope.mediafileZoomIn = function (mediafile) {
            var scale = 1;
            if (parseFloat(mediafile.scale)) {
                scale = mediafile.scale;
            }
            sendMediafileCommand(
                mediafile,
                {scale: scale + 0.2}
            );
        };
        $scope.mediafileFit = function (mediafile) {
            sendMediafileCommand(
                mediafile,
                {scale: 'page-fit'}
            );
        };
        $scope.mediafileZoomOut = function (mediafile) {
            var scale = 1;
            if (parseFloat(mediafile.scale)) {
                scale = mediafile.scale;
            }
            sendMediafileCommand(
                mediafile,
                {scale: scale - 0.2}
            );
        };
        $scope.mediafileChangePage = function(mediafile, pageNum) {
            sendMediafileCommand(
                mediafile,
                {pageToDisplay: pageNum}
            );
        };
        $scope.mediafileRotate = function (mediafile) {
            var rotation = mediafile.rotate;
            if (rotation === 270) {
                rotation = 0;
            } else {
                rotation = rotation + 90;
            }
            sendMediafileCommand(
                mediafile,
                {rotate: rotation}
            );
        };
        $scope.mediafileScroll = function(scroll) {
            var mediafileElement = getCurrentlyPresentedMediafile();
            sendMediafileCommand({
                scroll: scroll
            });
        };
        var setFullscreen = function(fullscreen) {
            sendMediafileCommand({
                fullscreen: fullscreen
            });
        };
        $scope.mediafileToggleFullscreen = function() {
            var mediafileElement = getCurrentlyPresentedMediafile();
            setFullscreen(!mediafileElement.fullscreen);
        };
        $scope.setPlaying = function(playing) {
            sendMediafileCommand({
                playing: playing
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
        };
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
        };
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
                    data: {mediafile: mediafile.newFile, title: mediafile.title, uploader_id: mediafile.uploader_id, private: mediafile.private}
                });

            }
        };
    }
])

.filter('privateFilter', [
    '$filter',
    'operator',
    function ($filter, operator) {
        return function (array) {
            if (operator.hasPerms('mediafiles.can_see_private')) {
                return array;
            }
            return Array.prototype.filter.call(array, function (item) {
                return !item.private;
            });
        };
    }
]);

}());
