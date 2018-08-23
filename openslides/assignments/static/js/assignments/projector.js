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
    'AssignmentPoll',
    'AssignmentPhases',
    'AssignmentPollDecimalPlaces',
    'User',
    function($scope, Assignment, AssignmentPoll, AssignmentPhases, AssignmentPollDecimalPlaces, User) {
        // Attention! Each object that is used here has to be dealt on server side.
        // Add it to the coresponding get_requirements method of the ProjectorElement
        // class.
        var id = $scope.element.id;
        $scope.showResult = $scope.element.poll;

        if ($scope.showResult) {
            var poll = AssignmentPoll.get($scope.showResult);
            $scope.votesPrecision = 0;
            if (poll) {
                AssignmentPollDecimalPlaces.getPlaces(poll, true).then(function (decimalPlaces) {
                    $scope.votesPrecision = decimalPlaces;
                });
            }
        }

        Assignment.bindOne(id, $scope, 'assignment');
        $scope.phases = AssignmentPhases;
        User.bindAll({}, $scope, 'users');
    }
]);

}());
