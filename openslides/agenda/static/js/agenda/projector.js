(function () {

'use strict';

angular.module('OpenSlidesApp.agenda.projector', ['OpenSlidesApp.agenda'])

.config([
    'slidesProvider',
    function(slidesProvider) {
        slidesProvider.registerSlide('agenda/list-of-speakers', {
            template: 'static/templates/agenda/slide-list-of-speakers.html',
        });
        slidesProvider.registerSlide('agenda/item-list', {
            template: 'static/templates/agenda/slide-item-list.html',
        });
        slidesProvider.registerSlide('agenda/current-list-of-speakers', {
            template: 'static/templates/agenda/slide-current-list-of-speakers.html',
        });
    }
])

.controller('SlideCurrentListOfSpeakersCtrl', [
    '$scope',
    'Agenda',
    'CurrentListOfSpeakersItem',
    'Config',
    'Projector',
    function ($scope, Agenda, CurrentListOfSpeakersItem, Config, Projector) {
        $scope.overlay = $scope.element.overlay;
        // Watch for changes in the current list of speakers reference
        $scope.$watch(function () {
            return Config.lastModified('projector_currentListOfSpeakers_reference');
        }, function () {
            $scope.currentListOfSpeakersReference = $scope.config('projector_currentListOfSpeakers_reference');
            $scope.updateCurrentListOfSpeakers();
        });
        // Watch for changes in the referenced projector
        $scope.$watch(function () {
            return Projector.lastModified($scope.currentListOfSpeakersReference);
        }, function () {
            $scope.updateCurrentListOfSpeakers();
        });
        // Watch for changes in the current item.
        $scope.$watch(function () {
            return Agenda.lastModified();
        }, function () {
            $scope.updateCurrentListOfSpeakers();
        });
        $scope.updateCurrentListOfSpeakers = function () {
            $scope.agendaItem = CurrentListOfSpeakersItem.getItem($scope.currentListOfSpeakersReference);
        };
    }
])

.controller('SlideListOfSpeakersCtrl', [
    '$scope',
    'Agenda',
    'User',
    function ($scope, Agenda, User) {
        // Attention! Each object that is used here has to be dealt on server side.
        // Add it to the coresponding get_requirements method of the ProjectorElement
        // class.
        var id = $scope.element.id;
        Agenda.bindOne(id, $scope, 'item');
    }
])

.controller('SlideItemListCtrl', [
    '$scope',
    '$http',
    '$filter',
    'Agenda',
    'AgendaTree',
    'Config',
    function ($scope, $http, $filter, Agenda, AgendaTree, Config) {
        // Attention! Each object that is used here has to be dealt on server side.
        // Add it to the coresponding get_requirements method of the ProjectorElement
        // class.

        // Bind agenda tree to the scope
        var items;
        $scope.$watch(function () {
            return Agenda.lastModified() +
                Config.lastModified('agenda_hide_internal_items_on_projector');
        }, function () {
            if ($scope.element.id) {
                if (Config.get('agenda_hide_internal_items_on_projector').value) {
                    items = _.filter(Agenda.getAll(), function (item) {
                        return item.type === 1;
                    });
                } else {
                    items = Agenda.getAll();
                }
                var tree = AgendaTree.getTree(items);

                var getRootNode = function (node) {
                    if (node.id == $scope.element.id) {
                        return node;
                    }
                    for (var i = 0; i < node.children.length; i++) {
                        var result = getRootNode(node.children[i]);
                        if (result) {
                            return result;
                        }
                    }
                    return false;
                };
                _.forEach(tree, function (node) {
                    var result = getRootNode(node);
                    if (result) {
                        $scope.rootItem = result.item;
                        $scope.tree = result.children;
                        return false;
                    }
                });
            } else if ($scope.element.tree) {
                items = _.filter(Agenda.getAll(), function (item) {
                    return item.type === 1;
                });
                $scope.tree = AgendaTree.getTree(items);
            } else {
                items = Agenda.filter({
                    where: { parent_id: null },
                    orderBy: 'weight'
                });
                items = _.filter(items, function (item) {
                    return item.type === 1;
                });
                $scope.tree = AgendaTree.getTree(items);
            }
        });
    }
]);

}());
