(function () {

'use strict';

angular.module('OpenSlidesApp.users.site', ['OpenSlidesApp.users'])

.config([
    'mainMenuProvider',
    'gettext',
    function (mainMenuProvider, gettext) {
        mainMenuProvider.register({
            'ui_sref': 'users.user.list',
            'img_class': 'user',
            'title': gettext('Participants'),
            'weight': 500,
            'perm': 'users.can_see_name',
        });
    }
])

.config([
    '$stateProvider',
    function($stateProvider) {
        $stateProvider
        .state('users', {
            url: '/users',
            abstract: true,
            template: "<ui-view/>",
        })
        .state('users.user', {
            abstract: true,
            template: "<ui-view/>",
        })
        .state('users.user.list', {
            resolve: {
                users: function(User) {
                    return User.findAll();
                },
                groups: function(Group) {
                    return Group.findAll();
                }
            }
        })
        .state('users.user.create', {
            resolve: {
                groups: function(Group) {
                    return Group.findAll();
                }
            }
        })
        .state('users.user.detail', {
            resolve: {
                user: function(User, $stateParams) {
                    return User.find($stateParams.id);
                },
                groups: function(Group) {
                    return Group.findAll();
                }
            }
        })
        // Redirects to user detail view and opens user edit form dialog, uses edit url.
        // Used by $state.go(..) from core/site.js only (for edit current slide button).
        // (from users list controller use UserForm factory instead to open dialog in front of
        // current view without redirect)
        .state('users.user.detail.update', {
            onEnter: ['$stateParams', '$state', 'ngDialog', 'User',
                function($stateParams, $state, ngDialog, User) {
                    ngDialog.open({
                        template: 'static/templates/users/user-form.html',
                        controller: 'UserUpdateCtrl',
                        className: 'ngdialog-theme-default wide-form',
                        closeByEscape: false,
                        closeByDocument: false,
                        resolve: {
                            user: function() {return User.find($stateParams.id);}
                        }
                    });
                }
            ]
        })
        .state('users.user.detail.profile', {
            views: {
                '@users.user': {},
            },
            url: '/profile',
            controller: 'UserProfileCtrl',
        })
        .state('users.user.detail.password', {
            views: {
                '@users.user': {},
            },
            url: '/password',
            controller: 'UserPasswordCtrl',
        })
        .state('users.user.import', {
            url: '/import',
            controller: 'UserImportCtrl',
            resolve: {
                groups: function(Group) {
                    return Group.findAll();
                },
                users: function(User) {
                    return User.findAll();
                }
            }
        })
        // groups
        .state('users.group', {
            url: '/groups',
            abstract: true,
            template: "<ui-view/>",
        })
        .state('users.group.list', {
            resolve: {
                groups: function(Group) {
                    return Group.findAll();
                },
                permissions: function(Group) {
                    return Group.getPermissions();
                }
            }
        })
        .state('login', {
            template: null,
            url: '/login',
            params: { guest_enabled: false },
            onEnter: ['$state', '$stateParams', 'ngDialog', function($state, $stateParams, ngDialog) {
                ngDialog.open({
                    template: 'static/templates/core/login-form.html',
                    controller: 'LoginFormCtrl',
                    showClose: $stateParams.guest_enabled,
                    closeByEscape: $stateParams.guest_enabled,
                    closeByDocument: $stateParams.guest_enabled,
                });
            }]
        });
    }
])

.run([
    'operator',
    '$rootScope',
    '$http',
    '$state',
    'Group',
    function(operator, $rootScope, $http, $state, Group) {
        // Put the operator into the root scope
        $http.get('/users/whoami/').success(function(data) {
            operator.setUser(data.user_id);
            $rootScope.guest_enabled = data.guest_enabled;
            if (data.user_id === null && !data.guest_enabled) {
                // redirect to login dialog if use is not logged in
                $state.go('login', {guest_enabled: data.guest_enabled});
            }
        });
        $rootScope.operator = operator;
        // Load all Groups. They are needed later
        Group.findAll();
    }
])

/*
 * Directive to check for permissions
 *
 * This is the Code from angular.js ngIf.
 *
 * TODO: find a way not to copy the code.
*/
.directive('osPerms', [
    '$animate',
    function($animate) {
        return {
            multiElement: true,
            transclude: 'element',
            priority: 600,
            terminal: true,
            restrict: 'A',
            $$tlb: true,
            link: function($scope, $element, $attr, ctrl, $transclude) {
                var block, childScope, previousElements, perms;
                if ($attr.osPerms[0] === '!') {
                    perms = _.trimLeft($attr.osPerms, '!');
                } else {
                    perms = $attr.osPerms;
                }
                $scope.$watch(
                    function (scope) {
                        return scope.operator.hasPerms(perms);
                    },
                    function (value) {
                        if ($attr.osPerms[0] === '!') {
                            value = !value;
                        }
                        if (value) {
                            if (!childScope) {
                                $transclude(function(clone, newScope) {
                                    childScope = newScope;
                                    clone[clone.length++] = document.createComment(' end ngIf: ' + $attr.ngIf + ' ');
                                    // Note: We only need the first/last node of the cloned nodes.
                                    // However, we need to keep the reference to the jqlite wrapper as it might be changed later
                                    // by a directive with templateUrl when its template arrives.
                                    block = {
                                        clone: clone
                                    };
                                    $animate.enter(clone, $element.parent(), $element);
                                });
                            }
                        } else {
                            if (previousElements) {
                                previousElements.remove();
                                previousElements = null;
                            }
                            if (childScope) {
                                childScope.$destroy();
                                childScope = null;
                            }
                            if (block) {
                                previousElements = getBlockNodes(block.clone);
                                $animate.leave(previousElements).then(function() {
                                    previousElements = null;
                                });
                                block = null;
                            }
                        }
                    }
                );
            }
        };
    }
])

// Service for generic assignment form (create and update)
.factory('UserForm', [
    '$http',
    'gettextCatalog',
    'Editor',
    'Group',
    'Mediafile',
    function ($http, gettextCatalog, Editor, Group, Mediafile) {
        return {
            // ngDialog for user form
            getDialog: function (user) {
                var resolve;
                if (user) {
                    resolve = {
                        user: function(User) {return User.find(user.id);}
                    };
                }
                return {
                    template: 'static/templates/users/user-form.html',
                    controller: (user) ? 'UserUpdateCtrl' : 'UserCreateCtrl',
                    className: 'ngdialog-theme-default wide-form',
                    closeByEscape: false,
                    closeByDocument: false,
                    resolve: (resolve) ? resolve : null
                };
            },
            // angular-formly fields for user form
            getFormFields: function (hideOnCreateForm) {
                var images = Mediafile.getAllImages();
                return [
                {
                    key: 'username',
                    type: 'input',
                    templateOptions: {
                        label: gettextCatalog.getString('Username')
                    },
                    hide: hideOnCreateForm
                },
                {
                    key: 'title',
                    type: 'input',
                    templateOptions: {
                        label: gettextCatalog.getString('Title'),
                        description: gettextCatalog.getString('Will be shown before the name.')
                    }
                },
                {
                    key: 'first_name',
                    type: 'input',
                    templateOptions: {
                        label: gettextCatalog.getString('First name')
                    }
                },
                {
                    key: 'last_name',
                    type: 'input',
                    templateOptions: {
                        label: gettextCatalog.getString('Last name')
                    }
                },
                {
                    key: 'structure_level',
                    type: 'input',
                    templateOptions: {
                        label: gettextCatalog.getString('Structure level'),
                        description: gettextCatalog.getString('Will be shown after the name.')
                    }
                },
                {   key: 'number',
                    type: 'input',
                    templateOptions: {
                        label:gettextCatalog.getString('Participant number')
                    }
                },
                {
                    key: 'groups_id',
                    type: 'select-multiple',
                    templateOptions: {
                        label: gettextCatalog.getString('Groups'),
                        options: Group.getAll(),
                        ngOptions: 'option.id as option.name | translate for option in to.options | ' +
                                   'filter: {id: "!1"}',
                        placeholder: gettextCatalog.getString('Select or search a group ...')
                    }
                },
                {
                    key: 'default_password',
                    type: 'input',
                    templateOptions: {
                        label: gettextCatalog.getString('Default password'),
                        description: '',
                        addonRight: { text: 'Reset', class: 'fa fa-undo', onClick:
                            function (options, scope) {
                                $http.post(
                                    '/rest/users/user/' + scope.model.id + '/reset_password/',
                                    {'password': scope.model.default_password})
                                .then(function() {
                                    options.templateOptions.description =
                                        gettextCatalog.getString('Password successfully resetted to:') +
                                        ' ' + scope.model.default_password;
                                });
                            }
                        }
                    }
                },
                {
                    key: 'comment',
                    type: 'input',
                    templateOptions: {
                        label: gettextCatalog.getString('Comment'),
                        description: gettextCatalog.getString('Only for notes.')
                    }
                },
                {
                    key: 'about_me',
                    type: 'editor',
                    templateOptions: {
                        label: gettextCatalog.getString('About me'),
                    },
                    data: {
                        tinymceOption: Editor.getOptions(images)
                    }
                },
                {
                    key: 'is_present',
                    type: 'checkbox',
                    templateOptions: {
                        label: gettextCatalog.getString('Is present'),
                        description: gettextCatalog.getString('Designates whether this user is in the room or not.')
                    },
                    defaultValue: true
                },
                {
                    key: 'is_active',
                    type: 'checkbox',
                    templateOptions: {
                        label: gettextCatalog.getString('Is active'),
                        description: gettextCatalog.getString(
                            'Designates whether this user should be treated as ' +
                            'active. Unselect this instead of deleting the account.')
                    },
                    defaultValue: true
                },
                {
                    key: 'is_committee',
                    type: 'checkbox',
                    templateOptions: {
                        label: gettextCatalog.getString('Is a committee'),
                        description: gettextCatalog.getString(
                            'Designates whether this user should be treated as a committee.')
                    },
                    defaultValue: false
                }];
            }
        };
    }
])

.controller('UserListCtrl', [
    '$scope',
    '$state',
    'ngDialog',
    'UserForm',
    'User',
    'Group',
    function($scope, $state, ngDialog, UserForm, User, Group) {
        User.bindAll({}, $scope, 'users');
        Group.bindAll({where: {id: {'>': 2}}}, $scope, 'groups');
        $scope.alert = {};
        $scope.groupFilter = undefined;

        // setup table sorting
        $scope.sortColumn = 'first_name'; //TODO: sort by first OR last name
        $scope.filterPresent = '';
        $scope.reverse = false;
        // function to sort by clicked column
        $scope.toggleSort = function ( column ) {
            if ( $scope.sortColumn === column ) {
                $scope.reverse = !$scope.reverse;
            }
            $scope.sortColumn = column;
        };

        // pagination
        $scope.currentPage = 1;
        $scope.itemsPerPage = 100;
        $scope.limitBegin = 0;
        $scope.pageChanged = function() {
            $scope.limitBegin = ($scope.currentPage - 1) * $scope.itemsPerPage;
        };

        // open new/edit dialog
        $scope.openDialog = function (user) {
            ngDialog.open(UserForm.getDialog(user));
        };
        // save changed user
        $scope.save = function (user) {
            User.save(user).then(
                function(success) {
                    //user.quickEdit = false;
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
        // *** select mode functions ***
        $scope.isSelectMode = false;
        // check all checkboxes
        $scope.checkAll = function () {
            angular.forEach($scope.users, function (user) {
                user.selected = $scope.selectedAll;
            });
        };
        // uncheck all checkboxes if isSelectMode is closed
        $scope.uncheckAll = function () {
            if (!$scope.isSelectMode) {
                $scope.selectedAll = false;
                angular.forEach($scope.users, function (user) {
                    user.selected = false;
                });
            }
        };
        // delete all selected users
        $scope.deleteMultiple = function () {
            angular.forEach($scope.users, function (user) {
                if (user.selected) {
                    User.destroy(user.id);
                }
            });
            $scope.isSelectMode = false;
            $scope.uncheckAll();
        };
        // delete single user
        $scope.delete = function (user) {
            User.destroy(user.id);
        };
        // add group for selected users
        $scope.addGroupMultiple = function (group) {
            angular.forEach($scope.users, function (user) {
                if (user.selected) {
                    user.groups_id.push(group);
                    User.save(user);
                }
            });
            $scope.isSelectMode = false;
            $scope.uncheckAll();
        };
        // remove group for selected users
        $scope.removeGroupMultiple = function (group) {
            angular.forEach($scope.users, function (user) {
                if (user.selected) {
                    var groupIndex = user.groups_id.indexOf(parseInt(group));
                    if (groupIndex > -1) {
                        user.groups_id.splice(groupIndex, 1);
                        User.save(user);
                    }
                }
            });
            $scope.isSelectMode = false;
            $scope.uncheckAll();
        };
    }
])

.controller('UserDetailCtrl', [
    '$scope',
    'ngDialog',
    'UserForm',
    'User',
    'user',
    'Group',
    function($scope, ngDialog, UserForm, User, user, Group) {
        User.bindOne(user.id, $scope, 'user');
        Group.bindAll({where: {id: {'>': 2}}}, $scope, 'groups');

        // open edit dialog
        $scope.openDialog = function (user) {
            ngDialog.open(UserForm.getDialog(user));
        };
    }
])

.controller('UserCreateCtrl', [
    '$scope',
    '$state',
    'User',
    'UserForm',
    'Group',
    function($scope, $state, User, UserForm, Group) {
        Group.bindAll({where: {id: {'>': 2}}}, $scope, 'groups');
        $scope.alert = {};
        // get all form fields
        $scope.formFields = UserForm.getFormFields(true);

        // save user
        $scope.save = function (user) {
            if (!user.groups_id) {
                user.groups_id = [];
            }
            User.create(user).then(
                function(success) {
                    $scope.closeThisDialog();
                },
                function (error) {
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

.controller('UserUpdateCtrl', [
    '$scope',
    '$state',
    '$http',
    'User',
    'UserForm',
    'Group',
    'user',
    function($scope, $state, $http, User, UserForm, Group, user) {
        Group.bindAll({where: {id: {'>': 2}}}, $scope, 'groups');
        $scope.alert = {};
        // set initial values for form model by create deep copy of user object
        // so list/detail view is not updated while editing
        $scope.model = angular.copy(user);

        // get all form fields
        $scope.formFields = UserForm.getFormFields();

        // save user
        $scope.save = function (user) {
            if (!user.groups_id) {
                user.groups_id = [];
            }
            // inject the changed user (copy) object back into DS store
            User.inject(user);
            // save change user object on server
            User.save(user).then(
                function (success) {
                    $scope.closeThisDialog();
                },
                function (error) {
                    // save error: revert all changes by restore
                    // (refresh) original user object from server
                    User.refresh(user);
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

.controller('UserProfileCtrl', [
    '$scope',
    '$state',
    'Editor',
    'User',
    'user',
    function($scope, $state, Editor, User, user) {
        $scope.user = user;  // autoupdate is not activated
        $scope.tinymceOption = Editor.getOptions();
        $scope.save = function (user) {
            User.save(user, { method: 'PATCH' }).then(
                function(success) {
                    $state.go('users.user.list');
                },
                function(error) {
                    $scope.formError = error;
                }
            );
        };
    }
])

.controller('UserPasswordCtrl', [
    '$scope',
    '$state',
    '$http',
    'user',
    function($scope, $state, $http, user) {
        $scope.user = user;  // autoupdate is not activated
        $scope.save = function (user) {
            if ($scope.newPassword != $scope.newPassword2) {
                $scope.newPassword = $scope.newPassword2 = '';
                $scope.formError = 'Password confirmation does not match.';
            } else {
                $http.post(
                    '/users/setpassword/',
                    {'old_password': $scope.oldPassword, 'new_password': $scope.newPassword}
                ).then(
                    function (response) {
                        // Success.
                        $state.go('users.user.list');
                    },
                    function (response) {
                        // Error, e. g. wrong old password.
                        $scope.oldPassword = $scope.newPassword = $scope.newPassword2 = '';
                        $scope.formError = response.data.detail;
                    }
                );
            }
        };
    }
])

.controller('UserImportCtrl', [
    '$scope',
    '$q',
    'gettext',
    'gettextCatalog',
    'User',
    'Group',
    function($scope, $q, gettext, gettextCatalog, User, Group) {
        // import from textarea
        $scope.importByLine = function () {
            $scope.usernames = $scope.userlist[0].split("\n");
            $scope.importcounter = 0;
            $scope.usernames.forEach(function(name) {
                // Split each full name in first and last name.
                // The last word is set as last name, rest is the first name(s).
                // (e.g.: "Max Martin Mustermann" -> last_name = "Mustermann")
                var names = name.split(" ");
                var last_name = names.slice(-1)[0];
                var first_name = names.slice(0, -1).join(" ");
                var user = {
                    first_name: first_name,
                    last_name: last_name,
                    groups_id: []
                };
                User.create(user).then(
                    function(success) {
                        $scope.importcounter++;
                    }
                );
            });
        };

        // *** csv import ***
        // set initial data for csv import
        $scope.users = [];
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
        // pagination
        $scope.currentPage = 1;
        $scope.itemsPerPage = 100;
        $scope.limitBegin = 0;
        $scope.pageChanged = function() {
            $scope.limitBegin = ($scope.currentPage - 1) * $scope.itemsPerPage;
        };
        $scope.duplicateActions = [
            'keep original',
            'override new',
            'create duplicate'
        ];
        // detect if csv file is loaded
        $scope.$watch('csv.result', function () {
            // All user objects are already loaded via the resolve statement from ui-router.
            var users = User.getAll();
            $scope.users = [];
            $scope.duplicates = 0;
            var quotionRe = /^"(.*)"$/;
            angular.forEach($scope.csv.result, function (user) {
                // title
                if (user.title) {
                    user.title = user.title.replace(quotionRe, '$1');
                }
                // first name
                if (user.first_name) {
                    user.first_name = user.first_name.replace(quotionRe, '$1');
                }
                // last name
                if (user.last_name) {
                    user.last_name = user.last_name.replace(quotionRe, '$1');
                }
                if (!user.first_name && !user.last_name) {
                    user.importerror = true;
                    user.name_error = gettext('Error: First or last name is required.');
                }
                // structure level
                if (user.structure_level) {
                    user.structure_level = user.structure_level.replace(quotionRe, '$1');
                }
                // number
                if (user.number) {
                    user.number = user.number.replace(quotionRe, '$1');
                } else {
                    user.number = "";
                }
                // groups
                if (user.groups) {
                    var csvGroups = user.groups.replace(quotionRe, '$1').split(",");
                    user.groups_id = [];
                    user.groupnames = [];
                    if (csvGroups !== '') {
                        // All group objects are already loaded via the resolve statement from ui-router.
                        var allGroups = Group.getAll();
                        csvGroups.forEach(function(csvGroup) {
                            allGroups.forEach(function (allGroup) {
                                if (csvGroup == allGroup.id) {
                                    user.groups_id.push(allGroup.id);
                                    user.groupnames.push(allGroup.name);
                                }
                            });
                        });
                    }
                } else {
                    user.groups_id = [];
                }
                // comment
                if (user.comment) {
                    user.comment = user.comment.replace(quotionRe, '$1');
                }
                // is active
                if (user.is_active) {
                    user.is_active = user.is_active.replace(quotionRe, '$1');
                    if (user.is_active == '1') {
                        user.is_active = true;
                    } else {
                        user.is_active = false;
                    }
                } else {
                    user.is_active = false;
                }
                // is committee
                if (user.is_committee) {
                    user.is_committee = user.is_committee.replace(quotionRe, '$1');
                    if (user.is_committee == '1') {
                        user.is_committee = true;
                    } else {
                        user.is_committee = false;
                    }
                } else {
                    user.is_committee = false;
                }

                // Check for duplicates
                user.duplicate = false;
                users.forEach(function(user_) {
                    if (user_.first_name == user.first_name &&
                        user_.last_name == user.last_name &&
                        user_.structure_level == user.structure_level) {
                        if (user.duplicate) {
                            // there are multiple duplicates!
                            user.duplicate_info += '\n' + gettextCatalog.getString('There are more than one duplicates of this user!');
                        } else {
                            user.duplicate = true;
                            user.duplicateAction = $scope.duplicateActions[1];
                            user.duplicate_info = '';
                            if (user_.title)
                                user.duplicate_info += user_.title + ' ';
                            if (user_.first_name)
                                user.duplicate_info += user_.first_name;
                            if (user_.first_name && user_.last_name)
                                user.duplicate_info += ' ';
                            if (user_.last_name)
                                user.duplicate_info += user_.last_name;
                            user.duplicate_info += ' (';
                            if (user_.number)
                                user.duplicate_info += gettextCatalog.getString('number') + ': ' + user_.number + ', ';
                            if (user_.structure_level)
                                user.duplicate_info += gettextCatalog.getString('structure level') + ': ' + user_.structure_level + ', ';
                            user.duplicate_info += gettextCatalog.getString('username') + ': ' + user_.username + ') '+
                                gettextCatalog.getString('already exists.');

                            $scope.duplicates++;
                        }
                    }
                });
                $scope.users.push(user);
            });
            $scope.calcStats();
        });

        // Stats
        $scope.calcStats = function() {
            // not imported: if importerror or duplicate->keep original
            $scope.usersWillNotBeImported = 0;
            // imported: all others
            $scope.usersWillBeImported = 0;

            $scope.users.forEach(function(user) {
                if (user.importerror || (user.duplicate && user.duplicateAction == $scope.duplicateActions[0])) {
                    $scope.usersWillNotBeImported++;
                } else {
                    $scope.usersWillBeImported++;
                }
            });
        };

        $scope.setGlobalAction = function (action) {
            $scope.users.forEach(function (user) {
                if (user.duplicate)
                    user.duplicateAction = action;
            });
            $scope.calcStats();
        };

        // import from csv file
        $scope.import = function () {
            $scope.csvImporting = true;
            var existingUsers = User.getAll();
            angular.forEach($scope.users, function (user) {
                if (!user.importerror) {
                    // Do nothing on duplicateAction==duplicateActions[0] (keep original)
                    if (user.duplicate && (user.duplicateAction == $scope.duplicateActions[1])) {
                        // delete existing user
                        var deletePromises = [];
                        existingUsers.forEach(function(user_) {
                            if (user_.first_name == user.first_name &&
                                user_.last_name == user.last_name &&
                                user_.structure_level == user.structure_level) {  
                                deletePromises.push(User.destroy(user_.id));
                            }
                        });
                        $q.all(deletePromises).then(function() {
                            User.create(user).then(
                                function(success) {
                                    user.imported = true;
                                }
                            );   
                        });
                    } else if (!user.duplicate ||
                               (user.duplicateAction == $scope.duplicateActions[2])) {
                        // create user
                        User.create(user).then(
                            function(success) {
                                user.imported = true;
                            }
                        );
                    }
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
                ['title', 'first_name', 'last_name', 'structure_level', 'number', 'groups', 'comment', 'is_active', 'is_committee'],
                // example entries
                ['Dr.', 'Max', 'Mustermann', 'Berlin','1234567890', '"3,4"', 'xyz', '1', ''],
                ['', 'John', 'Doe', 'Washington','75/99/8-2', '3', 'abc', '1', ''],
                ['', 'Fred', 'Bloggs', 'London', '', '', '', '', ''],
                ['', '', 'Executive Board', '', '', '5', '', '', '1'],

            ];
            var csvString = csvRows.join("%0A");
            element.href = 'data:text/csv;charset=utf-8,' + csvString;
            element.download = 'users-example.csv';
            element.target = '_blank';
        };
    }
])

.controller('GroupListCtrl', [
    '$scope',
    '$http',
    'operator',
    'Group',
    'permissions',
    'gettext',
    'Agenda',
    'Assignment',
    'Mediafile',
    'Motion',
    'User',
    'ngDialog',
    function($scope, $http, operator, Group, permissions, gettext, Agenda, Assignment, Mediafile, Motion, User, ngDialog) {
        //Group.bindAll({}, $scope, 'groups');
        $scope.permissions = permissions;

        $scope.$watch(function() {
            return Group.lastModified();
        }, function() {
            $scope.groups = Group.getAll();

            // find all groups with the 2 dangerous permissions
            var groups_danger = [];
            $scope.groups.forEach(function (group) {
                if ((_.indexOf(group.permissions, 'users.can_see_name') > -1) &&
                    (_.indexOf(group.permissions, 'users.can_manage') > -1)){
                    if (operator.isInGroup(group)){
                        groups_danger.push(group);
                    }
                }
            });
            // if there is only one dangerous group, block it.
            $scope.group_danger = groups_danger.length == 1 ? groups_danger[0] : null;
        });

        $scope.apps = [];
        // Create the main clustering with appname->permissions
        angular.forEach(permissions, function(perm) {
            var permissionApp = perm.value.split('.')[0]; // get appname

            // To insert perm in the right spot in $scope.apps
            var insert = function (id, perm, verboseName) {
                if (!$scope.apps[id]) {
                    $scope.apps[id] = {
                        app_name: verboseName,
                        app_visible: true,
                        permissions: []
                    };
                }
                $scope.apps[id].permissions.push(perm);
            };

            switch(permissionApp) {
                case 'core': // id 0 (projector) and id 6 (general)
                    if (perm.value.indexOf('projector') > -1) {
                        insert(0, perm, gettext('Projector'));
                    } else {
                        insert(6, perm, gettext('General'));
                    }
                    break;
                case 'agenda': // id 1
                    insert(1, perm, Agenda.verboseName);
                    break;
                case 'motions': // id 2
                    insert(2, perm, Motion.verboseNamePlural);
                    break;
                case 'assignments': // id 3
                    insert(3, perm, Assignment.verboseNamePlural);
                    break;
                case 'mediafiles': // id 4
                    insert(4, perm, Mediafile.verboseNamePlural);
                    break;
                case 'users': // id 5
                    insert(5, perm, User.verboseNamePlural);
                    break;
                default: // plugins: id>5
                    var display_name = permissionApp.charAt(0).toUpperCase() + permissionApp.slice(1);
                    // does the app exists?
                    var result = -1;
                    angular.forEach($scope.apps, function (app, index) {
                        if (app.app_name === display_name)
                            result = index;
                    });
                    var id = result == -1 ? $scope.apps.length : result;
                    insert(id, perm, display_name);
                    break;
            }
        });

        // sort each app: first all permission with 'see', then 'manage', then the rest
        // save the permissions in different lists an concat them in the right order together
        // Special Users: the two "see"-permissions are normally swapped. To create the right
        // order, we could simply reverse the whole permissions.
        angular.forEach($scope.apps, function (app, index) {
            if(index == 5) { // users
                app.permissions.reverse();
            } else { // rest
                var see = [];
                var manage = [];
                var others = [];
                angular.forEach(app.permissions, function (perm) {
                    if (perm.value.indexOf('see') > -1) {
                        see.push(perm);
                    } else if (perm.value.indexOf('manage') > -1) {
                        manage.push(perm);
                    } else {
                        others.push(perm);
                    }
                });
                app.permissions = see.concat(manage.concat(others));
            }
        });

        // check if the given group has the given permission
        $scope.hasPerm = function (group, permission) {
            return _.indexOf(group.permissions, permission.value) > -1;
        };

        // The current user is not allowed to lock himself out of the configuration:
        // - if the permission is 'users.can_manage' or 'users.can_see'
        // - if the user is in only one group with these permissions (group_danger is set)
        $scope.danger = function (group, permission){
            if ($scope.group_danger){
                if (permission.value == 'users.can_see_name' ||
                    permission.value == 'users.can_manage'){
                    return $scope.group_danger == group;
                }
            }
            return false;
        };

        // delete selected group
        $scope.delete = function (group) {
            Group.destroy(group.id);
        };

        // save changed permission
        $scope.changePermission = function (group, perm) {
            if (!$scope.danger(group, perm)) {
                if (!$scope.hasPerm(group, perm)) { // activate perm
                    group.permissions.push(perm.value);
                } else {
                    // delete perm in group.permissions
                    group.permissions = _.filter(group.permissions, function(value) {
                        return value != perm.value; // remove perm
                    });
                }
                Group.save(group);
            }
        };

        $scope.openDialog = function (group) {
            var resolve;
            if (group) {
                resolve = {
                    group: function() {return Group.find(group.id);}
                };
            }
            ngDialog.open({
                template: 'static/templates/users/group-edit.html',
                controller: group ? 'GroupRenameCtrl' : 'GroupCreateCtrl',
                className: 'ngdialog-theme-default wide-form',
                closeByEscape: false,
                closeByDocument: false,
                resolve: (resolve) ? resolve : null
            });
        };
    }
])

.controller('GroupRenameCtrl', [
    '$scope',
    'Group',
    'group',
    function($scope, Group, group) {
        $scope.group = group;
        $scope.new_name = group.name;

        $scope.alert = {};
        $scope.save = function() {
            var old_name = $scope.group.name;
            $scope.group.name = $scope.new_name;
            Group.save($scope.group).then(
                function (success) {
                    $scope.closeThisDialog();
                },
                function (error) {
                    var message = '';
                    for (var e in error.data) {
                        message += e + ': ' + error.data[e] + ' ';
                    }
                    $scope.alert = { msg: message, show: true };
                    $scope.group.name = old_name;
                }
            );
        };
    }
])

.controller('GroupCreateCtrl', [
    '$scope',
    'Group',
    function($scope, Group) {
        $scope.new_name = '';
        $scope.alert = {};

        $scope.save = function() {
            var group = {
                name: $scope.new_name,
                permissions: []
            };

            Group.create(group).then(
                function (success) {
                    $scope.closeThisDialog();
                },
                function (error) {
                    var message = '';
                    for (var e in error.data) {
                        message += e + ': ' + error.data[e] + ' ';
                    }
                    $scope.alert = { msg: message, show: true };
                }
            );
        };
    }
])

.controller('userMenu', [
    '$scope',
    '$http',
    'DS',
    'User',
    'operator',
    'ngDialog',
    function($scope, $http, DS, User, operator, ngDialog) {
        $scope.logout = function () {
            $http.post('/users/logout/').then(function (response) {
                operator.setUser(null);
                window.location.reload();
            });
        };
    }
])

.controller('LoginFormCtrl', [
    '$rootScope',
    '$scope',
    '$http',
    '$stateParams',
    'operator',
    function ($rootScope, $scope, $http, $stateParams, operator ) {
        $scope.alerts = [];

        // get login info-text from server
        $http.get('/users/login/').success(function(data) {
            if(data.info_text) {
                $scope.alerts.push({
                    type: 'success',
                    msg: data.info_text
                });
            }
        });
        // close alert function
        $scope.closeAlert = function(index) {
            $scope.alerts.splice(index, 1);
        };
        // check if guest login is allowed
        $scope.guestAllowed = $rootScope.guest_enabled;
        // login
        $scope.login = function () {
            $scope.alerts = [];
            $http.post(
                '/users/login/',
                {'username': $scope.username, 'password': $scope.password}
            ).then(
                function (response) {
                    // Success: User logged in.
                    operator.setUser(response.data.user_id);
                    $scope.closeThisDialog();
                    setTimeout(function(){
                        window.location.replace('/');
                    }, 1000);
                },
                function (response) {
                    // Error: Username or password is not correct.
                    $scope.alerts.push({
                        type: 'danger',
                        msg: response.data.detail
                    });
                }
            );
        };
        // guest login
        $scope.guestLogin = function () {
            $scope.closeThisDialog();
        };
    }
])

// Mark all users strings for translation in JavaScript.
.config([
    'gettext',
    function (gettext) {
        // permission strings (see models.py of each Django app)
        // agenda
        gettext('Can see agenda');
        gettext('Can manage agenda');
        gettext('Can see hidden items and time scheduling of agenda');
        gettext('Can put oneself on the list of speakers');
        // assignments
        gettext('Can see elections');
        gettext('Can nominate another participant');
        gettext('Can nominate oneself');
        gettext('Can manage elections');
        // core
        gettext('Can see the projector');
        gettext('Can manage the projector');
        gettext('Can see the front page');
        gettext('Can manage tags');
        gettext('Can manage configuration');
        gettext('Can use the chat');
        // mediafiles
        gettext('Can see the list of files');
        gettext('Can upload files');
        gettext('Can manage files');
        // motions
        gettext('Can see motions');
        gettext('Can create motions');
        gettext('Can support motions');
        gettext('Can manage motions');
        // users
        gettext('Can see names of users');
        gettext('Can see extra data of users (e.g. present and comment)');
        gettext('Can manage users');

        // config strings in users/config_variables.py
        gettext('[Place for your welcome and help text.]');
        gettext('Sort users by first name');
        gettext('Disable for sorting by last name');
        gettext('Participants');
        gettext('Sorting');
        gettext('Welcome to OpenSlides');
        gettext('Title for access data and welcome PDF');
        gettext('PDF');
        gettext('Help text for access data and welcome PDF');
        gettext('System URL');
        gettext('Used for QRCode in PDF of access data.');
        gettext('WLAN name (SSID)');
        gettext('Used for WLAN QRCode in PDF of access data.');
        gettext('WLAN password');
        gettext('Used for WLAN QRCode in PDF of access data.');
        gettext('WLAN encryption');
        gettext('Used for WLAN QRCode in PDF of access data.');
        gettext('WEP');
        gettext('WPA/WPA2');
        gettext('No encryption');
    }
]);


// this is code from angular.js. Find a way to call this function from this file
function getBlockNodes(nodes) {
  // TODO(perf): just check if all items in `nodes` are siblings and if they are return the original
  //             collection, otherwise update the original collection.
  var node = nodes[0];
  var endNode = nodes[nodes.length - 1];
  var blockNodes = [node];

  do {
    node = node.nextSibling;
    if (!node) break;
    blockNodes.push(node);
  } while (node !== endNode);

  return $(blockNodes);
}

}());
