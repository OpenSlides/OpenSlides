angular.module('OpenSlidesApp.mediafiles', [])

.factory('Mediafile', function(DS) {
    return DS.defineResource({
        name: 'mediafiles/mediafile',
        endpoint: '/rest/mediafiles/mediafile/'
    });
})

.run(function(Mediafile) {});


angular.module('OpenSlidesApp.mediafiles.site', ['OpenSlidesApp.mediafiles'])

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
        .state('mediafiles.mediafile.detail.update', {
            views: {
                '@mediafiles.mediafile': {}
            }
        });
})

.controller('MediafileListCtrl', function($scope, $http, Mediafile) {
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

.controller('MediafileCreateCtrl', function($scope, $state, Mediafile) {
    $scope.mediafile = {};
    $scope.save = function(mediafile) {
        Mediafile.create(mediafile).then(
            function(success) {
                $state.go('mediafiles.mediafile.list');
            }
        );
    };
})

.controller('MediafileUpdateCtrl', function($scope, $state, Mediafile, mediafile) {
    $scope.mediafile = mediafile;
    $scope.save = function (mediafile) {
        Mediafile.save(mediafile).then(
            function(success) {
                $state.go('mediafiles.mediafile.list');
            }
        );
    };
});


angular.module('OpenSlidesApp.mediafiles.projector', ['OpenSlidesApp.mediafiles']);
