(function () {

'use strict';

angular.module('OpenSlidesApp.mediafiles.projector', [
    'OpenSlidesApp.mediafiles.resources',
    //TODO: Add deps for slidesProvider
])

.config([
    'slidesProvider',
    function (slidesProvider) {
        slidesProvider.registerSlide('mediafiles/mediafile', {
            template: 'static/templates/mediafiles/slide_mediafile.html'
        });
    }
])

.controller('SlideMediafileCtrl', [
    '$scope',
    '$timeout',
    'Mediafile',
    function ($scope, $timeout, Mediafile) {
        // load mediafile object
        Mediafile.bindOne($scope.element.id, $scope, 'mediafile');

        $scope.showPdf = true;

        // Watch for page changes in the projector element. Adjust the page
        // in the canvas scope, so the viewer can change the size automatically.
        $scope.$watch(function () {
            return $scope.element.page;
        }, function () {
            var canvasScope = angular.element('#pdf-canvas').scope();
            if (canvasScope) {
                canvasScope.pageNum = $scope.element.page;
            }
        });

        // Watch for scale changes. If the scale is changed, reload the pdf
        // viewer by just disable and re-enable it.
        $scope.$watch(function () {
            return $scope.element.scale;
        }, function () {
            $scope.showPdf = false;
            $timeout(function () {
                $scope.showPdf = true;
            }, 1);
        });

        // Allow the elements to render properly
        setTimeout(function() {
            if ($scope.mediafile) {
                if ($scope.mediafile.is_pdf) {
                    $scope.pdfName = $scope.mediafile.title;
                    $scope.pdfUrl = $scope.mediafile.mediafileUrl;
                } else if ($scope.mediafile.is_video) {
                    var player = angular.element.find('#video-player')[0];
                    if ($scope.element.playing) {
                        player.play();
                    } else {
                        player.pause();
                    }
                }
            }
        }, 0);
    }
]);

}());
