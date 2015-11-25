(function () {

'use strict';

angular.module('OpenSlidesApp.assignments', [])

.factory('AssignmentPoll', [
    'DS',
    'Config',
    function (DS, Config) {
        return DS.defineResource({
            name: 'assignments/poll',
            relations: {
                belongsTo: {
                    'assignments/assignment': {
                        localField: 'assignment',
                        localKey: 'assignment_id',
                    }
                }
            },
        })
    }
])

.factory('AssignmentRelatedUser', [
    'DS',
    function (DS) {
        return DS.defineResource({
            name: 'assignments/relateduser',
            relations: {
                belongsTo: {
                    'users/user': {
                        localField: 'user',
                        localKey: 'user_id',
                    }
                }
            }
        })
    }
])

.factory('Assignment', [
    'DS',
    'AssignmentRelatedUser',
    'AssignmentPoll',
    'jsDataModel',
    function (DS, AssignmentRelatedUser, AssignmentPoll, jsDataModel) {
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
                },
                hasMany: {
                    'core/tag': {
                        localField: 'tags',
                        localKeys: 'tags_id',
                    },
                    'assignments/relateduser': {
                        localField: 'assignment_related_users',
                        foreignKey: 'assignment_id',
                    }
                }
            }
        });
    }
])

.run(['Assignment', function(Assignment) {}]);

}());
