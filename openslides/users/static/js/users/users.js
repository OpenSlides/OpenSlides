"use strict";

angular.module('OpenSlidesApp.users', [])

.factory('User', ['DS', 'Group', 'jsDataModel', function(DS, Group, jsDataModel) {
    var name = 'users/user'
    return DS.defineResource({
        name: name,
        useClass: jsDataModel,
        methods: {
            getResourceName: function () {
                return name;
            },
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
            get_full_name: function() {
                // should be the same as in the python user model.
                var firstName = _.trim(this.first_name),
                    lastName = _.trim(this.last_name),
                    structure_level = _.trim(this.structure_level),
                    name;

                if (firstName && lastName) {
                    // TODO: check config
                    name = [firstName, lastName].join(' ');
                } else {
                    name = firstName || lastName || this.username;
                }
                if (structure_level) {
                    name = name + " (" + structure_level + ")";
                }
                return name;
            },
            getPerms: function() {
                var allPerms = [];
                var allGroups = this.groups;
                // Add registered group
                allGroups.push(2);
                _.forEach(allGroups, function(groupId) {
                    // Get group from server
                    Group.find(groupId);
                    // But do not work with the returned promise, because in
                    // this case this method can not be called in $watch
                    var group = Group.get(groupId);
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
}])

.factory('Group', ['DS', function(DS) {
    return DS.defineResource({
        name: 'users/group',
    });
}])

.run(['User', 'Group', function(User, Group) {}]);


angular.module('OpenSlidesApp.users.site', ['OpenSlidesApp.users'])

.config([
    'mainMenuProvider',
    function (mainMenuProvider) {
        mainMenuProvider.register({
            'ui_sref': 'users.user.list',
            'img_class': 'user',
            'title': 'Participants',
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

.factory('operator', [
    'User',
    'Group',
    'loadGlobalData',
    function(User, Group, loadGlobalData) {
        var operatorChangeCallbacks = [];
        var operator = {
            user: null,
            perms: [],
            isAuthenticated: function () {
                return !!this.user;
            },
            onOperatorChange: function (func) {
                operatorChangeCallbacks.push(func);
            },
            setUser: function(user_id) {
                if (user_id) {
                    User.find(user_id).then(function(user) {
                        operator.user = user;
                        // TODO: load only the needed groups
                        Group.findAll().then(function() {
                            operator.perms = user.getPerms();
                            _.forEach(operatorChangeCallbacks, function (callback) {
                                callback();
                            });
                        });
                    });
                } else {
                    operator.user = null;
                    Group.find(1).then(function(group) {
                        operator.perms = group.permissions;
                        _.forEach(operatorChangeCallbacks, function (callback) {
                            callback();
                        });
                    });
                }
            },
            // Returns true if the operator has at least one perm of the perms-list.
            hasPerms: function(perms) {
                if (typeof perms == 'string') {
                    perms = perms.split(' ');
                }
                return _.intersection(perms, operator.perms).length > 0;
            },
        }
        return operator;
    }
])

.run(function(operator, $rootScope, $http) {
    // Put the operator into the root scope
    $http.get('/users/whoami/').success(function(data) {
        operator.setUser(data.user_id);
    });
    $rootScope.operator = operator;
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

.controller('UserListCtrl', function($scope, User, Group) {
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

    // save changed user
    $scope.togglePresent = function (user) {
        //the value was changed by the template (checkbox)
        User.save(user);
    };

    // delete selected user
    $scope.delete = function (user) {
        User.destroy(user.id);
    };
})

.controller('UserDetailCtrl', function($scope, User, user, Group) {
    User.bindOne(user.id, $scope, 'user');
    Group.bindAll({}, $scope, 'groups');
})

.controller('UserCreateCtrl', function($scope, $state, User, Group) {
    Group.bindAll({where: {id: {'>': 2}}}, $scope, 'groups');
    $scope.user = {};
    $scope.save = function (user) {
        if (!user.groups) {
            user.groups = [];
        }
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
        if (!user.groups) {
            user.groups = [];
        }
        User.save(user).then(
            function(success) {
                $state.go('users.user.list');
            }
        );
    };
})

.controller('UserImportCtrl', function($scope, $state, User) {
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
    }

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
            user.groups = obj[i].groups;
            user.comment = obj[i].comment;
            User.create(user).then(
                function(success) {
                    $scope.csvimportcounter++;
                }
            );
        }
        $scope.csvimported = true;
    }

    $scope.clear = function () {
        $scope.csv.result = null;
    };
})

.controller('GroupListCtrl', function($scope, Group) {
    Group.bindAll({}, $scope, 'groups');

    // delete selected group
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
});


angular.module('OpenSlidesApp.users.projector', ['OpenSlidesApp.users'])

.config(function(slidesProvider) {
    slidesProvider.registerSlide('users/user', {
        template: 'static/templates/users/slide_user.html',
    });
})

.controller('SlideUserCtrl', function($scope, User) {
    // Attention! Each object that is used here has to be dealt on server side.
    // Add it to the coresponding get_requirements method of the ProjectorElement
    // class.
    var id = $scope.element.context.id;
    User.find(id);
    User.bindOne(id, $scope, 'user');
});

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
