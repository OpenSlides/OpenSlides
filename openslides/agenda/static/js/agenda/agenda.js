angular.module('OpenSlidesApp.agenda', [])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider
        .when('/agenda', {
            templateUrl: 'static/templates/agenda/item-list.html',
            controller: 'ItemListCtrl',
            resolve: {
                items: function(Agenda) {
                    return Agenda.findAll();
                }
            }
        })
        .when('/agenda/new', {
            templateUrl: 'static/templates/agenda/item-form.html',
            controller: 'ItemCreateCtrl'
        })
        .when('/agenda/:id', {
            templateUrl: 'static/templates/agenda/item-detail.html',
            controller: 'ItemDetailCtrl',
            resolve: {
                item: function(Agenda, $route) {
                    return Agenda.find($route.current.params.id);
                }
            }
        })
        .when('/agenda/:id/edit', {
            templateUrl: 'static/templates/agenda/item-form.html',
            controller: 'ItemUpdateCtrl',
            resolve: {
                item: function(Agenda, $route) {
                    return Agenda.find($route.current.params.id);
                }
            }
        });
}])

.factory('Agenda', function(DS) {
    return DS.defineResource({
        name: 'agenda/item',
        endpoint: '/rest/agenda/item/'
    });
})

.controller('ItemListCtrl', function($scope, Agenda, i18n) {
    Agenda.bindAll($scope, 'items');
    $scope.test_plural = i18n.ngettext('test', 'tests', 2);
    $scope.test_singular = i18n.ngettext('test', 'tests', 1);
})

.controller('ItemDetailCtrl', function($scope, $routeParams, Agenda) {
    Agenda.bindOne($scope, 'item', $routeParams.id);
})

.controller('ItemCreateCtrl', function($scope, Agenda) {
    $scope.item = {};
    $scope.save = function (item) {
        item.weight = 0;  // TODO: the rest_api should do this
        Agenda.create(item);
        // TODO: redirect to list-view
    };
})

.controller('ItemUpdateCtrl', function($scope, $routeParams, Agenda, item) {
    $scope.item = item;  // do not use Agenda.binOne(...) so autoupdate is not activated
    $scope.save = function (item) {
        Agenda.save(item);
        // TODO: redirect to list-view
    };
});
