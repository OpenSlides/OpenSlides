(function () {

'use strict';

angular.module('OpenSlidesApp.motions.projector', [
    'OpenSlidesApp.motions',
    'OpenSlidesApp.motions.motionBlockProjector',
])

.config([
    'slidesProvider',
    function(slidesProvider) {
        slidesProvider.registerSlide('motions/motion', {
            template: 'static/templates/motions/slide_motion.html',
        });
    }
])

.controller('SlideMotionCtrl', [
    '$scope',
    'Motion',
    'MotionChangeRecommendation',
    'User',
    function($scope, Motion, MotionChangeRecommendation, User) {
        // Attention! Each object that is used here has to be dealt on server side.
        // Add it to the coresponding get_requirements method of the ProjectorElement
        // class.
        var id = $scope.element.id;
        $scope.mode = $scope.element.mode || 'original';

        Motion.bindOne(id, $scope, 'motion');
        User.bindAll({}, $scope, 'users');
        MotionChangeRecommendation.bindAll({
            where: {
                motion_version_id: {
                    '==': id,
                },
            },
        }, $scope, 'change_recommendations');
    }
]);

}());
