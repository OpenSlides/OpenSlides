(function () {

'use strict';

angular.module('OpenSlidesApp.poll.majority', [])

.value('MajorityMethodChoices', [
    {'value': 'simple_majority', 'display_name': 'Simple majority'},
    {'value': 'two-thirds_majority', 'display_name': 'Two-thirds majority'},
    {'value': 'three-quarters_majority', 'display_name': 'Three-quarters majority'},
    {'value': 'disabled', 'display_name': 'Disabled'},
])

.factory('MajorityMethods', [
    function () {
        return {
            'simple_majority': function (vote, base) {
                return Math.ceil(-(base / 2 - vote)) - 1;
            },
            'two-thirds_majority': function (vote, base) {
                var result = -(base * 2 - vote * 3) / 3;
                if (result % 1 !== 0) {
                    result = Math.ceil(result) - 1;
                }
                return result;
            },
            'three-quarters_majority': function (vote, base) {
                var result = -(base * 3 - vote * 4) / 4;
                if (result % 1 !== 0) {
                    result = Math.ceil(result) - 1;
                }
                return result;
            },
            'disabled': function () {
                return undefined;
            },
        };
    }
])

.factory('MajorityCalculation', [
    'MajorityMethods',
    function (MajorityMethods) {
        return {
            //calculate the base for yes-based multi-option polls
            options_yes_sum: function(poll){
                var yes = 0;
                var error = false;
                if (poll.options) {
                    _.forEach(poll.options, function(option) {
                        _.forEach(option.votes, function(vote) {
                            if (vote.value == 'Yes' || vote.value == 'Votes'){
                                if (vote.weight >= 0){
                                    yes = yes + vote.weight;
                                } else {
                                    error = true;
                                }
                            }
                        });
                    });
                    if (!error) {
                        return yes;
                    }
                } else if (poll.yes && poll.yes >= 0) {
                    return poll.yes;
                } // else: undefined
            },

            // returns 0 or positive integer if quorum is reached or surpassed
            // sum (optional): a different base to calculate with
            isReached: function (base, method, votes, sum) {
                var methodFunction = MajorityMethods[method];
                var yes = parseInt(votes.yes);
                var no = parseInt(votes.no);
                var alt_base = parseInt(sum);
                var abstain = parseInt(votes.abstain);
                var valid = parseInt(votes.votesvalid);
                var cast = parseInt(votes.votescast);
                var result;
                var isValid = function (vote) {
                    return !isNaN(vote) && vote >= 0;
                };
                if (isValid(alt_base) && isValid(yes)) {
                    result = methodFunction(yes, alt_base);
                } else {
                    switch (base) {
                        case 'YES_NO_ABSTAIN':
                            if (isValid(yes) && isValid(no) && isValid(abstain)) {
                                result = methodFunction(yes, yes + no + abstain);
                            }
                            break;
                        case 'YES_NO':
                            if (isValid(yes) && isValid(no)) {
                                result = methodFunction(yes, yes + no);
                            }
                            break;
                        case 'VALID':
                            if (isValid(yes) && isValid(valid)) {
                                result = methodFunction(yes, valid);
                            }
                            break;
                        case 'CAST':
                            if (isValid(yes) && isValid(cast)) {
                                result = methodFunction(yes, cast);
                            }
                            break;
                        // case 'DISABLED': result remains undefined
                    }
                }
                return result;
            }
        };
    }
]);

}());
