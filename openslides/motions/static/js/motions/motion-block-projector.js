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

        // Returns a shortened motion title. If the title is longer then maxLength, it is
        // split at the last whitespace that is in maxLength. Three dots are added then.
        $scope.getShortTitle = function (motion) {
            var maxLength = 40;
            var title = motion.getTitle();

            if (title.length <= maxLength) {
                return title;
            }

            // Find last whitespace that is before maxLength. Split the title
            // there and append dots.
            var whitespaceIndex = -1;
            for (var i = 0; i < maxLength+1; i++) {
                if (title[i] === ' ') {
                    whitespaceIndex = i;
                }
            }

            if (whitespaceIndex === -1) {
                // just one long word.. split it :/
                return title.substr(0, maxLength) + '...';
            } else {
                return title.substr(0, whitespaceIndex) + '...';
            }
        };
    }
]);

}());
