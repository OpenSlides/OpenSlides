angular.module('OpenSlidesApp.user', [])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider
        .when('/user', {
            templateUrl: 'static/templates/user/user-list.html',
            controller: 'UserListCtrl',
            resolve: {
                users: function(User) {
                    return User.findAll();
                }
            }
        })
        .when('/user/new', {
            templateUrl: 'static/templates/user/user-form.html',
            controller: 'UserCreateCtrl'
        })
        .when('/user/:id', {
            templateUrl: 'static/templates/user/user-detail.html',
            controller: 'UserDetailCtrl',
            resolve: {
                user: function(User, $route) {
                    return User.find($route.current.params.id);
                }
            }
        })
        .when('/user/:id/edit', {
            templateUrl: 'static/templates/user/user-form.html',
            controller: 'UserUpdateCtrl',
            resolve: {
                user: function(User, $route) {
                    return User.find($route.current.params.id);
                }
            }
        });
}])

.factory('User', function(DS) {
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
        }
    });
})

.factory('Group', function(DS) {
    // TODO: the rest api for group does not exist at the moment
    return DS.defineResource({
        name: 'users/group',
        endpoint: '/rest/users/group/'
    });
})

.controller('UserListCtrl', function($scope, User, i18n) {
    User.bindAll($scope, 'users');
})

.controller('UserDetailCtrl', function($scope, $routeParams, User) {
    User.bindOne($scope, 'user', $routeParams.id);
})

.controller('UserCreateCtrl', function($scope, User) {
    $scope.user = {};
    $scope.save = function (user) {
        User.create(user);
        // TODO: redirect to list-view
    };
})

.controller('UserUpdateCtrl', function($scope, $routeParams, User, user) {
    $scope.user = user;  // do not use Agenda.binOne(...) so autoupdate is not activated
    $scope.save = function (user) {
        User.save(user);
        // TODO: redirect to list-view
    };
});
