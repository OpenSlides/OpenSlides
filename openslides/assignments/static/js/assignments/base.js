(function () {

'use strict';

angular.module('OpenSlidesApp.assignments', [])

.factory('AssignmentPollOption', [
    'DS',
    function (DS) {
        return DS.defineResource({
            name: 'assignments/polloption',
            relations: {
                belongsTo: {
                    'assignments/poll': {
                        localField: 'poll',
                        localKey: 'poll_id',
                    },
                    'users/user': {
                        localField: 'candidate',
                        localKey: 'candidate_id',
                    }
                }
            },
        })
    }
])

.factory('AssignmentPoll', [
    'DS',
    'AssignmentPollOption',
    function (DS, AssignmentPollOption) {
        return DS.defineResource({
            name: 'assignments/poll',
            relations: {
                belongsTo: {
                    'assignments/assignment': {
                        localField: 'assignment',
                        localKey: 'assignment_id',
                    }
                },
                hasMany: {
                    'assignments/polloption': {
                        localField: 'options',
                        foreignKey: 'poll_id',
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
    '$http',
    'DS',
    'AssignmentRelatedUser',
    'AssignmentPoll',
    'jsDataModel',
    'gettext',
    function ($http, DS, AssignmentRelatedUser, AssignmentPoll, jsDataModel, gettext) {
        var name = 'assignments/assignment';
        var phases;
        return DS.defineResource({
            name: name,
            useClass: jsDataModel,
            verboseName: gettext('Election'),
            agendaSupplement: this.verboseName,
            phases: phases,
            getPhases: function () {
                if (!this.phases) {
                    this.phases = $http({ 'method': 'OPTIONS', 'url': '/rest/assignments/assignment/' });
                }
                return this.phases;
            },
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
                    },
                    'assignments/poll': {
                        localField: 'polls',
                        foreignKey: 'assignment_id',
                    }
                }
            },
            beforeInject: function (resource, instance) {
                AssignmentRelatedUser.ejectAll({where: {assignment_id: {'==': instance.id}}});
            }
        });
    }
])

.run(['Assignment', function(Assignment) {}]);

}());
