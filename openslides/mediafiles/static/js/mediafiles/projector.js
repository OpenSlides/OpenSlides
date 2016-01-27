(function () {

'use strict';

angular.module('OpenSlidesApp.mediafiles.projector', ['OpenSlidesApp.mediafiles'])

.config([
    'slidesProvider',
    function(slidesProvider) {
        slidesProvider.registerSlide('mediafiles/mediafile', {
            template: 'static/templates/mediafiles/slide_mediafile.html'
        });
    }
])

.controller('SlideMediafileCtrl', [
    '$scope',
    'Mediafile',
    function($scope, Mediafile) {
        // load mediafile object
        var mediafile = Mediafile.find($scope.element.id);
        mediafile.then(function(mediafile) {
            $scope.pdfName = mediafile.title;
            $scope.pdfUrl = mediafile.mediafileUrl;
        })
        // get page from projector
        $scope.page = $scope.element.page;
        $scope.scroll = 0;

        function updateScale() {
            if($scope.element.pageFit) {
                $scope.scale = 'page-fit';
            } else {
                $scope.scale = $scope.element.scale;
            }
        }

        $scope.$watch(function() {
            return $scope.element.scale;
        }, updateScale);

        updateScale();

        $scope.getNavStyle = function(scroll) {
            if (scroll > 100) {
                return 'pdf-controls fixed';
            } else {
                return 'pdf-controls';
            }
        };

        $scope.onLoad = function() {
            $scope.loading = '';
        };
    }
]);

})();
