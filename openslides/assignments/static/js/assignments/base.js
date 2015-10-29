(function () {

'use strict';

angular.module('OpenSlidesApp.assignments', [])

.factory('Assignment', [
    'DS',
    'jsDataModel',
    function(DS, jsDataModel) {
        var name = 'assignments/assignment';
        return DS.defineResource({
            name: name,
            useClass: jsDataModel,
            agendaSupplement: '(Assignment)',
            methods: {
                getResourceName: function () {
                    return name;
                },
                getAgendaTitle: function () {
                    return this.title;
                }
            },
            relations: {
                belongsTo: {
                    'agenda/item': {
                        localKey: 'agenda_item_id',
                        localField: 'agenda_item',
                    }
                }
            }
        });
    }
])

.run(['Assignment', function(Assignment) {}]);

}());
