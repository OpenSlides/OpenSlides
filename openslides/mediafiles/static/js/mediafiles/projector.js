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
        });
    }
]);

})();
