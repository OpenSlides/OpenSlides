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
    'Mediafile',
    function ($scope, Mediafile) {
        // load mediafile object
        Mediafile.bindOne($scope.element.id, $scope, 'mediafile');

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
