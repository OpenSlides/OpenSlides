(function () {

"use strict";

angular.module('OpenSlidesApp.motions', [])

.controller('CalculatorController', function CalculatorController($scope) {
  $scope.sum = function() {
    if ($scope.x === undefined || $scope.y === undefined) {
      $scope.z = 0;
    } else {
      $scope.z = $scope.x + $scope.y;
    }
  };
})


.service('lineNumberingService', function lineNumberingService() {

    this.helloWorld = function() {
        return 'Hello World';
    };

    this.lineLength = 80;

    this.setLineLength = function(length) {
        this.lineLength = length;
    };

    this.insertLineNumbers = function(html) {
        // @TODO
    }
});


}());
