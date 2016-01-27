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
    'Motion',
    'User',
    function($scope, Motion, User) {
        // Attention! Each object that is used here has to be dealt on server side.
        // Add it to the coresponding get_requirements method of the ProjectorElement
        // class.
        var id = $scope.element.id;

        // load motion object and related agenda item
        Motion.find(id).then(function(motion) {
            Motion.loadRelations(motion, 'agenda_item');
        });
        Motion.bindOne(id, $scope, 'motion');

        // load all users
        User.findAll();
        User.bindAll({}, $scope, 'users');
    }
]);

}());
