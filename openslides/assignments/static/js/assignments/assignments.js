"use strict";

angular.module('OpenSlidesApp.assignments', [])

.factory('Assignment', ['DS', 'jsDataModel', function(DS, jsDataModel) {
    var name = 'assignments/assignment'
    return DS.defineResource({
        name: name,
        useClass: jsDataModel,
        methods: {
            getResourceName: function () {
                return name;
            }
        }
    });
}])

.run(['Assignment', function(Assignment) {}]);


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

    // delete selected assignment
    $scope.delete = function (assignment) {
        Assignment.destroy(assignment.id);
    };
})

.controller('AssignmentDetailCtrl', function($scope, Assignment, assignment) {
    Assignment.bindOne(assignment.id, $scope, 'assignment')
})

.controller('AssignmentCreateCtrl', function($scope, $state, Assignment) {
    $scope.assignment = {};
    $scope.save = function(assignment) {
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

angular.module('OpenSlidesApp.assignments.projector', ['OpenSlidesApp.assignments'])

.config(function(slidesProvider) {
    slidesProvider.registerSlide('assignments/assignment', {
        template: 'static/templates/assignments/slide_assignment.html',
    });
})

.controller('SlideAssignmentCtrl', function($scope, Assignment) {
    // Attention! Each object that is used here has to be dealt on server side.
    // Add it to the coresponding get_requirements method of the ProjectorElement
    // class.
    var id = $scope.element.context.id;
    Assignment.find(id);
    Assignment.bindOne(id, $scope, 'assignment');
});
