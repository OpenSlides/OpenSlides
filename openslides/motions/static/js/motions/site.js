(function () {

'use strict';

angular.module('OpenSlidesApp.motions.site', [
    'OpenSlidesApp.motions',
    'OpenSlidesApp.motions.motionservices',
    'OpenSlidesApp.poll.majority',
    'OpenSlidesApp.core.pdf',
    'OpenSlidesApp.motions.docx',
    'OpenSlidesApp.motions.pdf',
    'OpenSlidesApp.motions.csv',
])

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

.config([
    'SearchProvider',
    'gettext',
    function (SearchProvider, gettext) {
        SearchProvider.register({
            'verboseName': gettext('Motions'),
            'collectionName': 'motions/motion',
            'urlDetailState': 'motions.motion.detail',
            'weight': 300,
        });
    }
])

.config([
    '$stateProvider',
    'gettext',
    function($stateProvider, gettext) {
        $stateProvider
            .state('motions', {
                url: '/motions',
                abstract: true,
                template: "<ui-view/>",
                data: {
                    title: gettext('Motions'),
                    basePerm: 'motions.can_see',
                },
            })
            .state('motions.motion', {
                abstract: true,
                template: "<ui-view/>",
            })
            .state('motions.motion.list', {})
            .state('motions.motion.detail', {
                resolve: {
                    motionId: ['$stateParams', function($stateParams) {
                        return $stateParams.id;
                    }],
                }
            })
            // redirects to motion detail and opens motion edit form dialog, uses edit url,
            // used by ui-sref links from agenda only
            // (from motion controller use MotionForm factory instead to open dialog in front of
            // current view without redirect)
            .state('motions.motion.detail.update', {
                onEnter: ['$stateParams', '$state', 'ngDialog', 'Motion',
                    function($stateParams, $state, ngDialog, Motion) {
                        ngDialog.open({
                            template: 'static/templates/motions/motion-form.html',
                            controller: 'MotionUpdateCtrl',
                            className: 'ngdialog-theme-default wide-form',
                            closeByEscape: false,
                            closeByDocument: false,
                            resolve: {
                                motionId: function () {return $stateParams.id;},
                            },
                            preCloseCallback: function () {
                                $state.go('motions.motion.detail', {motion: $stateParams.id});
                                return true;
                            }
                        });
                    }
                ]
            })
            .state('motions.motion.import', {
                url: '/import',
                controller: 'MotionImportCtrl',
            })
            // categories
            .state('motions.category', {
                url: '/category',
                abstract: true,
                template: "<ui-view/>",
                data: {
                    title: gettext('Categories'),
                },
            })
            .state('motions.category.list', {})
            .state('motions.category.create', {})
            .state('motions.category.detail', {
                resolve: {
                    categoryId: ['$stateParams', function($stateParams) {
                        return $stateParams.id;
                    }]
                }
            })
            .state('motions.category.detail.update', {
                views: {
                    '@motions.category': {}
                }
            })
            .state('motions.category.sort', {
                url: '/sort/{id}',
                controller: 'CategorySortCtrl',
                templateUrl: 'static/templates/motions/category-sort.html',
                resolve: {
                    categoryId: ['$stateParams', function($stateParams) {
                        return $stateParams.id;
                    }],
                },
            })
            // MotionBlock
            .state('motions.motionBlock', {
                url: '/blocks',
                abstract: true,
                template: '<ui-view/>',
                data: {
                    title: gettext('Motion blocks'),
                },
            })
            .state('motions.motionBlock.list', {})
            .state('motions.motionBlock.detail', {
                resolve: {
                    motionBlockId: ['$stateParams', function($stateParams) {
                        return $stateParams.id;
                    }],
                }
            })
            // redirects to motionBlock detail and opens motionBlock edit form dialog, uses edit url,
            // used by ui-sref links from agenda only
            // (from motionBlock controller use MotionBlockForm factory instead to open dialog in front
            // of current view without redirect)
            .state('motions.motionBlock.detail.update', {
                onEnter: ['$stateParams', '$state', 'ngDialog',
                    function($stateParams, $state, ngDialog) {
                        ngDialog.open({
                            template: 'static/templates/motions/motion-block-form.html',
                            controller: 'MotionBlockUpdateCtrl',
                            className: 'ngdialog-theme-default wide-form',
                            closeByEscape: false,
                            closeByDocument: false,
                            resolve: {
                                motionBlockId: function () {
                                    return $stateParams.id;
                                }
                            },
                            preCloseCallback: function() {
                                $state.go('motions.motionBlock.detail', {motionBlock: $stateParams.id});
                                return true;
                            }
                        });
                    }
                ],
            });
    }
])

.factory('ChangeRecommendationForm', [
    'gettextCatalog',
    'Editor',
    'Config',
    function(gettextCatalog, Editor, Config) {
        return {
            // ngDialog for motion form
            getCreateDialog: function (motion, version, lineFrom, lineTo) {
                return {
                    template: 'static/templates/motions/change-recommendation-form.html',
                    controller: 'ChangeRecommendationCreateCtrl',
                    className: 'ngdialog-theme-default wide-form',
                    closeByEscape: false,
                    closeByDocument: false,
                    resolve: {
                        motion: function() {
                            return motion;
                        },
                        version: function() {
                            return version;
                        },
                        lineFrom: function() {
                            return lineFrom;
                        },
                        lineTo: function() {
                            return lineTo;
                        }
                    }
                };
            },
            getEditDialog: function(change) {
                return {
                    template: 'static/templates/motions/change-recommendation-form.html',
                    controller: 'ChangeRecommendationUpdateCtrl',
                    className: 'ngdialog-theme-default wide-form',
                    closeByEscape: false,
                    closeByDocument: false,
                    resolve: {
                        change: function() {
                            return change;
                        }
                    }
                };
            },
            // angular-formly fields for motion form
            getFormFields: function (line_from, line_to) {
                return [
                    {
                        key: 'identifier',
                        type: 'input',
                        templateOptions: {
                            label: gettextCatalog.getString('Identifier')
                        },
                        hide: true
                    },
                    {
                        key: 'motion_version_id',
                        type: 'input',
                        templateOptions: {
                            label: gettextCatalog.getString('Motion')
                        },
                        hide: true
                    },
                    {
                        key: 'line_from',
                        type: 'input',
                        templateOptions: {
                            label: gettextCatalog.getString('From Line')
                        },
                        hide: true
                    },
                    {
                        key: 'line_to',
                        type: 'input',
                        templateOptions: {
                            label: gettextCatalog.getString('To Line')
                        },
                        hide: true
                    },
                    {
                        key: 'type',
                        type: 'radio-buttons',
                        templateOptions: {
                            name: 'type',
                            options: [
                                {name: gettextCatalog.getString('Replacement'), value: 0},
                                {name: gettextCatalog.getString('Insertion'), value: 1},
                                {name: gettextCatalog.getString('Deletion'), value: 2}
                            ]
                        }
                    },
                    {
                        key: 'text',
                        type: 'editor',
                        templateOptions: {
                            label: (
                                line_from == line_to - 1 ?
                                gettextCatalog.getString('Text in line %from%').replace(/%from%/, line_from) :
                                gettextCatalog.getString('Text from line %from% to %to%')
                                  .replace(/%from%/, line_from).replace(/%to%/, line_to - 1)
                            ),
                            required: false
                        },
                        data: {
                            ckeditorOptions: Editor.getOptions()
                        }
                    }
                ];
            }
        };
    }
])

// Service for generic motion form (create and update)
.factory('MotionForm', [
    'gettextCatalog',
    'operator',
    'Editor',
    'MotionComment',
    'Category',
    'Config',
    'Mediafile',
    'MotionBlock',
    'Tag',
    'User',
    'Workflow',
    'Agenda',
    'AgendaTree',
    function (gettextCatalog, operator, Editor, MotionComment, Category, Config, Mediafile, MotionBlock, Tag, User, Workflow, Agenda, AgendaTree) {
        return {
            // ngDialog for motion form
            getDialog: function (motion) {
                return {
                    template: 'static/templates/motions/motion-form.html',
                    controller: motion ? 'MotionUpdateCtrl' : 'MotionCreateCtrl',
                    className: 'ngdialog-theme-default wide-form',
                    closeByEscape: false,
                    closeByDocument: false,
                    resolve: {
                        motionId: function () {return motion ? motion.id : void 0;},
                    },
                };
            },
            // angular-formly fields for motion form
            getFormFields: function (isCreateForm) {
                var workflows = Workflow.getAll();
                var images = Mediafile.getAllImages();
                var formFields = [
                {
                    key: 'identifier',
                    type: 'input',
                    templateOptions: {
                        label: gettextCatalog.getString('Identifier')
                    },
                    hide: true
                },
                {
                    key: 'submitters_id',
                    type: 'select-multiple',
                    templateOptions: {
                        label: gettextCatalog.getString('Submitters'),
                        options: User.getAll(),
                        ngOptions: 'option.id as option.full_name for option in to.options',
                        placeholder: gettextCatalog.getString('Select or search a submitter ...')
                    },
                    hide: !operator.hasPerms('motions.can_manage')
                },
                {
                    key: 'title',
                    type: 'input',
                    templateOptions: {
                        label: gettextCatalog.getString('Title'),
                        required: true
                    }
                },
                {
                    template: '<p class="spacer-top-lg no-padding">' + Config.translate(Config.get('motions_preamble').value) + '</p>'
                },
                {
                    key: 'text',
                    type: 'editor',
                    templateOptions: {
                        label: gettextCatalog.getString('Text'),
                        required: true
                    },
                    data: {
                        ckeditorOptions: Editor.getOptions(images)
                    }
                },
                {
                    key: 'reason',
                    type: 'editor',
                    templateOptions: {
                        label: gettextCatalog.getString('Reason'),
                    },
                    data: {
                        ckeditorOptions: Editor.getOptions(images)
                    }
                },
                {
                    key: 'disable_versioning',
                    type: 'checkbox',
                    templateOptions: {
                        label: gettextCatalog.getString('Trivial change'),
                        description: gettextCatalog.getString("Don't create a new version.")
                    },
                    hide: true
                },
                {
                    key: 'showAsAgendaItem',
                    type: 'checkbox',
                    templateOptions: {
                        label: gettextCatalog.getString('Show as agenda item'),
                        description: gettextCatalog.getString('If deactivated the motion appears as internal item on agenda.')
                    },
                    hide: !operator.hasPerms('motions.can_manage')
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

                // motion comments
                formFields = formFields.concat(MotionComment.getFormFields());

                // more
                formFields.push(
                    {
                        key: 'more',
                        type: 'checkbox',
                        templateOptions: {
                            label: gettextCatalog.getString('Show extended fields')
                        },
                        hide: !operator.hasPerms('motions.can_manage')
                    },
                    {
                        template: '<hr class="smallhr">',
                        hideExpression: '!model.more'
                    }
                );
                // attachments
                if (Mediafile.getAll().length > 0) {
                    formFields.push({
                        key: 'attachments_id',
                        type: 'select-multiple',
                        templateOptions: {
                            label: gettextCatalog.getString('Attachment'),
                            options: Mediafile.getAll(),
                            ngOptions: 'option.id as option.title_or_filename for option in to.options',
                            placeholder: gettextCatalog.getString('Select or search an attachment ...')
                        },
                        hideExpression: '!model.more'
                    });
                }
                // category
                if (Category.getAll().length > 0) {
                    formFields.push({
                        key: 'category_id',
                        type: 'select-single',
                        templateOptions: {
                            label: gettextCatalog.getString('Category'),
                            options: Category.getAll(),
                            ngOptions: 'option.id as option.name for option in to.options',
                            placeholder: gettextCatalog.getString('Select or search a category ...')
                        },
                        hideExpression: '!model.more'
                    });
                }
                // motion block
                if (MotionBlock.getAll().length > 0) {
                    formFields.push({
                        key: 'motion_block_id',
                        type: 'select-single',
                        templateOptions: {
                            label: gettextCatalog.getString('Motion block'),
                            options: MotionBlock.getAll(),
                            ngOptions: 'option.id as option.title for option in to.options',
                            placeholder: gettextCatalog.getString('Select or search a motion block ...')
                        },
                        hideExpression: '!model.more'
                    });
                }
                // origin
                formFields.push({
                    key: 'origin',
                    type: 'input',
                    templateOptions: {
                        label: gettextCatalog.getString('Origin'),
                    },
                    hideExpression: '!model.more'
                });
                // tags
                if (Tag.getAll().length > 0) {
                    formFields.push({
                        key: 'tags_id',
                        type: 'select-multiple',
                        templateOptions: {
                            label: gettextCatalog.getString('Tags'),
                            options: Tag.getAll(),
                            ngOptions: 'option.id as option.name for option in to.options',
                            placeholder: gettextCatalog.getString('Select or search a tag ...')
                        },
                        hideExpression: '!model.more'
                    });
                }
                // supporters
                if (Config.get('motions_min_supporters').value > 0) {
                    formFields.push({
                        key: 'supporters_id',
                        type: 'select-multiple',
                        templateOptions: {
                            label: gettextCatalog.getString('Supporters'),
                            options: User.getAll(),
                            ngOptions: 'option.id as option.full_name for option in to.options',
                            placeholder: gettextCatalog.getString('Select or search a supporter ...')
                        },
                        hideExpression: '!model.more'
                    });
                }
                // workflows
                if (workflows.length > 1) {
                    formFields.push({
                        key: 'workflow_id',
                        type: 'select-single',
                        templateOptions: {
                            label: gettextCatalog.getString('Workflow'),
                            optionsAttr: 'bs-options',
                            options: workflows,
                            ngOptions: 'option.id as option.name | translate for option in to.options',
                            placeholder: gettextCatalog.getString('Select or search a workflow ...')
                        },
                        hideExpression: '!model.more',
                    });
                }

                return formFields;
            }
        };
    }
])

// Provide generic motionpoll form fields for poll update view
.factory('MotionPollForm', [
    'gettextCatalog',
    function (gettextCatalog) {
        return {
            getFormFields: function () {
                return [
                {
                    key: 'yes',
                    type: 'input',
                    templateOptions: {
                        label: gettextCatalog.getString('Yes'),
                        type: 'number',
                        required: true
                    }
                },
                {
                    key: 'no',
                    type: 'input',
                    templateOptions: {
                        label: gettextCatalog.getString('No'),
                        type: 'number',
                        required: true
                    }
                },
                {
                    key: 'abstain',
                    type: 'input',
                    templateOptions: {
                        label: gettextCatalog.getString('Abstain'),
                        type: 'number',
                        required: true
                    }
                },
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
                }];
            }
        };
    }
])

// Cache for MotionPollDetailCtrl so that users choices are keeped during user actions (e. g. save poll form).
.value('MotionPollDetailCtrlCache', {})

// Child controller of MotionDetailCtrl for each single poll.
.controller('MotionPollDetailCtrl', [
    '$scope',
    'MajorityMethodChoices',
    'Config',
    'MotionPollDetailCtrlCache',
    function ($scope, MajorityMethodChoices, Config, MotionPollDetailCtrlCache) {
        // Define choices.
        $scope.methodChoices = MajorityMethodChoices;
        // TODO: Get $scope.baseChoices from config_variables.py without copying them.

        // Setup empty cache with default values.
        if (typeof MotionPollDetailCtrlCache[$scope.poll.id] === 'undefined') {
            MotionPollDetailCtrlCache[$scope.poll.id] = {
                method: $scope.config('motions_poll_default_majority_method'),
            };
        }

        // Fetch users choices from cache.
        $scope.method = MotionPollDetailCtrlCache[$scope.poll.id].method;

        // Define result function.
        $scope.isReached = function () {
            return $scope.poll.isReached($scope.method);
        };

        // Define template controll function
        $scope.hideMajorityCalculation = function () {
            return typeof $scope.isReached() === 'undefined' && $scope.method !== 'disabled';
        };

        // Save current values to cache on detroy of this controller.
        $scope.$on('$destroy', function() {
            MotionPollDetailCtrlCache[$scope.poll.id] = {
                method: $scope.method,
            };
        });
    }
])

.controller('MotionListCtrl', [
    '$scope',
    '$state',
    '$http',
    'gettext',
    'gettextCatalog',
    'ngDialog',
    'MotionForm',
    'Motion',
    'Category',
    'Tag',
    'Workflow',
    'User',
    'Agenda',
    'MotionBlock',
    'MotionCsvExport',
    'MotionDocxExport',
    'MotionContentProvider',
    'MotionCatalogContentProvider',
    'PdfMakeConverter',
    'PdfMakeDocumentProvider',
    'HTMLValidizer',
    'Projector',
    'ProjectionDefault',
    'osTableFilter',
    'osTableSort',
    'PdfCreate',
    function($scope, $state, $http, gettext, gettextCatalog, ngDialog, MotionForm, Motion,
                Category, Tag, Workflow, User, Agenda, MotionBlock, MotionCsvExport, MotionDocxExport,
                MotionContentProvider, MotionCatalogContentProvider, PdfMakeConverter, PdfMakeDocumentProvider,
                HTMLValidizer, Projector, ProjectionDefault, osTableFilter, osTableSort, PdfCreate) {
        Motion.bindAll({}, $scope, 'motions');
        Category.bindAll({}, $scope, 'categories');
        MotionBlock.bindAll({}, $scope, 'motionBlocks');
        Tag.bindAll({}, $scope, 'tags');
        Workflow.bindAll({}, $scope, 'workflows');
        User.bindAll({}, $scope, 'users');
        Projector.bindAll({}, $scope, 'projectors');
        $scope.$watch(function () {
            return Projector.lastModified();
        }, function () {
            var projectiondefault = ProjectionDefault.filter({name: 'motions'})[0];
            if (projectiondefault) {
                $scope.defaultProjectorId = projectiondefault.projector_id;
            }
        });
        $scope.alert = {};

        // collect all states and all recommendations of all workflows
        $scope.states = [];
        $scope.recommendations = [];
        var workflows = Workflow.getAll();
        _.forEach(workflows, function (workflow) {
            var workflowHeader = {
                headername: workflow.name,
                workflowHeader: true,
            };
            $scope.states.push(workflowHeader);
            $scope.recommendations.push(workflowHeader);
            _.forEach(workflow.states, function (state) {
                $scope.states.push(state);
                if (state.recommendation_label) {
                    $scope.recommendations.push(state);
                }
            });
        });

        $scope.stateFilter = [];
        var updateStateFilter = function () {
            if (_.indexOf($scope.filter.multiselectFilters.state, -1) > -1) { // contains -1
                $scope.stateFilter = _.filter($scope.filter.multiselectFilters.state, function (id) {
                    return id >= 0;
                }); // remove -1
                _.forEach($scope.states, function (state) {
                    if (!state.workflowHeader) {
                        if (state.getNextStates().length === 0) { // done state
                            $scope.stateFilter.push(state.id);
                        }
                    }
                });
            } else {
                $scope.stateFilter = _.clone($scope.filter.multiselectFilters.state);
            }
        };

        // Filtering
        $scope.filter = osTableFilter.createInstance('MotionTableFilter');

        if (!$scope.filter.existsStorageEntry()) {
            $scope.filter.multiselectFilters = {
                state: [],
                category: [],
                motionBlock: [],
                tag: [],
                recommendation: [],
            };
        }
        updateStateFilter();
        $scope.filter.propertyList = ['identifier', 'origin'];
        $scope.filter.propertyFunctionList = [
            function (motion) {return motion.getTitle();},
            function (motion) {return motion.getText();},
            function (motion) {return motion.getReason();},
            function (motion) {return motion.category ? motion.category.name : '';},
            function (motion) {return motion.motionBlock ? motion.motionBlock.name : '';},
            function (motion) {return motion.recommendation ? motion.getRecommendationName() : '';},
        ];
        $scope.filter.propertyDict = {
            'submitters' : function (submitter) {
                return submitter.get_short_name();
            },
            'supporters' : function (submitter) {
                return supporter.get_short_name();
            },
            'tags' : function (tag) {
                return tag.name;
            },
        };
        $scope.getItemId = {
            state: function (motion) {return motion.state_id;},
            category: function (motion) {return motion.category_id;},
            motionBlock: function (motion) {return motion.motion_block_id;},
            tag: function (motion) {return motion.tags_id;},
            recommendation: function (motion) {return motion.recommendation_id;},
        };
        $scope.operateStateFilter = function (id, danger) {
            $scope.filter.operateMultiselectFilter('state', id, danger);
            updateStateFilter();
        };
        $scope.resetFilters = function () {
            $scope.filter.reset();
            updateStateFilter();
        };
        // Sorting
        $scope.sort = osTableSort.createInstance();
        $scope.sort.column = 'identifier';
        $scope.sortOptions = [
            {name: 'identifier',
             display_name: gettext('Identifier')},
            {name: 'getTitle()',
             display_name: gettext('Title')},
            {name: 'submitters',
             display_name: gettext('Submitters')},
            {name: 'category.name',
             display_name: gettext('Category')},
            {name: 'motionBlock.title',
             display_name: gettext('Motion block')},
            {name: 'state.name',
             display_name: gettext('State')},
            {name: 'log_messages[log_messages.length-1].time',
             display_name: gettext('Creation date')},
            {name: 'log_messages[0].time',
             display_name: gettext('Last modified')},
        ];

        // pagination
        $scope.currentPage = 1;
        $scope.itemsPerPage = 25;
        $scope.limitBegin = 0;
        $scope.pageChanged = function() {
            $scope.limitBegin = ($scope.currentPage - 1) * $scope.itemsPerPage;
        };


        // update state
        $scope.updateState = function (motion, state_id) {
            $http.put('/rest/motions/motion/' + motion.id + '/set_state/', {'state': state_id});
        };
        // reset state
        $scope.resetState = function (motion) {
            $http.put('/rest/motions/motion/' + motion.id + '/set_state/', {});
        };
        // update recommendation
        $scope.updateRecommendation = function (motion, recommendation_id) {
            $http.put('/rest/motions/motion/' + motion.id + '/set_recommendation/', {'recommendation': recommendation_id});
        };
        // reset recommendation
        $scope.resetRecommendation = function (motion) {
            $http.put('/rest/motions/motion/' + motion.id + '/set_recommendation/', {});
        };

        $scope.hasTag = function (motion, tag) {
            return _.indexOf(motion.tags_id, tag.id) > -1;
        };

        // Use this methon instead of Motion.save(), because otherwise
        // you have to provide always a title and a text
        $scope.save = function (motion) {
            motion.title = motion.getTitle(-1);
            motion.text = motion.getText(-1);
            motion.reason = motion.getReason(-1);
            Motion.save(motion);
        };
        // delete single motion
        $scope.delete = function (motion) {
            Motion.destroy(motion.id);
        };
        $scope.toggleTag = function (motion, tag) {
            if ($scope.hasTag(motion, tag)) {
                // remove
                motion.tags_id = _.filter(motion.tags_id, function (tag_id){
                    return tag_id != tag.id;
                });
            } else {
                motion.tags_id.push(tag.id);
            }
            $scope.save(motion);
        };
        $scope.toggleCategory = function (motion, category) {
            if (motion.category_id == category.id) {
                motion.category_id = null;
            } else {
                motion.category_id = category.id;
            }
            $scope.save(motion);
        };
        $scope.toggleMotionBlock = function (motion, block) {
            if (motion.motion_block_id == block.id) {
                motion.motion_block_id = null;
            } else {
                motion.motion_block_id = block.id;
            }
            $scope.save(motion);
        };

        // open new/edit dialog
        $scope.openDialog = function (motion) {
            ngDialog.open(MotionForm.getDialog(motion));
        };

        // Export as a pdf file
        $scope.pdfExport = function() {
            var filename = gettextCatalog.getString("Motions") + ".pdf";
            var image_sources = [];

            //save the arrays of the filtered motions to an array
            angular.forEach($scope.motionsFiltered, function (motion) {
                var content = HTMLValidizer.validize(motion.getText($scope.version)) + HTMLValidizer.validize(motion.getReason($scope.version));
                var map = Function.prototype.call.bind([].map);
                var tmp_image_sources = map($(content).find("img"), function(element) {
                    return element.getAttribute("src");
                });
                image_sources = image_sources.concat(tmp_image_sources);
            });

            //post-request to convert the images. Async.
            $http.post('/core/encode_media/', JSON.stringify(image_sources)).success(function(data) {
                var converter = PdfMakeConverter.createInstance(data.images);
                var motionContentProviderArray = [];

                //convert the filtered motions to motionContentProviders
                angular.forEach($scope.motionsFiltered, function (motion) {
                    motionContentProviderArray.push(MotionContentProvider.createInstance(converter, motion, $scope, User, $http));
                });
                var motionCatalogContentProvider = MotionCatalogContentProvider.createInstance(motionContentProviderArray, $scope, User, Category);
                var documentProvider = PdfMakeDocumentProvider.createInstance(motionCatalogContentProvider);

                PdfCreate.download(documentProvider.getDocument(), filename);
            });
        };

        // Export as a csv file
        $scope.csvExport = function () {
            MotionCsvExport.export($scope.motionsFiltered);
        };
        // Export as docx file
        $scope.docxExport = function () {
            MotionDocxExport.export($scope.motionsFiltered, $scope.categories);
        };

        // *** select mode functions ***
        $scope.isSelectMode = false;
        // check all checkboxes from filtered motions
        $scope.checkAll = function () {
            $scope.selectedAll = !$scope.selectedAll;
            angular.forEach($scope.motionsFiltered, function (motion) {
                motion.selected = $scope.selectedAll;
            });
        };
        // uncheck all checkboxes if isSelectMode is closed
        $scope.uncheckAll = function () {
            if (!$scope.isSelectMode) {
                $scope.selectedAll = false;
                angular.forEach($scope.motions, function (motion) {
                    motion.selected = false;
                });
            }
        };
        var selectModeAction = function (predicate) {
            angular.forEach($scope.motionsFiltered, function (motion) {
                if (motion.selected) {
                    predicate(motion);
                }
            });
            $scope.isSelectMode = false;
            $scope.uncheckAll();
        };
        // delete selected motions
        $scope.deleteMultiple = function () {
            selectModeAction(function (motion) {
                $scope.delete(motion);
            });
        };
        // set status for selected motions
        $scope.setStatusMultiple = function (stateId) {
            selectModeAction(function (motion) {
                $scope.updateState(motion, stateId);
            });
        };
        // set category for selected motions
        $scope.setCategoryMultiple = function (categoryId) {
            selectModeAction(function (motion) {
                motion.category_id = categoryId === 'no_category_selected' ? null : categoryId;
                $scope.save(motion);
            });
        };
        // set status for selected motions
        $scope.setMotionBlockMultiple = function (motionBlockId) {
            selectModeAction(function (motion) {
                motion.motion_block_id = motionBlockId === 'no_motionBlock_selected' ? null : motionBlockId;
                $scope.save(motion);
            });
        };
    }
])

.controller('MotionDetailCtrl', [
    '$scope',
    '$http',
    'operator',
    'ngDialog',
    'MotionForm',
    'ChangeRecommmendationCreate',
    'ChangeRecommmendationView',
    'MotionChangeRecommendation',
    'MotionPDFExport',
    'Motion',
    'MotionComment',
    'Category',
    'Mediafile',
    'Tag',
    'User',
    'Workflow',
    'Config',
    'motionId',
    'MotionInlineEditing',
    'MotionCommentsInlineEditing',
    'Projector',
    'ProjectionDefault',
    function($scope, $http, operator, ngDialog, MotionForm,
             ChangeRecommmendationCreate, ChangeRecommmendationView, MotionChangeRecommendation, MotionPDFExport,
             Motion, MotionComment, Category, Mediafile, Tag, User, Workflow, Config, motionId, MotionInlineEditing,
             MotionCommentsInlineEditing, Projector, ProjectionDefault) {
        var motion = Motion.get(motionId);
        Category.bindAll({}, $scope, 'categories');
        Mediafile.bindAll({}, $scope, 'mediafiles');
        Tag.bindAll({}, $scope, 'tags');
        User.bindAll({}, $scope, 'users');
        Workflow.bindAll({}, $scope, 'workflows');
        $scope.$watch(function () {
            return MotionChangeRecommendation.lastModified();
        }, function () {
            $scope.change_recommendations = MotionChangeRecommendation.filter({
                'where': {'motion_version_id': {'==': motion.active_version}}
            });
            if ($scope.change_recommendations.length === 0) {
                $scope.setProjectionMode($scope.projectionModes[0]);
            }
            if ($scope.change_recommendations.length > 0) {
                $scope.inlineEditing.disable();
            }
        });
        $scope.$watch(function () {
            return Projector.lastModified();
        }, function () {
            $scope.projectors = Projector.getAll();
            $scope.defaultProjectorId = ProjectionDefault.filter({name: 'motions'})[0].projector_id;
        });
        $scope.$watch(function () {
            return Motion.lastModified(motionId);
        }, function () {
            $scope.motion = Motion.get(motionId);
            MotionComment.populateFields($scope.motion);
        });
        $scope.projectionModes = [
            {mode: 'original',
            label: 'Original version'},
            {mode: 'changed',
            label: 'Changed version'},
            {mode: 'diff',
            label: 'Diff version'},
            {mode: 'agreed',
            label: 'Resolution'},
        ];
        $scope.projectionMode = $scope.projectionModes[0];
        if (motion.isProjected().length) {
            var modeMapping = motion.isProjectedWithMode();
            _.forEach($scope.projectionModes, function (mode) {
                if (mode.mode === modeMapping[0].mode) {
                    $scope.projectionMode = mode;
                }
            });
        }
        $scope.setProjectionMode = function (mode) {
            $scope.projectionMode = mode;
            var isProjected = motion.isProjectedWithMode();
            if (isProjected.length) {
                _.forEach(isProjected, function (mapping) {
                    if (mapping.mode != mode.mode) { // change the mode if it is different
                        motion.project(mapping.projectorId, mode.mode);
                    }
                });
            }
        };
        $scope.commentsFields = Config.get('motions_comments').value;
        $scope.commentFieldForState = MotionComment.getFieldNameForFlag('forState');
        $scope.commentFieldForRecommendation = MotionComment.getFieldNameForFlag('forRecommendation');
        $scope.version = motion.active_version;
        $scope.isCollapsed = true;
        $scope.lineNumberMode = Config.get('motions_default_line_numbering').value;
        $scope.setLineNumberMode = function(mode) {
            $scope.lineNumberMode = mode;
        };

        if (motion.parent_id) {
            Motion.bindOne(motion.parent_id, $scope, 'parent');
        }
        $scope.amendments = Motion.filter({parent_id: motion.id});

        $scope.highlight = 0;
        $scope.linesForProjector = false;
        // Set 0 for disable highlighting on projector
        var setHighlightOnProjector = function (line) {
            _.forEach(Projector.getAll(), function (projector) {
                var elements = _.map(projector.elements, function(element) { return element; });
                elements.forEach(function (element) {
                    if (element.name == 'motions/motion' && element.id == motion.id) {
                        var data = {};
                        data[element.uuid] = {
                            highlightAndScroll: line,
                        };
                        $http.post('/rest/core/projector/' + projector.id + '/update_elements/', data);
                    }
                });
            });
        };
        $scope.scrollToAndHighlight = function (line) {
            $scope.highlight = line;

            // The same line number can occur twice in diff view; we scroll to the first one in this case
            var scrollTop = null;
            $(".line-number-" + line).each(function() {
                var top = $(this).offset().top;
                if (top > 0 && (scrollTop === null || top < scrollTop)) {
                    scrollTop = top;
                }
            });

            if (scrollTop) {
                // Scroll local; 50 pixel above the line, so it's not completely squeezed to the screen border
                $('html, body').animate({
                    'scrollTop': scrollTop - 50
                }, 1000);
            }
            // set highlight and scroll on Projector
            setHighlightOnProjector($scope.linesForProjector ? line : 0);
        };
        $scope.toggleLinesForProjector = function () {
            $scope.linesForProjector = !$scope.linesForProjector;
            setHighlightOnProjector($scope.linesForProjector ? $scope.highlight : 0);
        };

        // open edit dialog
        $scope.openDialog = function (motion) {
            if ($scope.inlineEditing.active) {
                $scope.inlineEditing.disable();
            }
            ngDialog.open(MotionForm.getDialog(motion));
        };
        // support
        $scope.support = function () {
            $http.post('/rest/motions/motion/' + motion.id + '/support/');
        };
        // unsupport
        $scope.unsupport = function () {
            $http.delete('/rest/motions/motion/' + motion.id + '/support/');
        };
        // open dialog for new amendment
        $scope.newAmendment = function () {
            var dialog = MotionForm.getDialog();
            if (typeof dialog.scope === 'undefined') {
                dialog.scope = {};
            }
            dialog.scope = $scope;
            ngDialog.open(dialog);
        };
        // update state
        $scope.updateState = function (state_id) {
            $http.put('/rest/motions/motion/' + motion.id + '/set_state/', {'state': state_id});
        };
        // reset state
        $scope.reset_state = function () {
            $http.put('/rest/motions/motion/' + motion.id + '/set_state/', {});
        };
        // save additional state field
        $scope.saveAdditionalStateField = function (stateExtension) {
            if (stateExtension) {
                motion["comment " + $scope.commentFieldForState] = stateExtension;
                motion.title = motion.getTitle(-1);
                motion.text = motion.getText(-1);
                motion.reason = motion.getReason(-1);
                Motion.save(motion);
            }
        };
        // save additional recommendation field
        $scope.saveAdditionalRecommendationField = function (recommendationExtension) {
            if (recommendationExtension) {
                motion["comment " + $scope.commentFieldForRecommendation] = recommendationExtension;
                motion.title = motion.getTitle(-1);
                motion.text = motion.getText(-1);
                motion.reason = motion.getReason(-1);
                Motion.save(motion);
            }
        };
        // update recommendation
        $scope.updateRecommendation = function (recommendation_id) {
            $http.put('/rest/motions/motion/' + motion.id + '/set_recommendation/', {'recommendation': recommendation_id});
        };
        // reset recommendation
        $scope.resetRecommendation = function () {
            $http.put('/rest/motions/motion/' + motion.id + '/set_recommendation/', {});
        };
        // create poll
        $scope.create_poll = function () {
            $http.post('/rest/motions/motion/' + motion.id + '/create_poll/', {});
        };
        // open poll update dialog
        $scope.openPollDialog = function (poll, voteNumber) {
            ngDialog.open({
                template: 'static/templates/motions/motionpoll-form.html',
                controller: 'MotionPollUpdateCtrl',
                className: 'ngdialog-theme-default',
                closeByEscape: false,
                closeByDocument: false,
                resolve: {
                    motionpollId: function () {
                        return poll.id;
                    },
                    voteNumber: function () {
                        return voteNumber;
                    }
                }
            });
        };
        // delete poll
        $scope.delete_poll = function (poll) {
            poll.DSDestroy();
        };
        // show specific version
        $scope.showVersion = function (version) {
            $scope.version = version.id;
            $scope.inlineEditing.setVersion(motion, version.id);
            $scope.createChangeRecommendation.setVersion(motion, version.id);
        };
        // permit specific version
        $scope.permitVersion = function (version) {
            $http.put('/rest/motions/motion/' + motion.id + '/manage_version/',
                {'version_number': version.version_number})
                .then(function(success) {
                    $scope.showVersion(version);
                });
        };
        // delete specific version
        $scope.deleteVersion = function (version) {
            $http.delete('/rest/motions/motion/' + motion.id + '/manage_version/',
                    {headers: {'Content-Type': 'application/json'},
                     data: JSON.stringify({version_number: version.version_number})})
                .then(function(success) {
                    $scope.showVersion(motion.active_version);
                });
        };
        // check if user is allowed to see at least one comment field
        $scope.isAllowedToSeeCommentField = function () {
            var isAllowed = false;
            if ($scope.commentsFields.length > 0) {
                isAllowed = operator.hasPerms('motions.can_see_and_manage_comments') || _.find(
                        $scope.commentsFields,
                        function(field) {
                            return field.public && !field.forState && !field.forRecommendation;
                        }
                );
            }
            return Boolean(isAllowed);
        };

        // Inline editing functions
        $scope.inlineEditing = MotionInlineEditing.createInstance($scope, motion,
            'view-original-text-inline-editor', true,
            function (obj) {
                return motion.getTextWithLineBreaks($scope.version);
            },
            function (obj) {
                motion.reason = motion.getReason(-1);
                motion.setTextStrippingLineBreaks(obj.editor.getData());
                motion.disable_versioning = (obj.trivialChange && Config.get('motions_allow_disable_versioning').value);
            }
        );
        $scope.commentsInlineEditing = MotionCommentsInlineEditing.createInstances($scope, motion);

        // Change recommendation creation functions
        $scope.createChangeRecommendation = ChangeRecommmendationCreate;
        $scope.createChangeRecommendation.init($scope, motion);

        // Change recommendation viewing
        $scope.viewChangeRecommendations = ChangeRecommmendationView;
        $scope.viewChangeRecommendations.init($scope, 'original');

        // PDF creating functions
        $scope.pdfExport = MotionPDFExport;
        $scope.pdfExport.init($scope);
    }
])

.controller('ChangeRecommendationUpdateCtrl', [
    '$scope',
    'MotionChangeRecommendation',
    'ChangeRecommendationForm',
    'change',
    function ($scope, MotionChangeRecommendation, ChangeRecommendationForm, change) {
        $scope.alert = {};
        $scope.model = angular.copy(change);

        // get all form fields
        $scope.formFields = ChangeRecommendationForm.getFormFields(change.line_from, change.line_to);
        // save motion
        $scope.save = function (change) {
            // inject the changed change recommendation (copy) object back into DS store
            MotionChangeRecommendation.inject(change);
            // save changed change recommendation object on server
            MotionChangeRecommendation.save(change, { method: 'PATCH' }).then(
                function(success) {
                    $scope.closeThisDialog();
                },
                function (error) {
                    MotionChangeRecommendation.refresh(change);
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

.controller('ChangeRecommendationCreateCtrl', [
    '$scope',
    'Motion',
    'MotionChangeRecommendation',
    'ChangeRecommendationForm',
    'Config',
    'diffService',
    'motion',
    'version',
    'lineFrom',
    'lineTo',
    function($scope, Motion, MotionChangeRecommendation, ChangeRecommendationForm, Config, diffService, motion,
             version, lineFrom, lineTo) {
        $scope.alert = {};

        var html = motion.getTextWithLineBreaks(version),
            lineData = diffService.extractRangeByLineNumbers(html, lineFrom, lineTo);

        $scope.model = {
            text: lineData.outerContextStart + lineData.innerContextStart +
                lineData.html + lineData.innerContextEnd + lineData.outerContextEnd,
            line_from: lineFrom,
            line_to: lineTo,
            motion_version_id: version,
            type: 0
        };

        // get all form fields
        $scope.formFields = ChangeRecommendationForm.getFormFields(lineFrom, lineTo);
        // save motion
        $scope.save = function (motion) {
            MotionChangeRecommendation.create(motion).then(
                function(success) {
                    $scope.closeThisDialog();
                }
            );
        };
    }
])

.controller('MotionCreateCtrl', [
    '$scope',
    '$state',
    'gettext',
    'gettextCatalog',
    'operator',
    'Motion',
    'MotionForm',
    'Category',
    'Config',
    'Mediafile',
    'Tag',
    'User',
    'Workflow',
    'Agenda',
    'AgendaUpdate',
    function($scope, $state, gettext, gettextCatalog, operator, Motion, MotionForm,
        Category, Config, Mediafile, Tag, User, Workflow, Agenda, AgendaUpdate) {
        Category.bindAll({}, $scope, 'categories');
        Mediafile.bindAll({}, $scope, 'mediafiles');
        Tag.bindAll({}, $scope, 'tags');
        User.bindAll({}, $scope, 'users');
        Workflow.bindAll({}, $scope, 'workflows');

        $scope.model = {};

        // Check whether this is a new amendment.
        var isAmendment = $scope.$parent.motion && $scope.$parent.motion.id;

        // Set default values for create form
        // ... for amendments add parent_id
        if (isAmendment) {
            if (Config.get('motions_amendments_apply_text').value) {
                $scope.model.text = $scope.$parent.motion.getText();
            }
            $scope.model.title = $scope.$parent.motion.getTitle();
            $scope.model.parent_id = $scope.$parent.motion.id;
            $scope.model.category_id = $scope.$parent.motion.category_id;
            $scope.model.motion_block_id = $scope.$parent.motion.motion_block_id;
            Motion.bindOne($scope.model.parent_id, $scope, 'parent');
        }
        // ... preselect default workflow
        if (operator.hasPerms('motions.can_manage')) {
            $scope.model.workflow_id = Config.get('motions_workflow').value;
        }
        // get all form fields
        $scope.formFields = MotionForm.getFormFields(true);

        // save motion
        $scope.save = function (motion) {
            Motion.create(motion).then(
                function(success) {
                    // type: Value 1 means a non hidden agenda item, value 2 means a hidden agenda item,
                    // see openslides.agenda.models.Item.ITEM_TYPE.
                    var changes = [{key: 'type', value: (motion.showAsAgendaItem ? 1 : 2)},
                                   {key: 'parent_id', value: motion.agenda_parent_item_id}];
                    AgendaUpdate.saveChanges(success.agenda_item_id, changes);
                    if (isAmendment) {
                        $state.go('motions.motion.detail', {id: success.id});
                    }
                    $scope.closeThisDialog();
                }
            );
        };
    }
])

.controller('MotionUpdateCtrl', [
    '$scope',
    'Motion',
    'Category',
    'Config',
    'Mediafile',
    'MotionForm',
    'Tag',
    'User',
    'Workflow',
    'Agenda',
    'AgendaUpdate',
    'motionId',
    function($scope, Motion, Category, Config, Mediafile, MotionForm, Tag, User, Workflow, Agenda, AgendaUpdate, motionId) {
        Category.bindAll({}, $scope, 'categories');
        Mediafile.bindAll({}, $scope, 'mediafiles');
        Tag.bindAll({}, $scope, 'tags');
        User.bindAll({}, $scope, 'users');
        Workflow.bindAll({}, $scope, 'workflows');
        $scope.alert = {};

        // set initial values for form model by create deep copy of motion object
        // so list/detail view is not updated while editing
        var motion = Motion.get(motionId);
        $scope.model = angular.copy(motion);
        $scope.model.disable_versioning = false;
        $scope.model.more = false;

        // get all form fields
        $scope.formFields = MotionForm.getFormFields();
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
            if ($scope.formFields[i].key == "disable_versioning") {
                if (Config.get('motions_allow_disable_versioning').value && motion.state.versioning) {
                    // check current state if versioning is active
                    $scope.formFields[i].hide = false;
                }
            }
            if ($scope.formFields[i].key == "showAsAgendaItem") {
                // get state from agenda item (hidden/internal or agenda item)
                $scope.formFields[i].defaultValue = !motion.agenda_item.is_hidden;
            }
            if ($scope.formFields[i].key == "workflow_id") {
               // get saved workflow id from state
               $scope.formFields[i].defaultValue = motion.state.workflow_id;
            }
            if ($scope.formFields[i].key == "agenda_parent_item_id") {
                // get current parent_id of the agenda item
                $scope.formFields[i].defaultValue = motion.agenda_item.parent_id;
            }
        }

        // save motion
        $scope.save = function (motion) {
            // inject the changed motion (copy) object back into DS store
            Motion.inject(motion);
            // save change motion object on server
            Motion.save(motion, { method: 'PATCH' }).then(
                function(success) {
                    // type: Value 1 means a non hidden agenda item, value 2 means a hidden agenda item,
                    // see openslides.agenda.models.Item.ITEM_TYPE.
                    var changes = [{key: 'type', value: (motion.showAsAgendaItem ? 1 : 2)},
                                   {key: 'parent_id', value: motion.agenda_parent_item_id}];
                    AgendaUpdate.saveChanges(success.agenda_item_id,changes);
                    $scope.closeThisDialog();
                },
                function (error) {
                    // save error: revert all changes by restore
                    // (refresh) original motion object from server
                    Motion.refresh(motion);
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

.controller('MotionPollUpdateCtrl', [
    '$scope',
    'gettextCatalog',
    'MotionPoll',
    'MotionPollForm',
    'motionpollId',
    'voteNumber',
    function($scope, gettextCatalog, MotionPoll, MotionPollForm, motionpollId, voteNumber) {
        // set initial values for form model by create deep copy of motionpoll object
        // so detail view is not updated while editing poll
        var motionpoll = MotionPoll.get(motionpollId);
        $scope.model = angular.copy(motionpoll);
        $scope.voteNumber = voteNumber;
        $scope.formFields = MotionPollForm.getFormFields();
        $scope.alert = {};

        // save motionpoll
        $scope.save = function (poll) {
            poll.DSUpdate({
                    motion_id: poll.motion_id,
                    votes: {"Yes": poll.yes, "No": poll.no, "Abstain": poll.abstain},
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

.controller('MotionImportCtrl', [
    '$scope',
    '$q',
    'gettext',
    'Category',
    'Motion',
    'User',
    'MotionCsvExport',
    function($scope, $q, gettext, Category, Motion, User, MotionCsvExport) {
        // set initial data for csv import
        $scope.motions = [];

        // set csv
        $scope.csvConfig = {
            accept: '.csv, .txt',
            encodingOptions: ['UTF-8', 'ISO-8859-1'],
            parseConfig: {
                skipEmptyLines: true,
            },
        };

        var FIELDS = ['identifier', 'title', 'text', 'reason', 'submitter', 'category', 'origin'];
        $scope.motions = [];
        $scope.onCsvChange = function (csv) {
            $scope.motions = [];
            var motions = [];
            _.forEach(csv.data, function (row) {
                if (row.length >= 3) {
                    var filledRow = _.zipObject(FIELDS, row);
                    motions.push(filledRow);
                }
            });

            _.forEach(motions, function (motion) {
                motion.selected = true;
                // identifier
                if (motion.identifier !== '') {
                    // All motion objects are already loaded via the resolve statement from ui-router.
                    var motions = Motion.getAll();
                    if (_.find(motions, function (item) {
                        return item.identifier === motion.identifier;
                    })) {
                        motion.importerror = true;
                        motion.identifier_error = gettext('Error: Identifier already exists.');
                    }
                }
                // title
                if (!motion.title) {
                    motion.importerror = true;
                    motion.title_error = gettext('Error: Title is required.');
                }
                // text
                if (!motion.text) {
                    motion.importerror = true;
                    motion.text_error = gettext('Error: Text is required.');
                } else if (!motion.text.startsWith('<p>')) {
                    motion.text = '<p>' + motion.text + '</p>';
                }
                // Reason
                if (motion.reason && !motion.reason.startsWith('<p>')) {
                    motion.reason = '<p>' + motion.reason + '</p>';
                }
                // submitter
                if (motion.submitter) {
                    if (motion.submitter !== '') {
                        // All user objects are already loaded via the resolve statement from ui-router.
                        var users = User.getAll();
                        angular.forEach(users, function (user) {
                            if (user.short_name == motion.submitter.trim()) {
                                motion.submitters_id = [user.id];
                                motion.submitter = User.get(user.id).full_name;
                            }
                        });
                    }
                }
                if (motion.submitter && motion.submitter !== '' && !motion.submitters_id) {
                    motion.submitter_create = gettext('New participant will be created.');
                }
                // category
                if (motion.category) {
                    if (motion.category !== '') {
                        // All categore objects are already loaded via the resolve statement from ui-router.
                        var categories = Category.getAll();
                        angular.forEach(categories, function (category) {
                            // search for existing category
                            if (category.name == motion.category) {
                                motion.category_id = category.id;
                                motion.category = Category.get(category.id).name;
                            }
                        });
                    }
                }
                if (motion.category && motion.category !== '' && !motion.category_id) {
                    motion.category_create = gettext('New category will be created.');
                }

                $scope.motions.push(motion);
            });
            $scope.calcStats();
        };

        $scope.calcStats = function () {
            $scope.motionsWillNotBeImported = 0;
            $scope.motionsWillBeImported = 0;

            $scope.motions.forEach(function(motion) {
                if (!motion.importerror && motion.selected) {
                    $scope.motionsWillBeImported++;
                } else {
                    $scope.motionsWillNotBeImported++;
                }
            });
        };

        // Counter for creations
        $scope.usersCreated = 0;
        $scope.categoriesCreated = 0;

        // import from csv file
        $scope.import = function () {
            $scope.csvImporting = true;

            // Reset counters
            $scope.usersCreated = 0;
            $scope.categoriesCreated = 0;

            var importedUsers = [];
            var importedCategories = [];
            // collect users and categories
            angular.forEach($scope.motions, function (motion) {
                if (motion.selected && !motion.importerror) {
                    // collect user if not exists
                    if (!motion.submitters_id && motion.submitter) {
                        var index = motion.submitter.indexOf(' ');
                        var user = {
                            first_name: motion.submitter.substr(0, index),
                            last_name: motion.submitter.substr(index+1),
                            groups_id: []
                        };
                        importedUsers.push(user);
                    }
                    // collect category if not exists
                    if (!motion.category_id && motion.category) {
                        var category = {
                            name: motion.category,
                            prefix: motion.category.charAt(0)
                        };
                        importedCategories.push(category);
                    }
                }
            });

            // unique users and categories
            var importedUsersUnique = _.uniqWith(importedUsers, function (u1, u2) {
                return u1.first_name == u2.first_name &&
                    u1.last_name == u2.last_name;
            });
            var importedCategoriesUnique = _.uniqWith(importedCategories, function (c1, c2) {
                return c1.name == c2.name;
            });

            // Promises for users and categories
            var createPromises = [];

            // create users and categories
            importedUsersUnique.forEach(function (user) {
                createPromises.push(User.create(user).then(
                    function (success) {
                        user.id = success.id;
                        $scope.usersCreated++;
                    }
                ));
            });
            importedCategoriesUnique.forEach(function (category) {
                createPromises.push(Category.create(category).then(
                    function (success) {
                        category.id = success.id;
                        $scope.categoriesCreated++;
                    }
                ));
            });

            // wait for users and categories to create
            $q.all(createPromises).then( function() {
                angular.forEach($scope.motions, function (motion) {
                    if (motion.selected && !motion.importerror) {
                        // now, add user
                        if (!motion.submitters_id && motion.submitter) {
                            var index = motion.submitter.indexOf(' ');
                            var first_name = motion.submitter.substr(0, index);
                            var last_name = motion.submitter.substr(index+1);

                            // search for user, set id.
                            importedUsersUnique.forEach(function (user) {
                                if (user.first_name == first_name &&
                                    user.last_name == last_name) {
                                    motion.submitters_id = [user.id];
                                }
                            });
                        }
                        // add category
                        if (!motion.category_id && motion.category) {
                            var name = motion.category;

                            // search for category, set id.
                            importedCategoriesUnique.forEach(function (category) {
                                if (category.name == name) {
                                    motion.category_id = category.id;
                                }
                            });
                        }

                        // finally create motion
                        Motion.create(motion).then(
                            function(success) {
                                motion.imported = true;
                            }
                        );
                    }
                });
            });
            $scope.csvimported = true;
        };
        $scope.clear = function () {
            $scope.motions = [];
        };
        // download CSV example file
        $scope.downloadCSVExample = function () {
            MotionCsvExport.downloadExample();
        };
    }
])


.controller('CategoryListCtrl', [
    '$scope',
    'Category',
    function($scope, Category) {
        Category.bindAll({}, $scope, 'categories');

        // setup table sorting
        $scope.sortColumn = 'name';
        $scope.reverse = false;
        // function to sort by clicked column
        $scope.toggleSort = function ( column ) {
            if ( $scope.sortColumn === column ) {
                $scope.reverse = !$scope.reverse;
            }
            $scope.sortColumn = column;
        };

        // delete selected category
        $scope.delete = function (category) {
            Category.destroy(category.id);
        };
    }
])

.controller('CategoryDetailCtrl', [
    '$scope',
    'Category',
    'categoryId',
    function($scope, Category, categoryId) {
        Category.bindOne(categoryId, $scope, 'category');
    }
])

.controller('CategoryCreateCtrl', [
    '$scope',
    '$state',
    'Category',
    function($scope, $state, Category) {
        $scope.category = {};
        $scope.save = function (category) {
            Category.create(category).then(
                function(success) {
                    $state.go('motions.category.list');
                }
            );
        };
    }
])

.controller('CategoryUpdateCtrl', [
    '$scope',
    '$state',
    'Category',
    'categoryId',
    function($scope, $state, Category, categoryId) {
        $scope.category = Category.get(categoryId);
        $scope.save = function (category) {
            Category.save(category).then(
                function(success) {
                    $state.go('motions.category.list');
                }
            );
        };
    }
])

.controller('CategorySortCtrl', [
    '$scope',
    '$stateParams',
    '$http',
    'MotionList',
    'Category',
    'categoryId',
    'Motion',
    function($scope, $stateParams, $http, MotionList, Category, categoryId, Motion) {
        Category.bindOne(categoryId, $scope, 'category');
        Motion.bindAll({}, $scope, 'motions');
        $scope.filter = { category_id: categoryId,
                          parent_id: null,
                          orderBy: 'identifier' };

        $scope.$watch(
            function () {
                return Motion.lastModified();
            },
            function () {
                $scope.items = MotionList.getList(Motion.filter($scope.filter));
            }
        );

        $scope.alert = {};
        // Numbers all motions in this category by the given order in $scope.items
        $scope.numbering = function () {
            // Create a list of all motion ids in the current order.
            var sorted_motions = [];
            $scope.items.forEach(function (item) {
                sorted_motions.push(item.item.id);
            });

            // renumber them
            $http.post('/rest/motions/category/' + $scope.category.id + '/numbering/',
                {'motions': sorted_motions} )
            .success(function(data) {
                $scope.alert = { type: 'success', msg: data.detail, show: true };
            })
            .error(function(data) {
                $scope.alert = { type: 'danger', msg: data.detail, show: true };
            });
        };
    }
])

//mark all motions config strings for translation in javascript
.config([
    'gettext',
    function (gettext) {
        gettext('Motions');

        // subgroup General
        gettext('General');
        gettext('Workflow of new motions');
        gettext('Identifier');
        gettext('Numbered per category');
        gettext('Serially numbered');
        gettext('Set it manually');
        gettext('Motion preamble');
        gettext('The assembly may decide:');
        gettext('Default line numbering');
        /// Line numbering: Outside
        gettext('Outside');
        /// Line numbering: Inline
        gettext('Inline');
        /// Line numbering: None
        gettext('None');
        gettext('Line length');
        gettext('The maximum number of characters per line. Relevant when line numbering is enabled. Min: 40');
        gettext('Stop submitting new motions by non-staff users');
        gettext('Allow to disable versioning');
        gettext('Name of recommender');
        gettext('Will be displayed as label before selected recommendation. Use an empty value to disable the recommendation system.');

        // subgroup Amendments
        gettext('Amendments');
        gettext('Activate amendments');
        gettext('Prefix for the identifier for amendments');
        gettext('Apply text for new amendments');
        gettext('The title of the motion is always applied.');

        // subgroup Suppoerters
        gettext('Supporters');
        gettext('Number of (minimum) required supporters for a motion');
        gettext('Choose 0 to disable the supporting system.');
        gettext('Remove all supporters of a motion if a submitter edits his ' +
                'motion in early state');

        // subgroup Supporters
        gettext('Comments');
        gettext('Comment fields for motions');
        gettext('Public');
        gettext('Private');

        // subgroup Voting and ballot papers
        gettext('Voting and ballot papers');
        gettext('The 100 % base of a voting result consists of');
        gettext('Yes/No/Abstain');
        gettext('Yes/No');
        gettext('All valid ballots');
        gettext('All casted ballots');
        gettext('Disabled (no percents)');
        gettext('Required majority');
        gettext('Default method to check whether a motion has reached the required majority.');
        gettext('Simple majority');
        gettext('Two-thirds majority');
        gettext('Three-quarters majority');
        gettext('Disabled');
        gettext('Number of ballot papers (selection)');
        gettext('Number of all delegates');
        gettext('Number of all participants');
        gettext('Use the following custom number');
        gettext('Custom number of ballot papers');

        // subgroup PDF
        gettext('Title for PDF and DOCX documents (all motions)');
        gettext('Preamble text for PDF and DOCX documents (all motions)');

        // misc strings (used dynamically in templates by translate filter)
        gettext('needed');
    }
]);

}());
