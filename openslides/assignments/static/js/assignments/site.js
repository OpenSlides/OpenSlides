(function () {

'use strict';

angular.module('OpenSlidesApp.assignments.site', [
    'OpenSlidesApp.assignments',
    'OpenSlidesApp.core.pdf',
    'OpenSlidesApp.assignments.pdf',
    'OpenSlidesApp.poll.majority'
])

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
    'SearchProvider',
    'gettext',
    function (SearchProvider, gettext) {
        SearchProvider.register({
            'verboseName': gettext('Elections'),
            'collectionName': 'assignments/assignment',
            'urlDetailState': 'assignments.assignment.detail',
            'weight': 400,
        });
    }
])

.config([
    '$stateProvider',
    'gettext',
    function($stateProvider, gettext) {
        $stateProvider
            .state('assignments', {
                url: '/assignments',
                abstract: true,
                template: "<ui-view/>",
                data: {
                    title: gettext('Elections'),
                    basePerm: 'assignments.can_see',
                },
            })
            .state('assignments.assignment', {
                abstract: true,
                template: "<ui-view/>",
            })
            .state('assignments.assignment.list', {})
            .state('assignments.assignment.detail', {
                controller: 'AssignmentDetailCtrl',
                resolve: {
                    assignmentId: ['$stateParams', function($stateParams) {
                        return $stateParams.id;
                    }],
                }
            })
            // redirects to assignment detail and opens assignment edit form dialog, uses edit url,
            // used by ui-sref links from agenda only
            // (from assignment controller use AssignmentForm factory instead to open dialog in front
            // of current view without redirect)
            .state('assignments.assignment.detail.update', {
                onEnter: ['$stateParams', '$state', 'ngDialog',
                    function($stateParams, $state, ngDialog) {
                        ngDialog.open({
                            template: 'static/templates/assignments/assignment-form.html',
                            controller: 'AssignmentUpdateCtrl',
                            className: 'ngdialog-theme-default wide-form',
                            closeByEscape: false,
                            closeByDocument: false,
                            resolve: {
                                assignmentId: function() {
                                    return $stateParams.id;
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
    'Assignment',
    'Agenda',
    'AgendaTree',
    function (gettextCatalog, operator, Tag, Assignment, Agenda, AgendaTree) {
        return {
            // ngDialog for assignment form
            getDialog: function (assignment) {
                return {
                    template: 'static/templates/assignments/assignment-form.html',
                    controller: (assignment) ? 'AssignmentUpdateCtrl' : 'AssignmentCreateCtrl',
                    className: 'ngdialog-theme-default wide-form',
                    closeByEscape: false,
                    closeByDocument: false,
                    resolve: {
                        assignmentId: function () {return assignment ? assignment.id : void 0;}
                    },
                };
            },
            // angular-formly fields for assignment form
            getFormFields: function (isCreateForm) {
                var formFields = [
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
                        label: gettextCatalog.getString('Number of persons to be elected'),
                        type: 'number',
                        min: 1,
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
                }];

                // parent item
                if (isCreateForm) {
                    formFields.push({
                        key: 'agenda_parent_item_id',
                        type: 'select-single',
                        templateOptions: {
                            label: gettextCatalog.getString('Parent item'),
                            options: AgendaTree.getFlatTree(Agenda.getAll()),
                            ngOptions: 'item.id as item.getListViewTitle() for item in to.options | notself : model.agenda_item_id',
                            placeholder: gettextCatalog.getString('Select a parent item ...')
                        },
                        hide: !operator.hasPerms('agenda.can_manage')
                    });
                }
                // more (with tags field)
                if (Tag.getAll().length > 0) {
                    formFields.push(
                        {
                            key: 'more',
                            type: 'checkbox',
                            templateOptions: {
                                label: gettextCatalog.getString('Show extended fields')
                            },
                            hide: !operator.hasPerms('assignments.can_manage')
                        },
                        {
                            template: '<hr class="smallhr">',
                            hideExpression: '!model.more'
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
                        }
                    );
                }

                return formFields;
            }
        };
    }
])

// Cache for AssignmentPollDetailCtrl so that users choices are keeped during user actions (e. g. save poll form).
.value('AssignmentPollDetailCtrlCache', {})

// Child controller of AssignmentDetailCtrl for each single poll.
.controller('AssignmentPollDetailCtrl', [
    '$scope',
    'MajorityMethodChoices',
    'Config',
    'AssignmentPollDetailCtrlCache',
    'AssignmentPoll',
    function ($scope, MajorityMethodChoices, Config, AssignmentPollDetailCtrlCache, AssignmentPoll) {
        // Define choices.
        $scope.methodChoices = MajorityMethodChoices;
        // TODO: Get $scope.baseChoices from config_variables.py without copying them.

        // Setup empty cache with default values.
        if (typeof AssignmentPollDetailCtrlCache[$scope.poll.id] === 'undefined') {
            AssignmentPollDetailCtrlCache[$scope.poll.id] = {
                method: $scope.config('assignments_poll_default_majority_method'),
            };
        }

        // Fetch users choices from cache.
        $scope.method = AssignmentPollDetailCtrlCache[$scope.poll.id].method;

        $scope.recalculateMajorities = function (method) {
            $scope.method = method;
            _.forEach($scope.poll.options, function (option) {
                option.majorityReached = option.isReached(method);
            });
        };
        $scope.recalculateMajorities($scope.method);

        $scope.saveDescriptionChange = function (poll) {
            AssignmentPoll.save(poll);
        };

        // Save current values to cache on destroy of this controller.
        $scope.$on('$destroy', function() {
            AssignmentPollDetailCtrlCache[$scope.poll.id] = {
                method: $scope.method,
            };
        });
    }
])

.controller('AssignmentListCtrl', [
    '$scope',
    'ngDialog',
    'AssignmentForm',
    'Assignment',
    'Tag',
    'Agenda',
    'Projector',
    'ProjectionDefault',
    'gettextCatalog',
    'AssignmentContentProvider',
    'AssignmentCatalogContentProvider',
    'PdfMakeDocumentProvider',
    'User',
    'osTableFilter',
    'osTableSort',
    'gettext',
    'PdfCreate',
    'AssignmentPhases',
    function($scope, ngDialog, AssignmentForm, Assignment, Tag, Agenda, Projector, ProjectionDefault,
        gettextCatalog, AssignmentContentProvider, AssignmentCatalogContentProvider, PdfMakeDocumentProvider,
        User, osTableFilter, osTableSort, gettext, PdfCreate, AssignmentPhases) {
        Assignment.bindAll({}, $scope, 'assignments');
        Tag.bindAll({}, $scope, 'tags');
        $scope.$watch(function () {
            return Projector.lastModified();
        }, function () {
            var projectiondefault = ProjectionDefault.filter({name: 'assignments'})[0];
            if (projectiondefault) {
                $scope.defaultProjectorId = projectiondefault.projector_id;
            }
        });
        $scope.phases = AssignmentPhases;
        $scope.alert = {};

        // Filtering
        $scope.filter = osTableFilter.createInstance('AssignmentTableFilter');

        if (!$scope.filter.existsStorageEntry()) {
            $scope.filter.multiselectFilters = {
                tag: [],
                phase: [],
            };
        }
        $scope.filter.propertyList = ['title', 'description'];
        $scope.filter.propertyFunctionList = [
            function (assignment) {
                return gettextCatalog.getString($scope.phases[assignment.phase].display_name);
            },
        ];
        $scope.filter.propertyDict = {
            'assignment_related_users': function (candidate) {
                return candidate.user.get_short_name();
            },
            'tags': function (tag) {
                return tag.name;
            },
        };
        $scope.getItemId = {
            tag: function (assignment) {return assignment.tags_id;},
            phase: function (assignment) {return assignment.phase;},
        };
        // Sorting
        $scope.sort = osTableSort.createInstance();
        $scope.sort.column = 'title';
        $scope.sortOptions = [
            {name: 'agenda_item.getItemNumberWithAncestors()',
             display_name: gettext('Item')},
            {name: 'title',
             display_name: gettext('Title')},
            {name: 'phase',
             display_name: gettext('Phase')},
            {name: 'assignment_related_users.length',
             display_name: gettext('Number of candidates')},
        ];
        $scope.hasTag = function (assignment, tag) {
            return _.indexOf(assignment.tags_id, tag.id) > -1;
        };
        $scope.toggleTag = function (assignment, tag) {
            if ($scope.hasTag(assignment, tag)) {
                assignment.tags_id = _.filter(assignment.tags_id, function (tag_id){
                    return tag_id != tag.id;
                });
            } else {
                assignment.tags_id.push(tag.id);
            }
            Assignment.save(assignment);
        };
        // update phase
        $scope.updatePhase = function (assignment, phase_id) {
            assignment.phase = phase_id;
            Assignment.save(assignment);
        };
        // open new/edit dialog
        $scope.openDialog = function (assignment) {
            ngDialog.open(AssignmentForm.getDialog(assignment));
        };
        // *** select mode functions ***
        $scope.isSelectMode = false;
        // check all checkboxes
        $scope.checkAll = function () {
            angular.forEach($scope.assignments, function (assignment) {
                assignment.selected = $scope.selectedAll;
            });
        };
        // uncheck all checkboxes if isSelectMode is closed
        $scope.uncheckAll = function () {
            if (!$scope.isSelectMode) {
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
            $scope.isSelectMode = false;
            $scope.uncheckAll();
        };
        // delete single assignment
        $scope.delete = function (assignment) {
            Assignment.destroy(assignment.id);
        };
        // create the PDF List
        $scope.makePDF_assignmentList = function () {
            var filename = gettextCatalog.getString("Elections") + ".pdf";
            var assignmentContentProviderArray = [];

            //convert the filtered assignments to content providers
            angular.forEach($scope.assignmentsFiltered, function(assignment) {
                assignmentContentProviderArray.push(AssignmentContentProvider.createInstance(assignment));
            });

            var assignmentCatalogContentProvider =
                AssignmentCatalogContentProvider.createInstance(assignmentContentProviderArray);
            var documentProvider =
                PdfMakeDocumentProvider.createInstance(assignmentCatalogContentProvider);
            PdfCreate.download(documentProvider.getDocument(), filename);
        };
    }
])

.controller('AssignmentDetailCtrl', [
    '$scope',
    '$http',
    '$filter',
    'filterFilter',
    'gettext',
    'ngDialog',
    'AssignmentForm',
    'operator',
    'Assignment',
    'User',
    'assignmentId',
    'Projector',
    'ProjectionDefault',
    'AssignmentContentProvider',
    'BallotContentProvider',
    'PdfMakeDocumentProvider',
    'PdfMakeBallotPaperProvider',
    'gettextCatalog',
    'PdfCreate',
    'AssignmentPhases',
    function($scope, $http, $filter, filterFilter, gettext, ngDialog, AssignmentForm, operator, Assignment,
        User, assignmentId, Projector, ProjectionDefault, AssignmentContentProvider, BallotContentProvider,
        PdfMakeDocumentProvider, PdfMakeBallotPaperProvider, gettextCatalog, PdfCreate, AssignmentPhases) {
        var assignment = Assignment.get(assignmentId);
        User.bindAll({}, $scope, 'users');
        Assignment.loadRelations(assignment, 'agenda_item');
        $scope.$watch(function () {
            return Projector.lastModified();
        }, function () {
            var projectiondefault = ProjectionDefault.filter({name: 'assignments'})[0];
            if (projectiondefault) {
                $scope.defaultProjectorId = projectiondefault.projector_id;
            }
        });
        $scope.$watch(function () {
            return Assignment.lastModified(assignment.id);
        }, function () {
            // setup sorting of candidates
            $scope.relatedUsersSorted = $filter('orderBy')(assignment.assignment_related_users, 'weight');
            $scope.assignment = Assignment.get(assignment.id);
        });
        $scope.candidateSelectBox = {};
        $scope.phases = AssignmentPhases;
        $scope.alert = {};
        $scope.activeTab = 0;

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
        // Sort all candidates
        $scope.treeOptions = {
            dropped: function () {
                var sortedCandidates = [];
                _.forEach($scope.relatedUsersSorted, function (user) {
                    sortedCandidates.push(user.id);
                });
                $http.post('/rest/assignments/assignment/' + $scope.assignment.id + '/sort_related_users/',
                    {related_users: sortedCandidates}
                );
            }
        };
        // update phase
        $scope.updatePhase = function (phase_id) {
            assignment.phase = phase_id;
            Assignment.save(assignment);
        };
        // create new ballot
        $scope.createBallot = function () {
            $scope.activeTab = 0;
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
                    assignmentpollId: function () {return poll.id;},
                    ballot: function () {return ballot;},
                }
            });
        };
        // publish ballot
        $scope.togglePublishBallot = function (poll) {
            poll.DSUpdate({
                    assignment_id: assignment.id,
                    published: !poll.published,
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

        //creates the document as pdf
        $scope.makePDF_singleAssignment = function() {
            var filename = gettextCatalog.getString("Election") + "_" + $scope.assignment.title + ".pdf";
            var assignmentContentProvider = AssignmentContentProvider.createInstance(assignment);
            var documentProvider = PdfMakeDocumentProvider.createInstance(assignmentContentProvider);
            PdfCreate.download(documentProvider.getDocument(), filename);
        };

        //creates the ballotpaper as pdf
        $scope.makePDF_assignmentpoll = function(pollID) {
            var thePoll;
            var pollNumber;
            angular.forEach(assignment.polls, function(poll, pollIndex) {
                if (poll.id == pollID) {
                    thePoll = poll;
                    pollNumber = pollIndex+1;
                }
            });
            var filename = gettextCatalog.getString("Ballot") + "_" + pollNumber + "_" + $scope.assignment.title + ".pdf";
            var ballotContentProvider = BallotContentProvider.createInstance($scope, thePoll, pollNumber);
            var documentProvider = PdfMakeBallotPaperProvider.createInstance(ballotContentProvider);
            PdfCreate.download(documentProvider.getDocument(), filename);
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
    'AgendaUpdate',
    function($scope, Assignment, AssignmentForm, Agenda, AgendaUpdate) {
        $scope.model = {};
        // set default value for open posts form field
        $scope.model.open_posts = 1;
        // get all form fields
        $scope.formFields = AssignmentForm.getFormFields(true);
        // save assignment
        $scope.save = function(assignment) {
            Assignment.create(assignment).then(
                function(success) {
                    // type: Value 1 means a non hidden agenda item, value 2 means a hidden agenda item,
                    // see openslides.agenda.models.Item.ITEM_TYPE.
                    var changes = [{key: 'type', value: (assignment.showAsAgendaItem ? 1 : 2)},
                                   {key: 'parent_id', value: assignment.agenda_parent_item_id}];
                    AgendaUpdate.saveChanges(success.agenda_item_id,changes);
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
    'AgendaUpdate',
    'assignmentId',
    function($scope, Assignment, AssignmentForm, Agenda, AgendaUpdate, assignmentId) {
        var assignment = Assignment.get(assignmentId);
        $scope.alert = {};
        // set initial values for form model by create deep copy of assignment object
        // so list/detail view is not updated while editing
        $scope.model = angular.copy(assignment);
        // get all form fields
        $scope.formFields = AssignmentForm.getFormFields();
        var agenda_item = Agenda.get(assignment.agenda_item_id);
        for (var i = 0; i < $scope.formFields.length; i++) {
            if ($scope.formFields[i].key == "showAsAgendaItem") {
                // get state from agenda item (hidden/internal or agenda item)
                $scope.formFields[i].defaultValue = !assignment.agenda_item.is_hidden;
            } else if($scope.formFields[i].key == 'agenda_parent_item_id') {
                $scope.formFields[i].defaultValue = agenda_item.parent_id;
            }
        }

        // save assignment
        $scope.save = function (assignment) {
            // inject the changed assignment (copy) object back into DS store
            Assignment.inject(assignment);
            // save change assignment object on server
            Assignment.save(assignment).then(
                function(success) {
                    var changes = [{key: 'type', value: (assignment.showAsAgendaItem ? 1 : 2)},
                                   {key: 'parent_id', value: assignment.agenda_parent_item_id}];
                    AgendaUpdate.saveChanges(success.agenda_item_id,changes);
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
    '$filter',
    'gettextCatalog',
    'AssignmentPoll',
    'assignmentpollId',
    'ballot',
    function($scope, $filter, gettextCatalog, AssignmentPoll, assignmentpollId, ballot) {
        // set initial values for form model by create deep copy of assignmentpoll object
        // so detail view is not updated while editing poll
        var assignmentpoll = angular.copy(AssignmentPoll.get(assignmentpollId));
        $scope.model = assignmentpoll;
        $scope.ballot = ballot;
        $scope.formFields = [];
        $scope.alert = {};

        // add dynamic form fields
        var options = $filter('orderBy')(assignmentpoll.options, 'weight');
        options.forEach(function(option) {
            var defaultValue;
            if (assignmentpoll.pollmethod == 'yna' || assignmentpoll.pollmethod == 'yn') {
                if (assignmentpoll.pollmethod == 'yna') {
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
                    if (assignmentpoll.pollmethod == 'yna'){
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
                if (assignmentpoll.pollmethod == 'yna'){
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
                        label: gettextCatalog.getString('Valid ballots'),
                        type: 'number'
                    }
                },
                {
                    key: 'votesinvalid',
                    type: 'input',
                    templateOptions: {
                        label: gettextCatalog.getString('Invalid ballots'),
                        type: 'number'
                    }
                },
                {
                    key: 'votescast',
                    type: 'input',
                    templateOptions: {
                        label: gettextCatalog.getString('Casted ballots'),
                        type: 'number'
                    }
                }
        );

        // save assignmentpoll
        $scope.save = function (poll) {
            var votes = [];
            if (assignmentpoll.pollmethod == 'yna') {
                assignmentpoll.options.forEach(function(option) {
                    votes.push({
                        "Yes": poll['yes_' + option.candidate_id],
                        "No": poll['no_' + option.candidate_id],
                        "Abstain": poll['abstain_' + option.candidate_id]
                    });
                });
            } else if (assignmentpoll.pollmethod == 'yn') {
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
        gettext('The 100-%-base of an election result consists of');
        gettext('For Yes/No/Abstain per candidate and Yes/No per candidate the 100-%-base ' +
                'depends on the election method: If there is only one option per candidate, ' +
                'the sum of all votes of all candidates is 100 %. Otherwise for each ' +
                'candidate the sum of all votes is 100 %.');
        gettext('Yes/No/Abstain per candidate');
        gettext('Yes/No per candidate');
        gettext('All valid ballots');
        gettext('All casted ballots');
        gettext('Disabled (no percents)');
        gettext('Number of ballot papers (selection)');
        gettext('Number of all delegates');
        gettext('Number of all participants');
        gettext('Use the following custom number');
        gettext('Custom number of ballot papers');
        gettext('Required majority');
        gettext('Default method to check whether a candidate has reached the required majority.');
        gettext('Simple majority');
        gettext('Two-thirds majority');
        gettext('Three-quarters majority');
        gettext('Disabled');
        gettext('Title for PDF document (all elections)');
        gettext('Preamble text for PDF document (all elections)');
        //other translations
        gettext('Searching for candidates');
        gettext('Voting');
        gettext('Finished');
    }
]);

}());
