angular.module('OpenSlidesApp.assignments', [])

.config(function($stateProvider) {
    $stateProvider
        .state('assignments', {
            url: '/assignment',
            abstract: true,
            template: "<ui-view/>",
        })
        .state('assignments.assignment', {
            abstract: true,
            template: "<ui-view/>",
        })
        .state('assignments.assignment.list', {
            resolve: {
                assignments: function(Assignment) {
                    return Assignment.findAll();
                }
            }
        })
        .state('assignments.assignment.create', {})
        .state('assignments.assignment.detail', {
            controller: 'AssignmentDetailCtrl',
            resolve: {
                assignment: function(Assignment, $stateParams) {
                    return Assignment.find($stateParams.id);
                }
            }
        })
        .state('assignments.assignment.detail.update', {
            views: {
                '@assignments.assignment': {}
            }
        });
})

.factory('Assignment', function(DS) {
    return DS.defineResource({
        name: 'assignments/assignment',
        endpoint: '/rest/assignments/assignment/'
    });
})

.controller('AssignmentListCtrl', function($scope, Assignment) {
    Assignment.bindAll({}, $scope, 'assignments');
})

.controller('AssignmentDetailCtrl', function($scope, Assignment, assignment) {
    Assignment.bindOne(assignment.id, $scope, 'assignment')
})

.controller('AssignmentCreateCtrl', function($scope, Assignment) {
    $scope.assignment = {};
    $scope.save = function(assignment) {
        assignment.open_posts = 1;
        assignment.tags = []; // TODO: the rest_api should do this
        Assignment.create(assignment);
        // TODO: redirect to list-view
    };
})

.controller('AssignmentUpdateCtrl', function($scope, Assignment, assignment) {
    $scope.assignment = assignment;  // do not use .binOne(...) so autoupdate is not activated
    $scope.save = function (assignment) {
        Assignment.save(assignment);
        // TODO: redirect to list-view
    };
});

