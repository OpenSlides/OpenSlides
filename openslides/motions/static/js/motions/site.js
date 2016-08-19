(function () {

'use strict';

angular.module('OpenSlidesApp.motions.site', ['OpenSlidesApp.motions', 'OpenSlidesApp.motions.diff'])

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
    '$stateProvider',
    function($stateProvider) {
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
                        return Motion.findAll().then(function(motions) {
                            angular.forEach(motions, function(motion) {
                                Motion.loadRelations(motion, 'agenda_item');
                            });
                        });
                    },
                    categories: function(Category) {
                        return Category.findAll();
                    },
                    tags: function(Tag) {
                        return Tag.findAll();
                    },
                    users: function(User) {
                        return User.findAll().catch(
                            function () {
                                return null;
                            }
                        );
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
                        return User.findAll().catch(
                            function () {
                                return null;
                            }
                        );
                    },
                    mediafiles: function(Mediafile) {
                        return Mediafile.findAll().catch(
                            function () {
                                return null;
                            }
                        );
                    },
                    tags: function(Tag) {
                        return Tag.findAll();
                    }
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
                                motion: function() {
                                    return Motion.find($stateParams.id).then(function(motion) {
                                        return Motion.loadRelations(motion, 'agenda_item');
                                    });
                                },
                            },
                            preCloseCallback: function() {
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
                resolve: {
                    motions: function(Motion) {
                        return Motion.findAll();
                    },
                    categories: function(Category) {
                        return Category.findAll();
                    },
                    users: function(User) {
                        return User.findAll();
                    }
                }
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
            .state('motions.category.sort', {
                url: '/sort/{id}',
                resolve: {
                    category: function(Category, $stateParams) {
                        return Category.find($stateParams.id);
                    },
                    motions: function(Motion) {
                        return Motion.findAll();
                    }
                },
                controller: 'CategorySortCtrl',
                templateUrl: 'static/templates/motions/category-sort.html'
            });
    }
])

// Service for generic motion form (create and update)
.factory('MotionForm', [
    'gettextCatalog',
    'operator',
    'Editor',
    'Category',
    'Config',
    'Mediafile',
    'Tag',
    'User',
    'Workflow',
    function (gettextCatalog, operator, Editor, Category, Config, Mediafile, Tag, User, Workflow) {
        return {
            // ngDialog for motion form
            getDialog: function (motion) {
                var resolve = {};
                if (motion) {
                    resolve = {
                        motion: function() {
                            return motion;
                        },
                        agenda_item: function(Motion) {
                            return Motion.loadRelations(motion, 'agenda_item');
                        }
                    };
                }
                resolve.mediafiles = function (Mediafile) {
                        return Mediafile.findAll();
                };
                return {
                    template: 'static/templates/motions/motion-form.html',
                    controller: (motion) ? 'MotionUpdateCtrl' : 'MotionCreateCtrl',
                    className: 'ngdialog-theme-default wide-form',
                    closeByEscape: false,
                    closeByDocument: false,
                    resolve: (resolve) ? resolve : null
                };
            },
            // angular-formly fields for motion form
            getFormFields: function () {
                var workflows = Workflow.getAll();
                var images = Mediafile.getAllImages();
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
                    key: 'text',
                    type: 'editor',
                    templateOptions: {
                        label: gettextCatalog.getString('Text'),
                        required: true
                    },
                    data: {
                        tinymceOption: Editor.getOptions(images)
                    }
                },
                {
                    key: 'reason',
                    type: 'editor',
                    templateOptions: {
                        label: gettextCatalog.getString('Reason'),
                    },
                    data: {
                        tinymceOption: Editor.getOptions(images)
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
                },
                {
                    key: 'more',
                    type: 'checkbox',
                    templateOptions: {
                        label: gettextCatalog.getString('Show extended fields')
                    },
                    hide: !operator.hasPerms('motions.can_manage')
                },
                {
                    key: 'attachments_id',
                    type: 'select-multiple',
                    templateOptions: {
                        label: gettextCatalog.getString('Attachment'),
                        options: Mediafile.getAll(),
                        ngOptions: 'option.id as option.title_or_filename for option in to.options',
                        placeholder: gettextCatalog.getString('Select or search an attachment ...')
                    },
                    hideExpression: '!model.more'
                },
                {
                    key: 'category_id',
                    type: 'select-single',
                    templateOptions: {
                        label: gettextCatalog.getString('Category'),
                        options: Category.getAll(),
                        ngOptions: 'option.id as option.name for option in to.options',
                        placeholder: gettextCatalog.getString('Select or search a category ...')
                    },
                    hideExpression: '!model.more'
                },
                {
                    key: 'origin',
                    type: 'input',
                    templateOptions: {
                        label: gettextCatalog.getString('Origin'),
                    },
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
                },
                {
                    key: 'supporters_id',
                    type: 'select-multiple',
                    templateOptions: {
                        label: gettextCatalog.getString('Supporters'),
                        options: User.getAll(),
                        ngOptions: 'option.id as option.full_name for option in to.options',
                        placeholder: gettextCatalog.getString('Select or search a supporter ...')
                    },
                    hideExpression: '!model.more'
                },
                {
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
                }];
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

.controller('MotionListCtrl', [
    '$scope',
    '$state',
    'ngDialog',
    'MotionForm',
    'Motion',
    'Category',
    'Tag',
    'Workflow',
    'User',
    function($scope, $state, ngDialog, MotionForm, Motion, Category, Tag, Workflow, User) {
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
        $scope.toggleSort = function (column) {
            if ( $scope.sortColumn === column ) {
                $scope.reverse = !$scope.reverse;
            }
            $scope.sortColumn = column;
        };
        // define custom search filter string
        $scope.getFilterString = function (motion) {
            var category = '';
            if (motion.category) {
                category = motion.category.name;
            }
            return [
                motion.identifier,
                motion.getTitle(),
                motion.getText(),
                motion.getReason(),
                motion.origin,
                _.map(
                    motion.submitters,
                    function (submitter) {
                        return submitter.get_short_name();
                    }
                ).join(" "),
                _.map(
                    motion.supporters,
                    function (supporter) {
                        return supporter.get_short_name();
                    }
                ).join(" "),
                _.map(
                    motion.tags,
                    function (tag) {
                        return tag.name;
                    }
                ).join(" "),
                category,
            ].join(" ");
        };

        // collect all states of all workflows
        // TODO: regard workflows only which are used by motions
        $scope.states = [];
        var workflows = Workflow.getAll();
        angular.forEach(workflows, function (workflow) {
            if (workflows.length > 1) {
                var wf = {};
                wf.name = workflow.name;
                wf.workflowSeparator = "-";
                $scope.states.push(wf);
            }
            angular.forEach(workflow.states, function (state) {
                $scope.states.push(state);
            });
        });

        // open new/edit dialog
        $scope.openDialog = function (motion) {
            ngDialog.open(MotionForm.getDialog(motion));
        };
        // cancel QuickEdit mode
        $scope.cancelQuickEdit = function (motion) {
            // revert all changes by restore (refresh) original motion object from server
            Motion.refresh(motion);
            motion.quickEdit = false;
        };
        // save changed motion
        $scope.save = function (motion) {
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
        $scope.deleteMultiple = function () {
            angular.forEach($scope.motions, function (motion) {
                if (motion.selected)
                    Motion.destroy(motion.id);
            });
            $scope.isDeleteMode = false;
            $scope.uncheckAll();
        };
        // delete single motion
        $scope.delete = function (motion) {
            Motion.destroy(motion.id);
        };
    }
])

.controller('MotionDetailCtrl', [
    '$scope',
    '$http',
    'ngDialog',
    'MotionForm',
    'Motion',
    'Category',
    'Mediafile',
    'Tag',
    'User',
    'Workflow',
    'Editor',
    'Config',
    'motion',
    'diffService',
    function($scope, $http, ngDialog, MotionForm, Motion, Category, Mediafile, Tag, User, Workflow, Editor, Config,
             motion, diffService) {
        Motion.bindOne(motion.id, $scope, 'motion');
        Category.bindAll({}, $scope, 'categories');
        Mediafile.bindAll({}, $scope, 'mediafiles');
        Tag.bindAll({}, $scope, 'tags');
        User.bindAll({}, $scope, 'users');
        Workflow.bindAll({}, $scope, 'workflows');
        Motion.loadRelations(motion, 'agenda_item');
        $scope.version = motion.active_version;
        $scope.isCollapsed = true;
        $scope.lineNumberMode = Config.get('motions_default_line_numbering').value;
        $scope.lineBrokenText = motion.getTextWithLineBreaks($scope.version);

        // open edit dialog
        $scope.openDialog = function (motion) {
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
        // update state
        $scope.updateState = function (state_id) {
            $http.put('/rest/motions/motion/' + motion.id + '/set_state/', {'state': state_id});
        };
        // reset state
        $scope.reset_state = function (state_id) {
            $http.put('/rest/motions/motion/' + motion.id + '/set_state/', {});
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
                    motionpoll: function (MotionPoll) {
                        return MotionPoll.find(poll.id);
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
            $scope.lineBrokenText = motion.getTextWithLineBreaks($scope.version);
            $scope.inlineEditing.allowed = (motion.isAllowed('update') && $scope.version == motion.getVersion(-1).id);
            $scope.inlineEditing.changed = false;
            $scope.inlineEditing.active = false;
            $scope.inlineEditing.originalHtml = $scope.lineBrokenText;
            $scope.inlineEditing.originalHtmlNormalized = normalizeInlineHtml($scope.lineBrokenText);
            if ($scope.inlineEditing.editor) {
                $scope.inlineEditing.editor.setContent($scope.inlineEditing.originalHtml);
                $scope.inlineEditing.editor.setMode("readonly");
            }
        };
        // permit specific version
        $scope.permitVersion = function (version) {
            $http.put('/rest/motions/motion/' + motion.id + '/manage_version/',
                {'version_number': version.version_number})
                .then(function(success) {
                    $scope.version = version.id;
                });
        };
        // delete specific version
        $scope.deleteVersion = function (version) {
            $http.delete('/rest/motions/motion/' + motion.id + '/manage_version/',
                    {headers: {'Content-Type': 'application/json'},
                     data: JSON.stringify({version_number: version.version_number})})
                .then(function(success) {
                    $scope.version = motion.active_version;
                });
        };


        // Inline editing functions
        var normalizeInlineHtml = function(text) {
            text = text.replace(/ contenteditable="false"/g, "");
            text = text.replace(/ \/>/g, ">");
            return text;
        };
        $scope.inlineEditing = {
            allowed: (motion.isAllowed('update') && $scope.version == motion.getVersion(-1).id),
            active: false,
            changed: false,
            trivialChange: false,
            trivialChangeAllowed: false,
            editor: null,
            originalHtml: $scope.lineBrokenText,
            originalHtmlNormalized: normalizeInlineHtml($scope.lineBrokenText)
        };

        if (motion.state.versioning && Config.get('motions_allow_disable_versioning').value) {
            $scope.inlineEditing.trivialChange = true;
            $scope.inlineEditing.trivialChangeAllowed = true;
        }

        $scope.tinymceOptions = Editor.getOptions(null, true);
        $scope.tinymceOptions.readonly = 1;
        $scope.tinymceOptions.entities = "160,nbsp,38,amp,34,quot,162,cent,8364,euro,163,pound,165,yen,169,copy," +
            "174,reg,8482,trade,8240,permil,60,lt,62,gt,8804,le,8805,ge,176,deg,8722,minus";
        $scope.tinymceOptions.setup = function(editor) {
            $scope.inlineEditing.editor = editor;
            editor.on("change", function() {
                var text = normalizeInlineHtml(editor.getContent());
                text = text.replace(/ \/>/g, ">");
                $scope.inlineEditing.changed = (text != $scope.inlineEditing.originalHtmlNormalized);
            });
        };

        $scope.enableInlineEditing = function() {
            $scope.inlineEditing.editor.setMode("design");
            $scope.inlineEditing.active = true;
        };

        $scope.disableInlineEditing = function() {
            $scope.inlineEditing.editor.setMode("readonly");
            $scope.inlineEditing.active = false;
            $scope.inlineEditing.changed = false;
            $scope.lineBrokenText = $scope.inlineEditing.originalHtml;
            $scope.inlineEditing.editor.setContent($scope.inlineEditing.originalHtml);
        };

        $scope.motionInlineSave = function () {
            if (!$scope.inlineEditing.allowed) {
                throw "No permission to update motion";
            }

            var newInlineHtml = normalizeInlineHtml($scope.inlineEditing.editor.getContent());
            motion.setTextStrippingLineBreaks(motion.active_version, newInlineHtml);
            motion.disable_versioning = $scope.inlineEditing.trivialChange;
            console.log(motion.disable_versioning);

            Motion.inject(motion);
            // save change motion object on server
            Motion.save(motion, { method: 'PATCH' }).then(
                function(success) {
                    $scope.showVersion(motion.getVersion(-1));
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

.controller('MotionCreateCtrl', [
    '$scope',
    'gettext',
    'Motion',
    'MotionForm',
    'Category',
    'Config',
    'Mediafile',
    'Tag',
    'User',
    'Workflow',
    'Agenda',
    function($scope, gettext, Motion, MotionForm, Category, Config, Mediafile, Tag, User, Workflow, Agenda) {
        Category.bindAll({}, $scope, 'categories');
        Mediafile.bindAll({}, $scope, 'mediafiles');
        Tag.bindAll({}, $scope, 'tags');
        User.bindAll({}, $scope, 'users');
        Workflow.bindAll({}, $scope, 'workflows');

        $scope.model = {};
        // set default values for create form
        // ... set preamble config value as text
        $scope.model.text = Config.get('motions_preamble').value;
        // ... preselect default workflow
        $scope.model.workflow_id = Config.get('motions_workflow').value;
        // get all form fields
        $scope.formFields = MotionForm.getFormFields();
        // save motion
        $scope.save = function (motion) {
            Motion.create(motion).then(
                function(success) {
                    // find related agenda item
                    Agenda.find(success.agenda_item_id).then(function(item) {
                        // check form element and set item type (AGENDA_ITEM = 1, HIDDEN_ITEM = 2)
                        var type = motion.showAsAgendaItem ? 1 : 2;
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
    'motion',
    function($scope, Motion, Category, Config, Mediafile, MotionForm, Tag, User, Workflow, Agenda, motion) {
        Category.bindAll({}, $scope, 'categories');
        Mediafile.bindAll({}, $scope, 'mediafiles');
        Tag.bindAll({}, $scope, 'tags');
        User.bindAll({}, $scope, 'users');
        Workflow.bindAll({}, $scope, 'workflows');
        $scope.alert = {};

        // set initial values for form model by create deep copy of motion object
        // so list/detail view is not updated while editing
        $scope.model = angular.copy(motion);
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
            if ($scope.formFields[i].key == "disable_versioning" &&
                Config.get('motions_allow_disable_versioning')) {
                // check current state if versioning is active
                if (motion.state.versioning) {
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
        }

        // save motion
        $scope.save = function (motion) {
            // inject the changed motion (copy) object back into DS store
            Motion.inject(motion);
            // save change motion object on server
            Motion.save(motion, { method: 'PATCH' }).then(
                function(success) {
                    // check form element and set item type (AGENDA_ITEM = 1, HIDDEN_ITEM = 2)
                    var type = motion.showAsAgendaItem ? 1 : 2;
                    // save only if agenda item type is modified
                    if (motion.agenda_item.type != type) {
                        motion.agenda_item.type = type;
                        Agenda.save(motion.agenda_item);
                    }
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
    'motionpoll',
    'voteNumber',
    function($scope, gettextCatalog, MotionPoll, MotionPollForm, motionpoll, voteNumber) {
        // set initial values for form model by create deep copy of motionpoll object
        // so detail view is not updated while editing poll
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
    'gettext',
    'Category',
    'Motion',
    'User',
    function($scope, gettext, Category, Motion, User) {
        // set initial data for csv import
        $scope.motions = [];
        $scope.separator = ',';
        $scope.encoding = 'UTF-8';
        $scope.encodingOptions = ['UTF-8', 'ISO-8859-1'];
        $scope.accept = '.csv, .txt';
        $scope.csv = {
            content: null,
            header: true,
            headerVisible: false,
            separator: $scope.separator,
            separatorVisible: false,
            encoding: $scope.encoding,
            encodingVisible: false,
            accept: $scope.accept,
            result: null
        };
        // set csv file encoding
        $scope.setEncoding = function () {
            $scope.csv.encoding = $scope.encoding;
        };
        // set csv file encoding
        $scope.setSeparator = function () {
            $scope.csv.separator = $scope.separator;
        };
        // detect if csv file is loaded
        $scope.$watch('csv.result', function () {
            $scope.motions = [];
            var quotionRe = /^"(.*)"$/;
            angular.forEach($scope.csv.result, function (motion) {
                if (motion.identifier) {
                    motion.identifier = motion.identifier.replace(quotionRe, '$1');
                    if (motion.identifier !== '') {
                        // All motion objects are already loaded via the resolve statement from ui-router.
                        var motions = Motion.getAll();
                        if (_.find(motions, function (item) {
                            return item.identifier == motion.identifier;
                        })) {
                            motion.importerror = true;
                            motion.identifier_error = gettext('Error: Identifier already exists.');
                        }
                    }
                }
                // title
                if (motion.title) {
                    motion.title = motion.title.replace(quotionRe, '$1');
                }
                if (!motion.title) {
                    motion.importerror = true;
                    motion.title_error = gettext('Error: Title is required.');
                }
                // text
                if (motion.text) {
                    motion.text = motion.text.replace(quotionRe, '$1');
                }
                if (!motion.text) {
                    motion.importerror = true;
                    motion.text_error = gettext('Error: Text is required.');
                }
                // reason
                if (motion.reason) {
                    motion.reason = motion.reason.replace(quotionRe, '$1');
                }
                // submitter
                if (motion.submitter) {
                    motion.submitter = motion.submitter.replace(quotionRe, '$1');
                    if (motion.submitter !== '') {
                        // All user objects are already loaded via the resolve statement from ui-router.
                        var users = User.getAll();
                        angular.forEach(users, function (user) {
                            if (user.short_name == motion.submitter) {
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
                    motion.category = motion.category.replace(quotionRe, '$1');
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
                // origin
                if (motion.origin) {
                    motion.origin = motion.origin.replace(quotionRe, '$1');
                }
                $scope.motions.push(motion);
            });
        });

        // import from csv file
        $scope.import = function () {
            $scope.csvImporting = true;
            angular.forEach($scope.motions, function (motion) {
                if (!motion.importerror) {
                    // create new user if not exists
                    if (!motion.submitters_id && motion.submitter) {
                        var index = motion.submitter.indexOf(' ');
                        var user = {
                            first_name: motion.submitter.substr(0, index),
                            last_name: motion.submitter.substr(index+1),
                            groups: []
                        };
                        User.create(user).then(
                            function(success) {
                                // set new user id
                                motion.submitters_id = [success.id];
                            }
                        );
                    }
                    // create new category if not exists
                    if (!motion.category_id && motion.category) {
                        var category = {
                            name: motion.category,
                            prefix: motion.category.charAt(0)
                        };
                        Category.create(category).then(
                            function(success) {
                                // set new category id
                                motion.category_id = [success.id];
                            }
                        );
                    }
                    Motion.create(motion).then(
                        function(success) {
                            motion.imported = true;
                        }
                    );
                }
            });
            $scope.csvimported = true;
        };
        $scope.clear = function () {
            $scope.csv.result = null;
        };
        // download CSV example file
        $scope.downloadCSVExample = function () {
            var element = document.getElementById('downloadLink');
            var csvRows = [
                // column header line
                ['identifier', 'title', 'text', 'reason', 'submitter', 'category', 'origin'],
                // example entries
                ['A1', 'Title 1', 'Text 1', 'Reason 1', 'Submitter A', 'Category A', 'Last Year Conference A'],
                ['B1', 'Title 2', 'Text 2', 'Reason 2', 'Submitter B', 'Category B', ''                      ],
                [''  , 'Title 3', 'Text 3', ''        , ''           , ''          , ''                      ],
            ];
            var csvString = csvRows.join("%0A");
            element.href = 'data:text/csv;charset=utf-8,' + csvString;
            element.download = 'motions-example.csv';
            element.target = '_blank';
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
    'category',
    function($scope, Category, category) {
        Category.bindOne(category.id, $scope, 'category');
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
    'category',
    function($scope, $state, Category, category) {
        $scope.category = category;
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
    'category',
    'Motion',
    'motions',
    function($scope, $stateParams, $http, MotionList, Category, category, Motion, motions) {
        Category.bindOne(category.id, $scope, 'category');
        Motion.bindAll({}, $scope, 'motions');
        $scope.filter = { category_id: category.id,
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
        gettext('The assembly may decide,');
        gettext('Workflow of new motions');
        gettext('Motions');
        gettext('Identifier');
        gettext('Numbered per category');
        gettext('Serially numbered');
        gettext('Set it manually');
        gettext('Motion preamble');
        gettext('Stop submitting new motions by non-staff users');
        gettext('Allow to disable versioning');
        gettext('Activate amendments');
        gettext('Amendments');
        gettext('Prefix for the identifier for amendments');
        gettext('Number of (minimum) required supporters for a motion');
        gettext('Choose 0 to disable the supporting system.');
        gettext('Supporters');
        gettext('Remove all supporters of a motion if a submitter edits his ' +
                'motion in early state');
        gettext('Title for PDF document (all motions)');
        gettext('Preamble text for PDF document (all motioqns)');
        gettext('Show paragraph numbering (only in PDF)');
        /// Prefix for the identifier for amendments
        gettext('A');
    }
]);

}());
