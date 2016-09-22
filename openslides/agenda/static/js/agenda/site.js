(function () {

'use strict';

angular.module('OpenSlidesApp.agenda.site', ['OpenSlidesApp.agenda'])

.config([
    'mainMenuProvider',
    'gettext',
    function (mainMenuProvider, gettext) {
        mainMenuProvider.register({
            'ui_sref': 'agenda.item.list',
            'img_class': 'calendar-o',
            'title': gettext('Agenda'),
            'weight': 200,
            'perm': 'agenda.can_see',
        });
    }
])

.config([
    '$stateProvider',
    function($stateProvider) {
        $stateProvider
            .state('agenda', {
                url: '/agenda',
                abstract: true,
                template: "<ui-view/>",
            })
            .state('agenda.item', {
                abstract: true,
                template: "<ui-view/>",
            })
            .state('agenda.item.list', {
                resolve: {
                    items: function(Agenda) {
                        return Agenda.findAll();
                    }
                }
            })
            .state('agenda.item.detail', {
                resolve: {
                    item: function(Agenda, $stateParams) {
                        return Agenda.find($stateParams.id).catch(
                            function () {
                                return null;
                            }
                        );
                    },
                    users: function(User) {
                        return User.findAll().catch(
                            function () {
                                return null;
                            }
                        );
                    },
                    tags: function(Tag) {
                        return Tag.findAll();
                    }
                }
            })
            .state('agenda.item.sort', {
                resolve: {
                    items: function(Agenda) {
                        return Agenda.findAll();
                    }
                },
                url: '/sort',
                controller: 'AgendaSortCtrl',
            })
            .state('agenda.current-list-of-speakers', {
                url: '/speakers',
                controller: 'ListOfSpeakersViewCtrl',
                resolve: {
                    users: function(User) {
                        return User.findAll().catch(
                            function () {
                                return null;
                            }
                        );
                    },
                    items: function(Agenda) {
                       return Agenda.findAll();
                    }
                }
            });
    }
])

.controller('ItemListCtrl', [
    '$scope',
    '$filter',
    '$http',
    '$state',
    'DS',
    'operator',
    'ngDialog',
    'Agenda',
    'TopicForm', // TODO: Remove this dependency. Use template hook for "New" and "Import" buttons.
    'AgendaTree',
    'Projector',
    function($scope, $filter, $http, $state, DS, operator, ngDialog, Agenda, TopicForm, AgendaTree, Projector) {
        // Bind agenda tree to the scope
        $scope.$watch(function () {
            return Agenda.lastModified();
        }, function () {
            $scope.items = AgendaTree.getFlatTree(Agenda.getAll());
            var subitems = $filter('filter')($scope.items, {'parent_id': ''});
            if (subitems.length) {
                $scope.agendaHasSubitems = true;
            }
        });
        $scope.alert = {};

        $scope.sumDurations = function () {
            var totalDuration = 0;
            $scope.items.forEach(function (item) {
                if (item.duration) {
                    totalDuration += item.duration;
                }
            });
            return totalDuration;
        };

        $scope.calculateEndTime = function () {
            var totalDuration = $scope.sumDurations();
            var startTime = $scope.config('agenda_start_event_date_time');
            // This date-time has a fixed structure: DD.MM.YYYY HH:MM
            if (startTime) {
                var timestamp = Date.parse(startTime) + totalDuration * 60 * 1000;
                var endDate = new Date(timestamp);
                var mm = ("0"+endDate.getMinutes()).slice(-2);
                var dateStr = endDate.getHours() + ':' + mm;
                return dateStr;
            } else {
                return '';
            }
        };

        // pagination
        $scope.currentPage = 1;
        $scope.itemsPerPage = 100;
        $scope.limitBegin = 0;
        $scope.pageChanged = function() {
            $scope.limitBegin = ($scope.currentPage - 1) * $scope.itemsPerPage;
        };

        // check open permission
        // TODO: Use generic solution here.
        $scope.isAllowedToSeeOpenLink = function (item) {
            var collection = item.content_object.collection;
            switch (collection) {
                case 'topics/topic':
                    return operator.hasPerms('agenda.can_see');
                case 'motions/motion':
                    return operator.hasPerms('motions.can_see');
                case 'assignments/assignment':
                    return operator.hasPerms('assignments.can_see');
                default:
                    return false;
            }
        };
        // open dialog for new topics // TODO Remove this. Don't forget import button in template.
        $scope.newDialog = function () {
            ngDialog.open(TopicForm.getDialog());
        };
        // cancel QuickEdit mode
        $scope.cancelQuickEdit = function (item) {
            // revert all changes by restore (refresh) original item object from server
            Agenda.refresh(item);
            item.quickEdit = false;
        };
        // save changed item
        $scope.save = function (item) {
            Agenda.save(item).then(
                function(success) {
                    item.quickEdit = false;
                    $scope.alert.show = false;
                },
                function(error){
                    var message = '';
                    for (var e in error.data) {
                        message += e + ': ' + error.data[e] + ' ';
                    }
                    $scope.alert = { type: 'danger', msg: message, show: true };
                });
        };
        // delete related item
        $scope.deleteRelatedItem = function (item) {
            DS.destroy(item.content_object.collection, item.content_object.id);
        };

        // *** delete mode functions ***
        $scope.isDeleteMode = false;
        // check all checkboxes
        $scope.checkAll = function () {
            angular.forEach($scope.items, function (item) {
                item.selected = $scope.selectedAll;
            });
        };
        // uncheck all checkboxes if isDeleteMode is closed
        $scope.uncheckAll = function () {
            if (!$scope.isDeleteMode) {
                $scope.selectedAll = false;
                angular.forEach($scope.items, function (item) {
                    item.selected = false;
                });
            }
        };
        // delete selected items
        $scope.deleteMultiple = function () {
            angular.forEach($scope.items, function (item) {
                if (item.selected) {
                    DS.destroy(item.content_object.collection, item.content_object.id);
                }
            });
            $scope.isDeleteMode = false;
            $scope.uncheckAll();
        };

        // project agenda
        $scope.projectAgenda = function (tree, id) {
            $http.post('/rest/core/projector/1/prune_elements/',
                    [{name: 'agenda/item-list', tree: tree, id: id}]);
        };
        // check if agenda is projected
        $scope.isAgendaProjected = function (tree) {
            // Returns true if there is a projector element with the name
            // 'agenda/item-list'.
            var projector = Projector.get(1);
            if (typeof projector === 'undefined') return false;
            var self = this;
            var predicate = function (element) {
                var value;
                if (typeof tree === 'undefined') {
                    // only main agenda items
                    value = element.name == 'agenda/item-list' &&
                        typeof element.id === 'undefined' &&
                        !element.tree;
                } else {
                    // tree with all agenda items
                    value = element.name == 'agenda/item-list' &&
                        typeof element.id === 'undefined' &&
                        element.tree;
                }
                return value;
            };
            return typeof _.findKey(projector.elements, predicate) === 'string';
        };
        // auto numbering of agenda items
        $scope.autoNumbering = function() {
            $http.post('/rest/agenda/item/numbering/', {});
        };
    }
])

.controller('ItemDetailCtrl', [
    '$scope',
    '$filter',
    '$http',
    '$state',
    'operator',
    'Agenda',
    'User',
    'item',
    function ($scope, $filter, $http, $state, operator, Agenda, User, item) {
        Agenda.bindOne(item.id, $scope, 'item');
        User.bindAll({}, $scope, 'users');
        $scope.speakerSelectBox = {};
        $scope.alert = {};
        $scope.speakers = $filter('orderBy')(item.speakers, 'weight');

        $scope.$watch(function () {
            return Agenda.lastModified();
        }, function () {
            $scope.speakers = $filter('orderBy')(item.speakers, 'weight');
        });

        // close/open list of speakers of current item
        $scope.closeList = function (listClosed) {
            item.speaker_list_closed = listClosed;
            Agenda.save(item);
        };

        // add user to list of speakers
        $scope.addSpeaker = function (userId) {
            $http.post('/rest/agenda/item/' + item.id + '/manage_speaker/', {'user': userId})
            .success(function (data){
                $scope.alert.show = false;
                $scope.speakers = item.speakers;
                $scope.speakerSelectBox = {};
            })
            .error(function (data){
                $scope.alert = {type: 'danger', msg: data.detail, show: true};
                $scope.speakerSelectBox = {};
            });
        };

        // delete speaker(!) from list of speakers
        $scope.removeSpeaker = function (speakerId) {
            $http.delete(
                '/rest/agenda/item/' + item.id + '/manage_speaker/',
                {headers: {'Content-Type': 'application/json'},
                 data: JSON.stringify({speaker: speakerId})}
            )
            .success(function(data){
                $scope.speakers = item.speakers;
            })
            .error(function(data){
                $scope.alert = { type: 'danger', msg: data.detail, show: true };
            });
            $scope.speakers = item.speakers;
        };

        //delete all speakers from list of speakers
        $scope.removeAllSpeakers = function () {
            var speakersOnList = [];
            angular.forEach(item.speakers, function (speaker) {
                speakersOnList.push(speaker.id);
            });
            $http.delete(
                '/rest/agenda/item/' + item.id + '/manage_speaker/',
                {headers: {'Content-Type': 'application/json'},
                 data: JSON.stringify({speaker: speakersOnList})}
            )
            .success(function(data){
                $scope.speakers = item.speakers;
            })
            .error(function(data){
                $scope.alert = { type: 'danger', msg: data.detail, show: true };
            });
            $scope.speakers = item.speakers;
        };

        // check if user is allowed to see 'add me' / 'remove me' button
        $scope.isAllowed = function (action) {
            var nextUsers = [];
            var nextSpeakers = $filter('filter')($scope.speakers, {'begin_time': null});
            angular.forEach(nextSpeakers, function (speaker) {
                nextUsers.push(speaker.user_id);
            });
            if (action == 'add') {
                return (operator.hasPerms('agenda.can_be_speaker') &&
                        !item.speaker_list_closed &&
                        $.inArray(operator.user.id, nextUsers) == -1);
            }
            if (action == 'remove') {
                return ($.inArray(operator.user.id, nextUsers) != -1);
            }
        };

        // begin speech of selected/next speaker
        $scope.beginSpeech = function (speakerId) {
            $http.put('/rest/agenda/item/' + item.id + '/speak/', {'speaker': speakerId})
            .success(function(data){
                $scope.alert.show = false;
            })
            .error(function(data){
                $scope.alert = { type: 'danger', msg: data.detail, show: true };
            });
        };

        // end speech of current speaker
        $scope.endSpeech = function () {
            $http.delete(
                '/rest/agenda/item/' + item.id + '/speak/',
                {headers: {'Content-Type': 'application/json'}, data: {}}
            )
            .error(function(data){
                $scope.alert = { type: 'danger', msg: data.detail, show: true };
            });
        };
        // gets speech duration of selected speaker in seconds
        $scope.getDuration = function (speaker) {
            var beginTimestamp = new Date(speaker.begin_time).getTime();
            var endTimestamp = new Date(speaker.end_time).getTime();
            // calculate duration in seconds
            return Math.floor((endTimestamp - beginTimestamp) / 1000);

        };
        // save reordered list of speakers
        $scope.treeOptions = {
            dropped: function (event) {
                var sortedSpeakers = [];
                var nextSpeakers = $filter('filter')($scope.speakers, {'begin_time': null});
                angular.forEach(nextSpeakers, function (speaker) {
                    sortedSpeakers.push(speaker.id);
                });
                $http.post('/rest/agenda/item/' + item.id + '/sort_speakers/',
                    {speakers: sortedSpeakers}
                );
            }
        };
    }
])

.controller('AgendaSortCtrl', [
    '$scope',
    '$http',
    'Agenda',
    'AgendaTree',
    function($scope, $http, Agenda, AgendaTree) {
        // Bind agenda tree to the scope
        $scope.$watch(function () {
            return Agenda.lastModified();
        }, function () {
            $scope.items = AgendaTree.getTree(Agenda.getAll());
        });

        // save parent and weight of moved agenda item (and all items on same level)
        $scope.treeOptions = {
            dropped: function(event) {
                var parentID = null;
                var droppedItemID = event.source.nodeScope.$modelValue.id;
                if (event.dest.nodesScope.item) {
                    parentID = event.dest.nodesScope.item.id;
                }
                angular.forEach(event.dest.nodesScope.$modelValue, function(item, index) {
                    $http.patch('/rest/agenda/item/' + item.id + '/', {parent_id: parentID, weight: index});
                });
            }
        };
    }
])

.controller('ListOfSpeakersViewCtrl', [
    '$scope',
    '$state',
    '$http',
    'Projector',
    'Assignment', // TODO: Remove this after refactoring of data loading on start.
    'Topic', // TODO: Remove this after refactoring of data loading on start.
    'Motion', // TODO: Remove this after refactoring of data loading on start.
    'Agenda',
    function($scope, $state, $http, Projector, Assignment, Topic, Motion, Agenda) {
        $scope.$watch(
            function() {
                return Projector.lastModified(1);
            },
            function() {
                Projector.find(1).then( function(projector) {
                    $scope.AgendaItem = null;
                    _.forEach(projector.elements, function(element) {
                        switch(element.name) {
                            case 'motions/motion':
                                Motion.find(element.id).then(function(motion) {
                                    Motion.loadRelations(motion, 'agenda_item').then(function() {
                                        $scope.AgendaItem = motion.agenda_item;
                                    });
                                });
                                break;
                            case 'topics/topic':
                                Topic.find(element.id).then(function(topic) {
                                    Topic.loadRelations(topic, 'agenda_item').then(function() {
                                        $scope.AgendaItem = topic.agenda_item;
                                    });
                                });
                                break;
                            case 'assignments/assignment':
                                Assignment.find(element.id).then(function(assignment) {
                                    Assignment.loadRelations(assignment, 'agenda_item').then(function() {
                                        $scope.AgendaItem = assignment.agenda_item;
                                    });
                                });
                                break;
                            case 'agenda/list-of-speakers':
                                Agenda.find(element.id).then(function(item) {
                                    $scope.AgendaItem = item;
                                });
                        }
                    });
                });
            }
        );
        // go to the list of speakers (management) of the currently
        // displayed projector slide
        $scope.goToListOfSpeakers = function() {
            $state.go('agenda.item.detail', {id: $scope.AgendaItem.id});
        };
    }
])

//mark all agenda config strings for translation with Javascript
.config([
    'gettext',
    function (gettext) {
        gettext('Numbering prefix for agenda items');
        gettext('This prefix will be set if you run the automatic agenda numbering.');
        gettext('Agenda');
        gettext('Invalid input.');
        gettext('Numeral system for agenda items');
        gettext('Arabic');
        gettext('Roman');
        gettext('Begin of event');
        gettext('Input format: DD.MM.YYYY HH:MM');
        gettext('Number of last speakers to be shown on the projector');
        gettext('List of speakers');
        gettext('Show orange countdown in the last x seconds of speaking time');
        gettext('Enter duration in seconds. Choose 0 to disable warning color.');
        gettext('Couple countdown with the list of speakers');
        gettext('[Begin speech] starts the countdown, [End speech] stops the ' +
                'countdown.');
    }
 ]);

}());
