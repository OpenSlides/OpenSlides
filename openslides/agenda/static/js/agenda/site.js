(function () {

'use strict';

angular.module('OpenSlidesApp.agenda.site', [
    'OpenSlidesApp.agenda',
    'OpenSlidesApp.core.pdf',
    'OpenSlidesApp.agenda.pdf'
])

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
    'ProjectionDefault',
    'AgendaContentProvider',
    'PdfMakeDocumentProvider',
    'gettextCatalog',
    function($scope, $filter, $http, $state, DS, operator, ngDialog, Agenda, TopicForm, AgendaTree, Projector,
        ProjectionDefault, AgendaContentProvider, PdfMakeDocumentProvider, gettextCatalog) {
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
        Projector.bindAll({}, $scope, 'projectors');
        $scope.mainListTree = true;
        $scope.$watch(function () {
            return Projector.lastModified();
        }, function () {
            var projectiondefault =  ProjectionDefault.filter({name: 'agenda_all_items'})[0];
            if (projectiondefault) {
                $scope.defaultProjectorId_all_items = projectiondefault.projector_id;
            }
            $scope.projectionDefaults = ProjectionDefault.getAll();
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
            var startTimestamp = $scope.config('agenda_start_event_date_time');
            if (startTimestamp) {
                var endTimestamp = startTimestamp + totalDuration * 60 * 1000;
                var endDate = new Date(endTimestamp);
                var mm = ("0" + endDate.getMinutes()).slice(-2);
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

        /** Project functions **/
        // get ProjectionDefault for item
        $scope.getProjectionDefault = function (item) {
            if (item.tree) {
                return $scope.defaultProjectorId_all_items;
            } else {
                var app_name = item.content_object.collection.split('/')[0];
                var id = 1;
                $scope.projectionDefaults.forEach(function (projectionDefault) {
                    if (projectionDefault.name == app_name) {
                        id = projectionDefault.projector_id;
                    }
                });
                return id;
            }
        };
        // project agenda
        $scope.projectAgenda = function (projectorId, tree, id) {
            var isAgendaProjectedId = $scope.isAgendaProjected($scope.mainListTree);
            if (isAgendaProjectedId > 0) {
                // Deactivate
                $http.post('/rest/core/projector/' + isAgendaProjectedId + '/clear_elements/');
            }
            if (isAgendaProjectedId != projectorId) {
                $http.post('/rest/core/projector/' + projectorId + '/prune_elements/',
                    [{name: 'agenda/item-list', tree: tree, id: id}]);
            }
        };
        // change whether all items or only main items should be projected
        $scope.changeMainListTree = function () {
            var isAgendaProjectedId = $scope.isAgendaProjected($scope.mainListTree);
            $scope.mainListTree = !$scope.mainListTree;
            if (isAgendaProjectedId > 0) {
                $scope.projectAgenda(isAgendaProjectedId, $scope.mainListTree);
            }
        };
        // change whether one item or all subitems should be projected
        $scope.changeItemTree = function (item) {
            var isProjected = item.isProjected(item.tree);
            if (isProjected > 0) {
                // Deactivate and reactivate
                item.project(isProjected, item.tree);
                item.project(isProjected, !item.tree);
            }
            item.tree = !item.tree;
        };
        // check if agenda is projected
        $scope.isAgendaProjected = function (tree) {
            // Returns true if there is a projector element with the name
            // 'agenda/item-list'.
            var predicate = function (element) {
                var value;
                if (tree) {
                    // tree with all agenda items
                    value = element.name == 'agenda/item-list' &&
                        typeof element.id === 'undefined' &&
                        element.tree;
                } else {
                    // only main agenda items
                    value = element.name == 'agenda/item-list' &&
                        typeof element.id === 'undefined' &&
                        !element.tree;
                }
                return value;
            };
            var projectorId = 0;
            $scope.projectors.forEach(function (projector) {
                if (typeof _.findKey(projector.elements, predicate) === 'string') {
                    projectorId = projector.id;
                }
            });
            return projectorId;
        };
        // auto numbering of agenda items
        $scope.autoNumbering = function() {
            $http.post('/rest/agenda/item/numbering/', {});
        };

        $scope.makePDF = function() {
            var filename = gettextCatalog.getString("Agenda")+".pdf";
            var agendaContentProvider = AgendaContentProvider.createInstance($scope.items);
            var documentProvider = PdfMakeDocumentProvider.createInstance(agendaContentProvider);
            pdfMake.createPdf(documentProvider.getDocument()).download(filename);
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
    'Projector',
    'ProjectionDefault',
    function ($scope, $filter, $http, $state, operator, Agenda, User, item, Projector, ProjectionDefault) {
        Agenda.bindOne(item.id, $scope, 'item');
        User.bindAll({}, $scope, 'users');
        $scope.$watch(function () {
            return Projector.lastModified();
        }, function () {
            var item_app_name = item.content_object.collection.split('/')[0];
            var projectiondefaultItem = ProjectionDefault.filter({name: item_app_name})[0];
            if (projectiondefaultItem) {
                $scope.defaultProjectorItemId = projectiondefaultItem.projector_id;
            }
            var projectiondefaultListOfSpeakers = ProjectionDefault.filter({name: 'agenda_list_of_speakers'})[0];
            if (projectiondefaultListOfSpeakers) {
                $scope.defaultProjectorListOfSpeakersId = projectiondefaultListOfSpeakers.projector_id;
            }
        });

        $scope.$watch(function () {
            return Agenda.lastModified();
        }, function () {
            // all speakers
            $scope.speakers = $filter('orderBy')(item.speakers, 'weight');
            // next speakers
            $scope.nextSpeakers = $filter('filter')($scope.speakers, {'begin_time': null});
            // current speaker
            $scope.currentSpeaker = $filter('filter')($scope.speakers, {'begin_time': '!!', 'end_time': null});
            // last speakers
            $scope.lastSpeakers = $filter('filter')($scope.speakers, {'end_time': '!!'});
        });
        $scope.speakerSelectBox = {};
        $scope.alert = {};

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

        // Return true if the requested user is allowed to do a specific action
        // and see the corresponding button (e.g. 'add me' or 'remove me').
        $scope.isAllowed = function (action) {
            var nextUsers = [];
            angular.forEach($scope.nextSpeakers, function (speaker) {
                nextUsers.push(speaker.user_id);
            });
            switch (action) {
                case 'add':
                    return (operator.hasPerms('agenda.can_be_speaker') &&
                            !item.speaker_list_closed &&
                            $.inArray(operator.user.id, nextUsers) == -1);
                case 'remove':
                    return ($.inArray(operator.user.id, nextUsers) != -1);
                case 'removeAll':
                    return (operator.hasPerms('agenda.can_manage') &&
                            $scope.speakers.length > 0);
                case 'beginNextSpeech':
                    return (operator.hasPerms('agenda.can_manage') &&
                            $scope.nextSpeakers.length > 0);
                case 'endCurrentSpeech':
                    return (operator.hasPerms('agenda.can_manage') &&
                            $scope.currentSpeaker.length > 0);
                case 'showLastSpeakers':
                    return $scope.lastSpeakers.length > 0;
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
    'ProjectionDefault',
    'Config',
    'CurrentListOfSpeakersItem',
    function($scope, $state, $http, Projector, ProjectionDefault, Config, CurrentListOfSpeakersItem) {
        // Watch for changes in the current list of speakers reference
        $scope.$watch(function () {
            return Config.lastModified('projector_currentListOfSpeakers_reference');
        }, function () {
            $scope.currentListOfSpeakersReference = $scope.config('projector_currentListOfSpeakers_reference');
            $scope.updateCurrentListOfSpeakers();
        });
        $scope.$watch(function() {
            return Projector.lastModified();
        }, function() {
            $scope.projectors = Projector.getAll();
            $scope.updateCurrentListOfSpeakers();
            var projectiondefault = ProjectionDefault.filter({name: 'agenda_current_list_of_speakers'})[0];
            if (projectiondefault) {
                $scope.defaultProjectorId = projectiondefault.projector_id;
            }
        });
        $scope.updateCurrentListOfSpeakers = function () {
            var itemPromise = CurrentListOfSpeakersItem.getItem($scope.currentListOfSpeakersReference);
            if (itemPromise) {
                itemPromise.then(function(item) {
                    $scope.AgendaItem = item;
                });
            }
        };
        // Project current list of speakers
        // same logic as in core/base.js
        $scope.projectCurrentLoS = function (projectorId) {
            var isCurrentLoSProjectedId = $scope.isCurrentLoSProjected($scope.mainListTree);
            if (isCurrentLoSProjectedId > 0) {
                // Deactivate
                $http.post('/rest/core/projector/' + isCurrentLoSProjectedId + '/clear_elements/');
            }
            if (isCurrentLoSProjectedId != projectorId) {
                $http.post('/rest/core/projector/' + projectorId + '/prune_elements/',
                    [{name: 'agenda/current-list-of-speakers'}]);
            }
        };
        // same logic as in core/base.js
        $scope.isCurrentLoSProjected = function () {
            // Returns the projector id if there is a projector element with the name
            // 'agenda/current-list-of-speakers'. Elsewise returns 0.
            var projectorId = 0;
            $scope.projectors.forEach(function (projector) {
                var key = _.findKey(projector.elements, function (element) {
                    return element.name == 'agenda/current-list-of-speakers';
                });
                if (typeof key === 'string') {
                    projectorId = projector.id;
                }
            });
            return projectorId;
        };

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
