angular.module('OpenSlidesApp.assignments', [])

.factory('Assignment', function(DS) {
    return DS.defineResource({
        name: 'assignments/assignment',
        endpoint: '/rest/assignments/assignment/'
    });
})

.run(function(Assignment) {});


angular.module('OpenSlidesApp.assignments.site', ['OpenSlidesApp.assignments'])

.config(function($stateProvider) {
    $stateProvider
        .state('assignments', {
            url: '/assignments',
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
                },
                phases: function($http) {
                    return $http({ 'method': 'OPTIONS', 'url': '/rest/assignments/assignment/' });
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

.controller('AssignmentListCtrl', function($scope, Assignment, phases) {
    Assignment.bindAll({}, $scope, 'assignments');
    // get all item types via OPTIONS request
    $scope.phases = phases.data.actions.POST.phase.choices;

    // setup table sorting
    $scope.sortColumn = 'title';
    $scope.filterPresent = '';
    $scope.reverse = false;
    // function to sort by clicked column
    $scope.toggleSort = function ( column ) {
        if ( $scope.sortColumn === column ) {
            $scope.reverse = !$scope.reverse;
        }
        $scope.sortColumn = column;
    };

    // delete assignment
    $scope.delete = function (assignment) {
        //TODO: add confirm message
        Assignment.destroy(assignment.id).then(
            function(success) {
                //TODO: success message
            }
        );
    };
})

.controller('AssignmentDetailCtrl', function($scope, Assignment, assignment) {
    Assignment.bindOne(assignment.id, $scope, 'assignment')
})

.controller('AssignmentCreateCtrl', function($scope, $state, Assignment) {
    $scope.assignment = {};
    $scope.save = function(assignment) {
        assignment.tags = []; // TODO: the rest_api should do this
        Assignment.create(assignment).then(
            function(success) {
                $state.go('assignments.assignment.list');
            }
        );
    };
})

.controller('AssignmentUpdateCtrl', function($scope, $state, Assignment, assignment) {
    $scope.assignment = assignment;  // do not use .binOne(...) so autoupdate is not activated
    $scope.save = function (assignment) {
        Assignment.save(assignment).then(
            function(success) {
                $state.go('assignments.assignment.list');
            }
        );
    };
});

