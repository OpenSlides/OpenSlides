"use strict";

angular.module('OpenSlidesApp.agenda', ['OpenSlidesApp.users'])

.factory('Speaker', [
    'DS',
    function(DS) {
        return DS.defineResource({
            name: 'agenda/speaker',
            relations: {
                belongsTo: {
                    'users/user': {
                        localField: 'user',
                        localKey: 'user_id',
                    }
                }
            }
        });
    }
])

.factory('Agenda', [
    'DS',
    'Speaker',
    'jsDataModel',
    function(DS, Speaker, jsDataModel) {
        var name = 'agenda/item'
        return DS.defineResource({
            name: name,
            useClass: jsDataModel,
            methods: {
                getResourceName: function () {
                    return name;
                }
            },
            relations: {
                hasMany: {
                    'core/tag': {
                        localField: 'tags',
                        localKeys: 'tags_id',
                    },
                    'agenda/speaker': {
                        localField: 'speakers',
                        foreignKey: 'item_id',
                    }
                }
            }
        });
    }
])

.factory('AgendaTree', [
    function () {
        return {
            getTree: function (items) {
                // Sort items after there weight
                items.sort(function(itemA, itemB) {
                    return itemA.weight - itemB.weight;
                });

                // Build a dict with all children (dict-value) to a specific
                // item id (dict-key).
                var itemChildren = {};

                _.each(items, function (item) {
                    if (item.parent_id) {
                        // Add item to his parent. If it is the first child, then
                        // create a new list.
                        try {
                            itemChildren[item.parent_id].push(item);
                        } catch (error) {
                            itemChildren[item.parent_id] = [item];
                        }
                    }

                });

                // Recursive function that generates a nested list with all
                // items with there children
                function getChildren(items) {
                    var returnItems = [];
                    _.each(items, function (item) {
                        returnItems.push({
                            item: item,
                            children: getChildren(itemChildren[item.id]),
                            id: item.id,
                        });
                    });
                    return returnItems;
                }

                // Generates the list of root items (with no parents)
                var parentItems = items.filter(function (item) {
                    return !item.parent_id;
                });
                return getChildren(parentItems);
            },
            // Returns a list of all items as a flat tree the attribute parentCount
            getFlatTree: function(items) {
                var tree = this.getTree(items);
                var flatItems = [];

                function generateFatTree(tree, parentCount) {
                    _.each(tree, function (item) {
                        item.item.parentCount = parentCount;
                        flatItems.push(item.item);
                        generateFatTree(item.children, parentCount + 1);
                    });
                }
                generateFatTree(tree, 0);
                return flatItems;
            },
        }
    }
])

// Make sure that the Agenda resource is loaded.
.run(['Agenda', function(Agenda) {}]);


angular.module('OpenSlidesApp.agenda.site', ['OpenSlidesApp.agenda'])

.config([
    'mainMenuProvider',
    function (mainMenuProvider) {
        mainMenuProvider.register({
            'ui_sref': 'agenda.item.list',
            'img_class': 'calendar-o',
            'title': 'Agenda',
            'weight': 200,
            'perm': 'agenda.can_see',
        });
    }
])

.config([
    '$stateProvider',
    function($stateProvider) {
        $stateProvider
            .state('agenda', {
                url: '/agenda',
                abstract: true,
                template: "<ui-view/>",
            })
            .state('agenda.item', {
                abstract: true,
                template: "<ui-view/>",
            })
            .state('agenda.item.list', {
                resolve: {
                    items: function(Agenda) {
                        return Agenda.findAll();
                    }
                }
            })
            .state('agenda.item.create', {
                resolve: {
                    types: function($http) {
                        // get all item types
                        return $http({ 'method': 'OPTIONS', 'url': '/rest/agenda/item/' });
                    },
                    tags: function(Tag) {
                        return Tag.findAll();
                    }
                }
            })
            .state('agenda.item.detail', {
                resolve: {
                    item: function(Agenda, $stateParams) {
                        return Agenda.find($stateParams.id);
                    },
                    users: function(User) {
                        return User.findAll();
                    },
                    tags: function(Tag) {
                        return Tag.findAll();
                    }
                }
            })
            .state('agenda.item.detail.update', {
                views: {
                    '@agenda.item': {}
                },
                resolve: {
                    types: function($http) {
                        // get all item types
                        return $http({ 'method': 'OPTIONS', 'url': '/rest/agenda/item/' });
                    }
                }
            })
            .state('agenda.item.sort', {
                resolve: {
                    items: function(Agenda) {
                        return Agenda.findAll();
                    }
                },
                url: '/sort',
                controller: 'AgendaSortCtrl',
            })
            .state('agenda.item.import', {
                url: '/import',
                controller: 'AgendaImportCtrl',
            });
    }
])

.controller('ItemListCtrl', [
    '$scope',
    '$http',
    '$state',
    'Agenda',
    'AgendaTree',
    'Projector',
    function($scope, $http, $state, Agenda, AgendaTree, Projector) {
        // Bind agenda tree to the scope
        $scope.$watch(function () {
            return Agenda.lastModified();
        }, function () {
            $scope.items = AgendaTree.getFlatTree(Agenda.getAll());
        });

        // open detail view link
        $scope.openDetail = function (id) {
            $state.go('agenda.item.detail', {id: id});
        };

        // save changed item
        $scope.save = function (item) {
            Agenda.save(item);
        };

        // *** delete mode functions ***
        $scope.isDeleteMode = false;
        // check all checkboxes
        $scope.checkAll = function () {
            angular.forEach($scope.items, function (item) {
                item.selected = $scope.selectedAll;
            });
        };
        // uncheck all checkboxes if isDeleteMode is closed
        $scope.uncheckAll = function () {
            if (!$scope.isDeleteMode) {
                $scope.selectedAll = false;
                angular.forEach($scope.items, function (item) {
                    item.selected = false;
                });
            }
        };
        // delete selected item
        $scope.delete = function () {
            angular.forEach($scope.items, function (item) {
                if (item.selected)
                    Agenda.destroy(item.id);
            });
            $scope.isDeleteMode = false;
            $scope.uncheckAll();
        };

        // project agenda
        $scope.projectAgenda = function () {
            $http.post('/rest/core/projector/1/prune_elements/',
                    [{name: 'agenda/item-list'}]);
        };
        // check if agenda is projected
        $scope.isAgendaProjected = function () {
            // Returns true if there is a projector element with the same
            // name and agenda is active.
            var projector = Projector.get(1);
            if (typeof projector === 'undefined') return false;
            var self = this;
            var predicate = function (element) {
                return element.name == 'agenda/item-list';
            };
            return typeof _.findKey(projector.elements, predicate) === 'string';
        };
    }
])

.controller('ItemDetailCtrl', [
    '$scope',
    '$http',
    'Agenda',
    'User',
    'item',
    function ($scope, $http, Agenda, User, item) {
        Agenda.bindOne(item.id, $scope, 'item');
        User.bindAll({}, $scope, 'users');
        $scope.speaker = {};
        $scope.alert = {};

        // close/open list of speakers of current item
        $scope.closeList = function (listClosed) {
            item.speaker_list_closed = listClosed;
            Agenda.save(item);
        };
        // add user to list of speakers
        $scope.addSpeaker = function (userId) {
            $http.post('/rest/agenda/item/' + item.id + '/manage_speaker/', {'user': userId})
                .success(function(data){
                    $scope.alert.show = false;
                })
                .error(function(data){
                    $scope.alert = { type: 'danger', msg: data.detail, show: true };
                });
        };
        // delete speaker(!) from list of speakers
        $scope.removeSpeaker = function (speakerId) {
            $http.delete('/rest/agenda/item/' + item.id + '/manage_speaker/',
                    {headers: {'Content-Type': 'application/json'},
                     data: JSON.stringify({speaker: speakerId})})
                .error(function(data){
                    $scope.alert = { type: 'danger', msg: data.detail, show: true };
                });
        };
        // begin speech of selected/next speaker
        $scope.beginSpeech = function (speakerId) {
            $http.put('/rest/agenda/item/' + item.id + '/speak/', {'speaker': speakerId})
                .success(function(data){
                    $scope.alert.show = false;
                })
                .error(function(data){
                    $scope.alert = { type: 'danger', msg: data.detail, show: true };
                });
        };
        // end speech of current speaker
        $scope.endSpeech = function () {
            $http.delete('/rest/agenda/item/' + item.id + '/speak/',
                    {headers: {'Content-Type': 'application/json'},
                     data: JSON.stringify()})
                .error(function(data){
                    $scope.alert = { type: 'danger', msg: data.detail, show: true };
                });
        };
        // project list of speakers
        $scope.projectListOfSpeakers = function () {
            $http.post('/rest/core/projector/1/prune_elements/',
                    [{name: 'agenda/item', id: item.id, list_of_speakers: true}]);
        };
    }
])

.controller('ItemCreateCtrl', [
    '$scope',
    '$state',
    'Agenda',
    'Tag',
    'types',
    function($scope, $state, Agenda, Tag, types) {
        $scope.types = types.data.actions.POST.type.choices;  // get all item types
        Tag.bindAll({}, $scope, 'tags');
        $scope.save = function (item) {
            if (!item)
                return null;
            Agenda.create(item).then(
                function(success) {
                    $state.go('agenda.item.list');
                }
            );
        };
    }
])

.controller('ItemUpdateCtrl', [
    '$scope',
    '$state',
    'Agenda',
    'Tag',
    'types',
    'item',
    function($scope, $state, Agenda, Tag, types, item) {
        $scope.types = types.data.actions.POST.type.choices;  // get all item types
        Tag.bindAll({}, $scope, 'tags');
        $scope.item = item;
        $scope.save = function (item) {
            Agenda.save(item).then(
                function(success) {
                    $state.go('agenda.item.list');
                }
            );
        };
    }
])

.controller('AgendaSortCtrl', [
    '$scope',
    '$http',
    'Agenda',
    'AgendaTree',
    function($scope, $http, Agenda, AgendaTree) {
        // Bind agenda tree to the scope
        $scope.$watch(function () {
            return Agenda.lastModified();
        }, function () {
            $scope.items = AgendaTree.getTree(Agenda.getAll());
        });

        // set changed agenda tree
        $scope.treeOptions = {
            dropped: function() {
                $http.put('/rest/agenda/item/tree/', {tree: $scope.items});
            }
        };
    }
])

.controller('AgendaImportCtrl', [
    '$scope',
    '$state',
    'Agenda',
    function($scope, $state, Agenda) {
        // import from textarea
        $scope.importByLine = function () {
            $scope.items = $scope.itemlist[0].split("\n");
            $scope.importcounter = 0;
            $scope.items.forEach(function(title) {
                var item = {title: title};
                // TODO: create all items in bulk mode
                Agenda.create(item).then(
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
                var item = {};
                item.title = obj[i].title;
                item.text = obj[i].text;
                item.duration = obj[i].duration;
                Agenda.create(item).then(
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
     }
]);


angular.module('OpenSlidesApp.agenda.projector', ['OpenSlidesApp.agenda'])

.config([
    'slidesProvider',
    function(slidesProvider) {
        slidesProvider.registerSlide('agenda/item', {
            template: 'static/templates/agenda/slide-item-detail.html',
        });
        slidesProvider.registerSlide('agenda/item-list', {
            template: 'static/templates/agenda/slide-item-list.html',
        });
    }
])

.controller('SlideItemDetailCtrl', [
    '$scope',
    'Agenda',
    'User',
    function($scope, Agenda, User) {
        // Attention! Each object that is used here has to be dealt on server side.
        // Add it to the coresponding get_requirements method of the ProjectorElement
        // class.
        var id = $scope.element.id;
        Agenda.find(id);
        User.findAll();
        Agenda.bindOne(id, $scope, 'item');
        // get flag for list-of-speakers-slide (true/false)
        $scope.is_list_of_speakers = $scope.element.list_of_speakers;
    }
])

.controller('SlideItemListCtrl', [
    '$scope',
    '$http',
    'Agenda',
    'AgendaTree',
    function($scope, $http, Agenda, AgendaTree) {
        // Attention! Each object that is used here has to be dealt on server side.
        // Add it to the coresponding get_requirements method of the ProjectorElement
        // class.
        Agenda.findAll();
        // Bind agenda tree to the scope
        $scope.$watch(function () {
            return Agenda.lastModified();
        }, function () {
            $scope.items = AgendaTree.getFlatTree(Agenda.getAll());
        });
    }
]);
