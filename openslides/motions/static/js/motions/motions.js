angular.module('OpenSlidesApp.motions', [])

.factory('Motion', function(DS, jsDataModel) {
    var name = 'motions/motion'
    return DS.defineResource({
        name: name,
        endpoint: '/rest/motions/motion/',
        useClass: jsDataModel,
        methods: {
            getResourceName: function () {
                return name;
            },
            getVersion: function(versionId) {
                versionId = versionId || this.active_version;
                if (versionId == -1) {
                    index = this.versions.length - 1;
                } else {
                    index = _.findIndex(this.versions, function(element) {
                        return element.id == versionId
                    });
                }
                return this.versions[index];
            },
            getTitle: function(versionId) {
                return this.getVersion(versionId).title;
            },
            getText: function(versionId) {
                return this.getVersion(versionId).text;
            },
            getReason: function(versionId) {
                return this.getVersion(versionId).reason;
            }
        }
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

.run(function(Motion, Category, Workflow) {});


angular.module('OpenSlidesApp.motions.site', ['OpenSlidesApp.motions'])

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
                users: function(User) {
                    return User.findAll();
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
                },
                categories: function(Category) {
                    return Category.findAll();
                },
                users: function(User) {
                    return User.findAll();
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

.controller('MotionListCtrl', function($scope, Motion, Category, User) {
    Motion.bindAll({}, $scope, 'motions');
    Category.bindAll({}, $scope, 'categories');
    User.bindAll({}, $scope, 'users');

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
    // delete selected motion
    $scope.delete = function (motion) {
        Motion.destroy(motion.id);
    };
})

.controller('MotionDetailCtrl', function($scope, Motion, Category, User, motion) {
    Motion.bindOne(motion.id, $scope, 'motion');
    Category.bindAll({}, $scope, 'categories');
    User.bindAll({}, $scope, 'users');
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
        if (!motion.supporters) {
            motion.supporters = [];  // TODO: REST API should do it! (Bug in Django REST framework)
        }
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
    // get latest version for edit
    $scope.motion.title = $scope.motion.getTitle(-1);
    $scope.motion.text = $scope.motion.getText(-1);
    $scope.motion.reason = $scope.motion.getReason(-1);

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

angular.module('OpenSlidesApp.motions.projector', ['OpenSlidesApp.motions'])

.config(function(slidesProvider) {
    slidesProvider.registerSlide('motions/motion', {
        template: 'static/templates/motions/slide_motion.html',
    });
})

.controller('SlideMotionCtrl', function($scope, Motion) {
    // Attention! Each object that is used here has to be dealt on server side.
    // Add it to the coresponding get_requirements method of the ProjectorElement
    // class.
    var id = $scope.element.context.id;
    Motion.find(id);
    Motion.bindOne(id, $scope, 'motion');
});
