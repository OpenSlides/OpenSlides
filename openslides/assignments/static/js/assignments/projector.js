(function () {

'use strict';

angular.module('OpenSlidesApp.assignments.projector', ['OpenSlidesApp.assignments'])

.config([
    'slidesProvider',
    function(slidesProvider) {
        slidesProvider.registerSlide('assignments/assignment', {
            template: 'static/templates/assignments/slide_assignment.html',
        });
    }
])

.controller('SlideAssignmentCtrl', [
    '$scope',
    'Assignment',
    'User',
    'Projector',
    function($scope, Assignment, User, Projector) {
        // Attention! Each object that is used here has to be dealt on server side.
        // Add it to the coresponding get_requirements method of the ProjectorElement
        // class.
        var id = $scope.element.id;
        var poll = $scope.element.poll;
        Projector.find(1).then(function(projector) {
            $scope.overlay = projector.speakeroverlay;
        });
        $scope.$watch(Projector.lastModified(1), function() {
            Projector.find(1).then(function(projector) {
                $scope.overlay = projector.speakeroverlay;
            });
        });

        // load assignemt object and related agenda item
        Assignment.find(id).then(function(assignment) {
            Assignment.loadRelations(assignment, 'agenda_item');
        });
        Assignment.bindOne(id, $scope, 'assignment');
        Assignment.getPhases().then(function(phases) {
            $scope.phases = phases;
        });
        // load all users
        User.findAll().then( fucntion() {
            User.bindAll({}, $scope, 'users')
        });
    }
]);

}());
