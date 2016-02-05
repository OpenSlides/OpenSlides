(function () {

'use strict';

angular.module('OpenSlidesApp.assignments', [])

.factory('AssignmentPollOption', [
    'DS',
    'jsDataModel',
    'gettextCatalog',
    'Config',
    function (DS, jsDataModel, gettextCatalog, Config) {
        return DS.defineResource({
            name: 'assignments/polloption',
            useClass: jsDataModel,
            methods: {
                getVotes: function () {
                    if (!this.poll.has_votes) {
                        return;
                    }
                    var poll = this.poll;
                    var votes = [];
                    var config = Config.get('assignments_poll_100_percent_base').value;
                    angular.forEach(this.votes, function(vote) {
                        // check for special value
                        var value;
                        switch (vote.weight) {
                            case -1:
                                value = gettextCatalog.getString('majority');
                                break;
                            case -2:
                                value = gettextCatalog.getString('undocumented');
                                break;
                            default:
                                value = vote.weight;
                                break;
                        }
                        // calculate percent value
                        var percentStr, percentNumber;
                        if (config == "WITHOUT_INVALID" && poll.votesvalid > 0 && vote.weight >= 0) {
                            percentNumber = Math.round(vote.weight * 100 / poll.votesvalid * 10) / 10;
                        } else if (config == "WITH_INVALID" && poll.votescast > 0 && vote.weight >= 0) {
                            percentNumber = Math.round(vote.weight * 100 / (poll.votescast) * 10) / 10;
                        }
                        if (percentNumber) {
                            percentStr = "(" + percentNumber + "%)";
                        }
                        votes.push({
                            'label': gettextCatalog.getString(vote.value),
                            'value': value,
                            'percentStr': percentStr,
                            'percentNumber': percentNumber
                        });
                    });
                    return votes;
                }
            },
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
    'gettextCatalog',
    'AssignmentPollOption',
    'Config',
    function (DS, gettextCatalog, AssignmentPollOption, Config) {
        return DS.defineResource({
            name: 'assignments/poll',
            methods: {
                // returns object with value and percent (for votes valid/invalid/cast only)
                getVote: function (vote) {
                    if (!this.has_votes || !vote) {
                        return;
                    }
                    var value = '';
                    switch (vote) {
                        case -1:
                            value = gettextCatalog.getString('majority');
                            break;
                        case -2:
                            value = gettextCatalog.getString('undocumented');
                            break;
                        default:
                            value = vote;
                            break;
                    }
                    // calculate percent value
                    var config = Config.get('assignments_poll_100_percent_base').value;
                    var percent;
                    if ((config == "WITHOUT_INVALID" && vote == this.votesvalid && vote >= 0) ||
                        (config == "WITH_INVALID" && vote == this.votescast && vote >= 0)) {
                        percent = '(100%)';
                    }
                    return {
                        'value': value,
                        'percent': percent
                    };
                },
            },
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
            phases: phases,
            getPhases: function () {
                if (!this.phases) {
                    this.phases = $http({ 'method': 'OPTIONS', 'url': '/rest/assignments/assignment/' })
                        .then(function(phases) {
                            return phases.data.actions.POST.phase.choices;
                        });
                }
                return this.phases;
            },
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
                    return "Election";
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
