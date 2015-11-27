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
        .state('motions.motion.detail.update', {
            onEnter: ['$stateParams', 'ngDialog', 'Motion', function($stateParams, ngDialog, Motion) {
                ngDialog.open({
                    template: 'static/templates/motions/motion-form.html',
                    controller: 'MotionUpdateCtrl',
                    className: 'ngdialog-theme-default wide-form',
                    resolve: { motion: function() {
                        return Motion.find($stateParams.id) }}
                });
            }]
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
        });
})

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
                    },
                    ngModelElAttrs: {'ckeditor': 'CKEditorOptions'}
                },
                {
                    key: 'reason',
                    type: 'textarea',
                    templateOptions: {
                        label: gettext('Reason')
                    },
                    ngModelElAttrs: {'ckeditor': 'CKEditorOptions'}
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

.controller('MotionListCtrl', [
    '$scope',
    '$state',
    'ngDialog',
    'Motion',
    'Category',
    'Tag',
    'Workflow',
    'User',
    function($scope, $state, ngDialog, Motion, Category, Tag, Workflow, User) {
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

        // open new dialog
        $scope.newDialog = function () {
            ngDialog.open({
                template: 'static/templates/motions/motion-form.html',
                controller: 'MotionCreateCtrl',
                className: 'ngdialog-theme-default wide-form'
            });
        };
        // open edit dialog
        $scope.editDialog = function (motion) {
            ngDialog.open({
                template: 'static/templates/motions/motion-form.html',
                controller: 'MotionUpdateCtrl',
                className: 'ngdialog-theme-default wide-form',
                resolve: {
                    motion: function(Motion) {
                        return Motion.find(motion.id);
                    }
                }
            });
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
    'Motion',
    'Category',
    'Mediafile',
    'Tag',
    'User',
    'Workflow',
    'motion',
    function($scope, $http, ngDialog, Motion, Category, Mediafile, Tag, User, Workflow, motion) {
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

        // open edit dialog
        $scope.editDialog = function (motion) {
            ngDialog.open({
                template: 'static/templates/motions/motion-form.html',
                controller: 'MotionUpdateCtrl',
                className: 'ngdialog-theme-default wide-form',
                resolve: {
                    motion: function(Motion) {
                        return Motion.find(motion.id);
                    }
                }
            });
        };

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
    'Motion',
    'MotionFormFieldFactory',
    'Category',
    'Config',
    'Mediafile',
    'Tag',
    'User',
    'Workflow',
    function($scope, $state, gettext, Motion, MotionFormFieldFactory, Category, Config, Mediafile, Tag, User, Workflow) {
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

}());
