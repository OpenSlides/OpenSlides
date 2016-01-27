(function () {

'use strict';

// The core module for the OpenSlides projector
angular.module('OpenSlidesApp.core.projector', ['OpenSlidesApp.core'])

// Provider to register slides in a .config() statement.
.provider('slides', [
    function() {
        var slidesMap = {};

        this.registerSlide = function(name, config) {
            slidesMap[name] = config;
            return this;
        };

        this.$get = function($templateRequest, $q) {
            var self = this;
            return {
                getElements: function(projector) {
                    var elements = [];
                    var factory = this;
                    _.forEach(projector.elements, function(element) {
                        if (element.name in slidesMap) {
                            element.template = slidesMap[element.name].template;
                            elements.push(element);
                        } else {
                            console.log("Unknown slide: " + element.name);
                        }
                    });
                    return elements;
                }
            };
        };
    }
])

.config([
    'slidesProvider',
    function(slidesProvider) {
        slidesProvider.registerSlide('core/customslide', {
            template: 'static/templates/core/slide_customslide.html',
        });

        slidesProvider.registerSlide('core/clock', {
            template: 'static/templates/core/slide_clock.html',
        });

        slidesProvider.registerSlide('core/countdown', {
            template: 'static/templates/core/slide_countdown.html',
        });

        slidesProvider.registerSlide('core/message', {
            template: 'static/templates/core/slide_message.html',
        });
    }
])

.controller('ProjectorCtrl', [
    '$scope',
    'Projector',
    'slides',
    function($scope, Projector, slides) {
        Projector.find(1).then(function() {
            $scope.$watch(function () {
                return Projector.lastModified(1);
            }, function () {
                $scope.elements = [];
                _.forEach(slides.getElements(Projector.get(1)), function(element) {
                    if (!element.error) {
                        $scope.elements.push(element);
                    } else {
                        console.error("Error for slide " + element.name + ": " + element.error);
                    }
                });
                $scope.scroll = -5 * Projector.get(1).scroll;
                $scope.scale = 100 + 20 * Projector.get(1).scale;
            });
        });
    }
])

.controller('SlideCustomSlideCtrl', [
    '$scope',
    'Customslide',
    function($scope, Customslide) {
        // Attention! Each object that is used here has to be dealt on server side.
        // Add it to the coresponding get_requirements method of the ProjectorElement
        // class.
        var id = $scope.element.id;
        Customslide.find(id).then(function(customslide) {
            Customslide.loadRelations(customslide, 'agenda_item');
        });
        Customslide.bindOne(id, $scope, 'customslide');
    }
])

.controller('SlideClockCtrl', [
    '$scope',
    function($scope) {
        // Attention! Each object that is used here has to be dealt on server side.
        // Add it to the coresponding get_requirements method of the ProjectorElement
        // class.
        $scope.servertime = ( Date.now() / 1000 - $scope.serverOffset ) * 1000;
    }
])

.controller('SlideCountdownCtrl', [
    '$scope',
    '$interval',
    function($scope, $interval) {
        // Attention! Each object that is used here has to be dealt on server side.
        // Add it to the coresponding get_requirements method of the ProjectorElement
        // class.
        $scope.seconds = Math.floor( $scope.element.countdown_time - Date.now() / 1000 + $scope.serverOffset );
        $scope.status = $scope.element.status;
        $scope.visible = $scope.element.visible;
        $scope.index = $scope.element.index;
        $scope.description = $scope.element.description;
        // start interval timer if countdown status is running
        var interval;
        if ($scope.status == "running") {
            interval = $interval( function() {
                $scope.seconds = Math.floor( $scope.element.countdown_time - Date.now() / 1000 + $scope.serverOffset );
            }, 1000);
        } else {
             $scope.seconds = $scope.element.countdown_time;
        }
        $scope.$on('$destroy', function() {
            // Cancel the interval if the controller is destroyed
            $interval.cancel(interval);
        });
    }
])

.controller('SlideMessageCtrl', [
    '$scope',
    function($scope) {
        // Attention! Each object that is used here has to be dealt on server side.
        // Add it to the coresponding get_requirements method of the ProjectorElement
        // class.
        $scope.message = $scope.element.message;
        $scope.visible = $scope.element.visible;
    }
]);

}());
