"use strict";

angular.module('OpenSlidesApp.motions', [])

.factory('WorkflowState', [
    'DS',
    function (DS) {
        return DS.defineResource({
            name: 'motions/workflowstate',
            methods: {
                getNextStates: function () {
                    var states = [];
                    _.forEach(this.next_states_id, function (stateId) {
                        states.push(DS.get('motions/workflowstate', stateId));
                    })
                    return states;
                }
            }
        })
    }
])

.factory('Workflow', [
    'DS',
    'jsDataModel',
    'WorkflowState',
    function (DS, jsDataModel, WorkflowState) {
        return DS.defineResource({
            name: 'motions/workflow',
            useClass: jsDataModel,
            relations: {
                hasMany: {
                    'motions/workflowstate': {
                        localField: 'states',
                        foreignKey: 'workflow_id',
                    }
                }
            }
        })
    }
])

// Load all MotionWorkflows at startup
.run([
    'Workflow',
    function (Workflow) {
        Workflow.findAll();
    }
])

.factory('MotionPoll', [
    'DS',
    'Config',
    function (DS, Config) {
        return DS.defineResource({
            name: 'motions/motionpoll',
            relations: {
                belongsTo: {
                    'motions/motion': {
                        localField: 'motion',
                        localKey: 'motion_id',
                    }
                }
            },
            methods: {
                getYesPercent: function (valueOnly) {
                    var config = Config.get('motions_poll_100_percent_base').value;
                    var returnvalue;
                    if (config == "WITHOUT_INVALID" && this.votesvalid > 0 && this.yes >= 0) {
                        returnvalue = Math.round(this.yes * 100 / this.votesvalid * 10) / 10;
                    } else if (config == "WITH_INVALID" && this.votescast > 0 && this.yes >= 0) {
                        returnvalue = Math.round(this.yes * 100 / (this.votescast) * 10) / 10;
                    } else {
                        returnvalue = null;
                    }
                    if (!valueOnly && returnvalue != null) {
                        returnvalue = "(" + returnvalue + "%)";
                    }
                    return returnvalue;
                },
                getNoPercent: function (valueOnly) {
                    var config = Config.get('motions_poll_100_percent_base').value;
                    var returnvalue;
                    if (config == "WITHOUT_INVALID" && this.votesvalid > 0 && this.no >= 0) {
                        returnvalue = Math.round(this.no * 100 / this.votesvalid * 10) / 10;
                    } else if (config == "WITH_INVALID" && this.votescast > 0 && this.no >= 0) {
                        returnvalue = Math.round(this.no * 100 / (this.votescast) * 10) / 10;
                    } else {
                        returnvalue = null;
                    }
                    if (!valueOnly && returnvalue != null) {
                        returnvalue = "(" + returnvalue + "%)";
                    }
                    return returnvalue;
                },
                getAbstainPercent: function (valueOnly) {
                    var config = Config.get('motions_poll_100_percent_base').value;
                    var returnvalue;
                    if (config == "WITHOUT_INVALID" && this.votesvalid > 0 && this.abstain >= 0) {
                        returnvalue = Math.round(this.abstain * 100 / this.votesvalid * 10) / 10;
                    } else if (config == "WITH_INVALID" && this.votescast > 0 && this.abstain >= 0) {
                        returnvalue = Math.round(this.abstain * 100 / (this.votescast) * 10) / 10;
                    } else {
                        returnvalue = null;
                    }
                    if (!valueOnly && returnvalue != null) {
                        returnvalue = "(" + returnvalue + "%)";
                    }
                    return returnvalue;
                },
                getVotesValidPercent: function (valueOnly) {
                    var config = Config.get('motions_poll_100_percent_base').value;
                    var returnvalue;
                    if (config == "WITHOUT_INVALID" && this.votevalid >= 0) {
                        returnvalue = 100;
                    } else if (config == "WITH_INVALID" && this.votevalid >= 0) {
                        returnvalue = Math.round(this.votesvalid * 100 / (this.votescast) * 10) / 10;
                    } else {
                        returnvalue = null;
                    }
                    if (!valueOnly && returnvalue != null) {
                        returnvalue = "(" + returnvalue + "%)";
                    }
                    return returnvalue;
                },
                getVotesInvalidPercent: function (valueOnly) {
                    var config = Config.get('motions_poll_100_percent_base').value;
                    var returnvalue;
                    if (config == "WITH_INVALID" && this.voteinvalid >= 0) {
                        returnvalue = Math.round(this.votesinvalid * 100 / (this.votescast) * 10) / 10;
                    } else {
                        returnvalue = null;
                    }
                    if (!valueOnly && returnvalue != null) {
                        returnvalue = "(" + returnvalue + "%)";
                    }
                    return returnvalue;
                },
                getVotesCastPercent: function (valueOnly) {
                    var config = Config.get('motions_poll_100_percent_base').value;
                    var returnvalue;
                    if (config == "WITH_INVALID" && this.votecast >= 0) {
                        returnvalue = 100;
                    } else {
                        returnvalue = null;
                    }
                    if (!valueOnly && returnvalue != null) {
                        returnvalue = "(" + returnvalue + "%)";
                    }
                    return returnvalue;
                }
            }
        });
    }
])

.factory('Motion', [
    'DS',
    'MotionPoll',
    'jsDataModel',
    'gettext',
    'operator',
    'Config',
    function(DS, MotionPoll, jsDataModel, gettext, operator, Config) {
        var name = 'motions/motion'
        return DS.defineResource({
            name: name,
            useClass: jsDataModel,
            agendaSupplement: '(' + gettext('Motion') + ')',
            methods: {
                getResourceName: function () {
                    return name;
                },
                getVersion: function (versionId) {
                    versionId = versionId || this.active_version;
                    var index;
                    if (versionId == -1) {
                        index = this.versions.length - 1;
                    } else {
                        index = _.findIndex(this.versions, function (element) {
                            return element.id == versionId
                        });
                    }
                    return this.versions[index];
                },
                getTitle: function (versionId) {
                    return this.getVersion(versionId).title;
                },
                getText: function (versionId) {
                    return this.getVersion(versionId).text;
                },
                getReason: function (versionId) {
                    return this.getVersion(versionId).reason;
                },
                getAgendaTitle: function () {
                    var value = '';
                    if (this.identifier) {
                        value = this.identifier + ' | ';
                    }
                    return value + this.getTitle();
                },
                isAllowed: function (action) {
                    /*
                     * Return true if the requested user is allowed to do the specific action.
                     * There are the following possible actions.
                     * - see
                     * - update
                     * - delete
                     * - create_poll
                     * - support
                     * - unsupport
                     * - change_state
                     * - reset_state
                     *
                     *  NOTE: If you update this function please also update the
                     *  'get_allowed_actions' function on server side in motions/models.py.
                     */
                    switch (action) {
                        case 'see':
                            return (operator.hasPerms('motions.can_see') &&
                                (!this.state.required_permission_to_see ||
                                 operator.hasPerms(this.state.required_permission_to_see) ||
                                 (operator.user in this.submitters)));
                        case 'update':
                            return (operator.hasPerms('motions.can_manage') ||
                                (($.inArray(operator.user, this.submitters) != -1) &&
                                this.state.allow_submitter_edit));
                        case 'quickedit':
                            return operator.hasPerms('motions.can_manage');
                        case 'delete':
                            return operator.hasPerms('motions.can_manage');
                        case 'create_poll':
                            return (operator.hasPerms('motions.can_manage') &&
                                this.state.allow_create_poll);
                        case 'support':
                            return (operator.hasPerms('motions.can_support') &&
                                    this.state.allow_support &&
                                    Config.get('motions_min_supporters').value > 0 &&
                                    !($.inArray(operator.user, this.submitters) != -1) &&
                                    !($.inArray(operator.user, this.supporters) != -1));
                        case 'unsupport':
                            return (this.state.allow_support &&
                                   ($.inArray(operator.user, this.supporters) != -1));
                        case 'change_state':
                            return operator.hasPerms('motions.can_manage');
                        case 'reset_state':
                            return operator.hasPerms('motions.can_manage');
                        default:
                            return false;
                    }
                }
            },
            relations: {
                belongsTo: {
                    'motions/category': {
                        localField: 'category',
                        localKey: 'category_id',
                    },
                    'agenda/item': {
                        localKey: 'agenda_item_id',
                        localField: 'agenda_item',
                    }
                },
                hasMany: {
                    'core/tag': {
                        localField: 'tags',
                        localKeys: 'tags_id',
                    },
                    'mediafiles/mediafile': {
                        localField: 'attachments',
                        localKeys: 'attachments_id',
                    },
                    'users/user': [
                        {
                            localField: 'submitters',
                            localKeys: 'submitters_id',
                        },
                        {
                            localField: 'supporters',
                            localKeys: 'supporters_id',
                        }
                    ],
                    'motions/motionpoll': {
                        localField: 'polls',
                        foreignKey: 'motion_id',
                    }
                },
                hasOne: {
                    'motions/workflowstate': {
                        localField: 'state',
                        localKey: 'state_id',
                    }
                }
            }
        });
    }
])

// Provide generic motion form fields for create and update view
.factory('MotionFormFieldFactory', [
    'gettext',
    'operator',
    'Category',
    'Config',
    'Mediafile',
    'Tag',
    'User',
    'Workflow',
    function (gettext, operator, Category, Config, Mediafile, Tag, User, Workflow) {
        return {
            getFormFields: function () {
                return [
                {
                    key: 'identifier',
                    type: 'input',
                    templateOptions: {
                        label: gettext('Identifier')
                    },
                    hide: true
                },
                {
                    key: 'submitters_id',
                    type: 'ui-select-multiple',
                    templateOptions: {
                        label: gettext('Submitters'),
                        optionsAttr: 'bs-options',
                        options: User.getAll(),
                        ngOptions: 'option[to.valueProp] as option in to.options | filter: $select.search',
                        valueProp: 'id',
                        labelProp: 'full_name',
                        placeholder: gettext('Select or search a submitter...')
                    },
                    hide: !operator.hasPerms('motions.can_manage')
                },
                {
                    key: 'title',
                    type: 'input',
                    templateOptions: {
                        label: gettext('Title'),
                        required: true
                    }
                },
                {
                    key: 'text',
                    type: 'textarea',
                    templateOptions: {
                        label: gettext('Text'),
                        required: true
                    }
                },
                {
                    key: 'reason',
                    type: 'textarea',
                    templateOptions: {
                        label: gettext('Reason')
                    }
                },
                {
                    key: 'more',
                    type: 'checkbox',
                    templateOptions: {
                        label: gettext('Show extended fields')
                    },
                    hide: !operator.hasPerms('motions.can_manage')
                },
                {
                    key: 'attachments_id',
                    type: 'ui-select-multiple',
                    templateOptions: {
                        label: gettext('Attachment'),
                        optionsAttr: 'bs-options',
                        options: Mediafile.getAll(),
                        ngOptions: 'option[to.valueProp] as option in to.options | filter: $select.search',
                        valueProp: 'id',
                        labelProp: 'title_or_filename',
                        placeholder: gettext('Select or search an attachment...')
                    },
                    hideExpression: '!model.more'
                },
                {
                    key: 'category_id',
                    type: 'ui-select-single',
                    templateOptions: {
                        label: gettext('Category'),
                        optionsAttr: 'bs-options',
                        options: Category.getAll(),
                        ngOptions: 'option[to.valueProp] as option in to.options | filter: $select.search',
                        valueProp: 'id',
                        labelProp: 'name',
                        placeholder: gettext('Select or search a category...')
                    },
                    hideExpression: '!model.more'
                },
                {
                    key: 'tags_id',
                    type: 'ui-select-multiple',
                    templateOptions: {
                        label: gettext('Tags'),
                        optionsAttr: 'bs-options',
                        options: Tag.getAll(),
                        ngOptions: 'option[to.valueProp] as option in to.options | filter: $select.search',
                        valueProp: 'id',
                        labelProp: 'name',
                        placeholder: gettext('Select or search a tag...')
                    },
                    hideExpression: '!model.more'
                },
                {
                    key: 'supporters_id',
                    type: 'ui-select-multiple',
                    templateOptions: {
                        label: gettext('Supporters'),
                        optionsAttr: 'bs-options',
                        options: User.getAll(),
                        ngOptions: 'option[to.valueProp] as option in to.options | filter: $select.search',
                        valueProp: 'id',
                        labelProp: 'full_name',
                        placeholder: gettext('Select or search a supporter...')
                    },
                    hideExpression: '!model.more'
                },
                {
                    key: 'workflow_id',
                    type: 'ui-select-single',
                    templateOptions: {
                        label: gettext('Workflow'),
                        optionsAttr: 'bs-options',
                        options: Workflow.getAll(),
                        ngOptions: 'option[to.valueProp] as option in to.options | filter: $select.search',
                        valueProp: 'id',
                        labelProp: 'name',
                        placeholder: gettext('Select or search a workflow...')
                    },
                    hideExpression: '!model.more',
                }];
            }
        }
    }
])
.factory('Category', ['DS', function(DS) {
    return DS.defineResource({
        name: 'motions/category',
    });
}])

.run(['Motion', 'Category', function(Motion, Category) {}]);


angular.module('OpenSlidesApp.motions.site', ['OpenSlidesApp.motions'])

.config([
    'mainMenuProvider',
    'gettext',
    function (mainMenuProvider, gettext) {
        mainMenuProvider.register({
            'ui_sref': 'motions.motion.list',
            'img_class': 'file-text',
            'title': gettext('Motions'),
            'weight': 300,
            'perm': 'motions.can_see',
        });
    }
])

.config(function($stateProvider) {
    $stateProvider
        .state('motions', {
            url: '/motions',
            abstract: true,
            template: "<ui-view/>",
        })
        .state('motions.motion', {
            abstract: true,
            template: "<ui-view/>",
        })
        .state('motions.motion.list', {
            resolve: {
                motions: function(Motion) {
                    return Motion.findAll();
                },
                categories: function(Category) {
                    return Category.findAll();
                },
                tags: function(Tag) {
                    return Tag.findAll();
                },
                users: function(User) {
                    return User.findAll();
                }
            }
        })
        .state('motions.motion.create', {
            resolve: {
                categories: function(Category) {
                    return Category.findAll();
                },
                tags: function(Tag) {
                    return Tag.findAll();
                },
                users: function(User) {
                    return User.findAll();
                },
                mediafiles: function(Mediafile) {
                    return Mediafile.findAll();
                },
                workflows: function(Workflow) {
                    return Workflow.findAll();
                }
            }
        })
        .state('motions.motion.detail', {
            resolve: {
                motion: function(Motion, $stateParams) {
                    return Motion.find($stateParams.id);
                },
                categories: function(Category) {
                    return Category.findAll();
                },
                users: function(User) {
                    return User.findAll();
                },
                mediafiles: function(Mediafile) {
                    return Mediafile.findAll();
                },
                tags: function(Tag) {
                    return Tag.findAll();
                }
            }
        })
        .state('motions.motion.detail.update', {
            views: {
                '@motions.motion': {}
            },
            resolve: {
                categories: function(Category) {
                    return Category.findAll();
                },
                tags: function(Tag) {
                    return Tag.findAll();
                },
                users: function(User) {
                    return User.findAll();
                },
                mediafiles: function(Mediafile) {
                    return Mediafile.findAll();
                },
                workflows: function(Workflow) {
                    return Workflow.findAll();
                }
            }
        })
        .state('motions.motion.csv-import', {
            url: '/csv-import',
            controller: 'MotionCSVImportCtrl',
        })
        // categories
        .state('motions.category', {
            url: '/category',
            abstract: true,
            template: "<ui-view/>",
        })
        .state('motions.category.list', {
            resolve: {
                categories: function(Category) {
                    return Category.findAll();
                }
            }
        })
        .state('motions.category.create', {})
        .state('motions.category.detail', {
            resolve: {
                category: function(Category, $stateParams) {
                    return Category.find($stateParams.id);
                }
            }
        })
        .state('motions.category.detail.update', {
            views: {
                '@motions.category': {}
            }
        })
})

.controller('MotionListCtrl', [
    '$scope',
    '$state',
    'Motion',
    'Category',
    'Tag',
    'Workflow',
    'User',
    function($scope, $state, Motion, Category, Tag, Workflow, User) {
        Motion.bindAll({}, $scope, 'motions');
        Category.bindAll({}, $scope, 'categories');
        Tag.bindAll({}, $scope, 'tags');
        Workflow.bindAll({}, $scope, 'workflows');
        User.bindAll({}, $scope, 'users');
        $scope.alert = {};

        // setup table sorting
        $scope.sortColumn = 'identifier';
        $scope.filterPresent = '';
        $scope.reverse = false;
        // function to sort by clicked column
        $scope.toggleSort = function ( column ) {
            if ( $scope.sortColumn === column ) {
                $scope.reverse = !$scope.reverse;
            }
            $scope.sortColumn = column;
        };

        // collect all states of all workflows
        // TODO: regard workflows only which are used by motions
        $scope.states = [];
        var workflows = Workflow.getAll();
        angular.forEach(workflows, function (workflow) {
            if (workflows.length > 1) {
                var wf = {}
                wf.name = "# "+workflow.name;
                $scope.states.push(wf);
            }
            angular.forEach(workflow.states, function (state) {
                $scope.states.push(state);
            });
        });

        // hover edit actions
        $scope.hoverIn = function () {
            $scope.showEditActions = true;
        };
        $scope.hoverOut = function () {
            $scope.showEditActions = false;
        };

        // save changed motion
        $scope.update = function (motion) {
            // get (unchanged) values from latest version for update method
            motion.title = motion.getTitle(-1);
            motion.text = motion.getText(-1);
            motion.reason = motion.getReason(-1);
            Motion.save(motion).then(
                function(success) {
                    motion.quickEdit = false;
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
            angular.forEach($scope.motions, function (motion) {
                motion.selected = $scope.selectedAll;
            });
        };
        // uncheck all checkboxes if isDeleteMode is closed
        $scope.uncheckAll = function () {
            if (!$scope.isDeleteMode) {
                $scope.selectedAll = false;
                angular.forEach($scope.motions, function (motion) {
                    motion.selected = false;
                });
            }
        };
        // delete selected motions
        $scope.delete = function () {
            angular.forEach($scope.motions, function (motion) {
                if (motion.selected)
                    Motion.destroy(motion.id);
            });
            $scope.isDeleteMode = false;
            $scope.uncheckAll();
        };
        // delete single motion
        $scope.deleteSingleMotion = function (motion) {
            Motion.destroy(motion.id);
        };
    }
])

.controller('MotionDetailCtrl', [
    '$scope',
    '$http',
    'Motion',
    'Category',
    'Mediafile',
    'Tag',
    'User',
    'Workflow',
    'motion',
    function($scope, $http, Motion, Category, Mediafile, Tag, User, Workflow, motion) {
        Motion.bindOne(motion.id, $scope, 'motion');
        Category.bindAll({}, $scope, 'categories');
        Mediafile.bindAll({}, $scope, 'mediafiles');
        Tag.bindAll({}, $scope, 'tags');
        User.bindAll({}, $scope, 'users');
        Workflow.bindAll({}, $scope, 'workflows');
        Motion.loadRelations(motion, 'agenda_item');
        // TODO: make 'motion.attachments' useable and itteratable in template
        // Motion.loadRelations(motion, 'attachments');

        $scope.alert = {};
        $scope.isCollapsed = true;

        $scope.support = function () {
            $http.post('/rest/motions/motion/' + motion.id + '/support/');
        }
        $scope.unsupport = function () {
            $http.delete('/rest/motions/motion/' + motion.id + '/support/');
        }
        $scope.update_state = function (state) {
            $http.put('/rest/motions/motion/' + motion.id + '/set_state/', {'state': state.id});
        }
        $scope.reset_state = function (state_id) {
            $http.put('/rest/motions/motion/' + motion.id + '/set_state/', {});
        }
        $scope.create_poll = function () {
            $http.post('/rest/motions/motion/' + motion.id + '/create_poll/', {})
            .success(function(data){
                $scope.alert.show = false;
            })
            .error(function(data){
                $scope.alert = { type: 'danger', msg: data.detail, show: true };
            });
        }
        $scope.delete_poll = function (poll) {
            poll.DSDestroy();
        }
        $scope.update_poll = function (poll) {
            poll.DSUpdate({
                    motion_id: motion.id,
                    votes: {"Yes": poll.yes, "No": poll.no, "Abstain": poll.abstain},
                    votesvalid: poll.votesvalid,
                    votesinvalid: poll.votesinvalid,
                    votescast: poll.votescast
            })
            .then(function(success) {
                $scope.alert.show = false;
                poll.isEditMode = false;
            })
            .catch(function(error) {
                var message = '';
                for (var e in error.data) {
                    message += e + ': ' + error.data[e] + ' ';
                }
                $scope.alert = { type: 'danger', msg: message, show: true };
            });
        }
    }
])

.controller('MotionCreateCtrl', [
    '$scope',
    '$state',
    'gettext',
    'operator',
    'Motion',
    'MotionFormFieldFactory',
    'Category',
    'Config',
    'Mediafile',
    'Tag',
    'User',
    'Workflow',
    function($scope, $state, gettext, operator, Motion, MotionFormFieldFactory, Category, Config, Mediafile, Tag, User, Workflow) {
        Category.bindAll({}, $scope, 'categories');
        Mediafile.bindAll({}, $scope, 'mediafiles');
        Tag.bindAll({}, $scope, 'tags');
        User.bindAll({}, $scope, 'users');
        Workflow.bindAll({}, $scope, 'workflows');

        // get all form fields
        $scope.formFields = MotionFormFieldFactory.getFormFields();
        // override default values for create form
        for (var i = 0; i < $scope.formFields.length; i++) {
            if ($scope.formFields[i].key == "identifier") {
               $scope.formFields[i].hide = true;
            }
            if ($scope.formFields[i].key == "text") {
               // set  preamble config value as default text
               $scope.formFields[i].defaultValue = Config.get('motions_preamble').value;
            }
            if ($scope.formFields[i].key == "workflow_id") {
               // preselect default workflow
               $scope.formFields[i].defaultValue = Config.get('motions_workflow').value;
            }
        }
        $scope.save = function (motion) {
            Motion.create(motion).then(
                function(success) {
                    $state.go('motions.motion.list');
                }
            );
        };
    }
])

.controller('MotionUpdateCtrl', [
    '$scope',
    '$state',
    'gettext',
    'Motion',
    'Category',
    'Config',
    'Mediafile',
    'MotionFormFieldFactory',
    'Tag',
    'User',
    'Workflow',
    'motion',
    function($scope, $state, gettext, Motion, Category, Config, Mediafile, MotionFormFieldFactory, Tag, User, Workflow, motion) {
        Category.bindAll({}, $scope, 'categories');
        Mediafile.bindAll({}, $scope, 'mediafiles');
        Tag.bindAll({}, $scope, 'tags');
        User.bindAll({}, $scope, 'users');
        Workflow.bindAll({}, $scope, 'workflows');

        // set initial values for form model
        $scope.model = motion;
        $scope.model.more = false;
        // get all form fields
        $scope.formFields = MotionFormFieldFactory.getFormFields();
        // override default values for update form
        for (var i = 0; i < $scope.formFields.length; i++) {
            if ($scope.formFields[i].key == "identifier") {
                // show identifier field
               $scope.formFields[i].hide = false;
            }
            if ($scope.formFields[i].key == "title") {
                // get title of latest version
                $scope.formFields[i].defaultValue = motion.getTitle(-1);
            }
            if ($scope.formFields[i].key == "text") {
                // get text of latest version
                $scope.formFields[i].defaultValue = motion.getText(-1);
            }
            if ($scope.formFields[i].key == "reason") {
                // get reason of latest version
                $scope.formFields[i].defaultValue = motion.getReason(-1);
            }
            if ($scope.formFields[i].key == "workflow_id") {
               // get saved workflow id from state
               $scope.formFields[i].defaultValue = motion.state.workflow_id;
            }
       }

        // save form
        $scope.save = function (model) {
            Motion.save(model)
                .then(function(success) {
                    $state.go('motions.motion.detail', {id: motion.id});
                })
                .catch(function(fallback) {
                    //TODO: show error in GUI
                    console.log(fallback);
                });
        };
    }
])

.controller('MotionCSVImportCtrl', function($scope, Motion) {
    // TODO
})

.controller('CategoryListCtrl', function($scope, Category) {
    Category.bindAll({}, $scope, 'categories');

    // delete selected category
    $scope.delete = function (category) {
        Category.destroy(category.id);
    };
})

.controller('CategoryDetailCtrl', function($scope, Category, category) {
    Category.bindOne(category.id, $scope, 'category');
})

.controller('CategoryCreateCtrl', function($scope, $state, Category) {
    $scope.category = {};
    $scope.save = function (category) {
        Category.create(category).then(
            function(success) {
                $state.go('motions.category.list');
            }
        );
    };
})

.controller('CategoryUpdateCtrl', function($scope, $state, Category, category) {
    $scope.category = category;
    $scope.save = function (category) {
        Category.save(category).then(
            function(success) {
                $state.go('motions.category.list');
            }
        );
    };
});

angular.module('OpenSlidesApp.motions.projector', ['OpenSlidesApp.motions'])

.config(function(slidesProvider) {
    slidesProvider.registerSlide('motions/motion', {
        template: 'static/templates/motions/slide_motion.html',
    });
})

.controller('SlideMotionCtrl', function($scope, Motion) {
    // Attention! Each object that is used here has to be dealt on server side.
    // Add it to the coresponding get_requirements method of the ProjectorElement
    // class.
    var id = $scope.element.id;
    Motion.find(id);
    Motion.bindOne(id, $scope, 'motion');
});
