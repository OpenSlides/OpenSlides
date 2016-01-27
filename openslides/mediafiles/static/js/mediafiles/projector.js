(function () {

'use strict';

angular.module('OpenSlidesApp.mediafiles.projector', ['OpenSlidesApp.mediafiles']);

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

        var id = $scope.element.mediafile;
        $scope.page = $scope.element.page;
    
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
    
        var mediafile = Mediafile.find(id);
        mediafile.then(function(mediafile) {
            $scope.pdfName = mediafile.title;
            $scope.pdfUrl = mediafile.mediafileUrl;
        })
    
        $scope.scroll = 0;
    
        $scope.getNavStyle = function(scroll) {
            if(scroll > 100) return 'pdf-controls fixed';
            else return 'pdf-controls';
        };
    
        $scope.onError = function(error) {
            console.log(error);
        };
    
        $scope.onLoad = function() {
            $scope.loading = '';
        };
    
        $scope.onProgress = function(progress) {
            console.log(progress);
        };
    }
]);

})();
