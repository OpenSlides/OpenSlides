(function () {

'use strict';

angular.module('OpenSlidesApp.assignments.site', ['OpenSlidesApp.assignments'])

.config([
    'mainMenuProvider',
    function (mainMenuProvider) {
        mainMenuProvider.register({
            'ui_sref': 'assignments.assignment.list',
            'img_class': 'pie-chart',
            'title': 'Elections',
            'weight': 400,
            'perm': 'assignments.can_see'
        });
    }
])

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
                },
                users: function(User) {
                    return User.findAll();
                }
            }
        })
        .state('assignments.assignment.detail.update', {
            views: {
                '@assignments.assignment': {}
            }
        });
})

// Provide generic assignment form fields for create and update view
.factory('AssignmentFormFieldFactory', [
    'gettext',
    function (gettext) {
        return {
            getFormFields: function () {
                return [
                {
                    key: 'title',
                    type: 'input',
                    templateOptions: {
                        label: gettext('Title'),
                        required: true
                    }
                },
                {
                    key: 'description',
                    type: 'textarea',
                    templateOptions: {
                        label: gettext('Description')
                    }
                },
                {
                    key: 'open_posts',
                    type: 'input',
                    templateOptions: {
                        label: gettext('Number of members to be elected'),
                        type: 'number',
                        required: true
                    }
                },
                {
                    key: 'poll_description_default',
                    type: 'input',
                    templateOptions: {
                        label: gettext('Default comment on the ballot paper')
                    }
                }];
            }
        }
    }
])

// Provide generic assignmentpoll form fields for create and update view
.factory('AssignmentPollFormFieldFactory', [
    'gettext',
    function (gettext) {
        return {
            getFormFields: function () {
                return [
                {
                    key: 'description',
                    type: 'input',
                    templateOptions: {
                        label: gettext('Comment on the ballot paper')
                    }
                },
                {
                    key: 'yes',
                    type: 'input',
                    templateOptions: {
                        label: gettext('Yes'),
                        type: 'number',
                        required: true
                    }
                },
                {
                    key: 'poll_description_default',
                    type: 'input',
                    templateOptions: {
                        label: gettext('Default comment on the ballot paper')
                    }
                }];
            }
        }
    }
])
.controller('AssignmentListCtrl', [
    '$scope',
    'ngDialog',
    'Assignment',
    'phases',
    function($scope, ngDialog, Assignment, phases) {
        Assignment.bindAll({}, $scope, 'assignments');
        // get all item types via OPTIONS request
        $scope.phases = phases.data.actions.POST.phase.choices;
        $scope.alert = {};

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

        // open new customslide dialog
        $scope.newDialog = function () {
            ngDialog.open({
                template: 'static/templates/assignments/assignment-form.html',
                controller: 'AssignmentCreateCtrl',
                className: 'ngdialog-theme-default wide-form'
            });
        };
        // edit view of related item (content object)
        $scope.editDialog = function (assignment) {
            ngDialog.open({
                template: 'static/templates/assignments/assignment-form.html',
                controller: 'AssignmentUpdateCtrl',
                className: 'ngdialog-theme-default wide-form',
                resolve: {
                    assignment: function(Assignment) {
                        return Assignment.find(assignment.id);
                    }
                }
            });
        };
        // save changed item
        $scope.save = function (assignment) {
            Assignment.save(assignment).then(
                function(success) {
                    assignment.quickEdit = false;
                    $scope.alert.show = false;
                },
                function(error){
                    var message = '';
                    for (var e in error.data) {
                        message += e + ': ' + error.data[e] + ' ';
                    }
                    $scope.alert = { type: 'danger', msg: message, show: true };
                });
        };
        // delete all selected assignments
        $scope.deleteMultiple = function () {
            angular.forEach($scope.assignments, function (assignment) {
                if (assignment.selected)
                    Assignment.destroy(assignment.id);
            });
            $scope.isDeleteMode = false;
            $scope.uncheckAll();
        };
        // delete single assignment
        $scope.delete = function (assignment) {
            Assignment.destroy(assignment.id);
        };
    }
])

.controller('AssignmentDetailCtrl', [
    '$scope',
    '$http',
    'ngDialog',
    'operator',
    'Assignment',
    'User',
    'assignment',
    function($scope, $http, ngDialog, operator, Assignment, User, assignment) {
        User.bindAll({}, $scope, 'users');
        Assignment.bindOne(assignment.id, $scope, 'assignment');
        Assignment.loadRelations(assignment, 'agenda_item');
        $scope.candidate = {};
        $scope.alert = {};
        // add (nominate) candidate
        $scope.addCandidate = function (userId) {
            $http.post('/rest/assignments/assignment/' + assignment.id + '/candidature_other/', {'user': userId})
                .success(function(data){
                    $scope.alert.show = false;
                })
                .error(function(data){
                    $scope.alert = { type: 'danger', msg: data.detail, show: true };
                });
        };
        // remove candidate
        $scope.removeCandidate = function (userId) {
            $http.delete('/rest/assignments/assignment/' + assignment.id + '/candidature_other/',
                    {headers: {'Content-Type': 'application/json'},
                     data: JSON.stringify({user: userId})})
                .error(function(data){
                    $scope.alert = { type: 'danger', msg: data.detail, show: true };
                });
        };
        // remove blocked candidate from "block-list"
        $scope.removeBlockedCandidate = function (userId) {
            $http.delete('/rest/assignments/assignment/' + assignment.id + '/candidature_other/',
                    {headers: {'Content-Type': 'application/json'},
                     data: JSON.stringify({user: userId})})
                .error(function(data){
                    $scope.alert = { type: 'danger', msg: data.detail, show: true };
                });
        };
        // add me (nominate self as candidate)
        $scope.addMe = function () {
            $http.post('/rest/assignments/assignment/' + assignment.id + '/candidature_self/', {})
                .success(function(data){
                    $scope.alert.show = false;
                })
                .error(function(data){
                    $scope.alert = { type: 'danger', msg: data.detail, show: true };
                });
        };
        // remove me (withdraw own candidature)
        $scope.removeMe = function () {
            $http.delete('/rest/assignments/assignment/' + assignment.id + '/candidature_self/')
                .success(function(data){
                    $scope.alert.show = false;
                })
                .error(function(data){
                    $scope.alert = { type: 'danger', msg: data.detail, show: true };
                });
        };
        // check if current user is already a candidate (status=1)
        $scope.isCandidate = function () {
            var check = assignment.assignment_related_users.map( function(candidate) {
                if ( candidate.status == 1)
                    return candidate.user_id;
            }).indexOf(operator.user.id);
            if (check > -1)
                return true;
            else
                return false;
        };
        // create new ballot
        $scope.createBallot = function () {
            $http.post('/rest/assignments/assignment/' + assignment.id + '/create_poll/')
                .success(function(data){
                    $scope.alert.show = false;
                })
                .error(function(data){
                    $scope.alert = { type: 'danger', msg: data.detail, show: true };
                });
        };
        // delete ballt
        $scope.deleteBallot = function (poll) {
            poll.DSDestroy();
        }
        // edit poll dialog
        $scope.editPollDialog = function (poll) {
            ngDialog.open({
                template: 'static/templates/assignments/assignmentpoll-form.html',
                controller: 'AssignmentPollUpdateCtrl',
                className: 'ngdialog-theme-default',
                resolve: {
                    assignmentpoll: function(AssignmentPoll) {
                        return AssignmentPoll.find(poll.id);
                    }
                }
            });
        };
        // publish ballot
        $scope.publishBallot = function () {
            // TODO poll.DSUpdate()
            $http.put('/rest/assignments/assignment/' + assignment.id + '/publish_poll/')
                .success(function(data){
                    $scope.alert.show = false;
                })
                .error(function(data){
                    $scope.alert = { type: 'danger', msg: data.detail, show: true };
                });
        };
    }
])

.controller('AssignmentCreateCtrl', [
    '$scope',
    '$state',
    'Assignment',
    'AssignmentFormFieldFactory',
    function($scope, $state, Assignment, AssignmentFormFieldFactory) {
        $scope.assignment = {};
        // get all form fields
        $scope.formFields = AssignmentFormFieldFactory.getFormFields();

        // save assignment
        $scope.save = function(assignment) {
            Assignment.create(assignment).then(
                function(success) {
                    $scope.closeThisDialog();
                }
            );
        };
    }
])

.controller('AssignmentUpdateCtrl', [
    '$scope',
    '$state',
    'Assignment',
    'AssignmentFormFieldFactory',
    'assignment',
    function($scope, $state, Assignment, AssignmentFormFieldFactory, assignment) {
        // set initial values for form model
        $scope.model = assignment;
        // get all form fields
        $scope.formFields = AssignmentFormFieldFactory.getFormFields();

        // save assignment
        $scope.save = function (assignment) {
            Assignment.save(assignment).then(
                function(success) {
                    $scope.closeThisDialog();
                }
            );
        };
    }
])

.controller('AssignmentPollUpdateCtrl', [
    '$scope',
    '$state',
    'gettext',
    'AssignmentPoll',
    'assignmentpoll',
    function($scope, $state, gettext, AssignmentPoll, assignmentpoll) {
        // set initial values for form model
        $scope.model = assignmentpoll;
        $scope.formFields = [];
        // add dynamic form fields
        assignmentpoll.options.forEach(function(option) {
            $scope.formFields.push(
                    {
                        noFormControl: true,
                        template: '<strong>User#' + option.candidate_id + '</strong>'
                    },
                    {
                        key: 'yes_' + option.candidate_id,
                        type: 'input',
                        templateOptions: {
                            label: gettext('Yes'),
                            type: 'number',
                            required: true
                        }
                    },
                    {
                        key: 'no_' + option.candidate_id,
                        type: 'input',
                        templateOptions: {
                            label: gettext('No'),
                            type: 'number',
                            required: true
                        }
                    },
                    {
                        key:'abstain_' + option.candidate_id,
                        type: 'input',
                        templateOptions: {
                            label: gettext('Abstain'),
                            type: 'number',
                            required: true
                        }
                    }
            );
        });
        // add general form fields
        $scope.formFields.push(
                {
                    key: 'votesvalid',
                    type: 'input',
                    templateOptions: {
                        label: gettext('Votes valid'),
                        type: 'number'
                    }
                },
                {
                    key: 'votesinvalid',
                    type: 'input',
                    templateOptions: {
                        label: gettext('Votes invalid'),
                        type: 'number'
                    }
                },
                {
                    key: 'votescast',
                    type: 'input',
                    templateOptions: {
                        label: gettext('Votes cast'),
                        type: 'number'
                    }
                },
                // TODO: update description in separat request
                // (without vote result values)
                {
                    key: 'description',
                    type: 'input',
                    templateOptions: {
                        label: gettext('Comment on the ballot paper')
                    }
                }
        );



        // save assignment
        $scope.save = function (poll) {
            var votes = [];
            assignmentpoll.options.forEach(function(option) {
                votes.push({
                    "Yes": poll['yes_' + option.candidate_id],
                    "No": poll['no_' + option.candidate_id],
                    "Abstain": poll['abstain_' + option.candidate_id]
                });
            });
            poll.DSUpdate({
                    assignment_id: poll.assignment_id,
                    votes: votes,
                    votesvalid: poll.votesvalid,
                    votesinvalid: poll.votesinvalid,
                    votescast: poll.votescast
            })
            .then(function(success) {
                $scope.closeThisDialog();
            })
        };
    }
]);

}());
