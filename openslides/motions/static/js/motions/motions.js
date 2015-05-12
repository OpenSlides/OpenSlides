angular.module('OpenSlidesApp.motions', [])

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
                }
            }
        })
        .state('motions.motion.create', {
            resolve: {
                items: function(Agenda) {
                    return Agenda.findAll();
                },
                categories: function(Category) {
                    return Category.findAll();
                },
                workflows: function(Workflow) {
                    return Workflow.findAll();
                },
                tags: function(Tag) {
                    return Tag.findAll();
                },
                users: function(User) {
                    return User.findAll();
                },
                mediafiles: function(Mediafile) {
                    return Mediafile.findAll();
                }
            }
        })
        .state('motions.motion.detail', {
            resolve: {
                motion: function(Motion, $stateParams) {
                    return Motion.find($stateParams.id);
                }
            }
        })
        .state('motions.motion.detail.update', {
            views: {
                '@motions.motion': {}
            },
            resolve: {
                items: function(Agenda) {
                    return Agenda.findAll();
                },
                categories: function(Category) {
                    return Category.findAll();
                },
                workflows: function(Workflow) {
                    return Workflow.findAll();
                },
                tags: function(Tag) {
                    return Tag.findAll();
                },
                users: function(User) {
                    return User.findAll();
                },
                mediafiles: function(Mediafile) {
                    return Mediafile.findAll();
                }
            }
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
        })
})

.factory('Motion', function(DS) {
    return DS.defineResource({
        name: 'motions/motion',
        endpoint: '/rest/motions/motion/'
    });
})
.factory('Category', function(DS) {
    return DS.defineResource({
        name: 'motions/category',
        endpoint: '/rest/motions/category/'
    });
})
.factory('Workflow', function(DS) {
    return DS.defineResource({
        name: 'motions/workflow',
        endpoint: '/rest/motions/workflow/'
    });
})

.controller('MotionListCtrl', function($scope, Motion) {
    Motion.bindAll({}, $scope, 'motions');

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

    // save changed motion
    $scope.save = function (motion) {
        Motion.save(motion);
    };
    $scope.delete = function (motion) {
        //TODO: add confirm message
        Motion.destroy(motion.id).then(
            function(success) {
                //TODO: success message
            }
        );
    };
})

.controller('MotionDetailCtrl', function($scope, Motion, motion) {
    Motion.bindOne(motion.id, $scope, 'motion');
})

.controller('MotionCreateCtrl',
        function($scope, $state, $http, Motion, Agenda, User, Category, Workflow, Tag, Mediafile) {
    Agenda.bindAll({}, $scope, 'items');
    User.bindAll({}, $scope, 'users');
    Category.bindAll({}, $scope, 'categories');
    Workflow.bindAll({}, $scope, 'workflows');
    Tag.bindAll({}, $scope, 'tags');
    Mediafile.bindAll({}, $scope, 'mediafiles');

    $scope.motion = {};
    $scope.save = function (motion) {
        motion.tags = [];   // TODO: REST API should do it! (Bug in Django REST framework)
        motion.attachments = [];  // TODO: REST API should do it! (Bug in Django REST framework)
        Motion.create(motion).then(
            function(success) {
                $state.go('motions.motion.list');
            }
        );
    };
})

.controller('MotionUpdateCtrl',
        function($scope, $state, $http, Motion, Agenda, User, Category, Workflow, Tag, Mediafile, motion) {
    Agenda.bindAll({}, $scope, 'items');
    User.bindAll({}, $scope, 'users');
    Category.bindAll({}, $scope, 'categories');
    Workflow.bindAll({}, $scope, 'workflows');
    Tag.bindAll({}, $scope, 'tags');
    Mediafile.bindAll({}, $scope, 'mediafiles');

    $scope.motion = motion;
    $scope.save = function (motion) {
        motion.tags = [];   // TODO: REST API should do it! (Bug in Django REST framework)
        motion.attachments = [];  // TODO: REST API should do it! (Bug in Django REST framework)
        Motion.save(motion).then(
            function(success) {
                $state.go('motions.motion.list');
            }
        );
    };
})

.controller('MotionCSVImportCtrl', function($scope, Motion) {
    // TODO
})

.controller('CategoryListCtrl', function($scope, Category) {
    Category.bindAll({}, $scope, 'categories');

    $scope.delete = function (category) {
        //TODO: add confirm message
        Category.destroy(category.id).then(
            function(success) {
                //TODO: success message
            }
        );
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
