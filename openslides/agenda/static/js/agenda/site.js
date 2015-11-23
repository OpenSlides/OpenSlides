(function () {

'use strict';

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
    'ngDialog',
    'Agenda',
    'AgendaTree',
    'Customslide',
    'Projector',
    function($scope, $http, $state, ngDialog, Agenda, AgendaTree, Customslide, Projector) {
        // Bind agenda tree to the scope
        $scope.$watch(function () {
            return Agenda.lastModified();
        }, function () {
            $scope.items = AgendaTree.getFlatTree(Agenda.getAll());
        });
        $scope.alert = {};

        // project related item (content object)
        $scope.project = function (item) {
            item.getContentResource().find(item.content_object.id).then(
                function(object) {
                    object.project();
                }
            );
        };

        // open new customslide dialog
        $scope.newDialog = function () {
            ngDialog.open({
                template: 'static/templates/core/customslide-form.html',
                controller: 'CustomslideCreateCtrl',
                className: 'ngdialog-theme-default wide-form'
            });
        };
        // detail view of related item (content object)
        $scope.open = function (item) {
            $state.go(item.content_object.collection.replace('/','.')+'.detail',
                    {id: item.content_object.id});
        };
        // edit view of related item (content object)
        $scope.edit = function (item) {
            if (item.content_object.collection == "core/customslide") {
                ngDialog.open({
                    template: 'static/templates/core/customslide-form.html',
                    controller: 'CustomslideUpdateCtrl',
                    className: 'ngdialog-theme-default wide-form',
                    resolve: {
                        customslide: function(Customslide) {
                            return Customslide.find(item.content_object.id);
                        }
                    }
                });
            }
            else {
                $state.go(item.content_object.collection.replace('/','.')+'.detail.update',
                        {id: item.content_object.id});
            }
        };
        // update changed item
        $scope.update = function (item) {
            Agenda.save(item).then(
                function(success) {
                    item.quickEdit = false;
                    $scope.alert.show = false;
                },
                function(error){
                    var message = '';
                    for (var e in error.data) {
                        message += e + ': ' + error.data[e] + ' ';
                    }
                    $scope.alert = { type: 'danger', msg: message, show: true };
                });
;
        };
        // delete related item
        $scope.deleteRelatedItem = function (item) {
            if (item.content_object.collection == 'core/customslide') {
                Customslide.destroy(item.content_object.id);
            }
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
        // delete selected items only if items are customslides
        $scope.delete = function () {
            angular.forEach($scope.items, function (item) {
                if (item.selected) {
                    if (item.content_object.collection == 'core/customslide') {
                        Customslide.destroy(item.content_object.id);
                    }
                }
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
        // auto numbering of agenda items
        $scope.autoNumbering = function() {
            $http.post('/rest/agenda/item/numbering/', {});
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
    'Customslide',
    function($scope, $state, Agenda, Customslide) {
        // import from textarea
        $scope.importByLine = function () {
            $scope.items = $scope.itemlist[0].split("\n");
            $scope.importcounter = 0;
            $scope.items.forEach(function(title) {
                var item = {title: title};
                // TODO: create all items in bulk mode
                Customslide.create(item).then(
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
                var item = {};
                item.title = obj[i].title;
                item.text = obj[i].text;
                // TODO: save also 'duration' in related agenda item
                Customslide.create(item).then(
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
]);

}());
