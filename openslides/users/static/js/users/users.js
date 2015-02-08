angular.module('OpenSlidesApp.users', [])

.config(function($stateProvider) {
    $stateProvider
        .state('users', {
            url: '/user',
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
        .state('users.user.create', {})
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
            }
        });
})

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
    return DS.defineResource({
        name: 'users/group',
        endpoint: '/rest/users/group/'
    });
})

.controller('UserListCtrl', function($scope, User, i18n) {
    User.bindAll($scope, 'users');
})

.controller('UserDetailCtrl', function($scope, User, user) {
    User.bindOne($scope, 'user', user.id);
})

.controller('UserCreateCtrl', function($scope, User) {
    $scope.user = {};
    $scope.save = function (user) {
        User.create(user);
        // TODO: redirect to list-view
    };
})

.controller('UserUpdateCtrl', function($scope, User, user) {
    $scope.user = user;  // do not use Agenda.binOne(...) so autoupdate is not activated
    $scope.save = function(user) {
        User.save(user);
        // TODO: redirect to list-view
    };
});
