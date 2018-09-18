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
    'OpenSlidesApp.motions.workflow',
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
            .state('motions.motion.submitters', {
                url: '/submitters/{id:int}',
                controller: 'MotionSubmitterCtrl',
                resolve: {
                    motionId: ['$stateParams', function($stateParams) {
                        return $stateParams.id;
                    }],
                },
                data: {
                    title: gettext('Submitters'),
                    basePerm: 'motions.can_manage',
                },
            })
            .state('motions.motion.amendment-list', {
                url: '/{id:int}/amendments',
                controller: 'MotionAmendmentListStateCtrl',
                params: {
                    motionId: null,
                },
                resolve: {
                    motionId: ['$stateParams', function($stateParams) {
                        return $stateParams.id;
                    }],
                }
            })
            .state('motions.motion.allamendments', {
                url: '/amendments',
                templateUrl: 'static/templates/motions/motion-amendment-list.html',
                controller: 'MotionAmendmentListStateCtrl',
                resolve: {
                    motionId: function() { return void 0; },
                }
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
            })
            // Workflows and states
            .state('motions.workflow', {
                url: '/workflow',
                abstract: true,
                template: '<ui-view/>',
                data: {
                    title: gettext('Workflows'),
                    basePerm: 'motions.can_manage',
                },
            })
            .state('motions.workflow.list', {})
            .state('motions.workflow.detail', {
                resolve: {
                    workflowId: ['$stateParams', function($stateParams) {
                        return $stateParams.id;
                    }],
                }
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

// Service for choosing the paragraph of a given motion that is to be amended
.factory('AmendmentParagraphChooseForm', [
    function () {
        return {
            // ngDialog for motion form
            getDialog: function (motion, successCb) {
                return {
                    template: 'static/templates/motions/amendment-paragraph-choose-form.html',
                    controller: 'AmendmentParagraphChooseCtrl',
                    className: 'ngdialog-theme-default wide-form',
                    closeByEscape: false,
                    closeByDocument: false,
                    resolve: {
                        motion: function () { return motion; },
                        successCb: function() { return successCb; },
                    }
                };
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
    'ShowAsAgendaItemField',
    function ($filter, gettextCatalog, operator, Editor, MotionComment, Category, Config,
        Mediafile, MotionBlock, Tag, User, Workflow, Agenda, AgendaTree, ShowAsAgendaItemField) {
        return {
            // ngDialog for motion form
            // If motion is given and not null, we're editing an already existing motion
            // If parentMotion is give, we're dealing with an amendment
            // If paragraphNo is given as well, the amendment is paragraph-based
            // If paragraphTextPre is given, we're creating a modified version of another paragraph-based amendment
            getDialog: function (motion, parentMotion, paragraphNo, paragraphTextPre) {
                return {
                    template: 'static/templates/motions/motion-form.html',
                    controller: motion ? 'MotionUpdateCtrl' : 'MotionCreateCtrl',
                    className: 'ngdialog-theme-default wide-form',
                    closeByEscape: false,
                    closeByDocument: false,
                    resolve: {
                        motionId: function () {return motion ? motion.id : void 0;},
                        parentMotion: function () {return parentMotion;},
                        paragraphNo: function () {return paragraphNo;},
                        paragraphTextPre: function () {return paragraphTextPre;}
                    }
                };
            },
            // angular-formly fields for motion form
            getFormFields: function (isCreateForm, isParagraphBasedAmendment) {
                if (!isParagraphBasedAmendment) { // catch null and undefined. Angular formy doesn't like this.
                    isParagraphBasedAmendment = false;
                }

                var workflows = Workflow.getAll();
                var images = Mediafile.getAllImages();
                var formFields = [];
                formFields.push({
                    key: 'identifier',
                    type: 'input',
                    templateOptions: {
                        label: gettextCatalog.getString('Identifier')
                    },
                    hide: true
                });

                if (isCreateForm) {
                    formFields.push({
                        key: 'submitters_id',
                        type: 'select-multiple',
                        templateOptions: {
                            label: gettextCatalog.getString('Submitters'),
                            options: User.getAll(),
                            ngOptions: 'option.id as option.full_name for option in to.options',
                            placeholder: gettextCatalog.getString('Select or search a submitter ...'),
                        },
                        hide: !operator.hasPerms('motions.can_manage')
                    });
                }

                formFields = formFields.concat([
                    {
                        key: 'title',
                        type: 'input',
                        templateOptions: {
                            label: gettextCatalog.getString('Title'),
                            required: true
                        },
                        hide: isParagraphBasedAmendment && isCreateForm
                    },
                    {
                        template: '<p class="spacer-top-lg no-padding">' + Config.translate(Config.get('motions_preamble').value) + '</p>'
                    },
                    {
                        key: 'text',
                        type: 'editor',
                        templateOptions: {
                            label: gettextCatalog.getString('Text'),
                            required: !isParagraphBasedAmendment // Deleting the whole paragraph in an amendment should be possible
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
                    }
                ]);

                // show as agenda item + parent item
                if (isCreateForm) {
                    formFields.push(ShowAsAgendaItemField('motions.can_manage'));
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

.factory('MotionCommentForm', [
    'MotionComment',
    function (MotionComment) {
        return {
            // ngDialog for motion comment form
            getDialog: function (motion, commentFieldId) {
                return {
                    template: 'static/templates/motions/motion-comment-form.html',
                    controller: 'MotionCommentCtrl',
                    className: 'ngdialog-theme-default wide-form',
                    closeByEscape: false,
                    closeByDocument: false,
                    resolve: {
                        motionId: function () {return motion.id;},
                        commentFieldId: function () {return commentFieldId;},
                    },
                };
            },
            // angular-formly fields for motion comment form
            getFormFields: function (commentFieldId) {
                return [
                    MotionComment.getFormField(commentFieldId)
                ];
            },
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
            getFormFields: function (precision) {
                var step = Math.pow(10, -precision);
                return [
                {
                    key: 'yes',
                    type: 'input',
                    templateOptions: {
                        label: gettextCatalog.getString('Yes'),
                        type: 'number',
                        step: step,
                        required: true
                    }
                },
                {
                    key: 'no',
                    type: 'input',
                    templateOptions: {
                        label: gettextCatalog.getString('No'),
                        type: 'number',
                        step: step,
                        required: true
                    }
                },
                {
                    key: 'abstain',
                    type: 'input',
                    templateOptions: {
                        label: gettextCatalog.getString('Abstain'),
                        type: 'number',
                        step: step,
                        required: true
                    }
                },
                {
                    key: 'votesvalid',
                    type: 'input',
                    templateOptions: {
                        label: gettextCatalog.getString('Valid votes'),
                        step: step,
                        type: 'number'
                    }
                },
                {
                    key: 'votesinvalid',
                    type: 'input',
                    templateOptions: {
                        label: gettextCatalog.getString('Invalid votes'),
                        step: step,
                        type: 'number'
                    }
                },
                {
                    key: 'votescast',
                    type: 'input',
                    templateOptions: {
                        label: gettextCatalog.getString('Votes cast'),
                        step: step,
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
                var someMotionsHaveAmendments = _.some(motions, function (motion) {
                    return motion.hasAmendments();
                });
                // if amendments amendments are already included. We owudl have them twice, if the option is enabled.
                if (Config.get('motions_amendments_main_table').value) {
                    someMotionsHaveAmendments = false;
                }
                var getMetaInformationOptions = function (disabled) {
                    if (!disabled) {
                        disabled = {};
                    }
                    var options = [
                        {name: gettextCatalog.getString('Submitters'), id: 'submitters', disabled: disabled.submitters},
                        {name: gettextCatalog.getString('State'), id: 'state', disabled: disabled.state},
                    ];
                    if (Config.get('motions_recommendations_by').value) {
                        options.push({
                            name: gettextCatalog.getString('Recommendation'),
                            id: 'recommendation',
                            disabled: disabled.recommendation
                        });
                    }
                    if (_.some(motions, function (motion) { return motion.category; })) {
                        options.push({
                            name: gettextCatalog.getString('Category'),
                            id: 'category',
                            disabled: disabled.category,
                        });
                    }
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
                    options.push({
                        name: gettextCatalog.getString('Voting result'),
                        id: 'votingresult',
                        disabled: disabled.votingResult
                    });
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
                if (someMotionsHaveAmendments) {
                    fields.push({
                        key: 'amendments',
                        type: 'radio-buttons',
                        templateOptions: {
                            label: gettextCatalog.getString('Amendments'),
                            options: [
                                {name: gettextCatalog.getString('Include'), value: true},
                                {name: gettextCatalog.getString('Exclude'), value: false},
                            ],
                        },
                    });
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
                                    {name: gettextCatalog.getString('Final version'), value: 'modified_agreed'},
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
                                    {name: gettextCatalog.getString('Final version'), value: 'modified_agreed'},
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
            amendments: false,
            include: {
                text: true,
                reason: true,
                state: true,
                category: true,
                submitters: true,
                votingresult: true,
                motionBlock: true,
                origin: true,
                recommendation: true,
            },
            includeComments: {},
        });
        // Always change the mode from agreed to modified_agreed. If a motion does not have a modified
        // final version, the agreed will be taken.
        if ($scope.params.changeRecommendationMode === 'agreed') {
            $scope.params.changeRecommendationMode = 'modified_agreed';
        }
        $scope.motions = motions;
        $scope.singleMotion = singleMotion;

        // Add amendments to motions. The amendments are sorted by their identifier
        var prepareAmendments = function (motions) {
            var allMotions = [];
            _.forEach(motions, function (motion) {
                allMotions.push(motion);
                allMotions = allMotions.concat(
                    _.sortBy(motion.getAmendments(), function (amendment) {
                        return amendment.identifier;
                    })
                );
            });
            return allMotions;
        };

        $scope.export = function () {
            if ($scope.params.amendments) {
                motions = prepareAmendments(motions);
            }
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
    'MotionPollDecimalPlaces',
    function ($scope, MajorityMethodChoices, Config, MotionPollDetailCtrlCache, MotionPollDecimalPlaces) {
        // Define choices.
        $scope.methodChoices = MajorityMethodChoices;
        // TODO: Get $scope.baseChoices from config_variables.py without copying them.

        $scope.votesPrecision = MotionPollDecimalPlaces.getPlaces($scope.poll);

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
            // get all main motions and order by identifier (after custom ordering)
            var motions;
            if (Config.get('motions_amendments_main_table').value) {
                motions = Motion.getAll();
            } else {
                motions = Motion.filter({parent_id: undefined});
            }

            $scope.motions = _.orderBy(motions, ['identifier']);
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

        // This value may be overritten, so the filters, sorting and pagination in an
        // derived view are independent to this view.
        var osTablePrefix = $scope.osTablePrefix || 'MotionTable';

        // Filtering
        $scope.filter = osTableFilter.createInstance(osTablePrefix + 'Filter');

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
                return submitter.user.get_short_name();
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
        $scope.sort = osTableSort.createInstance(osTablePrefix + 'Sort');
        if (!$scope.sort.column) {
            $scope.sort.column = 'identifier';
        }
        $scope.sortOptions = [
            {name: 'identifier',
             display_name: gettext('Identifier')},
            {name: 'getTitle()',
             display_name: gettext('Title')},
            {name: 'submitters[0].user.get_short_name()',
             display_name: gettext('Submitters')},
            {name: 'category.' + Config.get('motions_export_category_sorting').value,
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
        $scope.pagination = osTablePagination.createInstance(osTablePrefix + 'Pagination');

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
        $scope.openExportDialog = function (motions) {
            ngDialog.open(MotionExportForm.getDialog(motions, $scope.sort));
        };
        $scope.pdfExport = function (motions) {
            MotionPdfExport.export(motions);
        };

        // *** select mode functions ***
        $scope.isSelectMode = false;
        // check all checkboxes from filtered motions
        $scope.checkAll = function (motions) {
            $scope.selectedAll = !$scope.selectedAll;
            _.forEach(motions, function (motion) {
                motion.selected = $scope.selectedAll;
            });
        };
        // uncheck all checkboxes if isSelectMode is closed
        $scope.uncheckAll = function () {
            if (!$scope.isSelectMode) {
                $scope.selectedAll = false;
                _.forEach($scope.motions, function (motion) {
                    motion.selected = false;
                });
            }
        };
        var selectModeAction = function (motions, predicate) {
            angular.forEach(motions, function (motion) {
                if (motion.selected) {
                    predicate(motion);
                }
            });
            $scope.isSelectMode = false;
            $scope.uncheckAll();
        };
        // delete selected motions
        $scope.deleteMultiple = function (motions) {
            selectModeAction(motions, function (motion) {
                $scope.delete(motion);
            });
        };
        // set status for selected motions
        $scope.setStatusMultiple = function (motions, stateId) {
            selectModeAction(motions, function (motion) {
                $http.put('/rest/motions/motion/' + motion.id + '/set_state/', {'state': stateId});
            });
        };
        // set category for selected motions
        $scope.setCategoryMultiple = function (motions, categoryId) {
            selectModeAction(motions, function (motion) {
                motion.category_id = categoryId === 'no_category_selected' ? null : categoryId;
                $scope.save(motion);
            });
        };
        // set status for selected motions
        $scope.setMotionBlockMultiple = function (motions, motionBlockId) {
            selectModeAction(motions, function (motion) {
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
    'AmendmentParagraphChooseForm',
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
    'Notify',
    'WebpageTitle',
    'EditingWarning',
    function($scope, $http, $timeout, $window, $filter, operator, ngDialog, gettextCatalog,
            MotionForm, AmendmentParagraphChooseForm, ChangeRecommendationCreate, ChangeRecommendationView,
            MotionStateAndRecommendationParser, MotionChangeRecommendation, Motion, MotionComment,
            Category, Mediafile, Tag, User, Workflow, Config, motionId, MotionInlineEditing,
            MotionCommentsInlineEditing, Editor, Projector, ProjectionDefault, MotionBlock,
            MotionPdfExport, PersonalNoteManager, Notify, WebpageTitle, EditingWarning) {
        var motion = Motion.get(motionId);
        Category.bindAll({}, $scope, 'categories');
        Mediafile.bindAll({}, $scope, 'mediafiles');
        Tag.bindAll({}, $scope, 'tags');
        User.bindAll({}, $scope, 'users');
        Workflow.bindAll({}, $scope, 'workflows');
        MotionBlock.bindAll({}, $scope, 'motionBlocks');
        Motion.bindAll({}, $scope, 'motions');


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
            $scope.amendment_diff_paragraphs = $scope.motion.getAmendmentParagraphsLinesDiff();
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
            $scope.viewChangeRecommendations.setVersion(motion, motion.active_version);
        });
        $scope.$watch(function () {
            return Motion.lastModified();
        }, function () {
            $scope.motions = Motion.getAll();
            $scope.amendments = Motion.filter({parent_id: motion.id});
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
            {mode: 'modified_agreed',
            label: 'Final print template'},
        ];
        var motionDefaultRecommendationTextMode = Config.get('motions_recommendation_text_mode').value;
        // Change to the modified final version, if exists
        if (motionDefaultRecommendationTextMode === 'agreed' && motion.getModifiedFinalVersion()) {
            motionDefaultRecommendationTextMode = 'modified_agreed';
        }
        $scope.projectionMode = _.find($scope.projectionModes, function (mode) {
            return mode.mode == motionDefaultRecommendationTextMode;
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

        $scope.showAmendmentContext = false;
        $scope.setShowAmendmentContext = function($event) {
            $event.preventDefault();
            $event.stopPropagation();
            $scope.showAmendmentContext = !$scope.showAmendmentContext;
        };

        if (motion.parent_id) {
            Motion.bindOne(motion.parent_id, $scope, 'parent');
        }

        $scope.scrollToLine = 0;
        $scope.highlight = 0;
        $scope.linesForProjector = false;
        $scope.scrollToAndHighlight = function (line) {
            $scope.scrollToLine = line;
            $scope.highlight = line;

            // The same line number can occur twice in diff view; we scroll to the first one in this case
            var scrollTop = null;
            $('.line-number-' + line).each(function() {
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

            $scope.scrollProjectorToLine(line);
        };
        $scope.scrollProjectorToLine = function (line) {
            var projectorIds = $scope.motion.isProjected();
            if (!$scope.linesForProjector || !line || !projectorIds.length) {
                return;
            }
            var projectorId = projectorIds[0];
            var notifyNamePrefix = 'projector_' + projectorId + '_motion_line_';

            // register callback
            var callbackId = Notify.registerCallback(notifyNamePrefix + 'answer', function (params) {
                Notify.deregisterCallback(callbackId);
                $http.post('/rest/core/projector/' + projectorId + '/set_scroll/', params.params.scroll);
            });

            // Query all projectors
            Notify.notify(notifyNamePrefix + 'request', {line: line}, null, null, [projectorId]);
        };
        $scope.toggleLinesForProjector = function () {
            $scope.linesForProjector = !$scope.linesForProjector;
            $scope.scrollProjectorToLine($scope.scrollToLine);
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
            var openMainDialog = function (paragraphNo) {
                var dialog = MotionForm.getDialog(null, motion, paragraphNo);
                dialog.scope = $scope;
                ngDialog.open(dialog);
            };

            if (Config.get('motions_amendments_text_mode').value === 'paragraph') {
                var dialog = AmendmentParagraphChooseForm.getDialog($scope.motion, openMainDialog);
                dialog.scope = $scope;
                ngDialog.open(dialog);
            } else {
                openMainDialog();
            }
        };
        // follow recommendation
        $scope.followRecommendation = function () {
            $http.post('/rest/motions/motion/' + motion.id + '/follow_recommendation/', {
                'recommendationExtension': $scope.recommendationExtension
            });
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
            $scope.viewChangeRecommendations.setVersion(motion, motion.active_version);
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
        $scope.modifiedFinalVersionInlineEditing = MotionInlineEditing.createInstance($scope, motion,
            'view-modified-agreed-inline-editor', true, Editor.getOptions('inline'),
            function (obj) {
                return motion.getModifiedFinalVersionWithLineBreaks($scope.version);
            },
            function (obj) {
                motion.setModifiedFinalVersionStrippingLineBreaks(obj.editor.getData());
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

        // Change recommendation and amendment viewing
        $scope.viewChangeRecommendations = ChangeRecommendationView;
        $scope.viewChangeRecommendations.initSite($scope, motion, motionDefaultRecommendationTextMode);

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
        $scope.model._change_object = undefined;

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

.controller('AmendmentParagraphChooseCtrl', [
    '$scope',
    '$state',
    'Motion',
    'motion',
    'successCb',
    function($scope, $state, Motion, motion, successCb) {
        $scope.model = angular.copy(motion);
        $scope.model.paragraph_selected = null;

        $scope.paragraphs = motion.getTextParagraphs(motion.active_version, true).map(function(text, index) {
            // This prevents an error in ng-repeater's duplication detection if two identical paragraphs occur
            return {
                "paragraphNo": index,
                "text": text
            };
        });

        $scope.gotoMotionForm = function() {
            var paragraphNo = parseInt($scope.model.paragraph_selected);
            successCb(paragraphNo);
            $scope.closeThisDialog();
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
    'parentMotion',
    'paragraphNo',
    'paragraphTextPre',
    'Category',
    'Config',
    'Mediafile',
    'Tag',
    'User',
    'Workflow',
    'Agenda',
    'ErrorMessage',
    function($scope, $state, gettext, gettextCatalog, operator, Motion, MotionForm, parentMotion,
        paragraphNo, paragraphTextPre, Category, Config, Mediafile, Tag, User, Workflow,
        Agenda, ErrorMessage) {
        Category.bindAll({}, $scope, 'categories');
        Mediafile.bindAll({}, $scope, 'mediafiles');
        Tag.bindAll({}, $scope, 'tags');
        User.bindAll({}, $scope, 'users');
        Workflow.bindAll({}, $scope, 'workflows');

        $scope.model = {
            agenda_type: parseInt(Config.get('agenda_new_items_default_visibility').value),
        };

        $scope.alert = {};

        // Check whether this is a new amendment.
        var isAmendment = parentMotion && parentMotion.id,
            isParagraphBasedAmendment = false;

        // Set default values for create form
        // ... for amendments add parent_id
        if (isAmendment) {
            if (Config.get('motions_amendments_text_mode').value === 'fulltext') {
                $scope.model.text = parentMotion.getText();
            }
            if (Config.get('motions_amendments_text_mode').value === 'paragraph' &&
                paragraphNo !== undefined) {
                var paragraphs = parentMotion.getTextParagraphs(parentMotion.active_version, false);
                $scope.model.text = paragraphs[paragraphNo];
                isParagraphBasedAmendment = true;
            }
            if (paragraphTextPre !== undefined) {
                $scope.model.text = paragraphTextPre;
            }
            if (parentMotion.identifier) {
                $scope.model.title = gettextCatalog.getString('Amendment to') +
                    ' ' + parentMotion.identifier;
            } else {
                $scope.model.title = gettextCatalog.getString('Amendment to motion ') +
                    ' ' + parentMotion.getTitle();
            }
            $scope.model.paragraphNo = paragraphNo;
            $scope.model.parent_id = parentMotion.id;
            $scope.model.category_id = parentMotion.category_id;
            $scope.model.motion_block_id = parentMotion.motion_block_id;
            Motion.bindOne($scope.model.parent_id, $scope, 'parent');
        }
        // ... preselect default workflow if exist
        var workflow = Workflow.get(Config.get('motions_workflow').value);
        if (!workflow) {
            workflow = _.first(Workflow.getAll());
        }
        if (workflow) {
            $scope.model.workflow_id = workflow.id;
        } else {
            $scope.alert = {
                type: 'danger',
                msg: gettextCatalog.getString('No workflows exists. You will not ' +
                    'be able to create a motion.'),
                show: true,
            };
        }

        // get all form fields
        $scope.formFields = MotionForm.getFormFields(true, isParagraphBasedAmendment);

        // save motion
        $scope.save = function (motion, gotoDetailView) {
            if (isAmendment && motion.paragraphNo !== undefined) {
                var orig_paragraphs = parentMotion.getTextParagraphs(parentMotion.active_version, false);
                motion.amendment_paragraphs = orig_paragraphs.map(function (_, idx) {
                    return (idx === motion.paragraphNo ? motion.text : null);
                });
            }

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
    function ($scope, $state, Motion, Category, Config, Mediafile, MotionForm,
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
        // We need to clone this by hand. angular and lodash are not capable of keeping
        // crossreferences out.
        $scope.model = {
            id: motion.id,
            parent_id: motion.parent_id,
            identifier: motion.identifier,
            title: motion.getTitle(),
            text: motion.getText(),
            reason: motion.getReason(),
            submitters_id: _.map(motion.submitters_id),
            supporters_id: _.map(motion.supporters_id),
            tags_id: _.map(motion.tags_id),
            state_id: motion.state_id,
            recommendation_id: motion.recommendation_id,
            origin: motion.origin,
            workflow_id: motion.workflow_id,
            comments: _.clone(motion.comments),
            attachments_id: _.map(motion.attachments_id),
            active_version: motion.active_version,
            agenda_item_id: motion.agenda_item_id,
            category_id: motion.category_id,
            motion_block_id: motion.motion_block_id,
        };
        // Clone comments
        _.forEach(motion.comments, function (comment, index) {
            $scope.model['comment_' + index] = comment;
        });
        $scope.model.disable_versioning = false;
        $scope.model.more = false;
        if (motion.isParagraphBasedAmendment()) {
            motion.getVersion(motion.active_version).amendment_paragraphs.forEach(function(paragraph_amend, paragraphNo) {
                // Hint: this assumes there is only one modified paragraph
                if (paragraph_amend !== null) {
                    $scope.model.text = paragraph_amend;
                    $scope.model.paragraphNo = paragraphNo;
                }
            });
            $scope.model.title = motion.getTitle();
        }

        // get all form fields
        $scope.formFields = MotionForm.getFormFields(false, motion.isParagraphBasedAmendment());
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
        $scope.save = function (model, gotoDetailView) {
            if ($scope.model.paragraphNo !== undefined) {
                var parentMotion = motion.getParentMotion();
                var orig_paragraphs = parentMotion.getTextParagraphs(parentMotion.active_version, false);
                $scope.model.amendment_paragraphs = orig_paragraphs.map(function (_, idx) {
                    return (idx === $scope.model.paragraphNo ? $scope.model.text : null);
                });
            }

            // inject the changed motion (copy) object back into DS store
            Motion.inject(model);
            // save changed motion object on server
            Motion.save(model).then(
                function(success) {
                    if (gotoDetailView) {
                        $state.go('motions.motion.detail', {id: success.id});
                    }
                    $scope.closeThisDialog();
                },
                function (error) {
                    // save error: revert all changes by restore
                    // (refresh) original motion object from server
                    Motion.refresh(model);
                    $scope.alert = ErrorMessage.forAlert(error);
                }
            );
        };
    }
])

.controller('MotionCommentCtrl', [
    '$scope',
    'Motion',
    'MotionComment',
    'MotionCommentForm',
    'motionId',
    'commentFieldId',
    'gettextCatalog',
    'ErrorMessage',
    function ($scope, Motion, MotionComment, MotionCommentForm, motionId, commentFieldId,
        gettextCatalog, ErrorMessage) {
        $scope.alert = {};

        // set initial values for form model by create deep copy of motion object
        // so list/detail view is not updated while editing
        var motion = Motion.get(motionId);
        $scope.model = angular.copy(motion);
        $scope.formFields = MotionCommentForm.getFormFields(commentFieldId);

        var fields = MotionComment.getNoSpecialCommentsFields();
        var title = gettextCatalog.getString('Edit comment %%comment%% of motion %%motion%%');
        title = title.replace('%%comment%%', fields[commentFieldId].name);
        $scope.title = title.replace('%%motion%%', motion.getTitle());

        $scope.model.title = motion.getTitle(-1);
        $scope.model.text = motion.getText(-1);
        $scope.model.reason = motion.getReason(-1);

        if (motion.isParagraphBasedAmendment()) {
            motion.getVersion(motion.active_version).amendment_paragraphs.forEach(function(paragraph_amend, paragraphNo) {
                // Hint: this assumes there is only one modified paragraph
                if (paragraph_amend !== null) {
                    $scope.model.text = paragraph_amend;
                    $scope.model.paragraphNo = paragraphNo;
                }
            });
        }

        $scope.save = function (motion) {
            if (motion.isParagraphBasedAmendment()) {
                motion.getVersion(motion.active_version).amendment_paragraphs.forEach(function(paragraph_amend, paragraphNo) {
                    // Hint: this assumes there is only one modified paragraph
                    if (paragraph_amend !== null) {
                        $scope.model.text = paragraph_amend;
                        $scope.model.paragraphNo = paragraphNo;
                    }
                });
            }

            // inject the changed motion (copy) object back into DS store
            Motion.inject(motion);
            // save changed motion object on server
            Motion.save(motion).then(
                function(success) {
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
    'MotionPollDecimalPlaces',
    'motionpollId',
    'voteNumber',
    'ErrorMessage',
    function ($scope, gettextCatalog, MotionPoll, MotionPollForm, MotionPollDecimalPlaces,
        motionpollId, voteNumber, ErrorMessage) {
        // set initial values for form model by create deep copy of motionpoll object
        // so detail view is not updated while editing poll
        var motionpoll = MotionPoll.get(motionpollId);
        $scope.model = angular.copy(motionpoll);
        $scope.voteNumber = voteNumber;
        var precision = MotionPollDecimalPlaces.getPlaces(motionpoll);
        $scope.formFields = MotionPollForm.getFormFields(precision);
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
            .then(function (success) {
                $scope.alert.show = false;
                $scope.closeThisDialog();
            }, function (error) {
                $scope.alert = ErrorMessage.forAlert(error);
            });
        };
    }
])

.controller('MotionSubmitterCtrl', [
    '$scope',
    '$filter',
    '$http',
    'User',
    'Motion',
    'motionId',
    'ErrorMessage',
    function ($scope, $filter, $http, User, Motion, motionId, ErrorMessage) {
        User.bindAll({}, $scope, 'users');
        $scope.submitterSelectBox = {};
        $scope.alert = {};

        $scope.$watch(function () {
            return Motion.lastModified(motionId);
        }, function () {
            $scope.motion = Motion.get(motionId);
            $scope.submitters = $filter('orderBy')($scope.motion.submitters, 'weight');
        });

        $scope.addSubmitter = function (userId) {
            $scope.submitterSelectBox = {};
            $http.post('/rest/motions/motion/' + $scope.motion.id + '/manage_submitters/', {
                'user': userId
            }).then(
                function (success) {
                    $scope.alert.show = false;
                }, function (error) {
                    $scope.alert = ErrorMessage.forAlert(error);
                }
            );
        };

        $scope.removeSubmitter = function (userId) {
            $http.delete('/rest/motions/motion/' + $scope.motion.id + '/manage_submitters/', {
                headers: {'Content-Type': 'application/json'},
                data: JSON.stringify({user: userId})
            }).then(
                function (success) {
                    $scope.alert.show = false;
                }, function (error) {
                    $scope.alert = ErrorMessage.forAlert(error);
                }
            );
        };

        // save reordered list of submitters
        $scope.treeOptions = {
            dropped: function (event) {
                var submitterIds = _.map($scope.submitters, function (submitter) {
                    return submitter.id;
                });
                $http.post('/rest/motions/motion/' + $scope.motion.id + '/sort_submitters/', {
                    submitters: submitterIds,
                });
            }
        };
    }
])

.controller('MotionAmendmentListStateCtrl', [
    '$scope',
    'motionId',
    function ($scope, motionId) {
        $scope.motionId = motionId;
        $scope.osTablePrefix = 'AmendmentTable';
    }
])

.controller('MotionAmendmentListCtrl', [
    '$scope',
    '$sessionStorage',
    '$state',
    'Motion',
    'MotionComment',
    'MotionForm',
    'PersonalNoteManager',
    'ngDialog',
    'MotionCommentForm',
    'MotionChangeRecommendation',
    'MotionPdfExport',
    'AmendmentCsvExport',
    'gettextCatalog',
    'gettext',
    function ($scope, $sessionStorage, $state, Motion, MotionComment, MotionForm,
        PersonalNoteManager, ngDialog, MotionCommentForm, MotionChangeRecommendation,
        MotionPdfExport, AmendmentCsvExport, gettextCatalog, gettext) {
        if ($scope.motionId) {
            $scope.leadMotion = Motion.get($scope.motionId);
        }

        var updateMotions = function () {
            // check, if lead motion is given
            var amendments;
            if ($scope.leadMotion) {
                amendments = Motion.filter({parent_id: $scope.leadMotion.id});
            } else {
                amendments = _.filter(Motion.getAll(), function (motion) {
                    return motion.parent_id;
                });
            }
            // always order by identifier (after custom ordering)
            $scope.amendments = _.orderBy(amendments, ['identifier']);

            _.forEach($scope.amendments, function (amendment) {
                MotionComment.populateFields(amendment);
                amendment.personalNote = PersonalNoteManager.getNote(amendment);
                // For filtering, we cannot filter for .personalNote.star
                amendment.star = amendment.personalNote ? amendment.personalNote.star : false;
                amendment.hasPersonalNote = amendment.personalNote ? !!amendment.personalNote.note : false;
                if (amendment.star === undefined) {
                    amendment.star = false;
                }

                // add a custom sort attribute
                var parentMotion = amendment.getParentMotion();
                amendment.parentMotionAndLineNumber = parentMotion.identifier;
                if (amendment.isParagraphBasedAmendment()) {
                    var paragraphs = amendment.getAmendmentParagraphsLinesDiff();
                    var diffLine = '0';
                    if (paragraphs.length) {
                        diffLine = '' + paragraphs[0].diffLineFrom;
                    }
                    while (diffLine.length < 6) {
                        diffLine = '0' + diffLine;
                    }
                    amendment.parentMotionAndLineNumber += ' ' + diffLine;
                }
            });

            // Get all lead motions
            $scope.leadMotions = _.orderBy(Motion.filter({parent_id: undefined}), ['identifier']);

            //updateCollissions();
        };

        var updateCollissions = function () {
            $scope.collissions = {};
            _.forEach($scope.amendments, function (amendment) {
                if (amendment.isParagraphBasedAmendment()) {
                    var parentMotion = amendment.getParentMotion();
                    // get all change recommendations _and_ changes by amendments from the
                    // parent motion. From all get the unified change object.
                    var parentChangeRecommendations = _.filter(
                        MotionChangeRecommendation.filter({
                            'where': {'motion_version_id': {'==': parentMotion.active_version}}
                        }), function (change) {
                            return change.isTextRecommendation();
                        }
                    );
                    var parentChanges = parentChangeRecommendations.map(function (cr) {
                        return cr.getUnifiedChangeObject();
                    }).concat(
                        _.map(parentMotion.getParagraphBasedAmendmentsForDiffView(), function (amendment) {
                            return amendment.getUnifiedChangeObject();
                        })
                    );
                    var change = amendment.getUnifiedChangeObject();
                    if (change) {
                        change.setOtherChangesForCollission(parentChanges);
                        $scope.collissions[amendment.id] = !!change.getCollissions().length;
                    }
                }
            });
        };

        //$scope.$watch(function () {
        //    return MotionChangeRecommendation.lastModified();
        //}, updateCollissions);

        $scope.$watch(function () {
            return Motion.lastModified();
        }, updateMotions);

        $scope.selectLeadMotion = function (motion) {
            $scope.leadMotion = motion;
            updateMotions();
            if ($scope.leadMotion) {
                $state.transitionTo('motions.motion.amendment-list',
                    {id: $scope.leadMotion.id},
                    {notify: false}
                );
            } else {
                $state.transitionTo('motions.motion.allamendments', {},
                    {notify: false}
                );
            }
        };

        // Save expand state so the session
        if ($sessionStorage.amendmentTableExpandState) {
            $scope.toggleExpandContent();
        }
        $scope.saveExpandState = function (state) {
            $sessionStorage.amendmentTableExpandState = state;
        };

        // add custom sorting
        $scope.sortOptions.unshift({
            name: 'parentMotionAndLineNumber',
            display_name: gettext('Parent motion and line number'),
        });
        if (!$scope.sort.column || $scope.sort.column === 'identifier') {
            $scope.sort.column = 'parentMotionAndLineNumber';
        }

        $scope.isTextExpandable = function (comment, characters) {
            comment = $(comment).text();
            return comment.length > characters;
        };
        $scope.getTextPreview = function (comment, characters) {
            comment = $(comment).text();
            if (comment.length > characters) {
                comment = comment.substr(0, characters) + '...';
            }
            return comment;
        };
        $scope.editComment = function (motion, fieldId) {
            ngDialog.open(MotionCommentForm.getDialog(motion, fieldId));
        };

        $scope.createModifiedAmendment = function (amendment) {
            var paragraphNo,
                paragraphText;
            if (amendment.isParagraphBasedAmendment()) {
                // We assume there is only one affected paragraph
                amendment.getVersion(amendment.active_version).amendment_paragraphs.forEach(function(parText, parNo) {
                    if (parText !== null) {
                        paragraphNo = parNo;
                        paragraphText = parText;
                    }
                });
            } else {
                paragraphText = amendment.getText();
            }
            ngDialog.open(MotionForm.getDialog(null, amendment.getParentMotion(), paragraphNo, paragraphText));
        };

        $scope.amendmentPdfExport = function (motions) {
            var filename;
            if ($scope.leadMotion) {
                filename = gettextCatalog.getString('Amendments to') + ' ' +
                    $scope.leadMotion.getTitle();
            } else {
                filename = gettextCatalog.getString('Amendments');
            }
            filename += '.pdf';
            MotionPdfExport.exportAmendments(motions, filename);
        };

        $scope.exportCsv = function (motions) {
            AmendmentCsvExport.export(motions);
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
    function ($scope, $q, gettext, Category, Motion, MotionBlock, User, MotionCsvExport) {
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
                    _.forEach(User.getAll(), function (user) {
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
        $scope.toggleSort = function (column) {
            if ($scope.sortColumn === column) {
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
                function (success) {
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
    function ($scope, Category, categoryId, CategoryForm, ErrorMessage) {
        $scope.alert = {};
        $scope.model = angular.copy(Category.get(categoryId));
        $scope.formFields = CategoryForm.getFormFields();
        $scope.save = function (category) {
            Category.inject(category);
            Category.save(category).then(
                function (success) {
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
    function ($scope, $stateParams, $http, Category, categoryId, Motion, ErrorMessage) {
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
        gettext('Edit comment %%comment%% of motion %%motion%%');

        // subgroup Amendments
        gettext('Amendments');
        gettext('Activate amendments');
        gettext('Show amendments together with motions');
        gettext('Prefix for the identifier for amendments');
        gettext('Apply text for new amendments');
        gettext('The title of the motion is always applied.');
        gettext('Amendment to');
        gettext('How to create new amendments');
        gettext('Empty text field');
        gettext('Edit the whole motion text');
        gettext('Paragraph-based, Diff-enabled');

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
        gettext('Amendment');
    }
]);

}());
