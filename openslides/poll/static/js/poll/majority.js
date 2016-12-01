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
]);

}());
