(function () {

'use strict';

angular.module('OpenSlidesApp.motions.motionBlockProjector', [])


// MotionBlock projector elements

.config([
    'slidesProvider',
    function(slidesProvider) {
        slidesProvider.registerSlide('motions/motion-block', {
            template: 'static/templates/motions/slide_motion_block.html',
        });
    }
])

.controller('SlideMotionBlockCtrl', [
    '$scope',
    'Motion',
    'MotionBlock',
    function($scope, Motion, MotionBlock) {
        // Attention! Each object that is used here has to be dealt on server side.
        // Add it to the coresponding get_requirements method of the ProjectorElement
        // class.
        var id = $scope.element.id;
        MotionBlock.bindOne(id, $scope, 'motionBlock');
    }
]);

}());
