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
    function($scope, Assignment, User) {
        // Attention! Each object that is used here has to be dealt on server side.
        // Add it to the coresponding get_requirements method of the ProjectorElement
        // class.
        var id = $scope.element.id;

        // load assignemt object and related agenda item
        Assignment.find(id).then(function(assignment) {
            Assignment.loadRelations(assignment, 'agenda_item');
            $scope.$watchGroup([assignment.assignment_related_users, $scope.element.poll.options],
            function(newval, oldval) {
                if (newval[0] != oldval[0]) {
                    angular.forEach(assignment.assignment_related_users, function(related) {
                        if(!related.user) {
                            User.find(related.user_id);
                        }
                    });
                }
                if (newval[1] != oldval[1]) {
                    angular.forEach($scope.element.poll.options, function(option) {
                        if(!option.user) {
                            User.find(option.user_id);
                        }
                    });
                }
            });
        });
        Assignment.bindOne(id, $scope, 'assignment');
        Assignment.getPhases().then(function(phases) {
            $scope.phases = phases;
        });
        // load all users
        User.findAll();
        User.bindAll({}, $scope, 'users');
    }
]);

}());
