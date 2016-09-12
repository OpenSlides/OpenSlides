(function () {

'use strict';

// The core module for the OpenSlides projector
angular.module('OpenSlidesApp.core.projector', ['OpenSlidesApp.core'])

// Can be used to find out if the projector or the side is used
.constant('REALM', 'projector')

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
                            console.error("Unknown slide: " + element.name);
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
    '$location',
    'loadGlobalData',
    'Projector',
    'ProjectorID',
    function($scope, $location, loadGlobalData, Projector, ProjectorID) {
        loadGlobalData();

        $scope.projector_id = ProjectorID();
        $scope.error = '';

        // watch for changes in Projector
        $scope.$watch(function () {
            return Projector.lastModified($scope.projector_id);
        }, function () {
            Projector.find($scope.projector_id).then(function (projector) {
                $scope.projectorWidth = projector.width;
                $scope.projectorHeight = projector.height;
                $scope.recalculateIframe();
            }, function (error) {
                if (error.status == 404) {
                    $scope.error = 'Projector not found.';
                } else if (error.status == 403) {
                    $scope.error = 'You have to login to see the projector.';
                }
            });
        });

        // recalculate the actual Iframesize and scale
        $scope.recalculateIframe = function () {
            var scale_width = window.innerWidth / $scope.projectorWidth;
            var scale_height = window.innerHeight / $scope.projectorHeight;

            // Iframe has to be scaled down or saceUp is activated
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
    '$location',
    'Projector',
    'slides',
    'Config',
    'ProjectorID',
    function($scope, $location, Projector, slides, Config, ProjectorID) {
        var projector_id = ProjectorID();

        $scope.broadcast = 0;

        var setElements = function (projector) {
            $scope.elements = [];
            _.forEach(slides.getElements(projector), function(element) {
                if (!element.error) {
                    $scope.elements.push(element);
                } else {
                    console.error("Error for slide " + element.name + ": " + element.error);
                }
            });
        };

        $scope.$watch(function () {
            return Projector.lastModified(projector_id);
        }, function () {
            $scope.projector = Projector.get(projector_id);
            if ($scope.projector) {
                if ($scope.broadcast === 0) {
                    setElements($scope.projector);
                    $scope.blank = $scope.projector.blank;
                }
            } else {
                // Blank projector on error
                $scope.elements = [];
                $scope.projector = {
                    scroll: 0,
                    scale: 0,
                    blank: true
                };
            }
        });

        $scope.$watch(function () {
            return Config.lastModified('projector_broadcast');
        }, function () {
            Config.findAll().then(function () {
                var bc = Config.get('projector_broadcast').value;
                if ($scope.broadcast != bc) {
                    $scope.broadcast = bc;
                    if ($scope.broadcastDeregister) {
                        // revert to original $scope.projector
                        $scope.broadcastDeregister();
                        $scope.broadcastDeregister = null;
                        setElements($scope.projector);
                        $scope.blank = $scope.projector.blank;
                    }
                }

                if ($scope.broadcast > 0) {
                    // get elements and blank from broadcast projector
                    $scope.broadcastDeregister = $scope.$watch(function () {
                        return Projector.lastModified($scope.broadcast);
                    }, function () {
                        if ($scope.broadcast > 0) {
                            // var broadcast_projector = Projector.get($scope.broadcast);
                            Projector.find($scope.broadcast).then(function (broadcast_projector) {
                                setElements(broadcast_projector);
                                $scope.blank = broadcast_projector.blank;
                            });
                        }
                    });
                }
            });
        });

        $scope.$on('$destroy', function() {
            if ($scope.broadcastDeregister) {
                $scope.broadcastDeregister();
                $scope.broadcastDeregister = null;
            }
        });
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
        $scope.running = $scope.element.running;
        $scope.visible = $scope.element.visible;
        $scope.selected = $scope.element.selected;
        $scope.index = $scope.element.index;
        $scope.description = $scope.element.description;
        // start interval timer if countdown status is running
        var interval;
        if ($scope.running) {
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
        $scope.selected = $scope.element.selected;
        $scope.type = $scope.element.type;
    }
]);

}());
