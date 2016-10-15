(function () {

'use strict';

angular.module('OpenSlidesApp.poll.majority', [])

.value('MajorityMethodChoices', [
    {'value': 'simple_majority', 'display_name': 'Simple majority'},
    {'value': 'two-thirds_majority', 'display_name': 'Two-thirds majority'},
    {'value': 'three-quarters_majority', 'display_name': 'Three-quarters majority'},
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
        };
    }
])

.factory('MotionMajority', [
    'MajorityMethods',
    function (MajorityMethods) {
        return {
            isReached: function (base, method, votes) {
                var methodFunction = MajorityMethods[method];
                var yes = parseInt(votes.yes);
                var no = parseInt(votes.no);
                var abstain = parseInt(votes.abstain);
                var valid = parseInt(votes.votesvalid);
                var cast = parseInt(votes.votescast);
                var result;
                var isValid = function (vote) {
                    return !isNaN(vote) && vote >= 0;
                };
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
                return result;
            },
        };
    }
]);

}());
