angular.module('OpenSlidesApp.agenda', [])

.config(function($stateProvider) {
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
        .state('agenda.item.create', {})
        .state('agenda.item.detail', {
            resolve: {
                item: function(Agenda, $stateParams) {
                    return Agenda.find($stateParams.id);
                }
            }
        })
        .state('agenda.item.detail.update', {
            views: {
                '@agenda.item': {}
            }
        });
})

.factory('Agenda', function(DS) {
    return DS.defineResource({
        name: 'agenda/item',
        endpoint: '/rest/agenda/item/'
    });
})

.controller('ItemListCtrl', function($scope, Agenda, i18n) {
    Agenda.bindAll({}, $scope, 'items');
    $scope.test_plural = i18n.ngettext('test', 'tests', 2);
    $scope.test_singular = i18n.ngettext('test', 'tests', 1);
})

.controller('ItemDetailCtrl', function($scope, Agenda, item) {
    Agenda.bindOne($scope, 'item', item.id);
})

.controller('ItemCreateCtrl', function($scope, Agenda) {
    $scope.item = {};
    $scope.save = function (item) {
        item.weight = 0;  // TODO: the rest_api should do this
        item.tags = []; // TODO: the rest_api should do this
        Agenda.create(item);
        // TODO: redirect to list-view
    };
})

.controller('ItemUpdateCtrl', function($scope, Agenda, item) {
    $scope.item = item;  // do not use Agenda.binOne(...) so autoupdate is not activated
    $scope.save = function (item) {
        Agenda.save(item);
        // TODO: redirect to list-view
    };
});
