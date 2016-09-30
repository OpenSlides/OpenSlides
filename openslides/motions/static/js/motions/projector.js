(function () {

'use strict';

angular.module('OpenSlidesApp.motions.projector', ['OpenSlidesApp.motions'])

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
    'User',
    'Config',
    'Projector',
    '$timeout',
    function($scope, $rootScope, $http, Motion, User, Config, Projector, $timeout) {
        // Attention! Each object that is used here has to be dealt on server side.
        // Add it to the coresponding get_requirements method of the ProjectorElement
        // class.
        var id = $scope.element.id;

        $scope.line = $scope.element.highlightAndScroll;

        // get cookie using jQuery
        var getCookie = function (name) {
            var cookieValue = null;
            if (document.cookie && document.cookie !== '') {
                var cookies = document.cookie.split(';');
                for (var i = 0; i < cookies.length; i++) {
                    var cookie = jQuery.trim(cookies[i]);
                    // Does this cookie string begin with the name we want?
                    if (cookie.substring(0, name.length + 1) == (name + '=')) {
                        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                        break;
                    }
                }
            }
            return cookieValue;
        };

        var scrollRequest = function (position) {
            // request with csrf token
            // TODO: Why is the X-CSRFToken not included in the header by default?
            var csrfToken = getCookie('csrftoken');
            var request = {
                method: 'POST',
                url: '/rest/core/projector/1/set_scroll/',
                data: position,
                headers: {
                    'X-CSRFToken': csrfToken
                }
            };
            $http(request);
        };
        $scope.scroll = function () {
            // Prevent getting in an infinite loop by updating only if the value has changed.
            // (if this check is removed this happends: controller loads --> call of $scope.scroll
            // --> same line but scrollRequest --> projector updates --> controller loads --> ... )
            if ($scope.line !== $rootScope.motion_projector_line) {
                // line value has changed
                var lineElement = document.getElementsByName('L' + $scope.line);
                if (lineElement[0]) {
                    $rootScope.motion_projector_line = $scope.line;
                    var pos = lineElement[0].getBoundingClientRect().top + Projector.get(1).scroll*80;
                    scrollRequest(Math.floor(pos/80.0) - 1);
                } else if ($scope.line === 0) {
                    $rootScope.motion_projector_line = $scope.line;
                    scrollRequest(0);
                }
            }
        };

        Motion.bindOne(id, $scope, 'motion');
        User.bindAll({}, $scope, 'users');

    }
]);

}());
