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

.config(function($stateProvider) {
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
    .state('users.user.detail.update', {
        views: {
            '@users.user': {}
        },
        resolve: {
            groups: function(Group) {
                return Group.findAll();
            }
        }
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
            permissions: function($http) {
                return $http({ 'method': 'OPTIONS', 'url': '/rest/users/group/' });
            }
        }
    })
    .state('users.group.detail', {
        resolve: {
            group: function(Group, $stateParams) {
                return Group.find($stateParams.id);
            }
        }
    })
    .state('users.group.detail.update', {
        views: {
            '@users.group': {}
        },
        resolve: {
            permissions: function($http) {
                return $http({ 'method': 'OPTIONS', 'url': '/rest/users/group/' });
            }
        }
    });
})

.run([
    'operator',
    '$rootScope',
    '$http',
    'Group',
    function(operator, $rootScope, $http, Group) {
        // Put the operator into the root scope
        $http.get('/users/whoami/').success(function(data) {
            operator.setUser(data.user_id);
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

/*
 * Like osPerms but does only hide the DOM-Elements
 *
 * This is the Code from angular.js ngShow.
*/
.directive('osPermsLite', [
    '$animate',
    function($animate) {
        var NG_HIDE_CLASS = 'os-perms-lite';
        var NG_HIDE_IN_PROGRESS_CLASS = 'os-perms-lite-animate';
        return {
            restrict: 'A',
            multiElement: true,
            link: function(scope, element, $attr) {
                var perms;
                if ($attr.osPermsLite[0] === '!') {
                    perms = _.trimLeft($attr.osPermsLite, '!');
                } else {
                    perms = $attr.osPermsLite;
                }
                scope.$watch(
                    function (scope) {
                        return scope.operator.hasPerms(perms);
                    }, function ngShowWatchAction(value) {
                        if ($attr.osPermsLite[0] === '!') {
                            value = !value;
                        }
                        // we're adding a temporary, animation-specific class for ng-hide since this way
                        // we can control when the element is actually displayed on screen without having
                        // to have a global/greedy CSS selector that breaks when other animations are run.
                        // Read: https://github.com/angular/angular.js/issues/9103#issuecomment-58335845
                        $animate[value ? 'removeClass' : 'addClass'](element, NG_HIDE_CLASS, {
                            tempClasses: NG_HIDE_IN_PROGRESS_CLASS
                        });
                    }
                );
            }
        };
    }
])

// Provide generic user form fields for create and update view
.factory('UserFormFieldFactory', [
    '$http',
    'gettextCatalog',
    'Group',
    function ($http, gettextCatalog, Group) {
        return {
            getFormFields: function () {
                return [
                {
                    key: 'title',
                    type: 'input',
                    templateOptions: {
                        label: gettextCatalog.getString('Title'),
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
                        label: gettextCatalog.getString('Structure level')
                    }
                },
                {
                    key: 'groups',
                    type: 'ui-select-multiple',
                    templateOptions: {
                        label: gettextCatalog.getString('Groups'),
                        optionsAttr: 'bs-options',
                        options: Group.getAll(),
                        ngOptions: 'option[to.valueProp] as option in to.options | filter: $select.search',
                        valueProp: 'id',
                        labelProp: 'name',
                        placeholder: gettextCatalog.getString('Select or search a group...')
                    }
                },
                {
                    key: 'default_password',
                    type: 'input',
                    templateOptions: {
                        label: gettextCatalog.getString('Default password'),
                        addonRight: { text: 'Reset', class: 'fa fa-undo', onClick: function () {
                            // TODO: find a way to get user.id
                            //$http.post('/rest/users/user/' + model.id + '/reset_password/', {})
                            }
                        }
                    }
                },
                {
                    key: 'comment',
                    type: 'input',
                    templateOptions: {
                        label: gettextCatalog.getString('Comment')
                    }
                },
                {
                    key: 'about_me',
                    type: 'textarea',
                    templateOptions: {
                        label: gettextCatalog.getString('About me')
                    },
                    ngModelElAttrs: {'ckeditor': 'CKEditorOptions'}
                },
                {
                    key: 'is_present',
                    type: 'checkbox',
                    templateOptions: {
                        label: gettextCatalog.getString('Is present')
                    }
                },
                {
                    key: 'is_active',
                    type: 'checkbox',
                    templateOptions: {
                        label: gettextCatalog.getString('Is active')
                    }
                }];
            }
        }
    }
])

.controller('UserListCtrl', [
    '$scope',
    '$state',
    'ngDialog',
    'User',
    'Group',
    function($scope, $state, ngDialog, User, Group) {
        User.bindAll({}, $scope, 'users');
        Group.bindAll({}, $scope, 'groups');

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

        // open new dialog
        $scope.newDialog = function () {
            ngDialog.open({
                template: 'static/templates/users/user-form.html',
                controller: 'UserCreateCtrl',
                className: 'ngdialog-theme-default wide-form'
            });
        };
        // open edit dialog
        $scope.editDialog = function (user) {
            ngDialog.open({
                template: 'static/templates/users/user-form.html',
                controller: 'UserUpdateCtrl',
                className: 'ngdialog-theme-default wide-form',
                resolve: {
                    user: function(User) {
                        return User.find(user.id);
                    }
                }
            });
        };
        // save changed user
        $scope.save = function (user) {
            Assignment.save(user).then(
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
        // *** delete mode functions ***
        $scope.isDeleteMode = false;
        // check all checkboxes
        $scope.checkAll = function () {
            angular.forEach($scope.users, function (user) {
                user.selected = $scope.selectedAll;
            });
        };
        // uncheck all checkboxes if isDeleteMode is closed
        $scope.uncheckAll = function () {
            if (!$scope.isDeleteMode) {
                $scope.selectedAll = false;
                angular.forEach($scope.users, function (user) {
                    user.selected = false;
                });
            }
        };
        // delete all selected users
        $scope.deleteMultiple = function () {
            angular.forEach($scope.users, function (user) {
                if (user.selected)
                    User.destroy(user.id);
            });
            $scope.isDeleteMode = false;
            $scope.uncheckAll();
        };
        // delete single user
        $scope.delete = function (user) {
            User.destroy(user.id);
        };
    }
])

.controller('UserDetailCtrl', [
    '$scope',
    'User',
    'user',
    'Group',
    function($scope, User, user, Group) {
        User.bindOne(user.id, $scope, 'user');
        Group.bindAll({}, $scope, 'groups');
    }
])

.controller('UserCreateCtrl', [
    '$scope',
    '$state',
    'User',
    'UserFormFieldFactory',
    'Group',
    function($scope, $state, User, UserFormFieldFactory, Group) {
        Group.bindAll({where: {id: {'>': 2}}}, $scope, 'groups');
        // get all form fields
        $scope.formFields = UserFormFieldFactory.getFormFields();

        // save user
        $scope.save = function (user) {
            if (!user.groups) {
                user.groups = [];
            }
            User.create(user).then(
                function(success) {
                    $scope.closeThisDialog();
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
    'UserFormFieldFactory',
    'Group',
    'user',
    function($scope, $state, $http, User, UserFormFieldFactory, Group, user) {
        Group.bindAll({where: {id: {'>': 2}}}, $scope, 'groups');
        // set initial values for form model
        $scope.model = user;
        // get all form fields
        $scope.formFields = UserFormFieldFactory.getFormFields();

        // save user
        $scope.save = function (user) {
            if (!user.groups) {
                user.groups = [];
            }
            User.save(user).then(
                function(success) {
                    $scope.closeThisDialog();
                }
            );
        };
    }
])

.controller('UserProfileCtrl', [
    '$scope',
    '$state',
    'User',
    'user',
    function($scope, $state, User, user) {
        $scope.user = user;  // autoupdate is not activated
        $scope.save = function (user) {
            User.save(user).then(
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
                    function(data) {
                        // Success.
                        $state.go('users.user.list');
                    },
                    function(data) {
                        // Error, e. g. wrong old password.
                        $scope.oldPassword = $scope.newPassword = $scope.newPassword2 = '';
                        $scope.formError = data;
                    }
                );
            }
        };
    }
])

.controller('UserImportCtrl', [
    '$scope',
    '$state',
    'User',
    function($scope, $state, User) {
        // import from textarea
        $scope.importByLine = function () {
            $scope.users = $scope.userlist[0].split("\n");
            $scope.importcounter = 0;
            $scope.users.forEach(function(name) {
                // Split each full name in first and last name.
                // The last word is set as last name, rest is the first name(s).
                // (e.g.: "Max Martin Mustermann" -> last_name = "Mustermann")
                var names = name.split(" ");
                var last_name = names.slice(-1)[0];
                var first_name = names.slice(0, -1).join(" ");
                var user = {
                    first_name: first_name,
                    last_name: last_name,
                    groups: []
                };
                User.create(user).then(
                    function(success) {
                        $scope.importcounter++;
                    }
                );
            });
        };

        // import from csv file
        $scope.csv = {
            content: null,
            header: true,
            separator: ',',
            result: null
        };

        $scope.importByCSV = function (result) {
            var obj = JSON.parse(JSON.stringify(result));
            $scope.csvimporting = true;
            $scope.csvlines = Object.keys(obj).length;
            $scope.csvimportcounter = 0;
            for (var i = 0; i < obj.length; i++) {
                var user = {};
                user.title = obj[i].titel;
                user.first_name = obj[i].first_name;
                user.last_name = obj[i].last_name;
                user.structure_level = obj[i].structure_level;
                user.groups = [];
                if (obj[i].groups !== '') {
                    var groups = obj[i].groups.replace('"','').split(",");
                    groups.forEach(function(group) {
                        user.groups.push(group);
                    });
                }
                user.comment = obj[i].comment;
                User.create(user).then(
                    function(success) {
                        $scope.csvimportcounter++;
                    }
                );
            }
            $scope.csvimported = true;
        };

        $scope.clear = function () {
            $scope.csv.result = null;
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
        $scope.permissions = permissions.data.actions.POST.permissions.choices;
        $scope.group = {};
        $scope.save = function (group) {
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
        $scope.permissions = permissions.data.actions.POST.permissions.choices;
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
    function($scope, Group, group) {
        Group.bindOne(group.id, $scope, 'group');
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
        $scope.logout = function() {
            $http.post('/users/logout/').success(function(data) {
                operator.setUser(null);
                // TODO: remove all data from cache and reload page
                // DS.flush();
            });
        };
        $scope.openLoginForm = function () {
            ngDialog.open({
                template: 'static/templates/core/login-form.html',
                controller: 'LoginFormCtrl',
            });
        };
    }
])

.controller('LoginFormCtrl', [
    '$scope',
    '$http',
    'operator',
    'gettextCatalog',
    'Config',
    function ($scope, $http, operator, gettextCatalog, Config) {
        $scope.alerts = [];

        // TODO: add welcome message only on first time (or if admin password not changed)
        $scope.alerts.push({
            type: 'success',
            msg: gettextCatalog.getString("Installation was successfully.") + "<br>" +
                 gettextCatalog.getString("Use <strong>admin</strong> and <strong>admin</strong> for first login.") + "<br>" +
                 gettextCatalog.getString("Important: Please change your password!")
        });
        // close alert function
        $scope.closeAlert = function(index) {
            $scope.alerts.splice(index, 1);
        };
        // check if guest login is allowed
        $scope.guestAllowed = true; //TODO Config.get('general_system_enable_anonymous').value;
        // login
        $scope.login = function () {
            $http.post(
                '/users/login/',
                {'username': $scope.username, 'password': $scope.password}
            ).success(function(data) {
                if (data.success) {
                    operator.setUser(data.user_id);
                    $scope.closeThisDialog();
                } else {
                    $scope.alerts.push({
                        type: 'danger',
                        msg: gettextCatalog.getString('Username or password was not correct.')
                    });
                    //Username or password is not correct.
                }
            });
        };
        // guest login
        $scope.guestLogin = function () {
            $scope.closeThisDialog();
        };
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
