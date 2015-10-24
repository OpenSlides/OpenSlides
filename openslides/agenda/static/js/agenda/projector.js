(function () {

'use strict';

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

}());
