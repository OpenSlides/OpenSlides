(function () {

'use strict';

angular.module('OpenSlidesApp.motions.projector', ['OpenSlidesApp.motions'])

.config(function(slidesProvider) {
    slidesProvider.registerSlide('motions/motion', {
        template: 'static/templates/motions/slide_motion.html',
    });
})

.controller('SlideMotionCtrl', function($scope, Motion) {
    // Attention! Each object that is used here has to be dealt on server side.
    // Add it to the coresponding get_requirements method of the ProjectorElement
    // class.
    var id = $scope.element.id;
    Motion.find(id);
    Motion.bindOne(id, $scope, 'motion');
});

}());
