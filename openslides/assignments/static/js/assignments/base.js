(function () {

'use strict';

angular.module('OpenSlidesApp.assignments', [])

.factory('AssignmentPollOption', [
    'DS',
    'jsDataModel',
    'gettextCatalog',
    'Config',
    'MajorityMethods',
    function (DS, jsDataModel, gettextCatalog, Config, MajorityMethods) {
        return DS.defineResource({
            name: 'assignments/polloption',
            useClass: jsDataModel,
            methods: {
                getVotes: function () {
                    if (!this.poll.has_votes) {
                        // Return undefined if this poll has no votes.
                        return;
                    }

                    // Initial values for the option
                    var votes = [],
                        config = Config.get('assignments_poll_100_percent_base').value;

                    var base = this.poll.getPercentBase(config);
                    if (typeof base === 'object') {
                        // this.poll.pollmethod === 'yna'
                        base = base[this.id];
                    }

                    _.forEach(this.votes, function (vote) {
                        // Initial values for the vote
                        var order = '',
                            value = '',
                            percentStr = '',
                            percentNumber;

                        // Check for special value
                        switch (vote.weight) {
                            case -1:
                                value = gettextCatalog.getString('majority');
                                break;
                            case -2:
                                value = gettextCatalog.getString('undocumented');
                                break;
                            default:
                                if (vote.weight >= 0) {
                                    value = vote.weight;
                                } else {
                                    value = 0;  // Vote was not defined. Set value to 0.
                                }
                        }
                        switch (vote.value) {
                            case "Yes":
                                order = 1;
                                break;
                            case "No":
                                order = 2;
                                break;
                            case "Abstain":
                                order = 3;
                                break;
                            default:
                                order = 0;
                        }

                        // Special case where to skip percents
                        var skipPercents = config === 'YES_NO' && vote.value === 'Abstain';

                        if (base && !skipPercents) {
                            percentNumber = Math.round(vote.weight * 100 / base * 10) / 10;
                            percentStr = "(" + percentNumber + "%)";
                        }
                        votes.push({
                            'order': order,
                            'label': gettextCatalog.getString(vote.value),
                            'value': value,
                            'percentStr': percentStr,
                            'percentNumber': percentNumber
                        });
                    });
                    return _.sortBy(votes, 'order');
                },

                // Returns 0 or positive integer if quorum is reached or surpassed.
                // Returns negativ integer if quorum is not reached.
                // Returns undefined if we can not calculate the quorum.
                isReached: function (method) {
                    if (!this.poll.has_votes) {
                        // Return undefined if this poll has no votes.
                        return;
                    }
                    var isReached;
                    var config = Config.get('assignments_poll_100_percent_base').value;
                    var base = this.poll.getPercentBase(config);
                    if (typeof base === 'object') {
                        // this.poll.pollmethod === 'yna'
                        base = base[this.id];
                    }
                    if (base) {
                        // Provide result only if base is not undefined and not 0.
                        isReached = MajorityMethods[method](this.getVoteYes(), base);
                    }
                    return isReached;
                },

                // Returns the weight for the vote or the vote 'yes' in case of YNA poll method.
                getVoteYes: function () {
                    var voteYes = 0;
                    if (this.poll.pollmethod === 'yna') {
                        var voteObj = _.find(this.votes, function (vote) {
                            return vote.value === 'Yes';
                        });
                        if (voteObj) {
                            voteYes = voteObj.weight;
                        }
                    } else {
                        // pollmethod === 'votes'
                        voteYes = this.votes[0].weight;
                    }
                    return voteYes;
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

                // Returns percent base. Returns undefined if calculation is not possible in general.
                getPercentBase: function (config, type) {
                    var base;
                    switch (config) {
                        case 'CAST':
                            if (this.votescast <= 0 || this.votesinvalid < 0) {
                                // It would be OK to check only this.votescast < 0 because 0
                                // is checked again later but this is a little bit faster.
                                break;
                            }
                            base = this.votescast;
                            /* falls through */
                        case 'VALID':
                            if (this.votesvalid < 0) {
                                base = void 0;
                                break;
                            }
                            if (typeof base === 'undefined' && type !== 'votescast' && type !== 'votesinvalid') {
                                base = this.votesvalid;
                            }
                            /* falls through */
                        case 'YES_NO_ABSTAIN':
                        case 'YES_NO':
                            if (this.pollmethod === 'yna') {
                                if (typeof base === 'undefined' && type !== 'votescast' && type !== 'votesinvalid' && type !== 'votesvalid') {
                                    base = {};
                                    _.forEach(this.options, function (option) {
                                        var allVotes = option.votes;
                                        if (config === 'YES_NO') {
                                            allVotes = _.filter(allVotes, function (vote) {
                                                // Extract abstain votes in case of YES_NO percent base.
                                                // Do not extract abstain vote if it is set to majority so the predicate later
                                                // fails and therefor we get an undefined base. Reason: It should not be possible
                                                // to set abstain to majority and nevertheless calculate percents of yes and no.
                                                return vote.value !== 'Abstain' || vote.weight === -1;
                                            });
                                        }
                                        var predicate = function (vote) {
                                            return vote.weight < 0;
                                        };
                                        if (_.findIndex(allVotes, predicate) === -1) {
                                            base[option.id] = _.reduce(allVotes, function (sum, vote) {
                                                return sum + vote.weight;
                                            }, 0);
                                        }
                                    });
                                }
                            } else {
                                // this.pollmethod === 'votes'
                                var predicate = function (option) {
                                    return option.votes[0].weight < 0;
                                };
                                if (_.findIndex(this.options, predicate) !== -1) {
                                    base = void 0;
                                } else {
                                    if (typeof base === 'undefined' && type !== 'votescast' && type !== 'votesinvalid' && type !== 'votesvalid') {
                                        base = _.reduce(this.options, function (sum, option) {
                                            return sum + option.votes[0].weight;
                                        }, 0);
                                    }
                                }
                            }
                    }
                    return base;
                },

                // Returns object with value and percent for this poll (for votes valid/invalid/cast only).
                getVote: function (type) {
                    if (!this.has_votes) {
                        // Return undefined if this poll has no votes.
                        return;
                    }

                    // Initial values
                    var value = '',
                        percentStr = '',
                        percentNumber,
                        vote,
                        config = Config.get('assignments_poll_100_percent_base').value;

                    switch (type) {
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

                    // Check special values
                    switch (vote) {
                        case -1:
                            value = gettextCatalog.getString('majority');
                            break;
                        case -2:
                            value = gettextCatalog.getString('undocumented');
                            break;
                        default:
                            if (vote >= 0) {
                                value = vote;
                            } else {
                                value = 0; // value was not defined
                            }
                    }

                    // Calculate percent value
                    var base = this.getPercentBase(config, type);
                    if (base) {
                        percentNumber = Math.round(vote * 100 / (base) * 10) / 10;
                        percentStr = '(' + percentNumber + ' %)';
                    }
                    return {
                        'value': value,
                        'percentStr': percentStr,
                        'percentNumber': percentNumber,
                        'display': value + ' ' + percentStr
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
        return DS.defineResource({
            name: name,
            useClass: jsDataModel,
            verboseName: gettext('Election'),
            verboseNamePlural: gettext('Elections'),
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
                // return true if a specific relation matches for given searchquery
                // (here: related_users/candidates)
                hasSearchResult: function (results) {
                    var assignment = this;
                    // search for related users (check if any user.id from already found users matches)
                    return _.some(results, function(result) {
                        if (result.getResourceName() === "users/user") {
                            if (_.some(assignment.assignment_related_users, {'user_id': result.id})) {
                                return true;
                            }
                        }
                    });
                },
                // override project function of jsDataModel factory
                project: function (projectorId, pollId) {
                    var isProjectedIds = this.isProjected(pollId);
                    _.forEach(isProjectedIds, function (id) {
                        $http.post('/rest/core/projector/' + id + '/clear_elements/');
                    });
                    if (_.indexOf(isProjectedIds, projectorId) == -1) {
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
