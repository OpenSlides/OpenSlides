(function () {

'use strict';

// The core module for the OpenSlides projector
angular.module('OpenSlidesApp.core.projector', ['OpenSlidesApp.core'])

// Can be used to find out if the projector or the side is used
.constant('REALM', 'projector')

.run([
    'autoupdate',
    function (autoupdate) {
        autoupdate.newConnect();
    }
])

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

        slidesProvider.registerSlide('core/projectormessage', {
            template: 'static/templates/core/slide_message.html',
        });
    }
])

.controller('LanguageCtrl', [
    '$scope',
    'Languages',
    'Config',
    'ProjectorID',
    function ($scope, Languages, Config, ProjectorID) {
        // for the dynamic title
        $scope.projectorId = ProjectorID();

        $scope.$watch(function () {
            return Config.lastModified('projector_language');
        }, function () {
            var lang = Config.get('projector_language');
            if (!lang || lang.value == 'browser') {
                $scope.selectedLanguage = Languages.getBrowserLanguage();
            } else {
                $scope.selectedLanguage = lang.value;
            }
            Languages.setCurrentLanguage($scope.selectedLanguage);
        });
    }
])

// Projector Container Controller
.controller('ProjectorContainerCtrl', [
    '$scope',
    '$location',
    'gettext',
    'Projector',
    function($scope, $location, gettext, Projector) {
        $scope.error = '';

        // watch for changes in Projector
        $scope.$watch(function () {
            return Projector.lastModified($scope.projectorId);
        }, function () {
            var projector = Projector.get($scope.projectorId);
            if (projector) {
                $scope.error = '';
                $scope.projectorWidth = projector.width;
                $scope.projectorHeight = projector.height;
                $scope.recalculateIframe();
            } else {
                $scope.error = gettext('Can not open the projector.');
            }
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
    '$timeout',
    'Projector',
    'slides',
    'Config',
    'ProjectorID',
    function($scope, $location, $timeout, Projector, slides, Config, ProjectorID) {
        var projectorId = ProjectorID();

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

        // This function scrolls the projector smoothly. It scrolls is steps calling each
        // step with a little timeout.
        var STEPS = 5;
        $scope.scroll = 0;
        var setScroll = function (scroll) {
            scroll = -80 * scroll;
            if ($scope.scrollTimeout) {
                $timeout.cancel($scope.scrollTimeout);
            }
            var oldScroll = $scope.scroll;
            var diff = scroll - oldScroll;
            var count = 0;
            if (scroll !== oldScroll) {
                var scrollFunction = function () {
                    $scope.scroll += diff/STEPS;
                    count++;
                    if (count < STEPS) {
                        $scope.scrollTimeout = $timeout(scrollFunction, 1);
                    }
                };
                scrollFunction();
            }
        };

        $scope.$watch(function () {
            return Projector.lastModified(projectorId);
        }, function () {
            $scope.projector = Projector.get(projectorId);
            if ($scope.projector) {
                if ($scope.broadcast === 0) {
                    setElements($scope.projector);
                    $scope.blank = $scope.projector.blank;
                }
                setScroll($scope.projector.scroll);
            } else {
                // Blank projector on error
                $scope.elements = [];
                $scope.projector = {
                    scale: 0,
                    blank: true
                };
                setScroll(0);
            }
        });

        $scope.$watch(function () {
            return Config.lastModified('projector_broadcast');
        }, function () {
            var bc = Config.get('projector_broadcast');
            if (bc) {
                if ($scope.broadcast != bc.value) {
                    $scope.broadcast = bc.value;
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
                            var broadcast_projector = Projector.get($scope.broadcast);
                            if (broadcast_projector) {
                                setElements(broadcast_projector);
                                $scope.blank = broadcast_projector.blank;
                            }
                        }
                    });
                }
            }
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
    '$interval',
    function($scope, $interval) {
        // Attention! Each object that is used here has to be dealt on server side.
        // Add it to the coresponding get_requirements method of the ProjectorElement
        // class.
        $scope.servertime = ( Date.now() / 1000 - $scope.serverOffset ) * 1000;
        var interval = $interval(function () {
            $scope.servertime = ( Date.now() / 1000 - $scope.serverOffset ) * 1000;
        }, 30000); // Update the clock every 30 seconds

        $scope.$on('$destroy', function() {
            if (interval) {
                $interval.cancel(interval);
            }
        });
    }
])

.controller('SlideCountdownCtrl', [
    '$scope',
    '$interval',
    'Countdown',
    function($scope, $interval, Countdown) {
        // Attention! Each object that is used here has to be dealt on server side.
        // Add it to the coresponding get_requirements method of the ProjectorElement
        // class.
        var id = $scope.element.id;
        var interval;
        var calculateCountdownTime = function (countdown) {
            countdown.seconds = Math.floor( $scope.countdown.countdown_time - Date.now() / 1000 + $scope.serverOffset );
        };
        $scope.$watch(function () {
            return Countdown.lastModified(id);
        }, function () {
            $scope.countdown = Countdown.get(id);
            if (interval) {
                $interval.cancel(interval);
            }
            if ($scope.countdown) {
                if ($scope.countdown.running) {
                    calculateCountdownTime($scope.countdown);
                    interval = $interval(function () { calculateCountdownTime($scope.countdown); }, 1000);
                } else {
                    $scope.countdown.seconds = $scope.countdown.countdown_time;
                }
            }
        });
        $scope.$on('$destroy', function() {
            // Cancel the interval if the controller is destroyed
            if (interval) {
                $interval.cancel(interval);
            }
        });
    }
])

.controller('SlideMessageCtrl', [
    '$scope',
    'ProjectorMessage',
    'Projector',
    'ProjectorID',
    'gettextCatalog',
    function($scope, ProjectorMessage, Projector, ProjectorID, gettextCatalog) {
        // Attention! Each object that is used here has to be dealt on server side.
        // Add it to the coresponding get_requirements method of the ProjectorElement
        // class.
        var id = $scope.element.id;

        if ($scope.element.identify) {
            var projector = Projector.get(ProjectorID());
            $scope.identifyMessage = gettextCatalog.getString('Projector') + ' ' + projector.id + ': ' + gettextCatalog.getString(projector.name);
        } else {
            $scope.message = ProjectorMessage.get(id);
            ProjectorMessage.bindOne(id, $scope, 'message');
        }
    }
]);

}());
