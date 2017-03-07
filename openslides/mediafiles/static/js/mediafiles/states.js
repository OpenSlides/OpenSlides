(function () {

'use strict';

angular.module('OpenSlidesApp.mediafiles.states', [
    'gettext',
    'ui.router',
    //TODO: Add deps for mainMenuProvider
])

.config([
    'gettext',
    'mainMenuProvider',
    function (gettext, mainMenuProvider) {
        mainMenuProvider.register({
            'ui_sref': 'mediafiles.mediafile.list',
            'img_class': 'paperclip',
            'title': gettext('Files'),
            'weight': 600,
            'perm': 'mediafiles.can_see',
        });
    }
])

.config([
    'SearchProvider',
    'gettext',
    function (SearchProvider, gettext) {
        SearchProvider.register({
            'verboseName': gettext('Files'),
            'collectionName': 'mediafiles/mediafile',
            'urlDetailState': 'mediafiles.mediafile.detail',
            'weight': 600,
        });
    }
])

.config([
    'gettext',
    '$stateProvider',
    function (gettext, $stateProvider) {
        $stateProvider
        .state('mediafiles', {
            url: '/mediafiles',
            abstract: true,
            template: "<ui-view/>",
            data: {
                title: gettext('Files'),
                basePerm: 'mediafiles.can_see',
            },
        })
        .state('mediafiles.mediafile', {
            abstract: true,
            template: "<ui-view/>",
        })
        .state('mediafiles.mediafile.list', {});
    }
]);

}());
