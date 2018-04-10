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

        $scope.$watch(function () {
            return MotionChangeRecommendation.lastModified();
        }, function () {
            $scope.change_recommendations = [];
            $scope.title_change_recommendation = null;
            if ($scope.motion) {
                MotionChangeRecommendation.filter({
                    'where': {'motion_version_id': {'==': $scope.motion.active_version}}
                }).forEach(function(change) {
                    if (change.isTextRecommendation()) {
                        $scope.change_recommendations.push(change);
                    }
                    if (change.isTitleRecommendation()) {
                        $scope.title_change_recommendation = change;
                    }
                });
            }
        });
    }
]);

}());
