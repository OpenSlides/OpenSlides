(function () {

'use strict';

angular.module('OpenSlidesApp.users.projector', ['OpenSlidesApp.users'])

.config(function(slidesProvider) {
    slidesProvider.registerSlide('users/user', {
        template: 'static/templates/users/slide_user.html',
    });
})

.controller('SlideUserCtrl', function($scope, User) {
    // Attention! Each object that is used here has to be dealt on server side.
    // Add it to the coresponding get_requirements method of the ProjectorElement
    // class.
    var id = $scope.element.id;
    User.find(id);
    User.bindOne(id, $scope, 'user');
});

}());
