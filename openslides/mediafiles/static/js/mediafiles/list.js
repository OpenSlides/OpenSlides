(function () {

'use strict';

angular.module('OpenSlidesApp.mediafiles.list', [
    'gettext',
    'ngDialog',
    'OpenSlidesApp.mediafiles.forms',
    'OpenSlidesApp.mediafiles.resources',
    //TODO: Add deps for operator, User, Projector, ProjectionDefault, osTableFilter, osTableSort,
])

.controller('MediafileListCtrl', [
    '$http',
    '$scope',
    'gettext',
    'ngDialog',
    'osTableFilter',
    'osTableSort',
    'ProjectionDefault',
    'Projector',
    'User',
    'Mediafile',
    'MediafileForm',
    'Logos',
    'Messaging',
    function ($http, $scope, gettext, ngDialog, osTableFilter, osTableSort,
              ProjectionDefault, Projector, User, Mediafile, MediafileForm, Logos, Messaging) {
        $scope.$watch(function () {
            return Mediafile.lastModified();
        }, function () {
            $scope.mediafiles = _.orderBy(Mediafile.getAll(), ['title']);
        });
        User.bindAll({}, $scope, 'users');
        $scope.$watch(function() {
            return Projector.lastModified();
        }, function() {
            $scope.projectors = Projector.getAll();
            updatePresentedMediafiles();
            var projectiondefault = ProjectionDefault.filter({name: 'mediafiles'})[0];
            if (projectiondefault) {
                $scope.defaultProjectorId = projectiondefault.projector_id;
            }
        });

        $scope.onFilesDropped = function (files, event) {
            // Don't process multiple files
            if (files.length != 1) {
                return;
            }

            var mediafile = {
                getFile: function () {
                    return files[0];
                }
            };

            $scope.uploadFile(mediafile);
        };

        // upload and save mediafile
        $scope.uploadFile = function (mediafile) {
            var progressMessageId = -1;
            MediafileForm.uploadFile(mediafile).then(
                function (success) {
                    if (progressMessageId !== -1) {
                        Messaging.deleteMessage(progressMessageId);
                    }

                    Messaging.addMessage('The file is uploaded successfully.', 'success',  {
                        timeout: 3000
                    });
                },
                function (error) {
                    Messaging.addMessage('Error while uploading: ' + error.data.title, 'error',  {
                        timeout: 3000
                    });
                },
                function (progress) {
                    var percentage = parseInt(100.0 * progress.loaded / progress.total);
                    if (progressMessageId === -1) {
                        progressMessageId = Messaging.addMessage(
                            '[' + percentage + '% ] The file is uploading...',
                            'info'
                        );
                    } else {
                        Messaging.createOrEditMessage(
                            progressMessageId,
                            '[' + percentage + '% ] The file is uploading...',
                            'info'
                        );
                    }
                }
            );
        };

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

        // Filtering
        $scope.filter = osTableFilter.createInstance('MediafilesTableFilter');

        if (!$scope.filter.existsStorageEntry()) {
            $scope.filter.booleanFilters = {
                isHidden: {
                    value: undefined,
                    displayName: gettext('Hidden'),
                    choiceYes: gettext('Is hidden'),
                    choiceNo: gettext('Is not hidden'),
                    needExtraPermission: true,
                },
                isPdf: {
                    value: undefined,
                    displayName: gettext('Is PDF'),
                    choiceYes: gettext('Is PDF file'),
                    choiceNo: gettext('Is no PDF file'),
                },
            };
        }
        $scope.filter.propertyList = ['title_or_filename'];
        $scope.filter.propertyFunctionList = [
            function (mediafile) {return mediafile.uploader.get_short_name();},
            function (mediafile) {return mediafile.mediafile.type;},
            function (mediafile) {return mediafile.mediafile.name;},
        ];
        // Sorting
        $scope.sort = osTableSort.createInstance('MediafileTableSort');
        if (!$scope.sort.column) {
            $scope.sort.column = 'title_or_filename';
        }
        $scope.sortOptions = [
            {name: 'title_or_filename',
             display_name: gettext('Title')},
            {name: 'mediafile.type',
             display_name: gettext('Type')},
            {name: 'filesize',
             display_name: gettext('File size')},
            {name: 'timestamp',
             display_name: gettext('Upload time')},
            {name: 'uploader.get_short_name()',
             display_name: gettext('Uploaded by')},
        ];

        // pagination
        $scope.currentPage = 1;
        $scope.itemsPerPage = 25;
        $scope.limitBegin = 0;
        $scope.pageChanged = function() {
            $scope.limitBegin = ($scope.currentPage - 1) * $scope.itemsPerPage;
            $scope.gotoTop();
        };

        // open new/edit dialog
        $scope.openDialog = function (mediafile) {
            ngDialog.open(MediafileForm.getDialog(mediafile));
        };

        // *** select mode functions ***
        $scope.isSelectMode = false;
        // check all checkboxes
        $scope.checkAll = function () {
            angular.forEach($scope.mediafiles, function (mediafile) {
                mediafile.selected = $scope.selectedAll;
            });
        };
        // uncheck all checkboxes if SelectMode is closed
        $scope.uncheckAll = function () {
            if (!$scope.isSelectMode) {
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
            $scope.isSelectMode = false;
            $scope.uncheckAll();
        };
        // delete single mediafile
        $scope.delete = function (mediafile) {
            Mediafile.destroy(mediafile.id);
        };

        // ** PDF presentation functions **/
        // show document on projector
        $scope.showMediafile = function (projectorId, mediafile) {
            var isProjectedIds = mediafile.isProjected();
            _.forEach(isProjectedIds, function (id) {
                $http.post('/rest/core/projector/' + id + '/clear_elements/');
            });
            if (_.indexOf(isProjectedIds, projectorId) == -1) {
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
                        fullscreen: mediafile.is_pdf || mediafile.is_image
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

        $scope.getType = function (presentedMediafile) {
            var mediafile = Mediafile.get(presentedMediafile.id);
            return mediafile.is_pdf ? 'pdf' : mediafile.is_image ? 'image' : 'video';
        };

        $scope.mediafileGoToPage = function (mediafile, page) {
            page = parseInt(page);
            if (page > 0 && page <= mediafile.numPages) {
                sendMediafileCommand(
                    mediafile,
                    {page: page}
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
        $scope.mediafileChangePage = function (mediafile, pageNum) {
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
        $scope.mediafileToggleFullscreen = function (mediafile) {
            sendMediafileCommand(
                mediafile,
                {fullscreen: !mediafile.fullscreen}
            );
        };
        $scope.mediafileTogglePlaying = function (mediafile) {
            sendMediafileCommand(
                mediafile,
                {playing: !mediafile.playing}
            );
        };

        /** Logos **/
        $scope.logos = Logos.getAll();
        $scope.toggleLogo = function (mediafile, logo) {
            if (!$scope.hasLogo(mediafile, logo)) {
                Logos.setMediafile(logo.key, mediafile);
            } else {
                Logos.setMediafile(logo.key);
            }
        };
        $scope.hasLogo = function (mediafile, logo) {
            var allUrls = _.map(mediafile.getLogos(), function (logo) {
               return logo.path;
            });
            return _.includes(allUrls, logo.path);
        };
        $scope.hasProjectorHeaderLogo = function (mediafile) {
            return _.some(mediafile.getLogos(), function (logo) {
                return logo.key === 'logo_projector_header';
            });
        };
    }
])

/*
 * Special filter only for mediafile list view.
 */
.filter('hiddenFilter', [
    '$filter',
    'operator',
    function ($filter, operator) {
        return function (array) {
            if (operator.hasPerms('mediafiles.can_see_hidden')) {
                return array;
            }
            return Array.prototype.filter.call(array, function (item) {
                return !item.hidden;
            });
        };
    }
]);

}());
