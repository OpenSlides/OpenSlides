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

// Projector Container Controller
.controller('ProjectorContainerCtrl', [
    '$scope',
    'Config',
    function($scope, Config) {
        // watch for changes in Config
        var last_conf;
        $scope.$watch(function () {
            return Config.lastModified();
        }, function () {
            // With multiprojector, get the resolution from Prjector.get(pk).{width; height}
            if (typeof $scope.config === 'function') {
                var conf = $scope.config('projector_resolution');
                if(!last_conf || last_conf.width != conf.width || last_conf.height != conf.height) {
                    last_conf = conf;
                    $scope.projectorWidth = conf.width;
                    $scope.projectorHeight = conf.height;
                    $scope.recalculateIframe();
                }
            }
        });

        // recalculate the actual Iframesize and scale
        $scope.recalculateIframe = function () {
            var scale_width = window.innerWidth / $scope.projectorWidth;
            var scale_height = window.innerHeight / $scope.projectorHeight;

            if (scale_width > 1 && scale_height > 1) {
                // Iframe fits in full size in the window
                $scope.scale = 1;
                $scope.iframeWidth = $scope.projectorWidth;
                $scope.iframeHeight = $scope.projectorHeight;
            } else {
                // Iframe has to be scaled down
                if (scale_width <= scale_height) {
                    // width is the reference
                    $scope.iframeWidth = window.innerWidth;
                    $scope.scale = scale_width;
                    $scope.iframeHeight = $scope.projectorHeight * scale_width;
                } else {
                    // height is the reference
                    $scope.iframeHeight = window.innerHeight;
                    $scope.scale = scale_height;
                    $scope.iframeWidth = $scope.projectorWidth * scale_height;
                }
            }
        };

        // watch for changes in the windowsize
        $(window).on("resize.doResize", function () {
            $scope.$apply(function() {
                $scope.recalculateIframe();
            });
        });

        $scope.$on("$destroy",function (){
            $(window).off("resize.doResize");
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
