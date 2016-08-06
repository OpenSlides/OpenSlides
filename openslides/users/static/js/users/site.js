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
                }
            }
        })
        .state('users.group.create', {
            resolve: {
                permissions: function(Group) {
                    return Group.getPermissions();
                }
            }
        })
        .state('users.group.detail', {
            resolve: {
                group: function(Group, $stateParams) {
                    return Group.find($stateParams.id);
                },
                permissions: function(Group) {
                    return Group.getPermissions();
                }
            }
        })
        .state('users.group.detail.update', {
            views: {
                '@users.group': {}
            },
            resolve: {
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
                                   'filter: {id: "!1"} | filter: {id: "!2"}',
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
    'gettext',
    'User',
    'Group',
    function($scope, gettext, User, Group) {
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
        // detect if csv file is loaded
        $scope.$watch('csv.result', function () {
            $scope.users = [];
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
                $scope.users.push(user);
            });
        });

        // import from csv file
        $scope.import = function () {
            $scope.csvImporting = true;
            angular.forEach($scope.users, function (user) {
                if (!user.importerror) {
                    User.create(user).then(
                        function(success) {
                            user.imported = true;
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
    'Group',
    function($scope, Group) {
        Group.bindAll({}, $scope, 'groups');

        // delete selected group
        $scope.delete = function (group) {
            Group.destroy(group.id);
        };
    }
])

.controller('GroupCreateCtrl', [
    '$scope',
    '$state',
    'Group',
    'permissions',
    function($scope, $state, Group, permissions) {
        // get all permissions
        $scope.permissions = permissions;
        $scope.group = {};
        $scope.save = function (group) {
            if (!group.permissions) {
                group.permissions = [];
            }
            Group.create(group).then(
                function(success) {
                    $state.go('users.group.list');
                }
            );
        };
    }
])

.controller('GroupUpdateCtrl', [
    '$scope',
    '$state',
    'Group',
    'permissions',
    'group',
    function($scope, $state, Group, permissions, group) {
        // get all permissions
        $scope.permissions = permissions;
        $scope.group = group;  // autoupdate is not activated
        $scope.save = function (group) {
            Group.save(group).then(
                function(success) {
                    $state.go('users.group.list');
                }
            );
        };
    }
])

.controller('GroupDetailCtrl', [
    '$scope',
    'Group',
    'group',
    'permissions',
    function($scope, Group, group, permissions) {
        Group.bindOne(group.id, $scope, 'group');
        $scope.groupPermissionNames = [];
        // get display names of group permissions
        // from an object array with all available permissions [{display_name, value}]
        angular.forEach(group.permissions, function(permValue) {
            angular.forEach(permissions, function(p) {
                if (p.value == permValue) {
                    $scope.groupPermissionNames.push(p.display_name);
                }
            });
        });
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
