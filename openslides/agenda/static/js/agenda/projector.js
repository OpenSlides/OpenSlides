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
    }
])

.controller('SlideListOfSpeakersCtrl', [
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
    }
])

.controller('SlideItemListCtrl', [
    '$scope',
    '$http',
    '$filter',
    'Agenda',
    'AgendaTree',
    function($scope, $http, $filter, Agenda, AgendaTree) {
        // Attention! Each object that is used here has to be dealt on server side.
        // Add it to the coresponding get_requirements method of the ProjectorElement
        // class.
        Agenda.findAll();
        // Bind agenda tree to the scope
        $scope.$watch(function () {
            return Agenda.lastModified();
        }, function () {
            if ($scope.element.id) {
                $scope.rootItem = Agenda.get($scope.element.id);
                var tree = AgendaTree.getFlatTree(Agenda.getAll());
                var startIndex = tree.indexOf($scope.rootItem);
                tree = tree.slice(startIndex);
                // define delta to move the whole subtree to level 0
                var parentCountDelta = 0;
                if (tree[0]) {
                    parentCountDelta = tree[0].parentCount;
                }
                $scope.items = [];
                for (var i = 1; i < tree.length; i++) {
                    if (tree[i].parentCount - parentCountDelta <= 0) {
                        break;
                    }
                    var item = tree[i];
                    // move rootItem (and all childs) to level 0
                    item.parentCount = item.parentCount - parentCountDelta;
                    $scope.items.push(item);
                }
            } else if ($scope.element.tree) {
                $scope.items = AgendaTree.getFlatTree(Agenda.getAll());
            } else {
                $scope.items = Agenda.filter({
                    where: { parent_id: null },
                    orderBy: 'weight'
                });
            }
        });
    }
]);

}());
