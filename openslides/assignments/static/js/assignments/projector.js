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
    'AssignmentPhases',
    'User',
    function($scope, Assignment, AssignmentPhases, User) {
        // Attention! Each object that is used here has to be dealt on server side.
        // Add it to the coresponding get_requirements method of the ProjectorElement
        // class.
        var id = $scope.element.id;
        $scope.showResult = $scope.element.poll;

        Assignment.bindOne(id, $scope, 'assignment');
        $scope.phases = AssignmentPhases;
        User.bindAll({}, $scope, 'users');
    }
]);

}());
