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
                        if (percentNumber >= 0 ) {
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
        });
    }
])

.factory('AssignmentPoll', [
    '$http',
    'DS',
    'jsDataModel',
    'gettextCatalog',
    'AssignmentPollOption',
    'Config',
    function ($http, DS, jsDataModel, gettextCatalog, AssignmentPollOption, Config) {
        var name = 'assignments/poll';
        return DS.defineResource({
            name: name,
            useClass: jsDataModel,
            methods: {
                getResourceName: function () {
                    return name;
                },
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
        });
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
        });
    }
])

.factory('Assignment', [
    '$http',
    'DS',
    'Projector',
    'AssignmentRelatedUser',
    'AssignmentPoll',
    'jsDataModel',
    'gettext',
    function ($http, DS, Projector, AssignmentRelatedUser, AssignmentPoll, jsDataModel, gettext) {
        var name = 'assignments/assignment';
        var phases;
        return DS.defineResource({
            name: name,
            useClass: jsDataModel,
            verboseName: gettext('Election'),
            verboseNamePlural: gettext('Elections'),
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
                },
                // override project function of jsDataModel factory
                project: function (poll_id) {
                    return $http.post(
                        '/rest/core/projector/1/prune_elements/',
                        [{name: 'assignments/assignment', id: this.id, poll: poll_id}]
                    );
                },
                // override isProjected function of jsDataModel factory
                isProjected: function (poll_id) {
                    // Returns true if there is a projector element with the name
                    // 'assignments/assignment'.
                    var projector = Projector.get(1);
                    var isProjected;
                    if (typeof projector !== 'undefined') {
                        var self = this;
                        var predicate = function (element) {
                            var value;
                            if (typeof poll_id === 'undefined') {
                                // Assignment detail slide without poll
                                value = element.name == 'assignments/assignment' &&
                                    typeof element.id !== 'undefined' &&
                                    element.id == self.id &&
                                    typeof element.poll === 'undefined';
                            } else {
                                // Assignment detail slide with specific poll
                                value = element.name == 'assignments/assignment' &&
                                    typeof element.id !== 'undefined' &&
                                    element.id == self.id &&
                                    typeof element.poll !== 'undefined' &&
                                    element.poll == poll_id;
                            }
                            return value;
                        };
                        isProjected = typeof _.findKey(projector.elements, predicate) === 'string';
                    } else {
                        isProjected = false;
                    }
                    return isProjected;
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
