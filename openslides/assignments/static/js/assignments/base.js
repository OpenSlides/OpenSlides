(function () {

'use strict';

angular.module('OpenSlidesApp.assignments', [])

.factory('Assignment', ['DS', 'jsDataModel', function(DS, jsDataModel) {
    var name = 'assignments/assignment';
    return DS.defineResource({
        name: name,
        useClass: jsDataModel,
        methods: {
            getResourceName: function () {
                return name;
            }
        }
    });
}])

.run(['Assignment', function(Assignment) {}]);

}());
