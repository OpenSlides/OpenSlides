(function () {

'use strict';

angular.module('OpenSlidesApp.topics', [])

.factory('Topic', [
    'DS',
    'jsDataModel',
    'gettext',
    function(DS, jsDataModel, gettext) {
        var name = 'topics/topic';
        return DS.defineResource({
            name: name,
            useClass: jsDataModel,
            verboseName: gettext('Topic'),
            methods: {
                getResourceName: function () {
                    return name;
                },
                getAgendaTitle: function () {
                    return this.title;
                },
                // link name which is shown in search result
                getSearchResultName: function () {
                    return this.getAgendaTitle();
                },
                // subtitle of search result
                getSearchResultSubtitle: function () {
                    return 'Topic';
                },
            },
            relations: {
                belongsTo: {
                    'agenda/item': {
                        localKey: 'agenda_item_id',
                        localField: 'agenda_item',
                    }
                },
                hasMany: {
                    'mediafiles/mediafile': {
                        localField: 'attachments',
                        localKeys: 'attachments_id',
                    }
                }
            }
        });
    }
])

.run(['Topic', function(Topic) {}]);

}());
