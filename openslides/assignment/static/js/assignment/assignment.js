angular.module('OpenSlidesApp.assignment', [])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider
        .when('/assignment', {
            templateUrl: 'static/templates/assignment/assignment-list.html',
            controller: 'AssignmentListCtrl',
            resolve: {
                assignments: function(Assignment) {
                    return Assignment.findAll();
                }
            }
        })
        .when('/assignment/new', {
            templateUrl: 'static/templates/assignment/assignment-form.html',
            controller: 'AssignmentCreateCtrl'
        })
        .when('/assignment/:id', {
            templateUrl: 'static/templates/assignment/assignment-detail.html',
            controller: 'AssignmentDetailCtrl',
            resolve: {
                assignment: function(Assignment, $route) {
                    return Assignment.find($route.current.params.id);
                }
            }
        })
        .when('/assignment/:id/edit', {
            templateUrl: 'static/templates/assignment/assignment-form.html',
            controller: 'AssignmentUpdateCtrl',
            resolve: {
                assignment: function(Assignment, $route) {
                    return Assignment.find($route.current.params.id);
                }
            }
        });
}])

.factory('Assignment', function(DS) {
    return DS.defineResource({
        name: 'assignment/assignment',
        endpoint: '/rest/assignment/assignment/'
    });
})

.controller('AssignmentListCtrl', function($scope, Assignment) {
    Assignment.bindAll($scope, 'assignments');
})

.controller('AssignmentDetailCtrl', function($scope, $routeParams, Assignment) {
    Assignment.bindOne($scope, 'assignment', $routeParams.id)
})

.controller('AssignmentCreateCtrl', function($scope, Assignment) {
    $scope.assignment = {};
    $scope.save = function(assignment) {
        Assignment.create(assignment);
        // TODO: redirect to list-view
    };
})

.controller('AssignmentUpdateCtrl', function($scope, $routeParams, Assignment, assignment) {
    $scope.assignment = assignment;  // do not use .binOne(...) so autoupdate is not activated
    $scope.save = function (assignment) {
        Assignment.save(assignment);
        // TODO: redirect to list-view
    };
});

