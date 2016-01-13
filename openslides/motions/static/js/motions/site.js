(function () {

'use strict';

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
                            motion: function() {return Motion.find($stateParams.id)}
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
        });
})

// Service for generic motion form (create and update)
.factory('MotionForm', [
    'gettextCatalog',
    'operator',
    'Category',
    'Config',
    'Mediafile',
    'Tag',
    'User',
    'Workflow',
    function (gettextCatalog, operator, Category, Config, Mediafile, Tag, User, Workflow) {
        return {
            // ngDialog for motion form
            getDialog: function (motion) {
                if (motion) {
                    var resolve = {
                        motion: function(Motion) { return Motion.find(motion.id); }
                    };
                }
                return {
                    template: 'static/templates/motions/motion-form.html',
                    controller: (motion) ? 'MotionUpdateCtrl' : 'MotionCreateCtrl',
                    className: 'ngdialog-theme-default wide-form',
                    closeByEscape: false,
                    closeByDocument: false,
                    resolve: (resolve) ? resolve : null
                }
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
                    key: 'submitters_id',
                    type: 'ui-select-multiple',
                    templateOptions: {
                        label: gettextCatalog.getString('Submitters'),
                        optionsAttr: 'bs-options',
                        options: User.getAll(),
                        ngOptions: 'option[to.valueProp] as option in to.options | filter: $select.search',
                        valueProp: 'id',
                        labelProp: 'full_name',
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
                    type: 'textarea',
                    templateOptions: {
                        label: gettextCatalog.getString('Text'),
                        required: true
                    },
                    ngModelElAttrs: {'ckeditor': 'CKEditorOptions'}
                },
                {
                    key: 'reason',
                    type: 'textarea',
                    templateOptions: {
                        label: gettextCatalog.getString('Reason')
                    },
                    ngModelElAttrs: {'ckeditor': 'CKEditorOptions'}
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
                    type: 'ui-select-multiple',
                    templateOptions: {
                        label: gettextCatalog.getString('Attachment'),
                        optionsAttr: 'bs-options',
                        options: Mediafile.getAll(),
                        ngOptions: 'option[to.valueProp] as option in to.options | filter: $select.search',
                        valueProp: 'id',
                        labelProp: 'title_or_filename',
                        placeholder: gettextCatalog.getString('Select or search an attachment ...')
                    },
                    hideExpression: '!model.more'
                },
                {
                    key: 'category_id',
                    type: 'ui-select-single',
                    templateOptions: {
                        label: gettextCatalog.getString('Category'),
                        optionsAttr: 'bs-options',
                        options: Category.getAll(),
                        ngOptions: 'option[to.valueProp] as option in to.options | filter: $select.search',
                        valueProp: 'id',
                        labelProp: 'name',
                        placeholder: gettextCatalog.getString('Select or search a category ...')
                    },
                    hideExpression: '!model.more'
                },
                {
                    key: 'tags_id',
                    type: 'ui-select-multiple',
                    templateOptions: {
                        label: gettextCatalog.getString('Tags'),
                        optionsAttr: 'bs-options',
                        options: Tag.getAll(),
                        ngOptions: 'option[to.valueProp] as option in to.options | filter: $select.search',
                        valueProp: 'id',
                        labelProp: 'name',
                        placeholder: gettextCatalog.getString('Select or search a tag ...')
                    },
                    hideExpression: '!model.more'
                },
                {
                    key: 'supporters_id',
                    type: 'ui-select-multiple',
                    templateOptions: {
                        label: gettextCatalog.getString('Supporters'),
                        optionsAttr: 'bs-options',
                        options: User.getAll(),
                        ngOptions: 'option[to.valueProp] as option in to.options | filter: $select.search',
                        valueProp: 'id',
                        labelProp: 'full_name',
                        placeholder: gettextCatalog.getString('Select or search a supporter ...')
                    },
                    hideExpression: '!model.more'
                },
                {
                    key: 'workflow_id',
                    type: 'ui-select-single',
                    templateOptions: {
                        label: gettextCatalog.getString('Workflow'),
                        optionsAttr: 'bs-options',
                        options: Workflow.getAll(),
                        ngOptions: 'option[to.valueProp] as option in to.options | filter: $select.search',
                        valueProp: 'id',
                        labelProp: 'name',
                        placeholder: gettextCatalog.getString('Select or search a workflow ...')
                    },
                    hideExpression: '!model.more',
                }];
            }
        }
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
        $scope.getFilterString = function (motion) {
            if (motion.category) {
                var category = motion.category.name;
            } else {
                var category = ''
            }
            return [
                motion.getTitle(),
                motion.getText(),
                _.map(motion.submitters, function (submitter) {return submitter.get_short_name()}).join(" "),
                category].join(" ");
        }

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

        // open new/edit dialog
        $scope.openDialog = function (motion) {
            ngDialog.open(MotionForm.getDialog(motion));
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
    'motion',
    function($scope, $http, ngDialog, MotionForm, Motion, Category, Mediafile, Tag, User, Workflow, motion) {
        Motion.bindOne(motion.id, $scope, 'motion');
        Category.bindAll({}, $scope, 'categories');
        Mediafile.bindAll({}, $scope, 'mediafiles');
        Tag.bindAll({}, $scope, 'tags');
        User.bindAll({}, $scope, 'users');
        Workflow.bindAll({}, $scope, 'workflows');
        Motion.loadRelations(motion, 'agenda_item');

        $scope.alert = {};
        $scope.isCollapsed = true;

        // open edit dialog
        $scope.openDialog = function (motion) {
            ngDialog.open(MotionForm.getDialog(motion));
        };

        $scope.support = function () {
            $http.post('/rest/motions/motion/' + motion.id + '/support/');
        }
        $scope.unsupport = function () {
            $http.delete('/rest/motions/motion/' + motion.id + '/support/');
        }
        $scope.updateState = function (state_id) {
            $http.put('/rest/motions/motion/' + motion.id + '/set_state/', {'state': state_id});
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
    'Motion',
    'MotionForm',
    'Category',
    'Config',
    'Mediafile',
    'Tag',
    'User',
    'Workflow',
    function($scope, $state, gettext, Motion, MotionForm, Category, Config, Mediafile, Tag, User, Workflow) {
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
        for (var i = 0; i < $scope.formFields.length; i++) {
            if ($scope.formFields[i].key == "identifier") {
               $scope.formFields[i].hide = true;
            }
        }
        // save motion
        $scope.save = function (motion) {
            Motion.create(motion).then(
                function(success) {
                    $scope.closeThisDialog();
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
    'motion',
    function($scope, $state, Motion, Category, Config, Mediafile, MotionForm, Tag, User, Workflow, motion) {
        Category.bindAll({}, $scope, 'categories');
        Mediafile.bindAll({}, $scope, 'mediafiles');
        Tag.bindAll({}, $scope, 'tags');
        User.bindAll({}, $scope, 'users');
        Workflow.bindAll({}, $scope, 'workflows');

        // set initial values for form model
        $scope.model = motion;
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
            if ($scope.formFields[i].key == "workflow_id") {
               // get saved workflow id from state
               $scope.formFields[i].defaultValue = motion.state.workflow_id;
            }
        }

        // save motion
        $scope.save = function (motion) {
            Motion.save(motion).then(
                function(success) {
                    $scope.closeThisDialog();
                }
            );
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
        $scope.motions = []
        $scope.separator = ',';
        $scope.encoding = 'UTF-8';
        $scope.encodingOptions = ['UTF-8', 'ISO-8859-1'];
        $scope.csv = {
            content: null,
            header: true,
            headerVisible: false,
            separator: $scope.separator,
            separatorVisible: false,
            encoding: $scope.encoding,
            encodingVisible: false,
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
                    if (motion.identifier != '') {
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
                    if (motion.submitter != '') {
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
                if (motion.submitter && motion.submitter != '' && !motion.submitters_id) {
                    motion.submitter_create = gettext('New participant will be created.');
                }
                // category
                if (motion.category) {
                    motion.category = motion.category.replace(quotionRe, '$1');
                    if (motion.category != '') {
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
                if (motion.category && motion.category != '' && !motion.category_id) {
                    motion.category_create = gettext('New category will be created.');
                }
                $scope.motions.push(motion);
            });
        });

        // import from csv file
        $scope.import = function () {
            $scope.csvImporting = true;
            angular.forEach($scope.motions, function (motion) {
                if (!motion.importerror) {
                    // create new user if not exist
                    if (!motion.submitters_id) {
                        var index = motion.submitter.indexOf(' ');
                        var user = {
                            first_name: motion.submitter.substr(0, index),
                            last_name: motion.submitter.substr(index+1),
                            groups: []
                        }
                        User.create(user).then(
                            function(success) {
                                // set new user id
                                motion.submitters_id = [success.id];
                            }
                        );
                    }
                    // create new category if not exist
                    if (!motion.category_id) {
                        var category = {
                            name: motion.category,
                            prefix: motion.category.charAt(0)
                        }
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
                ['identifier', 'title', 'text', 'reason', 'submitter', 'category'],
                // example entries
                ['A1', 'title 1', 'text 1', 'reason 1', 'Submitter A', 'Category A'],
                ['B1', 'title 2', 'text 2', 'reason 2', 'Submitter B', 'Category B'],
                [''  , 'title 3', 'text 3', '', '', '']

            ];
            var csvString = csvRows.join("%0A");
            element.href = 'data:text/csv;charset=utf-8,' + csvString;
            element.download = 'motions-example.csv';
            element.target = '_blank';
        }
    }
])

.controller('CategoryListCtrl', function($scope, Category) {
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

}());
