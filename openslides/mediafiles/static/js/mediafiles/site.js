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

.config(function($stateProvider) {
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
                }
            }
        })
        .state('mediafiles.mediafile.create', {})
        .state('mediafiles.mediafile.detail', {
            url: '/{id:int}',
            abstract: true,
            resolve: {
                mediafile: function(Mediafile, $stateParams) {
                    var id = $stateParams.id;
                    var file = Mediafile.find(id);
                    return file;
                }
            },
            template: "<ui-view/>",
        })
        .state('mediafiles.mediafile.detail.update', {
            views: {
                '@mediafiles.mediafile': {}
            }
        });
})

.controller('MediafileListCtrl', function($scope, $http, $timeout, Upload, Mediafile) {
    Mediafile.bindAll({}, $scope, 'mediafiles');

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

    // delete
    $scope.delete = function (mediafile) {
        //TODO: add confirm message
        Mediafile.destroy(mediafile.id).then(
            function(success) {
                //TODO: success message
            }
        );
    };
})

.controller('MediafileCreateCtrl', [
    '$scope',
    '$state',
    '$timeout',
    'operator',
    'Upload',
    function($scope, $state, $timeout, operator, Upload) {
        $scope.mediafile = {};
        $scope.save = uploadFile($timeout, $scope, $state, operator, Upload);
    }
])

.controller('MediafileUpdateCtrl', [
    '$scope',
    '$state',
    '$timeout',
    'operator',
    'Upload',
    'Mediafile',
    'mediafile',
    function($scope, $state, $timeout, operator, Upload, Mediafile, mediafile) {
        $scope.mediafile = mediafile;
        $scope.save = uploadFile($timeout, $scope, $state, operator, Upload, mediafile);
    }
]);

function uploadFile($timeout, $scope, $state, operator, Upload, mediafile) {
    return function(file) {
        file.upload = Upload.upload({
            url: '/rest/mediafiles/mediafile/' + (mediafile ? mediafile.id : ''),
            method: mediafile ? 'PUT' : 'POST',
            data: {mediafile: file.newFile, title: file.title, uploader_id: operator.user.id}
        });

        file.upload.then(function (response) {
            $timeout(function () {
                file.result = response.data;
                $state.go('mediafiles.mediafile.list');
            });
        }, function (response) {
            if (response.status > 0)
                $scope.errorMsg = response.status + ': ' + response.data;
        });
    };
}

}());
