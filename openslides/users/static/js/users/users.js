angular.module('OpenSlidesApp.users', [])

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
    .state('users.user.csv-import', {
        url: '/csv-import',
        controller: 'UserCSVImportCtrl',
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
                return $http({ 'method': 'OPTIONS', 'url': '/rest/users/group/' })
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
                return $http({ 'method': 'OPTIONS', 'url': '/rest/users/group/' })
            }
        }
    });
})

.factory('operator', function(User, Group) {
    var operator = {
        user: null,
        perms: [],
        isAuthenticated: function() {
            return !!this.user;
        },
        setUser: function(user_id) {
            if (user_id) {
                User.find(user_id).then(function(user) {
                    operator.user = user;
                    // TODO: load only the needed groups
                    Group.findAll().then(function() {
                        operator.perms = user.getPerms();
                    });
                });
            } else {
                operator.user = null;
                Group.find(1).then(function(group) {
                    operator.perms = group.permissions;
                });
            }
        },
        hasPerms: function(perms) {
            if (typeof perms == 'string') {
                perms = perms.split(' ');
            }
            return _.intersection(perms, operator.perms).length > 0;
        },
    }
    return operator;
})

.run(function(operator, $rootScope, $http) {
    // Put the operator into the root scope
    $http.get('/users/whoami/').success(function(data) {
        operator.setUser(data.user_id);
    });
    $rootScope.operator = operator;
})

.factory('User', function(DS, Group) {
    return DS.defineResource({
        name: 'users/user',
        endpoint: '/rest/users/user/',
        methods: {
            get_short_name: function() {
                // should be the same as in the python user model.
                var firstName = _.trim(this.first_name),
                    lastName = _.trim(this.last_name),
                    name;

                if (firstName && lastName) {
                    // TODO: check config
                    name = [firstName, lastName].join(' ');
                } else {
                    name = firstName || lastName || this.username;
                }
                return name;
            },
            getPerms: function() {
                var allPerms = [];
                _.forEach(this.groups, function(groupId) {
                    // Get group from server
                    Group.find(groupId);
                    // But do not work with the returned promise, because in
                    // this case this method can not be called in $watch
                    group = Group.get(groupId);
                    if (group) {
                        _.forEach(group.permissions, function(perm) {
                            allPerms.push(perm);
                        });
                    }
                });
                return _.uniq(allPerms);
            },
        },
    });
})

.factory('Group', function(DS) {
    return DS.defineResource({
        name: 'users/group',
        endpoint: '/rest/users/group/'
    });
})

/*
 * Directive to check for permissions
 *
 * This is the Code from angular.js ngIf.
 *
 * TODO: find a way not to copy the code.
*/
.directive('osPerms', ['$animate', function($animate) {
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
                perms = _.trimLeft($attr.osPerms, '!')
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
}])

.controller('UserListCtrl', function($scope, User) {
    User.bindAll({}, $scope, 'users');

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

    // save changed user
    $scope.togglePresent = function (user) {
        //the value was changed by the template (checkbox)
        User.save(user);
    };

    // delete user
    $scope.delete = function (user) {
        User.destroy(user.id);
    };
})

.controller('UserDetailCtrl', function($scope, User, user) {
    User.bindOne(user.id, $scope, 'user');
})

.controller('UserCreateCtrl', function($scope, $state, User, Group) {
    Group.bindAll({where: {id: {'>': 2}}}, $scope, 'groups');
    $scope.user = {};
    $scope.save = function (user) {
        User.create(user).then(
            function(success) {
                $state.go('users.user.list');
            }
        );
    };
})

.controller('UserUpdateCtrl', function($scope, $state, User, user, Group) {
    Group.bindAll({where: {id: {'>': 2}}}, $scope, 'groups');
    $scope.user = user;  // autoupdate is not activated
    $scope.save = function (user) {
        User.save(user).then(
            function(success) {
                $state.go('users.user.list');
            }
        );
    };
})

.controller('UserCSVImportCtrl', function($scope, $state, User) {
    $scope.csv = {
        content: null,
        header: true,
        separator: ',',
        result: null
    };

    $scope.import = function (result) {
        console.log(result);
        var obj = JSON.parse(result);
        console.log(obj);
        var imported_users = 0;
        for (var i = 0; i < obj.length; i++) {
            var user = {};
            // TODO: use generic solution to get csv column values
            user.title = obj[i].Titel;
            user.first_name = obj[i].Vorname;
            user.last_name = obj[i].Nachname;
            user.groups = "3";
            User.create(user).then(
                function(success) {
                    imported_users++;
                }
            );
        }
        $state.go('users.user.list');
    }
})

.controller('GroupListCtrl', function($scope, Group) {
    Group.bindAll({}, $scope, 'groups');

    $scope.delete = function (group) {
        Group.destroy(group.id);
    };
})

.controller('GroupCreateCtrl', function($scope, $state, Group, permissions) {
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
})

.controller('GroupUpdateCtrl', function($scope, $state, Group, permissions, group) {
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
})

.controller('GroupDetailCtrl', function($scope, Group, group) {
    Group.bindOne(group.id, $scope, 'group');
})

.controller('userMenu', function($scope, $http, DS, User, operator) {
    $scope.logout = function() {
        $http.post('/users/logout/').success(function(data) {
            operator.setUser(null);
            // TODO: remove all data from cache and reload page
            // DS.flush();
        });
    };
})



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
