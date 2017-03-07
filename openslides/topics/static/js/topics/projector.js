(function () {

'use strict';

angular.module('OpenSlidesApp.topics.projector', ['OpenSlidesApp.topics'])

.config([
    'slidesProvider',
    function (slidesProvider) {
        slidesProvider.registerSlide('topics/topic', {
            template: 'static/templates/topics/slide_topic.html'
        });
    }
])

.controller('SlideTopicCtrl', [
    '$scope',
    'Topic',
    function($scope, Topic) {
        // Attention! Each object that is used here has to be dealt on server side.
        // Add it to the coresponding get_requirements method of the ProjectorElement
        // class.
        var id = $scope.element.id;
        Topic.bindOne(id, $scope, 'topic');
    }
]);

})();
