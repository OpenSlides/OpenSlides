"use strict";

angular.module('OpenSlidesApp.motions', [])

.factory('MotionPoll', [
    'DS',
    'Config',
    'jsDataModel',
    function(DS, Config, jsDataModel) {
        return DS.defineResource({
            name: 'motions/motionpoll',
            useClass: jsDataModel,
            relations: {
                belongsTo: {
                    'motions/motion': {
                        localField: 'motion',
                        localKey: 'motion_id',
                    }
                }
            },
            methods: {
                getYesPercent: function () {
                    var config = Config.get('motions_poll_100_percent_base').value;
                    if (config == "WITHOUT_INVALID" && this.votesvalid > 0) {
                        return "(" + Math.round(this.yes * 100 / this.votesvalid * 10) / 10 + " %)";
                    } else if (config == "WITH_INVALID" && this.votescast > 0) {
                        return "(" + Math.round(this.yes * 100 / (this.votescast) * 10) / 10 + " %)";
                    } else {
                        return null;
                    }
                },
                getNoPercent: function () {
                    var config = Config.get('motions_poll_100_percent_base').value;
                    if (config == "WITHOUT_INVALID" && this.votesvalid > 0) {
                        return "(" + Math.round(this.no * 100 / this.votesvalid * 10) / 10 + " %)";
                    } else if (config == "WITH_INVALID" && this.votescast > 0) {
                        return "(" + Math.round(this.no * 100 / (this.votescast) * 10) / 10 + " %)";
                    } else {
                        return null;
                    }
                },
                getAbstainPercent: function () {
                    var config = Config.get('motions_poll_100_percent_base').value;
                    if (config == "WITHOUT_INVALID" && this.votesvalid > 0) {
                        return "(" + Math.round(this.abstain * 100 / this.votesvalid * 10) / 10 + " %)";
                    } else if (config == "WITH_INVALID" && this.votescast > 0) {
                        return "(" + Math.round(this.abstain * 100 / (this.votescast) * 10) / 10 + " %)";
                    } else {
                        return null;
                    }
                },
                getVotesValidPercent: function () {
                    var config = Config.get('motions_poll_100_percent_base').value;
                    if (config == "WITHOUT_INVALID") {
                        return "(100 %)";
                    } else if (config == "WITH_INVALID") {
                        return "(" + Math.round(this.votesvalid * 100 / (this.votescast) * 10) / 10 + " %)";
                    } else {
                        return null;
                    }
                },
                getVotesInvalidPercent: function () {
                    var config = Config.get('motions_poll_100_percent_base').value;
                    if (config == "WITH_INVALID") {
                        return "(" + Math.round(this.votesinvalid * 100 / (this.votescast) * 10) / 10 + " %)";
                    } else {
                        return null;
                    }
                },
                getVotesCastPercent: function () {
                    var config = Config.get('motions_poll_100_percent_base').value;
                    if (config == "WITH_INVALID") {
                        return "(100 %)";
                    } else {
                        return null;
                    }
                }
            }
        });
    }
])

.factory('Motion', [
    'DS',
    'MotionPoll',
    'jsDataModel',
    function(DS, MotionPoll, jsDataModel) {
        var name = 'motions/motion'
        return DS.defineResource({
            name: name,
            useClass: jsDataModel,
            agendaSupplement: '(Motion)',
            methods: {
                getResourceName: function () {
                    return name;
                },
                getVersion: function (versionId) {
                    versionId = versionId || this.active_version;
                    var index;
                    if (versionId == -1) {
                        index = this.versions.length - 1;
                    } else {
                        index = _.findIndex(this.versions, function (element) {
                            return element.id == versionId
                        });
                    }
                    return this.versions[index];
                },
                getTitle: function (versionId) {
                    return this.getVersion(versionId).title;
                },
                getText: function (versionId) {
                    return this.getVersion(versionId).text;
                },
                getReason: function (versionId) {
                    return this.getVersion(versionId).reason;
                },
                getAgendaTitle: function () {
                    var value = '';
                    if (this.identifier) {
                        value = this.identifier + ' | ';
                    }
                    return value + this.getTitle();
                }
            },
            relations: {
                belongsTo: {
                    'motions/category': {
                        localField: 'category',
                        localKey: 'category_id',
                    },
                    'agenda/item': {
                        localKey: 'agenda_item_id',
                        localField: 'agenda_item',
                    }
                },
                hasMany: {
                    'core/tag': {
                        localField: 'tags',
                        localKeys: 'tags_id',
                    },
                    'users/user': [
                        {
                            localField: 'submitters',
                            localKeys: 'submitters_id',
                        },
                        {
                            localField: 'supporters',
                            localKeys: 'supporters_id',
                        }
                    ],
                    'motions/motionpoll': {
                        localField: 'polls',
                        foreignKey: 'motion_id',
                    }
                }
            }
        });
    }
])

.factory('Category', ['DS', function(DS) {
    return DS.defineResource({
        name: 'motions/category',
    });
}])

.factory('Workflow', ['DS', function(DS) {
    return DS.defineResource({
        name: 'motions/workflow',
    });
}])

.run(['Motion', 'Category', 'Workflow', function(Motion, Category, Workflow) {}]);


angular.module('OpenSlidesApp.motions.site', ['OpenSlidesApp.motions'])

.config([
    'mainMenuProvider',
    function (mainMenuProvider) {
        mainMenuProvider.register({
            'ui_sref': 'motions.motion.list',
            'img_class': 'file-text',
            'title': 'Motions',
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
                },
                tags: function(Tag) {
                    return Tag.findAll();
                },
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

.controller('MotionListCtrl', [
    '$scope',
    '$state',
    'Motion',
    'Category',
    'User',
    function($scope, $state, Motion, Category, User) {
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

        // hover edit actions
        $scope.hoverIn = function () {
            $scope.showEditActions = true;
        };
        $scope.hoverOut = function () {
            $scope.showEditActions = false;
        };

        // save changed motion
        $scope.update = function (motion) {
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
        $scope.delete = function () {
            angular.forEach($scope.motions, function (motion) {
                if (motion.selected)
                    Motion.destroy(motion.id);
            });
            $scope.isDeleteMode = false;
            $scope.uncheckAll();
        };
        // delete single motion
        $scope.deleteSingleMotion = function (motion) {
            Motion.destroy(motion.id);
        };
    }
])

.controller('MotionDetailCtrl', [
    '$scope',
    'Motion',
    'Category',
    'Workflow',
    'User',
    'motion',
    '$http',
    function($scope, Motion, Category, Workflow, User, motion, $http) {
        Motion.bindOne(motion.id, $scope, 'motion');
        Category.bindAll({}, $scope, 'categories');
        Workflow.bindAll({}, $scope, 'workflows');
        User.bindAll({}, $scope, 'users');
        Motion.loadRelations(motion);
        $scope.alert = {}; // TODO: show alert in template

        $scope.update_state = function (state_id) {
            $http.put('/rest/motions/motion/' + motion.id + '/set_state/', {'state': state_id});
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
            });
            poll.isEditMode = false;
        }
    }
])

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
        Motion.create(motion).then(
            function(success) {
                $state.go('motions.motion.list');
            }
        );
    };
})

.controller('MotionUpdateCtrl', [
    '$scope',
    '$state',
    '$http',
    'Motion',
    'Agenda',
    'User',
    'Category',
    'Workflow',
    'Tag',
    'Mediafile',
    'motion',
    function ($scope, $state, $http, Motion, Agenda, User, Category, Workflow, Tag, Mediafile, motion) {
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
            Motion.save(motion).then(
                function(success) {
                    $state.go('motions.motion.list');
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
    var id = $scope.element.id;
    Motion.find(id);
    Motion.bindOne(id, $scope, 'motion');
});
