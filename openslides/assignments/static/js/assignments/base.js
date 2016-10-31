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
                    var impossible = false;
                    var yes = null, no = null, abstain = null;
                    angular.forEach(this.votes, function(vote) {
                        if (vote.value == "Yes" || vote.value == "Votes") {
                            yes = vote.weight;
                        } else if (vote.value == "No") {
                            no = vote.weight;
                        } else if (vote.value == "Abstain") {
                            abstain = vote.weight;
                        }
                    });
                    //calculation for several candidates without yes/no options
                    var do_sum_of_all = false;
                    var sum_of_votes = 0;
                    if (poll.options.length > 1 && poll.pollmethod == 'votes') {
                        do_sum_of_all = true;
                    }
                    if (do_sum_of_all === true) {
                        angular.forEach(poll.options, function(option) {
                            angular.forEach(option.votes, function(vote) {
                                if (vote.value == "Votes") {
                                    if (vote.weight >= 0 ) {
                                        sum_of_votes = sum_of_votes + vote.weight;
                                    } else {
                                        impossible = true;
                                    }
                                }
                            });
                        });
                    }
                    angular.forEach(this.votes, function(vote) {
                        // check for special value
                        var value;
                        switch (vote.weight) {
                            case -1:
                                value = gettextCatalog.getString('majority');
                                impossible = true;
                                break;
                            case -2:
                                value = gettextCatalog.getString('undocumented');
                                impossible = true;
                                break;
                            default:
                                if (vote.weight >= 0) {
                                    value = vote.weight;
                                } else {
                                    value = 0;
                                }
                                break;
                        }
                        // calculate percent value
                        var percentStr, percentNumber, base;
                        if (config == "VALID") {
                            if (poll.votesvalid && poll.votesvalid > 0) {
                                base = poll.votesvalid;
                            }
                        } else if ( config == "CAST") {
                            if (poll.votescast && poll.votescast > 0) {
                                base = poll.votescast;
                            }
                        } else if (config == "YES_NO" && !impossible) {
                            if (vote.value == "Yes" || vote.value == "No" || vote.value == "Votes"){
                                if (do_sum_of_all) {
                                    base = sum_of_votes;
                                } else {
                                    base = yes + no;
                                }
                            }
                        } else if (config == "YES_NO_ABSTAIN" && !impossible) {
                            if (do_sum_of_all) {
                                base = sum_of_votes;
                            } else {
                                base = yes + no + abstain;
                            }
                        }
                        if (base !== 'undefined' && vote.weight >= 0) {
                            percentNumber = Math.round(vote.weight * 100 / base * 10) / 10;
                        }
                        if (percentNumber >= 0 && percentNumber !== 'undefined') {
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
                getVote: function (type) {
                    var value, percentStr, vote;
                    switch(type) {
                        case 'votesinvalid':
                            vote = this.votesinvalid;
                            break;
                        case 'votesvalid':
                            vote = this.votesvalid;
                            break;
                        case 'votescast':
                            vote = this.votescast;
                            break;
                    }
                    if (this.has_votes && vote) {
                        switch (vote) {
                            case -1:
                                value = gettextCatalog.getString('majority');
                                break;
                            case -2:
                                value = gettextCatalog.getString('undocumented');
                                break;
                            default:
                                value = vote;
                        }
                        if (vote >= 0) {
                            var config = Config.get('assignments_poll_100_percent_base').value;
                            var percentNumber;
                            if (config == "CAST" && this.votescast && this.votescast > 0) {
                                percentNumber = Math.round(vote * 100 / this.votescast * 10) / 10;
                            } else if (config == "VALID" && this.votesvalid && this.votesvalid >= 0) {
                                if (type === 'votesvalid'){
                                    percentNumber = Math.round(vote * 100 / this.votesvalid * 10) / 10;
                                }
                            }
                            if (percentNumber !== 'undefined' && percentNumber >= 0 && percentNumber <=100) {
                                percentStr = "(" + percentNumber + "%)";
                            }
                        }
                    }
                    return {
                        'value': value,
                        'percentStr': percentStr
                    };
                }
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
                project: function (projectorId, pollId) {
                    var isProjectedId = this.isProjected(pollId);
                    if (isProjectedId > 0) {
                        $http.post('/rest/core/projector/' + isProjectedId + '/clear_elements/');
                    }
                    if (isProjectedId != projectorId) {
                        return $http.post(
                            '/rest/core/projector/' + projectorId + '/prune_elements/',
                            [{name: 'assignments/assignment', id: this.id, poll: pollId}]
                        );
                    }
                },
                // override isProjected function of jsDataModel factory
                isProjected: function (poll_id) {
                    // Returns the ids of all projectors with an element
                    // with the name 'assignments/assignment'. Else returns an empty list.
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
                    var isProjectedIds = [];
                    Projector.getAll().forEach(function (projector) {
                        if (typeof _.findKey(projector.elements, predicate) === 'string') {
                            isProjectedIds.push(projector.id);
                        }
                    });
                    return isProjectedIds;
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
