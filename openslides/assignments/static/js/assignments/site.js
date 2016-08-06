(function () {

'use strict';

angular.module('OpenSlidesApp.assignments.site', ['OpenSlidesApp.assignments'])

.config([
    'mainMenuProvider',
    'gettext',
    function (mainMenuProvider, gettext) {
        mainMenuProvider.register({
            'ui_sref': 'assignments.assignment.list',
            'img_class': 'pie-chart',
            'title': gettext('Elections'),
            'weight': 400,
            'perm': 'assignments.can_see'
        });
    }
])

.config([
    '$stateProvider',
    function($stateProvider) {
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
                    items: function(Agenda) {
                        return Agenda.findAll().catch(
                            function () {
                                return null;
                            }
                        );
                    },
                    tags: function(Tag) {
                        return Tag.findAll();
                    },
                    phases: function(Assignment) {
                        return Assignment.getPhases();
                    }
                }
            })
            .state('assignments.assignment.detail', {
                controller: 'AssignmentDetailCtrl',
                resolve: {
                    assignment: function(Assignment, $stateParams) {
                        return Assignment.find($stateParams.id).then(function(assignment) {
                            return Assignment.loadRelations(assignment, 'agenda_item');
                        });
                    },
                    users: function(User) {
                        return User.findAll();
                    },
                    tags: function(Tag) {
                        return Tag.findAll();
                    },
                    phases: function(Assignment) {
                        return Assignment.getPhases();
                    }
                }
            })
            // redirects to assignment detail and opens assignment edit form dialog, uses edit url,
            // used by ui-sref links from agenda only
            // (from assignment controller use AssignmentForm factory instead to open dialog in front
            // of current view without redirect)
            .state('assignments.assignment.detail.update', {
                onEnter: ['$stateParams', '$state', 'ngDialog', 'Assignment',
                    function($stateParams, $state, ngDialog, Assignment) {
                        ngDialog.open({
                            template: 'static/templates/assignments/assignment-form.html',
                            controller: 'AssignmentUpdateCtrl',
                            className: 'ngdialog-theme-default wide-form',
                            closeByEscape: false,
                            closeByDocument: false,
                            resolve: {
                                assignment: function() {
                                    return Assignment.find($stateParams.id).then(function(assignment) {
                                        return Assignment.loadRelations(assignment, 'agenda_item');
                                    });
                                },
                            },
                            preCloseCallback: function() {
                                $state.go('assignments.assignment.detail', {assignment: $stateParams.id});
                                return true;
                            }
                        });
                    }
                ]
            });
    }
])

// Service for generic assignment form (create and update)
.factory('AssignmentForm', [
    'gettextCatalog',
    'operator',
    'Tag',
    function (gettextCatalog, operator, Tag) {
        return {
            // ngDialog for assignment form
            getDialog: function (assignment) {
                var resolve;
                if (assignment) {
                    resolve = {
                        assignment: function() {
                            return assignment;
                        },
                        agenda_item: function(Assignment) {
                            return Assignment.loadRelations(assignment, 'agenda_item');
                        }
                    };
                }
                return {
                    template: 'static/templates/assignments/assignment-form.html',
                    controller: (assignment) ? 'AssignmentUpdateCtrl' : 'AssignmentCreateCtrl',
                    className: 'ngdialog-theme-default wide-form',
                    closeByEscape: false,
                    closeByDocument: false,
                    resolve: (resolve) ? resolve : null
                };
            },
            // angular-formly fields for assignment form
            getFormFields: function () {
                return [
                {
                    key: 'title',
                    type: 'input',
                    templateOptions: {
                        label: gettextCatalog.getString('Title'),
                        required: true
                    }
                },
                {
                    key: 'description',
                    type: 'textarea',
                    templateOptions: {
                        label: gettextCatalog.getString('Description')
                    }
                },
                {
                    key: 'open_posts',
                    type: 'input',
                    templateOptions: {
                        label: gettextCatalog.getString('Number of posts to be elected'),
                        type: 'number',
                        required: true
                    }
                },
                {
                    key: 'poll_description_default',
                    type: 'input',
                    templateOptions: {
                        label: gettextCatalog.getString('Default comment on the ballot paper')
                    }
                },
                {
                    key: 'showAsAgendaItem',
                    type: 'checkbox',
                    templateOptions: {
                        label: gettextCatalog.getString('Show as agenda item'),
                        description: gettextCatalog.getString('If deactivated the election appears as internal item on agenda.')
                    },
                    hide: !operator.hasPerms('assignments.can_manage')
                },
                {
                    key: 'more',
                    type: 'checkbox',
                    templateOptions: {
                        label: gettextCatalog.getString('Show extended fields')
                    },
                    hide: !operator.hasPerms('assignments.can_manage')
                },
                {
                    key: 'tags_id',
                    type: 'select-multiple',
                    templateOptions: {
                        label: gettextCatalog.getString('Tags'),
                        options: Tag.getAll(),
                        ngOptions: 'option.id as option.name for option in to.options',
                        placeholder: gettextCatalog.getString('Select or search a tag ...')
                    },
                    hideExpression: '!model.more'
                }];
            }
        };
    }
])

.controller('AssignmentListCtrl', [
    '$scope',
    'ngDialog',
    'AssignmentForm',
    'Assignment',
    'Tag',
    'phases',
    function($scope, ngDialog, AssignmentForm, Assignment, Tag, phases) {
        Assignment.bindAll({}, $scope, 'assignments');
        Tag.bindAll({}, $scope, 'tags');
        $scope.phases = phases;
        $scope.alert = {};

        // setup table sorting
        $scope.sortColumn = 'title';
        $scope.filterPresent = '';
        $scope.reverse = false;
        // function to sort by clicked column
        $scope.toggleSort = function (column) {
            if ( $scope.sortColumn === column ) {
                $scope.reverse = !$scope.reverse;
            }
            $scope.sortColumn = column;
        };
        // define custom search filter string
        $scope.getFilterString = function (assignment) {
            return [
                assignment.title,
                assignment.description,
                $scope.phases[assignment.phase].display_name,
                _.map(assignment.assignment_related_users,
                    function (candidate) {
                        return candidate.user.get_short_name();
                    }
                ).join(" "),
                _.map(assignment.tags,
                    function (tag) {
                        return tag.name;
                    }
                ).join(" "),
            ].join(" ");
        };

        // open new/edit dialog
        $scope.openDialog = function (assignment) {
            ngDialog.open(AssignmentForm.getDialog(assignment));
        };
        // cancel QuickEdit mode
        $scope.cancelQuickEdit = function (assignment) {
            // revert all changes by restore (refresh) original assignment object from server
            Assignment.refresh(assignment);
            assignment.quickEdit = false;
        };
        // save changed assignment
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
        // *** delete mode functions ***
        $scope.isDeleteMode = false;
        // check all checkboxes
        $scope.checkAll = function () {
            angular.forEach($scope.assignments, function (assignment) {
                assignment.selected = $scope.selectedAll;
            });
        };
        // uncheck all checkboxes if isDeleteMode is closed
        $scope.uncheckAll = function () {
            if (!$scope.isDeleteMode) {
                $scope.selectedAll = false;
                angular.forEach($scope.assignments, function (assignment) {
                    assignment.selected = false;
                });
            }
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
    'filterFilter',
    'gettext',
    'ngDialog',
    'AssignmentForm',
    'operator',
    'Assignment',
    'User',
    'assignment',
    'phases',
    function($scope, $http, filterFilter, gettext, ngDialog, AssignmentForm, operator, Assignment, User, assignment, phases) {
        User.bindAll({}, $scope, 'users');
        Assignment.bindOne(assignment.id, $scope, 'assignment');
        Assignment.loadRelations(assignment, 'agenda_item');
        $scope.candidateSelectBox = {};
        $scope.phases = phases;
        $scope.alert = {};

        // open edit dialog
        $scope.openDialog = function (assignment) {
            ngDialog.open(AssignmentForm.getDialog(assignment));
        };
        // add (nominate) candidate
        $scope.addCandidate = function (userId) {
            $http.post('/rest/assignments/assignment/' + assignment.id + '/candidature_other/', {'user': userId})
                .success(function(data){
                    $scope.alert.show = false;
                    $scope.candidateSelectBox = {};
                })
                .error(function(data){
                    $scope.alert = { type: 'danger', msg: data.detail, show: true };
                    $scope.candidateSelectBox = {};
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
        // check if current user is already a candidate (elected==false)
        $scope.isCandidate = function () {
            var check = assignment.assignment_related_users.map( function(candidate) {
                if ( !candidate.elected ) {
                    return candidate.user_id;
                }
            }).indexOf(operator.user.id);
            if (check > -1)
                return true;
            else
                return false;
        };
        // update phase
        $scope.updatePhase = function (phase_id) {
            assignment.phase = phase_id;
            Assignment.save(assignment);
        };
        // create new ballot
        $scope.createBallot = function () {
            $http.post('/rest/assignments/assignment/' + assignment.id + '/create_poll/')
                .success(function(data){
                    $scope.alert.show = false;
                    if (assignment.phase === 0) {
                        $scope.updatePhase(1);
                    }
                })
                .error(function(data){
                    $scope.alert = { type: 'danger', msg: data.detail, show: true };
                });
        };
        // delete ballot
        $scope.deleteBallot = function (poll) {
            poll.DSDestroy();
        };
        // edit poll dialog
        $scope.editPollDialog = function (poll, ballot) {
            ngDialog.open({
                template: 'static/templates/assignments/assignmentpoll-form.html',
                controller: 'AssignmentPollUpdateCtrl',
                className: 'ngdialog-theme-default',
                closeByEscape: false,
                closeByDocument: false,
                resolve: {
                    assignmentpoll: function (AssignmentPoll) {
                        return AssignmentPoll.find(poll.id);
                    },
                    ballot: function () {
                        return ballot;
                    }
                }
            });
        };
        // publish ballot
        $scope.publishBallot = function (poll, isPublished) {
            poll.DSUpdate({
                    assignment_id: assignment.id,
                    published: isPublished,
            })
            .then(function(success) {
                $scope.alert.show = false;
            })
            .catch(function(error) {
                var message = '';
                for (var e in error.data) {
                    message += e + ': ' + error.data[e] + ' ';
                }
                $scope.alert = { type: 'danger', msg: message, show: true };
            });
        };
        // mark candidate as (not) elected
        $scope.markElected = function (user, reverse) {
            if (reverse) {
                $http.delete(
                    '/rest/assignments/assignment/' + assignment.id + '/mark_elected/',
                    {
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        data: JSON.stringify({user: user})
                    }
                );
            } else {
                $http.post('/rest/assignments/assignment/' + assignment.id + '/mark_elected/', {'user': user})
                    .then(function(success) {
                        var elected = filterFilter(assignment.assignment_related_users,{elected: true});
                        // Set phase to 'finished' if there are enough (= number of open posts) elected users.
                        // Note: The array 'elected' does NOT contains the candidate who is just marked as elected.
                        // So add 1 to length to get the real number of all elected users.
                        if (elected.length + 1 == assignment.open_posts ) {
                            $scope.updatePhase(2);
                        }
                    });
            }

        };

        // Just mark some vote value strings for translation.
        gettext('Yes');
        gettext('No');
        gettext('Abstain');
    }
])

.controller('AssignmentCreateCtrl', [
    '$scope',
    'Assignment',
    'AssignmentForm',
    'Agenda',
    function($scope, Assignment, AssignmentForm, Agenda) {
        $scope.model = {};
        // set default value for open posts form field
        $scope.model.open_posts = 1;
        // get all form fields
        $scope.formFields = AssignmentForm.getFormFields();

        // save assignment
        $scope.save = function(assignment) {
            Assignment.create(assignment).then(
                function(success) {
                    // find related agenda item
                    Agenda.find(success.agenda_item_id).then(function(item) {
                        // check form element and set item type (AGENDA_ITEM = 1, HIDDEN_ITEM = 2)
                        var type = assignment.showAsAgendaItem ? 1 : 2;
                        // save only if agenda item type is modified
                        if (item.type != type) {
                            item.type = type;
                            Agenda.save(item);
                        }
                    });
                    $scope.closeThisDialog();
                }
            );
        };
    }
])

.controller('AssignmentUpdateCtrl', [
    '$scope',
    'Assignment',
    'AssignmentForm',
    'Agenda',
    'assignment',
    function($scope, Assignment, AssignmentForm, Agenda, assignment) {
        $scope.alert = {};
        // set initial values for form model by create deep copy of assignment object
        // so list/detail view is not updated while editing
        $scope.model = angular.copy(assignment);
        // get all form fields
        $scope.formFields = AssignmentForm.getFormFields();
        for (var i = 0; i < $scope.formFields.length; i++) {
            if ($scope.formFields[i].key == "showAsAgendaItem") {
                // get state from agenda item (hidden/internal or agenda item)
                $scope.formFields[i].defaultValue = !assignment.agenda_item.is_hidden;
            }
        }

        // save assignment
        $scope.save = function (assignment) {
            // inject the changed assignment (copy) object back into DS store
            Assignment.inject(assignment);
            // save change assignment object on server
            Assignment.save(assignment).then(
                function(success) {
                    // check form element and set item type (AGENDA_ITEM = 1, HIDDEN_ITEM = 2)
                    var type = assignment.showAsAgendaItem ? 1 : 2;
                    // save only if agenda item type is modified
                    if (assignment.agenda_item.type != type) {
                        assignment.agenda_item.type = type;
                        Agenda.save(assignment.agenda_item);
                    }
                    $scope.closeThisDialog();
                },
                function (error) {
                    // save error: revert all changes by restore
                    // (refresh) original assignment object from server
                    Assignment.refresh(assignment);
                    var message = '';
                    for (var e in error.data) {
                        message += e + ': ' + error.data[e] + ' ';
                    }
                    $scope.alert = {type: 'danger', msg: message, show: true};
                }
            );
        };
    }
])

.controller('AssignmentPollUpdateCtrl', [
    '$scope',
    'gettextCatalog',
    'AssignmentPoll',
    'assignmentpoll',
    'ballot',
    function($scope, gettextCatalog, AssignmentPoll, assignmentpoll, ballot) {
        // set initial values for form model by create deep copy of assignmentpoll object
        // so detail view is not updated while editing poll
        $scope.model = angular.copy(assignmentpoll);
        $scope.ballot = ballot;
        $scope.formFields = [];
        $scope.alert = {};

        // add dynamic form fields
        assignmentpoll.options.forEach(function(option) {
            var defaultValue;
            if (assignmentpoll.yesnoabstain || assignmentpoll.yesno) {
                if (assignmentpoll.yesnoabstain) {
                    defaultValue = {
                        'yes': '',
                        'no': '',
                        'abstain': ''
                    };
                }
                else {
                    defaultValue = {
                        'yes': '',
                        'no': ''
                    };
                }

                if (option.votes.length) {
                    defaultValue.yes = option.votes[0].weight;
                    defaultValue.no = option.votes[1].weight;
                    if (assignmentpoll.yesnoabstain){
                        defaultValue.abstain = option.votes[2].weight;
                    }
                }
                $scope.formFields.push(
                    {
                        noFormControl: true,
                        template: '<strong>' + option.candidate.get_full_name() + '</strong>'
                    },
                    {
                        key: 'yes_' + option.candidate_id,
                        type: 'input',
                        templateOptions: {
                            label: gettextCatalog.getString('Yes'),
                            type: 'number',
                            required: true
                        },
                        defaultValue: defaultValue.yes
                    },
                    {
                        key: 'no_' + option.candidate_id,
                        type: 'input',
                        templateOptions: {
                            label: gettextCatalog.getString('No'),
                            type: 'number',
                            required: true
                        },
                        defaultValue: defaultValue.no
                    });
                if (assignmentpoll.yesnoabstain){
                    $scope.formFields.push(
                    {
                        key:'abstain_' + option.candidate_id,
                        type: 'input',
                        templateOptions: {
                            label: gettextCatalog.getString('Abstain'),
                            type: 'number',
                            required: true
                        },
                        defaultValue: defaultValue.abstain
                    });
                }
            } else {
                if (option.votes.length) {
                    defaultValue = option.votes[0].weight;
                }
                $scope.formFields.push(
                    {
                        key: 'vote_' + option.candidate_id,
                        type: 'input',
                        templateOptions: {
                            label: option.candidate.get_full_name(),
                            type: 'number',
                            required: true
                        },
                        defaultValue: defaultValue
                    });
            }
        });
        // add general form fields
        $scope.formFields.push(
                {
                    key: 'votesvalid',
                    type: 'input',
                    templateOptions: {
                        label: gettextCatalog.getString('Votes valid'),
                        type: 'number'
                    }
                },
                {
                    key: 'votesinvalid',
                    type: 'input',
                    templateOptions: {
                        label: gettextCatalog.getString('Votes invalid'),
                        type: 'number'
                    }
                },
                {
                    key: 'votescast',
                    type: 'input',
                    templateOptions: {
                        label: gettextCatalog.getString('Votes cast'),
                        type: 'number'
                    }
                },
                // TODO: update description in separat request
                // (without vote result values)
                {
                    key: 'description',
                    type: 'input',
                    templateOptions: {
                        label: gettextCatalog.getString('Comment on the ballot paper')
                    }
                }
        );

        // save assignmentpoll
        $scope.save = function (poll) {
            var votes = [];
            if (assignmentpoll.yesnoabstain) {
                assignmentpoll.options.forEach(function(option) {
                    votes.push({
                        "Yes": poll['yes_' + option.candidate_id],
                        "No": poll['no_' + option.candidate_id],
                        "Abstain": poll['abstain_' + option.candidate_id]
                    });
                });
            } else if (assignmentpoll.yesno) {
                    assignmentpoll.options.forEach(function(option) {
                        votes.push({
                            "Yes": poll['yes_' + option.candidate_id],
                            "No": poll['no_' + option.candidate_id]
                            });
                        });
            } else {
                assignmentpoll.options.forEach(function(option) {
                    votes.push({
                        "Votes": poll['vote_' + option.candidate_id],
                    });
                });
            }
            // save change poll object on server
            poll.DSUpdate({
                assignment_id: poll.assignment_id,
                votes: votes,
                votesvalid: poll.votesvalid,
                votesinvalid: poll.votesinvalid,
                votescast: poll.votescast
            })
            .then(function(success) {
                $scope.alert.show = false;
                $scope.closeThisDialog();
            })
            .catch(function(error) {
                var message = '';
                for (var e in error.data) {
                    message += e + ': ' + error.data[e] + ' ';
                }
                $scope.alert = { type: 'danger', msg: message, show: true };
            });
        };
    }
])

//mark all assignment config strings for translation with Javascript
.config([
    'gettext',
    function (gettext) {
        gettext('Election method');
        gettext('Automatic assign of method');
        gettext('Always one option per candidate');
        gettext('Always Yes-No-Abstain per candidate');
        gettext('Always Yes/No per candidate');
        gettext('Elections');
        gettext('Ballot and ballot papers');
        gettext('The 100 % base of an election result consists of');
        gettext('Number of ballot papers (selection)');
        gettext('Number of all delegates');
        gettext('Number of all participants');
        gettext('Use the following custom number');
        gettext('Custom number of ballot papers');
        gettext('Title for PDF document (all elections)');
        gettext('Preamble text for PDF document (all elections)');
        //other translations
        gettext('Searching for candidates');
        gettext('Voting');
        gettext('Finished');
    }
]);

}());
