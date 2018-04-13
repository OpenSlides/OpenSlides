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

.factory('ChangeRecommendationTitleForm', [
    'gettextCatalog',
    'Editor',
    'Config',
    function(gettextCatalog) {
        return {
            // ngDialog for motion form
            getCreateDialog: function (motion, version) {
                return {
                    template: 'static/templates/motions/change-recommendation-form.html',
                    controller: 'ChangeRecommendationTitleCreateCtrl',
                    className: 'ngdialog-theme-default wide-form',
                    closeByEscape: false,
                    closeByDocument: false,
                    resolve: {
                        motion: function() {
                            return motion;
                        },
                        version: function() {
                            return version;
                        }
                    }
                };
            },
            getEditDialog: function(change) {
                return {
                    template: 'static/templates/motions/change-recommendation-form.html',
                    controller: 'ChangeRecommendationTitleUpdateCtrl',
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
            getFormFields: function () {
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
                        key: 'text',
                        type: 'input',
                        templateOptions: {
                            label: gettextCatalog.getString('New title'),
                            required: false
                        }
                    }
                ];
            }
        };
    }
])

.factory('ChangeRecommendationTextForm', [
    'gettextCatalog',
    'Editor',
    'Config',
    function(gettextCatalog, Editor) {
        return {
            // ngDialog for motion form
            getCreateDialog: function (motion, version, lineFrom, lineTo) {
                return {
                    template: 'static/templates/motions/change-recommendation-form.html',
                    controller: 'ChangeRecommendationTextCreateCtrl',
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
                    controller: 'ChangeRecommendationTextUpdateCtrl',
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
                            label: 'Type',
                            options: [
                                {name: gettextCatalog.getString('Replacement'), value: 0},
                                {name: gettextCatalog.getString('Insertion'), value: 1},
                                {name: gettextCatalog.getString('Deletion'), value: 2},
                                {name: gettextCatalog.getString('Other'), value: 3},
                            ]
                        }
                    },
                    {
                        key: 'other_description',
                        type: 'input',
                        templateOptions: {
                            label: gettextCatalog.getString('Description'),
                        },
                        hideExpression: "model.type !== 3",
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
    '$filter',
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
    function ($filter, gettextCatalog, operator, Editor, MotionComment, Category,
        Config, Mediafile, MotionBlock, Tag, User, Workflow, Agenda, AgendaTree) {
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
                        ckeditorOptions: Editor.getOptions()
                    }
                },
                {
                    key: 'reason',
                    type: 'editor',
                    templateOptions: {
                        label: gettextCatalog.getString('Reason'),
                    },
                    data: {
                        ckeditorOptions: Editor.getOptions()
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
                }];

                // show as agenda item + parent item
                if (isCreateForm) {
                    formFields.push({
                        key: 'showAsAgendaItem',
                        type: 'checkbox',
                        templateOptions: {
                            label: gettextCatalog.getString('Show as agenda item'),
                            description: gettextCatalog.getString('If deactivated the motion appears as internal item on agenda.')
                        },
                        hide: !(operator.hasPerms('motions.can_manage') && operator.hasPerms('agenda.can_manage'))
                    });
                    formFields.push({
                        key: 'agenda_parent_id',
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
                            options: $filter('orderBy')(Mediafile.getAll(), 'title_or_filename'),
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

.factory('CategoryForm', [
    'gettextCatalog',
    function (gettextCatalog) {
        return {
            getDialog: function (category) {
                return {
                    template: 'static/templates/motions/category-form.html',
                    controller: category ? 'CategoryUpdateCtrl' : 'CategoryCreateCtrl',
                    className: 'ngdialog-theme-default wide-form',
                    closeByEscape: false,
                    closeByDocument: false,
                    resolve: {
                        categoryId: function () {return category ? category.id : void 0;},
                    },
                };

            },
            getFormFields: function () {
                return [
                    {
                        key: 'prefix',
                        type: 'input',
                        templateOptions: {
                            label: gettextCatalog.getString('Prefix')
                        },
                    },
                    {
                        key: 'name',
                        type: 'input',
                        templateOptions: {
                            label: gettextCatalog.getString('Name')
                        },
                    }
                ];
            },
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
                        label: gettextCatalog.getString('Valid votes'),
                        type: 'number'
                    }
                },
                {
                    key: 'votesinvalid',
                    type: 'input',
                    templateOptions: {
                        label: gettextCatalog.getString('Invalid votes'),
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
                }];
            }
        };
    }
])

.factory('MotionExportForm', [
    'operator',
    'gettextCatalog',
    'Config',
    'MotionComment',
    function (operator, gettextCatalog, Config, MotionComment) {
        var noSpecialCommentsFields = MotionComment.getNoSpecialCommentsFields();
        return {
            getDialog: function (motions, params, singleMotion) {
                return {
                    template: 'static/templates/motions/motion-export-form.html',
                    controller: 'MotionExportCtrl',
                    className: 'ngdialog-theme-default wide-form',
                    closeByEscape: false,
                    closeByDocument: false,
                    resolve: {
                        motions: function () {return motions;},
                        params: function () {return params;},
                        singleMotion: function () {return singleMotion;},
                    },
                };
            },
            getFormFields: function (singleMotion, motions, formatChangeCallback) {
                var fields = [];
                var commentsAvailable = _.keys(noSpecialCommentsFields).length !== 0;
                var getMetaInformationOptions = function (disabled) {
                    if (!disabled) {
                        disabled = {};
                    }
                    var options = [
                        {name: gettextCatalog.getString('State'), id: 'state', disabled: disabled.state},
                        {name: gettextCatalog.getString('Submitters'), id: 'submitters', disabled: disabled.submitters},
                        {name: gettextCatalog.getString('Voting result'), id: 'votingresult', disabled: disabled.votingResult}
                    ];
                    if (_.some(motions, function (motion) { return motion.motionBlock; })) {
                        options.push({
                            name: gettextCatalog.getString('Motion block'),
                            id: 'motionBlock',
                            disabled: disabled.motionBlock,
                        });
                    }
                    if (_.some(motions, function (motion) { return motion.origin; })) {
                        options.push({
                            name: gettextCatalog.getString('Origin'),
                            id: 'origin',
                            disabled: disabled.origin,
                        });
                    }
                    if (Config.get('motions_recommendations_by').value) {
                        options.push({
                            name: gettextCatalog.getString('Recommendation'),
                            id: 'recommendation',
                            disabled: disabled.recommendation
                        });
                    }
                    return options;
                };
                if (!singleMotion) {
                    fields = [
                        {
                            key: 'format',
                            type: 'radio-buttons',
                            templateOptions: {
                                label: gettextCatalog.getString('Format'),
                                options: [
                                    {name: 'PDF', value: 'pdf'},
                                    {name: 'CSV', value: 'csv'},
                                    {name: 'DOCX', value: 'docx'},
                                ],
                                change: formatChangeCallback,
                            },
                        }
                    ];
                }
                if (operator.hasPerms('motions.can_manage')) {
                    fields.push.apply(fields, [
                        {
                            key: 'lineNumberMode',
                            type: 'radio-buttons',
                            templateOptions: {
                                label: gettextCatalog.getString('Line numbering'),
                                options: [
                                    {name: gettextCatalog.getString('None'), value: 'none'},
                                    {name: gettextCatalog.getString('inline'), value: 'inline'},
                                    {name: gettextCatalog.getString('outside'), value: 'outside'},
                                ],
                            },
                            hideExpression: "model.format !== 'pdf'",
                        },
                        {
                            key: 'lineNumberMode',
                            type: 'radio-buttons',
                            templateOptions: {
                                label: gettextCatalog.getString('Line numbering'),
                                options: [
                                    {name: gettextCatalog.getString('None'), value: 'none'},
                                    {name: gettextCatalog.getString('inline'), value: 'inline', disabled: true},
                                    {name: gettextCatalog.getString('outside'), value: 'outside', disabled: true},
                                ],
                            },
                            hideExpression: "model.format === 'pdf'",
                        },
                        {
                            key: 'changeRecommendationMode',
                            type: 'radio-buttons',
                            templateOptions: {
                                label: gettextCatalog.getString('Change recommendations'),
                                options: [
                                    {name: gettextCatalog.getString('Original version'), value: 'original'},
                                    {name: gettextCatalog.getString('Changed version'), value: 'changed'},
                                    {name: gettextCatalog.getString('Diff version'), value: 'diff'},
                                    {name: gettextCatalog.getString('Final version'), value: 'agreed'},
                                ],
                            },
                            hideExpression: "model.format !== 'pdf'",
                        },
                        {
                            key: 'changeRecommendationMode',
                            type: 'radio-buttons',
                            templateOptions: {
                                label: gettextCatalog.getString('Change recommendations'),
                                options: [
                                    {name: gettextCatalog.getString('Original version'), value: 'original'},
                                    {name: gettextCatalog.getString('Changed version'), value: 'changed'},
                                    {name: gettextCatalog.getString('Diff version'), value: 'diff', disabled: true},
                                    {name: gettextCatalog.getString('Final version'), value: 'agreed'},
                                ],
                            },
                            hideExpression: "model.format === 'pdf'",
                        },
                        {
                            key: 'include',
                            type: 'checkbox-buttons',
                            templateOptions: {
                                label: gettextCatalog.getString('Content'),
                                options: [
                                    {name: gettextCatalog.getString('Text'), id: 'text'},
                                    {name: gettextCatalog.getString('Reason'), id: 'reason'},
                                ],
                            },
                        },
                        {
                            key: 'include',
                            type: 'checkbox-buttons',
                            templateOptions: {
                                label: gettextCatalog.getString('Meta information'),
                                options: getMetaInformationOptions(),
                            },
                            hideExpression: "model.format !== 'pdf'",
                        },
                        {
                            key: 'include',
                            type: 'checkbox-buttons',
                            templateOptions: {
                                label: gettextCatalog.getString('Meta information'),
                                options: getMetaInformationOptions({votingResult: true}),
                            },
                            hideExpression: "model.format !== 'csv'",
                        },
                    ]);
                    if (commentsAvailable) {
                        fields.push({
                            key: 'includeComments',
                            type: 'checkbox-buttons',
                            templateOptions: {
                                label: gettextCatalog.getString('Comments'),
                                options: _.map(noSpecialCommentsFields, function (field, id) {
                                    return {
                                        name: gettextCatalog.getString(field.name),
                                        id: id,
                                    };
                                }),
                            },
                            hideExpression: "model.format === 'csv'",
                        });
                    }
                }
                if (!singleMotion) {
                    fields.push({
                        key: 'pdfFormat',
                        type: 'radio-buttons',
                        templateOptions: {
                            label: gettextCatalog.getString('PDF format'),
                            options: [
                                {name: gettextCatalog.getString('One PDF'), value: 'pdf'},
                                {name: gettextCatalog.getString('Multiple PDFs in a zip arcive'), value: 'zip'},
                            ],
                        },
                        hideExpression: "model.format !== 'pdf'",
                    });
                }
                return fields;
            },
        };
    }
])

.controller('MotionExportCtrl', [
    '$scope',
    'Config',
    'MotionExportForm',
    'MotionPdfExport',
    'MotionCsvExport',
    'MotionDocxExport',
    'motions',
    'params',
    'singleMotion',
    function ($scope, Config, MotionExportForm, MotionPdfExport, MotionCsvExport,
            MotionDocxExport, motions, params, singleMotion) {
        $scope.formFields = MotionExportForm.getFormFields(singleMotion, motions, function () {
            if ($scope.params.format !== 'pdf') {
                $scope.params.changeRecommendationMode = 'original';
                $scope.params.lineNumberMode = 'none';
                $scope.params.include.votingresult = false;
            }
            if ($scope.params.format === 'docx') {
                $scope.params.include.state = false;
                $scope.params.include.submitter = true;
                $scope.params.include.motionBlock = false;
                $scope.params.include.origin = false;
                $scope.params.include.recommendation = false;
            } else {
                $scope.params.include.state = true;
                $scope.params.include.motionBlock = true;
                $scope.params.include.origin = true;
                $scope.params.include.recommendation = true;
            }
            if ($scope.params.format === 'pdf') {
                $scope.params.include.state = true;
                $scope.params.include.votingresult = true;
            }
        });
        $scope.params = params || {};
        _.defaults($scope.params, {
            format: 'pdf',
            pdfFormat: 'pdf',
            changeRecommendationMode: Config.get('motions_recommendation_text_mode').value,
            lineNumberMode: Config.get('motions_default_line_numbering').value,
            include: {
                text: true,
                reason: true,
                state: true,
                submitters: true,
                votingresult: true,
                motionBlock: true,
                origin: true,
                recommendation: true,
            },
            includeComments: {},
        });
        $scope.motions = motions;
        $scope.singleMotion = singleMotion;

        $scope.export = function () {
            switch ($scope.params.format) {
                case 'pdf':
                    if ($scope.params.pdfFormat === 'pdf') {
                        MotionPdfExport.export(motions, $scope.params, singleMotion);
                    } else {
                        MotionPdfExport.exportZip(motions, $scope.params);
                    }
                    break;
                case 'csv':
                    MotionCsvExport.export(motions, $scope.params);
                    break;
                case 'docx':
                    MotionDocxExport.export(motions, $scope.params);
                    break;
            }
            $scope.closeThisDialog();
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
    'operator',
    'ngDialog',
    'MotionForm',
    'Motion',
    'MotionComment',
    'Category',
    'Config',
    'Tag',
    'Workflow',
    'User',
    'Agenda',
    'MotionBlock',
    'Projector',
    'ProjectionDefault',
    'osTableFilter',
    'osTableSort',
    'osTablePagination',
    'MotionExportForm',
    'MotionPdfExport',
    'PersonalNoteManager',
    function($scope, $state, $http, gettext, gettextCatalog, operator, ngDialog, MotionForm, Motion,
                MotionComment, Category, Config, Tag, Workflow, User, Agenda, MotionBlock, Projector,
                ProjectionDefault, osTableFilter, osTableSort, osTablePagination, MotionExportForm,
                MotionPdfExport, PersonalNoteManager) {
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
        $scope.$watch(function () {
            return Motion.lastModified();
        }, function () {
            // always order by identifier (after custom ordering)
            $scope.motions = _.orderBy(Motion.getAll(), ['identifier']);
            _.forEach($scope.motions, function (motion) {
                MotionComment.populateFields(motion);
                motion.personalNote = PersonalNoteManager.getNote(motion);
                // For filtering, we cannot filter for .personalNote.star
                motion.star = motion.personalNote ? motion.personalNote.star : false;
                motion.hasPersonalNote = motion.personalNote ? !!motion.personalNote.note : false;
                if (motion.star === undefined) {
                    motion.star = false;
                }
            });
            $scope.collectStatesAndRecommendations();
        });
        $scope.alert = {};

        // Motion comments
        $scope.noSpecialCommentsFields = MotionComment.getNoSpecialCommentsFields();
        $scope.showCommentsFilter = function () {
            return _.keys($scope.noSpecialCommentsFields).length > 0;
        };

        // collect all states and all recommendations of all workflows
        $scope.collectStatesAndRecommendations = function () {
            // Special case: If it is the first time updated, update the state filter.
            // This causes to set the done/undone states correct on page load.
            var doStateFilterUpdate = !$scope.states;
            $scope.states = [];
            $scope.recommendations = [];
            var workflows = $scope.collectAllUsedWorkflows();
            _.forEach(workflows, function (workflow) {
                if (workflows.length > 1) {
                    var workflowHeader = {
                        headername: workflow.name,
                        workflowHeader: true,
                    };
                    $scope.states.push(workflowHeader);
                    $scope.recommendations.push(workflowHeader);
                }

                var firstEndStateSeen = false;
                _.forEach(_.orderBy(workflow.states, 'id'), function (state) {
                    if (state.next_states_id.length === 0 && !firstEndStateSeen) {
                        $scope.states.push({divider: true});
                        firstEndStateSeen = true;
                    }
                    $scope.states.push(state);
                    if (state.recommendation_label) {
                        $scope.recommendations.push(state);
                    }
                });
            });
            if (doStateFilterUpdate) {
                updateStateFilter();
            }
        };
        $scope.collectAllUsedWorkflows = function () {
            return _.filter(Workflow.getAll(), function (workflow) {
                return _.some($scope.motions, function (motion) {
                    return motion.state.workflow_id === workflow.id;
                });
            });
        };

        $scope.stateFilter = [];
        var updateStateFilter = function () {
            $scope.stateFilter = _.clone($scope.filter.multiselectFilters.state);

            var doneIndex = _.indexOf($scope.stateFilter, -1);
            if (doneIndex > -1) { // contains -1 (done)
                $scope.stateFilter.splice(doneIndex, 1); // remove -1
                _.forEach($scope.states, function (state) {
                    if (!state.workflowHeader && !state.divider) {
                        if (state.next_states_id.length === 0) { // add all done state
                            $scope.stateFilter.push(state.id);
                        }
                    }
                });
            }

            var undoneIndex = _.indexOf($scope.stateFilter, -2);
            if (undoneIndex > -1) { // contains -2 (undone)
                $scope.stateFilter.splice(undoneIndex, 1); // remove -2
                _.forEach($scope.states, function (state) {
                    if (!state.workflowHeader && !state.divider) {
                        if (state.next_states_id.length !== 0) { // add all undone state
                            $scope.stateFilter.push(state.id);
                        }
                    }
                });
            }
            $scope.stateFilter = _.uniq($scope.stateFilter);
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
                comment: [],
            };
            $scope.filter.booleanFilters = {
                isAmendment: {
                    value: undefined,
                    choiceYes: gettext('Is an amendment'),
                    choiceNo: gettext('Is not an amendment'),
                },
                isFavorite: {
                    value: undefined,
                    choiceYes: gettext('Marked as favorite'),
                    choiceNo: gettext('Not marked as favorite'),
                },
                hasPersonalNote: {
                    value: undefined,
                    choiceYes: gettext('Personal note set'),
                    choiceNo: gettext('Personal note not set'),
                },
            };
        }
        $scope.filter.propertyList = ['identifier', 'origin'];
        $scope.filter.propertyFunctionList = [
            function (motion) {return motion.getTitle();},
            function (motion) {return motion.category ? motion.category.name : '';},
            function (motion) {return motion.motionBlock ? motion.motionBlock.name : '';},
            function (motion) {return motion.recommendation ? motion.getRecommendationName() : '';},
        ];
        $scope.filter.propertyDict = {
            'submitters': function (submitter) {
                return submitter.get_short_name();
            },
            'supporters': function (supporter) {
                return supporter.get_short_name();
            },
            'tags': function (tag) {
                return tag.name;
            },
        };
        $scope.getItemId = {
            state: function (motion) {return motion.state_id;},
            comment: function (motion) {
                var ids = [];
                _.forEach(motion.comments, function (comment, id) {
                    if (comment) {
                        ids.push(id);
                    }
                });
                return ids;
            },
            category: function (motion) {return motion.category_id;},
            motionBlock: function (motion) {return motion.motion_block_id;},
            tag: function (motion) {return motion.tags_id;},
            recommendation: function (motion) {return motion.recommendation_id;},
        };
        $scope.operateStateFilter = function (id, danger) {
            $scope.filter.operateMultiselectFilter('state', id, danger);
            updateStateFilter();
        };
        $scope.resetFilters = function (danger) {
            $scope.filter.reset(danger);
            updateStateFilter();
        };
        // Sorting
        $scope.sort = osTableSort.createInstance('MotionTableSort');
        if (!$scope.sort.column) {
            $scope.sort.column = 'identifier';
        }
        $scope.sortOptions = [
            {name: 'identifier',
             display_name: gettext('Identifier')},
            {name: 'getTitle()',
             display_name: gettext('Title')},
            {name: 'submitters[0].get_short_name()',
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
        $scope.pagination = osTablePagination.createInstance('MotionTablePagination');

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

        $scope.save = function (motion) {
            Motion.save(motion, {method: 'PATCH'});
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
        $scope.toggleStar = function (motion) {
            if (motion.personalNote) {
                motion.personalNote.star = !motion.personalNote.star;
            } else {
                motion.personalNote = {star: true};
            }
            PersonalNoteManager.saveNote(motion, motion.personalNote);
        };

        // open new/edit dialog
        $scope.openDialog = function (motion) {
            ngDialog.open(MotionForm.getDialog(motion));
        };
        // Export dialog
        $scope.openExportDialog = function () {
            ngDialog.open(MotionExportForm.getDialog($scope.motionsFiltered));
        };
        $scope.pdfExport = function () {
            MotionPdfExport.export($scope.motionsFiltered);
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
    '$timeout',
    '$window',
    '$filter',
    'operator',
    'ngDialog',
    'gettextCatalog',
    'MotionForm',
    'ChangeRecommendationCreate',
    'ChangeRecommendationView',
    'MotionStateAndRecommendationParser',
    'MotionChangeRecommendation',
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
    'Editor',
    'Projector',
    'ProjectionDefault',
    'MotionBlock',
    'MotionPdfExport',
    'PersonalNoteManager',
    'WebpageTitle',
    'EditingWarning',
    function($scope, $http, $timeout, $window, $filter, operator, ngDialog, gettextCatalog,
            MotionForm, ChangeRecommendationCreate, ChangeRecommendationView,
            MotionStateAndRecommendationParser, MotionChangeRecommendation, Motion, MotionComment,
            Category, Mediafile, Tag, User, Workflow, Config, motionId, MotionInlineEditing,
            MotionCommentsInlineEditing, Editor, Projector, ProjectionDefault, MotionBlock,
            MotionPdfExport, PersonalNoteManager, WebpageTitle, EditingWarning) {
        var motion = Motion.get(motionId);
        Category.bindAll({}, $scope, 'categories');
        Mediafile.bindAll({}, $scope, 'mediafiles');
        Tag.bindAll({}, $scope, 'tags');
        User.bindAll({}, $scope, 'users');
        Workflow.bindAll({}, $scope, 'workflows');
        MotionBlock.bindAll({}, $scope, 'motionBlocks');
        Motion.bindAll({}, $scope, 'motions');
        $scope.$watch(function () {
            return MotionChangeRecommendation.lastModified();
        }, function () {
            $scope.change_recommendations = [];
            $scope.title_change_recommendation = null;
            MotionChangeRecommendation.filter({
                'where': {'motion_version_id': {'==': motion.active_version}}
            }).forEach(function(change) {
                if (change.isTextRecommendation()) {
                    $scope.change_recommendations.push(change);
                }
                if (change.isTitleRecommendation()) {
                    $scope.title_change_recommendation = change;
                }
            });

            if ($scope.change_recommendations.length === 0) {
                $scope.setProjectionMode($scope.projectionModes[0]);
            }
            if ($scope.change_recommendations.length > 0) {
                $scope.disableMotionInlineEditing();
            }
        });
        $scope.$watch(function () {
            return Projector.lastModified();
        }, function () {
            $scope.projectors = Projector.getAll();
            var projectiondefault = ProjectionDefault.filter({name: 'motions'})[0];
            if (projectiondefault) {
                $scope.defaultProjectorId = projectiondefault.projector_id;
            }
        });
        $scope.$watch(function () {
            return Motion.lastModified(motionId);
        }, function () {
            $scope.motion = Motion.get(motionId);
            MotionComment.populateFields($scope.motion);
            if (motion.comments) {
                $scope.stateExtension = $scope.motion.comments[$scope.commentFieldForStateId];
                $scope.recommendationExtension = $scope.motion.comments[$scope.commentFieldForRecommendationId];
            }
            $scope.motion.personalNote = PersonalNoteManager.getNote($scope.motion);
            $scope.navigation.evaluate();

            var webpageTitle = gettextCatalog.getString('Motion') + ' ';
            if ($scope.motion.identifier) {
                webpageTitle += $scope.motion.identifier + ' - ';
            }
            webpageTitle += $scope.motion.getTitle();
            WebpageTitle.updateTitle(webpageTitle);

            $scope.createChangeRecommendation.setVersion(motion, motion.active_version);
        });
        $scope.projectionModes = [
            {mode: 'original',
            label: 'Original version'},
            {mode: 'changed',
            label: 'Changed version'},
            {mode: 'diff',
            label: 'Diff version'},
            {mode: 'agreed',
            label: 'Final version'},
        ];
        var motionDefaultTextMode = Config.get('motions_recommendation_text_mode').value;
        $scope.projectionMode = _.find($scope.projectionModes, function (mode) {
            return mode.mode == motionDefaultTextMode;
        });
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
        $scope.commentsFields = MotionComment.getCommentsFields();
        $scope.noSpecialCommentsFields = MotionComment.getNoSpecialCommentsFields();
        $scope.commentFieldForStateId = MotionComment.getFieldIdForFlag('forState');
        $scope.commentFieldForRecommendationId = MotionComment.getFieldIdForFlag('forRecommendation');
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
                // remove the line highlight after 2 seconds.
                $timeout(function () {
                    $scope.highlight = 0;
                }, 2000);
            }
        };

        // open edit dialog
        $scope.openDialog = function (motion) {
            if ($scope.inlineEditing.active) {
                $scope.disableMotionInlineEditing();
            }
            ngDialog.open(MotionForm.getDialog(motion));
        };
        $scope.save = function (motion) {
            Motion.save(motion, {method: 'PATCH'});
        };
        // Navigation buttons
        $scope.navigation = {
            evaluate: function () {
                var motions = $filter('orderByEmptyLast')(Motion.getAll(), 'identifier');
                var thisIndex = _.findIndex(motions, function (motion) {
                    return motion.id === $scope.motion.id;
                });
                this.count = motions.length;
                this.nextMotion = thisIndex < motions.length-1 ? motions[thisIndex+1] : _.head(motions);
                this.previousMotion = thisIndex > 0 ? motions[thisIndex-1] : _.last(motions);
            },
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
        // follow recommendation
        $scope.followRecommendation = function () {
            $http.post('/rest/motions/motion/' + motion.id + '/follow_recommendation/', {
                'recommendationExtension': $scope.recommendationExtension
            });
        };
        // update state
        $scope.updateState = function (state_id) {
            $http.put('/rest/motions/motion/' + motion.id + '/set_state/', {'state': state_id});
        };
        // reset state
        $scope.reset_state = function () {
            $http.put('/rest/motions/motion/' + motion.id + '/set_state/', {});
        };
        // toggle functions for meta information
        $scope.toggleCategory = function (category) {
            if ($scope.motion.category_id == category.id) {
                $scope.motion.category_id = null;
            } else {
                $scope.motion.category_id = category.id;
            }
            $scope.save($scope.motion);
        };
        $scope.toggleMotionBlock = function (block) {
            if ($scope.motion.motion_block_id == block.id) {
                $scope.motion.motion_block_id = null;
            } else {
                $scope.motion.motion_block_id = block.id;
            }
            $scope.save($scope.motion);

        };
        $scope.toggleTag = function (tag) {
            if (_.indexOf($scope.motion.tags_id, tag.id) > -1) {
                // remove
                $scope.motion.tags_id = _.filter($scope.motion.tags_id,
                    function (tag_id){
                        return tag_id != tag.id;
                    }
                );
            } else {
                $scope.motion.tags_id.push(tag.id);
            }
            $scope.save($scope.motion);
        };
        // save additional state field
        $scope.saveAdditionalStateField = function (stateExtension) {
            motion['comment_' + $scope.commentFieldForStateId] = stateExtension;
            $scope.save(motion);
        };
        // save additional recommendation field
        $scope.saveAdditionalRecommendationField = function (recommendationExtension) {
            motion['comment_' + $scope.commentFieldForRecommendationId] = recommendationExtension;
            $scope.save(motion);
        };
        $scope.addMotionToRecommendationField = function (motion) {
            $scope.recommendationExtension += MotionStateAndRecommendationParser.formatMotion(motion);
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
                template: 'static/templates/motions/motion-poll-form.html',
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
            $scope.reasonInlineEditing.setVersion(motion, version.id);
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
                    $scope.showVersion({id: motion.active_version});
                });
        };
        // check if there is at least one comment field
        $scope.commentFieldsAvailable = function () {
            return _.keys($scope.noSpecialCommentsFields).length > 0;
        };
        // personal note
        // For pinning the personal note container we need to adjust the width with JS. We
        // do not use angular here, because on every window resize a digist cycle would trigger.
        // This costs too much performance. We use JQuery here, because it is fast for DOM
        // manipulation and very responsive.
        $scope.toggleStar = function () {
            if ($scope.motion.personalNote) {
                $scope.motion.personalNote.star = !$scope.motion.personalNote.star;
            } else {
                $scope.motion.personalNote = {star: true};
            }
            PersonalNoteManager.saveNote($scope.motion, $scope.motion.personalNote);
        };
        $scope.personalNotePinned = false;
        $scope.pinPersonalNote = function () {
            $scope.personalNotePinned = !$scope.personalNotePinned;
            if ($scope.personalNotePinned) {
                resizePersonalNoteContainer();
            } else {
                $('#personalNote').css('width', '');
            }
        };
        $scope.gotoPersonalNote = function () {
            var pos = $('#personalNote').offset();
            $window.scrollTo(pos.left, pos.top);
        };
        var resizePersonalNoteContainer = function () {
            if ($scope.personalNotePinned) {
                var width = $('#main-column').width() - 40; // Subtract 2x20px margin
                $('#personalNote').css('width', width + 'px');
            }
        };
        $(window).resize(resizePersonalNoteContainer);

        // Inline editing functions
        $scope.inlineEditing = MotionInlineEditing.createInstance($scope, motion,
            'view-original-text-inline-editor', true, Editor.getOptions('inline'),
            function (obj) {
                return motion.getTextWithLineBreaks($scope.version);
            },
            function (obj) {
                motion.setTextStrippingLineBreaks(obj.editor.getData());
                motion.disable_versioning = (obj.trivialChange &&
                    Config.get('motions_allow_disable_versioning').value);
            }
        );
        $scope.reasonInlineEditing = MotionInlineEditing.createInstance($scope, motion,
            'reason-inline-editor', true, Editor.getOptions('inline'),
            function (obj) {
                return motion.getReason($scope.version);
            },
            function (obj) {
                motion.reason = obj.editor.getData();
                motion.disable_versioning = (obj.trivialChange &&
                    Config.get('motions_allow_disable_versioning').value);
            }
        );
        // Wrapper functions for $scope.inlineEditing, to warn other users.
        var editingStoppedCallback;
        $scope.enableMotionInlineEditing = function () {
            editingStoppedCallback = EditingWarning.editingStarted('motion_update_' + motion.id);
            if ($scope.motion.getReason($scope.version)) {
                $scope.reasonInlineEditing.enable();
            }
            $scope.inlineEditing.enable();
        };
        $scope.disableMotionInlineEditing = function () {
            if (editingStoppedCallback) {
                editingStoppedCallback();
            }
            if ($scope.motion && $scope.motion.getReason($scope.version)) {
                $scope.reasonInlineEditing.disable();
            }
            $scope.inlineEditing.disable();
        };
        $scope.textReasonSaveToolbarVisible = function () {
            return ($scope.inlineEditing.changed && $scope.inlineEditing.active) ||
                ($scope.reasonInlineEditing.changed && $scope.reasonInlineEditing.active);
        };
        $scope.textReasonSave = function () {
            if ($scope.motion.getReason($scope.version)) {
                $scope.reasonInlineEditing.save();
            }
            $scope.inlineEditing.save();
        };
        $scope.textReasonRevert = function () {
            if ($scope.motion.getReason($scope.version)) {
                $scope.reasonInlineEditing.revert();
            }
            $scope.inlineEditing.revert();
        };
        $scope.commentsInlineEditing = MotionCommentsInlineEditing.createInstances($scope, motion);
        $scope.personalNoteInlineEditing = MotionInlineEditing.createInstance($scope, motion,
            'personal-note-inline-editor', false, Editor.getOptions('inline'),
            function (obj) {
                return motion.personalNote ? motion.personalNote.note : '';
            },
            function (obj) {
                if (motion.personalNote) {
                    motion.personalNote.note = obj.editor.getData();
                } else {
                    motion.personalNote = {note: obj.editor.getData()};
                }
                PersonalNoteManager.saveNote(motion, motion.personalNote);
                obj.revert();
                obj.disable();
                return true; // Do not update the motion via patch request.
            }
        );

        // Change recommendation creation functions
        $scope.createChangeRecommendation = ChangeRecommendationCreate;
        $scope.createChangeRecommendation.init($scope, motion);

        // Change recommendation viewing
        $scope.viewChangeRecommendations = ChangeRecommendationView;
        $scope.viewChangeRecommendations.init($scope, Config.get('motions_recommendation_text_mode').value);

        // PDF creating functions
        $scope.pdfExport = function () {
            var identifier = $scope.motion.identifier ? '-' + $scope.motion.identifier : '';
            var params = {
                filename: gettextCatalog.getString('Motion') + identifier + '.pdf',
                version: $scope.version,
                changeRecommendationMode: $scope.viewChangeRecommendations.mode,
                lineNumberMode: $scope.lineNumberMode,
            };
            MotionPdfExport.export(motion, params, true);
        };
        $scope.createPollPdf = function () {
            MotionPdfExport.createPollPdf($scope.motion, $scope.version);
        };
        $scope.exportComment = function (commentId) {
            var identifier = $scope.motion.identifier ? '-' + $scope.motion.identifier : '';
            var commentsString = ' - ' + gettextCatalog.getString('Comments');
            var filename = gettextCatalog.getString('Motion') + identifier + commentsString + '.pdf';
            MotionPdfExport.exportComment($scope.motion, commentId, filename);
        };
        $scope.exportPersonalNote = function () {
            var identifier = $scope.motion.identifier ? '-' + $scope.motion.identifier : '';
            var personalNoteString = ' - ' + gettextCatalog.getString('personal note');
            var filename = gettextCatalog.getString('Motion') + identifier + personalNoteString + '.pdf';
            MotionPdfExport.exportPersonalNote($scope.motion, filename);
        };
    }
])

.controller('ChangeRecommendationTitleUpdateCtrl', [
    '$scope',
    'MotionChangeRecommendation',
    'ChangeRecommendationTitleForm',
    'diffService',
    'change',
    'ErrorMessage',
    function ($scope, MotionChangeRecommendation, ChangeRecommendationTitleForm, diffService, change, ErrorMessage) {
        $scope.alert = {};
        $scope.model = angular.copy(change);

        // get all form fields
        $scope.formFields = ChangeRecommendationTitleForm.getFormFields();
        // save motion
        $scope.save = function (change) {
            // inject the changed change recommendation (copy) object back into DS store
            MotionChangeRecommendation.inject(change);
            // save changed change recommendation object on server
            MotionChangeRecommendation.save(change).then(
                function() {
                    $scope.closeThisDialog();
                },
                function (error) {
                    MotionChangeRecommendation.refresh(change);
                    $scope.alert = ErrorMessage.forAlert(error);
                }
            );
        };
    }
])

.controller('ChangeRecommendationTitleCreateCtrl', [
    '$scope',
    'Motion',
    'MotionChangeRecommendation',
    'ChangeRecommendationTitleForm',
    'Config',
    'diffService',
    'motion',
    'version',
    function($scope, Motion, MotionChangeRecommendation, ChangeRecommendationTitleForm, Config, diffService, motion,
             version) {
        $scope.alert = {};

        $scope.model = {
            text: version.title,
            motion_version_id: version.id
        };

        // get all form fields
        $scope.formFields = ChangeRecommendationTitleForm.getFormFields();
        // save motion
        $scope.save = function (change) {
            change.line_from = 0;
            change.line_to = 0;
            MotionChangeRecommendation.create(change).then(
                function() {
                    $scope.closeThisDialog();
                }
            );
        };
    }
])

.controller('ChangeRecommendationTextUpdateCtrl', [
    '$scope',
    'MotionChangeRecommendation',
    'ChangeRecommendationTextForm',
    'diffService',
    'change',
    'ErrorMessage',
    function ($scope, MotionChangeRecommendation, ChangeRecommendationTextForm, diffService, change, ErrorMessage) {
        $scope.alert = {};
        $scope.model = angular.copy(change);

        // get all form fields
        $scope.formFields = ChangeRecommendationTextForm.getFormFields(change.line_from, change.line_to);
        // save motion
        $scope.save = function (change) {
            change.text = diffService.removeDuplicateClassesInsertedByCkeditor(change.text);
            // inject the changed change recommendation (copy) object back into DS store
            MotionChangeRecommendation.inject(change);
            // save changed change recommendation object on server
            MotionChangeRecommendation.save(change).then(
                function() {
                    $scope.closeThisDialog();
                },
                function (error) {
                    MotionChangeRecommendation.refresh(change);
                    $scope.alert = ErrorMessage.forAlert(error);
                }
            );
        };
    }
])

.controller('ChangeRecommendationTextCreateCtrl', [
    '$scope',
    'Motion',
    'MotionChangeRecommendation',
    'ChangeRecommendationTextForm',
    'Config',
    'diffService',
    'motion',
    'version',
    'lineFrom',
    'lineTo',
    function($scope, Motion, MotionChangeRecommendation, ChangeRecommendationTextForm, Config, diffService, motion,
             version, lineFrom, lineTo) {
        $scope.alert = {};

        var html = motion.getTextWithLineBreaks(version.id),
            lineData = diffService.extractRangeByLineNumbers(html, lineFrom, lineTo);

        $scope.model = {
            text: lineData.outerContextStart + lineData.innerContextStart +
                lineData.html + lineData.innerContextEnd + lineData.outerContextEnd,
            line_from: lineFrom,
            line_to: lineTo,
            motion_version_id: version.id,
            type: 0
        };

        // get all form fields
        $scope.formFields = ChangeRecommendationTextForm.getFormFields(lineFrom, lineTo);
        // save motion
        $scope.save = function (motion) {
            motion.text = diffService.removeDuplicateClassesInsertedByCkeditor(motion.text);
            MotionChangeRecommendation.create(motion).then(
                function() {
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
    'ErrorMessage',
    function($scope, $state, gettext, gettextCatalog, operator, Motion, MotionForm,
        Category, Config, Mediafile, Tag, User, Workflow, Agenda, ErrorMessage) {
        Category.bindAll({}, $scope, 'categories');
        Mediafile.bindAll({}, $scope, 'mediafiles');
        Tag.bindAll({}, $scope, 'tags');
        User.bindAll({}, $scope, 'users');
        Workflow.bindAll({}, $scope, 'workflows');

        $scope.model = {};
        $scope.alert = {};

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
        $scope.save = function (motion, gotoDetailView) {
            motion.agenda_type = motion.showAsAgendaItem ? 1 : 2;
            // The attribute motion.agenda_parent_id is set by the form, see form definition.
            Motion.create(motion).then(
                function(success) {
                    if (isAmendment || gotoDetailView) {
                        $state.go('motions.motion.detail', {id: success.id});
                    }
                    $scope.closeThisDialog();
                },
                function (error) {
                    $scope.alert = ErrorMessage.forAlert(error);
                }
            );
        };
    }
])

.controller('MotionUpdateCtrl', [
    '$scope',
    '$state',
    'Motion',
    'Category',
    'Config',
    'Mediafile',
    'MotionForm',
    'Tag',
    'User',
    'Workflow',
    'Agenda',
    'motionId',
    'operator',
    'ErrorMessage',
    'EditingWarning',
    function($scope, $state, Motion, Category, Config, Mediafile, MotionForm,
        Tag, User, Workflow, Agenda, motionId, operator, ErrorMessage,
        EditingWarning) {
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
                // show identifier field if the operator has manage permissions
               $scope.formFields[i].hide = !operator.hasPerms('motions.can_manage');
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
            if ($scope.formFields[i].key == "workflow_id") {
               // get saved workflow id from state
               $scope.formFields[i].defaultValue = motion.state.workflow_id;
            }
        }

        // Displaying a warning, if other users edit this motion too
        var editingStoppedCallback = EditingWarning.editingStarted('motion_update_' + motionId);
        $scope.$on('$destroy', editingStoppedCallback);

        // Save motion
        $scope.save = function (motion, gotoDetailView) {
            // inject the changed motion (copy) object back into DS store
            Motion.inject(motion);
            // save changed motion object on server
            Motion.save(motion).then(
                function(success) {
                    if (gotoDetailView) {
                        $state.go('motions.motion.detail', {id: success.id});
                    }
                    $scope.closeThisDialog();
                },
                function (error) {
                    // save error: revert all changes by restore
                    // (refresh) original motion object from server
                    Motion.refresh(motion);
                    $scope.alert = ErrorMessage.forAlert(error);
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
    'ErrorMessage',
    function($scope, gettextCatalog, MotionPoll, MotionPollForm, motionpollId,
        voteNumber, ErrorMessage) {
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
            }, function(error) {
                $scope.alert = ErrorMessage.forAlert(error);
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
    'MotionBlock',
    'User',
    'MotionCsvExport',
    function($scope, $q, gettext, Category, Motion, MotionBlock, User, MotionCsvExport) {
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

        var FIELDS = ['identifier', 'title', 'text', 'reason', 'submitter', 'category', 'origin', 'motionBlock'];
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
                if (motion.submitter && motion.submitter !== '') {
                    angular.forEach(User.getAll(), function (user) {
                        var user_short_name = [user.title, user.first_name, user.last_name].join(' ').trim();
                        if (user_short_name == motion.submitter.trim()) {
                            motion.submitters_id = [user.id];
                            motion.submitter = user.full_name;
                        }
                    });
                    if (!motion.submitters_id) {
                        motion.submitter_create = gettext('New participant will be created.');
                    }
                }
                // category
                if (motion.category && motion.category !== '') {
                    angular.forEach(Category.getAll(), function (category) {
                        // search for existing category
                        if (category.name == motion.category.trim()) {
                            motion.category_id = category.id;
                            motion.category = category.name;
                        }
                    });
                    if (!motion.category_id) {
                        motion.category_create = gettext('New category will be created.');
                    }
                }
                // Motion block
                if (motion.motionBlock && motion.motionBlock !== '') {
                    angular.forEach(MotionBlock.getAll(), function (block) {
                        // search for existing block
                        if (block.title == motion.motionBlock.trim()) {
                            motion.motion_block_id = block.id;
                            motion.motionBlock = block.title;
                        }
                    });
                    if (!motion.motion_block_id) {
                        motion.motionBlock_create = gettext('New motion block will be created.');
                    }
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
            $scope.motionBlocksCreated = 0;

            var importedUsers = [];
            var importedCategories = [];
            var importedMotionBlocks = [];
            // collect users, categories and motion blocks
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
                    // collect motion block if not exists
                    if (!motion.motion_block_id && motion.motionBlock) {
                        var motionBlock = {
                            title: motion.motionBlock,
                        };
                        importedMotionBlocks.push(motionBlock);
                    }
                }
            });

            // unique users, categories and motion blocks
            var importedUsersUnique = _.uniqWith(importedUsers, function (u1, u2) {
                return u1.first_name == u2.first_name &&
                    u1.last_name == u2.last_name;
            });
            var importedCategoriesUnique = _.uniqWith(importedCategories, function (c1, c2) {
                return c1.name == c2.name;
            });
            var importedMotionBlocksUnique = _.uniqWith(importedMotionBlocks, function (c1, c2) {
                return c1.title == c2.title;
            });

            // Promises for users and categories
            var createPromises = [];

            // create users and categories
            _.forEach(importedUsersUnique, function (user) {
                createPromises.push(User.create(user).then(
                    function (success) {
                        user.id = success.id;
                        $scope.usersCreated++;
                    }
                ));
            });
            _.forEach(importedCategoriesUnique, function (category) {
                createPromises.push(Category.create(category).then(
                    function (success) {
                        category.id = success.id;
                        $scope.categoriesCreated++;
                    }
                ));
            });
            _.forEach(importedMotionBlocksUnique, function (motionBlock) {
                createPromises.push(MotionBlock.create(motionBlock).then(
                    function (success) {
                        motionBlock.id = success.id;
                        $scope.motionBlocksCreated++;
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
                            _.forEach(importedUsersUnique, function (user) {
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
                            _.forEach(importedCategoriesUnique, function (category) {
                                if (category.name == name) {
                                    motion.category_id = category.id;
                                }
                            });
                        }
                        // add motion block
                        if (!motion.motion_block_id && motion.motionBlock) {
                            var title = motion.motionBlock;

                            // search for motion block
                            _.forEach(importedMotionBlocksUnique, function (motionBlock) {
                                if (motionBlock.title == title) {
                                    motion.motion_block_id = motionBlock.id;
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
    'ngDialog',
    'CategoryForm',
    function($scope, Category, ngDialog, CategoryForm) {
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
        $scope.editOrCreate = function (category) {
            ngDialog.open(CategoryForm.getDialog(category));
        };
    }
])

.controller('CategoryCreateCtrl', [
    '$scope',
    'Category',
    'CategoryForm',
    'ErrorMessage',
    function($scope, Category, CategoryForm, ErrorMessage) {
        $scope.model = {};
        $scope.alert = {};
        $scope.formFields = CategoryForm.getFormFields();
        $scope.save = function (category) {
            Category.create(category).then(
                function(success) {
                    $scope.closeThisDialog();
                },
                function (error) {
                    $scope.alert = ErrorMessage.forAlert(error);
                }
            );
        };
    }
])

.controller('CategoryUpdateCtrl', [
    '$scope',
    'Category',
    'categoryId',
    'CategoryForm',
    'ErrorMessage',
    function($scope, Category, categoryId, CategoryForm, ErrorMessage) {
        $scope.alert = {};
        $scope.model = angular.copy(Category.get(categoryId));
        $scope.formFields = CategoryForm.getFormFields();
        $scope.save = function (category) {
            Category.inject(category);
            Category.save(category).then(
                function(success) {
                    $scope.closeThisDialog();
                },
                function (error) {
                    // save error: revert all changes by restore
                    // (refresh) original category object from server
                    Category.refresh(category);
                    $scope.alert = ErrorMessage.forAlert(error);
                }
            );
        };
    }
])

.controller('CategorySortCtrl', [
    '$scope',
    '$stateParams',
    '$http',
    'Category',
    'categoryId',
    'Motion',
    'ErrorMessage',
    function($scope, $stateParams, $http, Category, categoryId, Motion, ErrorMessage) {
        Category.bindOne(categoryId, $scope, 'category');
        Motion.bindAll({}, $scope, 'motions');
        $scope.filter = { category_id: categoryId,
                          parent_id: null,
                          orderBy: 'identifier' };

        $scope.$watch(function () {
            return Motion.lastModified();
        }, function () {
            var motions = Motion.filter($scope.filter);
            $scope.items = _.map(motions, function (motion) {
                return {
                    id: motion.id,
                    item: motion
                };
            });
        });

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
                {'motions': sorted_motions} ).then(
            function (success) {
                $scope.alert = { type: 'success', msg: success.data.detail, show: true };
            }, function (error) {
                $scope.alert = ErrorMessage.forAlert(error);
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
        gettext('Hide reason on projector');
        gettext('Hide meta information box on projector');
        gettext('Hide recommendation on projector');
        gettext('Stop submitting new motions by non-staff users');
        gettext('Allow to disable versioning');
        gettext('Name of recommender');
        gettext('Default text version for change recommendations');
        gettext('Will be displayed as label before selected recommendation. Use an empty value to disable the recommendation system.');

        // subgroup Amendments
        gettext('Amendments');
        gettext('Activate amendments');
        gettext('Prefix for the identifier for amendments');
        gettext('Apply text for new amendments');
        gettext('The title of the motion is always applied.');

        // subgroup Supporters
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

        // subgroup PDF and DOCX
        gettext('Title for PDF and DOCX documents (all motions)');
        gettext('Preamble text for PDF and DOCX documents (all motions)');
        gettext('Sort categories by');
        gettext('Include the sequential number in PDF and DOCX');

        // misc strings (used dynamically in templates by translate filter)
        gettext('needed');
    }
]);

}());
