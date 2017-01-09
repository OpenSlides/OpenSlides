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
    '$rootScope',
    '$http',
    'Motion',
    'MotionChangeRecommendation',
    'User',
    'Config',
    'Projector',
    '$timeout',
    'ProjectorID',
    function($scope, $rootScope, $http, Motion, MotionChangeRecommendation, User, Config, Projector, $timeout, ProjectorID) {
        // Attention! Each object that is used here has to be dealt on server side.
        // Add it to the coresponding get_requirements method of the ProjectorElement
        // class.
        var id = $scope.element.id;
        var thisProjector = Projector.get(ProjectorID());

        $scope.line = $scope.element.highlightAndScroll;
        $scope.scroll = function () {
            // Prevent getting in an infinite loop by updating only if the value has changed.
            // (if this check is removed this happends: controller loads --> call of $scope.scroll
            // --> same line but scrollRequest --> projector updates --> controller loads --> ... )
            if ($scope.line !== $rootScope.motion_projector_line) {
                // The same line number can occur twice in diff view; we scroll to the first one in this case
                var scrollTop = null;
                $(".line-number-" + $scope.line).each(function() {
                    var top = $(this).offset().top;
                    if (top > 0 && (scrollTop === null || top < scrollTop)) {
                        scrollTop = top;
                    }
                });
                if (scrollTop) {
                    $rootScope.motion_projector_line = $scope.line;
                    var pos = scrollTop + thisProjector.scroll*80;
                    $http.post('/rest/core/projector/' + thisProjector.id + '/set_scroll/', Math.floor(pos/80.0) - 1);
                } else if ($scope.line === 0) {
                    $rootScope.motion_projector_line = $scope.line;
                    $http.post('/rest/core/projector/' + thisProjector.id + '/set_scroll/', 0);
                }
            }
        };

        $scope.mode = $scope.element.mode || 'original';

        Motion.bindOne(id, $scope, 'motion');
        User.bindAll({}, $scope, 'users');
        MotionChangeRecommendation.bindAll({}, $scope, 'change_recommendations');
    }
]);

}());
