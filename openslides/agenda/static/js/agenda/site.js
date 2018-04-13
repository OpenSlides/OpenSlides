(function () {

'use strict';

angular.module('OpenSlidesApp.agenda.site', [
    'OpenSlidesApp.agenda',
    'OpenSlidesApp.core.pdf',
    'OpenSlidesApp.agenda.pdf',
    'OpenSlidesApp.agenda.csv',
    'OpenSlidesApp.agenda.docx',
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
    'SearchProvider',
    'gettext',
    function (SearchProvider, gettext) {
        SearchProvider.register({
            'verboseName': gettext('Agenda'),
            'collectionName': 'agenda/item',
            'urlDetailState': 'agenda.item.detail',
            'weight': 200,
        });
    }
])

.config([
    '$stateProvider',
    'gettext',
    function ($stateProvider, gettext) {
        $stateProvider
            .state('agenda', {
                url: '/agenda',
                abstract: true,
                template: "<ui-view/>",
                data: {
                    title: gettext('Agenda'),
                    basePerm: 'agenda.can_see',
                },
            })
            .state('agenda.item', {
                abstract: true,
                template: "<ui-view/>",
            })
            .state('agenda.item.list', {})
            .state('agenda.item.detail', {
                resolve: {
                    itemId: ['$stateParams', function($stateParams) {
                        return $stateParams.id;
                    }],
                }
            })
            .state('agenda.item.sort', {
                url: '/sort',
                controller: 'AgendaSortCtrl',
            })
            .state('agenda.current-list-of-speakers', {
                url: '/speakers',
                controller: 'CurrentListOfSpeakersViewCtrl',
                data: {
                    title: gettext('Current list of speakers'),
                },
            });
    }
])

// Set the sensitivity of moving nodes horizontal for the ui-tree.
.config([
    'treeConfig',
    function (treeConfig) {
        treeConfig.dragMoveSensitivity = 20;
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
    'gettextCatalog',
    'gettext',
    'osTableFilter',
    'osTablePagination',
    'AgendaCsvExport',
    'AgendaPdfExport',
    'AgendaDocxExport',
    'ErrorMessage',
    function($scope, $filter, $http, $state, DS, operator, ngDialog, Agenda, TopicForm,
        AgendaTree, Projector, ProjectionDefault, gettextCatalog, gettext, osTableFilter,
        osTablePagination, AgendaCsvExport, AgendaPdfExport, AgendaDocxExport, ErrorMessage) {
        // Bind agenda tree to the scope
        $scope.$watch(function () {
            return Agenda.lastModified();
        }, function () {
            // Filter out items that doesn't have the list_item_title. This happens, if the
            // item is a hidden item but provides the list of speakers, but should not be
            // visible in the list view.
            var allowedItems = _.filter(Agenda.getAll(), function (item) {
                return item.list_view_title;
            });
            $scope.items = AgendaTree.getFlatTree(allowedItems);
            $scope.agendaHasSubitems = $filter('filter')($scope.items, {'parent_id': ''}).length;
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


        // Filtering
        $scope.filter = osTableFilter.createInstance('AgendaTableFilter');

        if (!$scope.filter.existsStorageEntry()) {
            $scope.filter.booleanFilters = {
                closed: {
                    value: undefined,
                    displayName: gettext('Closed items'),
                    choiceYes: gettext('Closed items'),
                    choiceNo: gettext('Open items'),
                },
                is_hidden: {
                    value: undefined,
                    displayName: gettext('Internal items'),
                    choiceYes: gettext('Internal items'),
                    choiceNo: gettext('No internal items'),
                    permission: 'agenda.can_see_hidden_items',
                },
            };
        }
        $scope.filter.propertyList = ['item_number', 'title', 'title_list_view', 'comment', 'duration'];
        $scope.filter.propertyFunctionList = [
            function (item) {return item.getListViewTitle();},
        ];
        $scope.filter.propertyDict = {
            'speakers' : function (speaker) {
                return '';
            },
        };

        // Expand all items during searching.
        $scope.filter.changed = function () {
            $scope.collapseState = true;
            $scope.toggleCollapseState();
        };

        // pagination
        $scope.pagination = osTablePagination.createInstance('AgendaTablePagination', 50);

        // parse duration for inline editing
        $scope.generateDurationText = function (item) {
            //convert data from model format (m) to view format (hh:mm)
            if (item.duration) {
                var time = "",
                    totalminutes = item.duration;
                if (totalminutes < 0) {
                    time = "-";
                    totalminutes = -totalminutes;
                }
                var hh = Math.floor(totalminutes / 60);
                var mm = Math.floor(totalminutes % 60);
                // Add leading "0" for double digit values
                mm = ("0"+mm).slice(-2);
                time += hh + ":" + mm;
                item.durationText = time;
            } else {
                item.durationText = "";
            }
        };
        $scope.setDurationText = function (item) {
            //convert data from view format (hh:mm) to model format (m)
            var time = item.durationText.replace('h', '').split(':');
            var data;
            if (time.length > 1 && !isNaN(time[0]) && !isNaN(time[1])) {
                data = (+time[0]) * 60 + (+time[1]);
                if (data < 0) {
                    data = "-"+data;
                }
                item.duration = parseInt(data);
            } else if (time.length == 1 && !isNaN(time[0])) {
                data = (+time[0]);
                item.duration = parseInt(data);
            } else {
                item.duration = 0;
            }
            $scope.save(item);
        };

        /** Duration calculations **/
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

        // Agenda collapse function
        $scope.toggleCollapseState = function () {
            $scope.collapseState = !$scope.collapseState;
            _.forEach($scope.items, function (item) {
                item.hideChildren = $scope.collapseState;
            });
        };

        // Check, if an item has childs in all filtered items
        $scope.hasChildren = function (item) {
            return _.some($scope.itemsFiltered, function (_item) {
                return _item.parent_id == item.id;
            });
        };

        // returns true, if the agenda has at least two layers
        $scope.agendaHasMultipleLayers = function () {
            return _.some($scope.items, function (item) {
                return item.parent_id;
            });
        };

        /** Agenda item functions **/
        // open dialog for new topics // TODO Remove this. Don't forget import button in template.
        $scope.newDialog = function () {
            ngDialog.open(TopicForm.getDialog());
        };
        // save changed item
        $scope.save = function (item) {
            Agenda.save(item).then(
                function (success) {
                    $scope.alert.show = false;
                },
                function (error) {
                    $scope.alert = ErrorMessage.forAlert(error);
                });
        };
        // delete related item
        $scope.deleteRelatedItem = function (item) {
            DS.destroy(item.content_object.collection, item.content_object.id);
        };
        // auto numbering of agenda items
        $scope.autoNumbering = function() {
            $http.post('/rest/agenda/item/numbering/', {});
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
                case 'motions/motion-block':
                    return operator.hasPerms('motions.can_see');
                case 'assignments/assignment':
                    return operator.hasPerms('assignments.can_see');
                default:
                    return false;
            }
        };
        $scope.edit = function (item) {
            ngDialog.open(item.getContentObjectForm().getDialog({id: item.content_object.id}));
        };

        // export
        $scope.pdfExport = function () {
            AgendaPdfExport.export($scope.itemsFiltered);
        };
        $scope.csvExport = function () {
            AgendaCsvExport.export($scope.itemsFiltered);
        };
        $scope.docxExport = function () {
            AgendaDocxExport.export($scope.itemsFiltered);
        };

        /** select mode functions **/
        $scope.isSelectMode = false;
        // check all checkboxes
        $scope.checkAll = function () {
            $scope.selectedAll = !$scope.selectedAll;
            angular.forEach($scope.items, function (item) {
                item.selected = $scope.selectedAll;
            });
        };
        // uncheck all checkboxes if isDeleteMode is closed
        $scope.uncheckAll = function () {
            if (!$scope.isSelectMode) {
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
            $scope.isSelectMode = false;
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
            var isAgendaProjectedIds = $scope.isAgendaProjected($scope.mainListTree);
            _.forEach(isAgendaProjectedIds, function (id) {
                $http.post('/rest/core/projector/' + id + '/clear_elements/');
            });
            if (_.indexOf(isAgendaProjectedIds, projectorId) == -1) {
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
            // Returns the ids of all projectors with an element with
            // the name 'agenda/item-list'. Else returns an empty list.
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
            var projectorIds = [];
            $scope.projectors.forEach(function (projector) {
                if (typeof _.findKey(projector.elements, predicate) === 'string') {
                    projectorIds.push(projector.id);
                }
            });
            return projectorIds;
        };
    }
])

// filter to hide collapsed items. Items has to be a flat tree.
.filter('collapsedItemFilter', [
    function () {
        return function (items) {
            return _.filter(items, function (item) {
                var index = _.findIndex(items, item);
                var parentId = item.parent_id;
                // Search for parents, if one has the hideChildren attribute set. All parents
                // have a higher index as this item, because items is a flat tree.
                // If a parent has this attribute, we should remove this item. Else if we hit
                // the top or an item on the first layer, the item is not collapsed.
                for (--index; index >= 0 && parentId !== null; index--) {
                    var p = items[index];
                    if (p.id === parentId) {
                        if (p.hideChildren) {
                            return false;
                        } else {
                            parentId = p.parent_id;
                        }
                    }
                }
                return true;
            });
        };
    }
])

.controller('ItemDetailCtrl', [
    '$scope',
    '$filter',
    'Agenda',
    'itemId',
    'Projector',
    'ProjectionDefault',
    'gettextCatalog',
    'WebpageTitle',
    'ErrorMessage',
    function ($scope, $filter, Agenda, itemId, Projector, ProjectionDefault, gettextCatalog, WebpageTitle,
        ErrorMessage) {
        $scope.alert = {};

        $scope.$watch(function () {
            return Agenda.lastModified(itemId);
        }, function () {
            $scope.item = Agenda.get(itemId);
            WebpageTitle.updateTitle(gettextCatalog.getString('List of speakers') + ' ' +
                gettextCatalog.getString('of') + ' ' + $scope.item.getTitle());
            // all speakers
            $scope.speakers = $filter('orderBy')($scope.item.speakers, 'weight');
            // next speakers
            $scope.nextSpeakers = $filter('filter')($scope.speakers, {'begin_time': null});
            // current speaker
            $scope.currentSpeaker = $filter('filter')($scope.speakers, {'begin_time': '!!', 'end_time': null});
            // last speakers
            $scope.lastSpeakers = $filter('filter')($scope.speakers, {'end_time': '!!'});
            $scope.lastSpeakers = $filter('orderBy')($scope.lastSpeakers, 'begin_time');
        });
        $scope.$watch(function () {
            return Projector.lastModified();
        }, function () {
            var item_app_name = $scope.item.content_object.collection.split('/')[0];
            var projectiondefaultItem = ProjectionDefault.filter({name: item_app_name})[0];
            if (projectiondefaultItem) {
                $scope.defaultProjectorItemId = projectiondefaultItem.projector_id;
            }
            var projectiondefaultListOfSpeakers = ProjectionDefault.filter({name: 'agenda_list_of_speakers'})[0];
            if (projectiondefaultListOfSpeakers) {
                $scope.defaultProjectorListOfSpeakersId = projectiondefaultListOfSpeakers.projector_id;
            }
        });
    }
])

/* This is the controller for the list of speakers partial management template.
 * The parent controller needs to provide a $scope.item, $scope.speakers, $scope.nextSpeakers,
 * $scope.currentSpeakers, $scope.lastSpeakers. See (as example) ItemDetailCtrl. */
.controller('ListOfSpeakersManagementCtrl', [
    '$scope',
    '$http',
    '$filter',
    'Agenda',
    'User',
    'operator',
    'ErrorMessage',
    function ($scope, $http, $filter, Agenda, User, operator, ErrorMessage) {
        User.bindAll({}, $scope, 'users');
        $scope.speakerSelectBox = {};

        // close/open list of speakers of current item
        $scope.closeList = function (listClosed) {
            $scope.item.speaker_list_closed = listClosed;
            Agenda.save($scope.item);
        };

        // add user to list of speakers
        $scope.addSpeaker = function (userId) {
            $http.post('/rest/agenda/item/' + $scope.item.id + '/manage_speaker/', {'user': userId}).then(
                function (success) {
                    $scope.alert.show = false;
                    $scope.speakerSelectBox = {};
                }, function (error) {
                    $scope.alert = ErrorMessage.forAlert(error);
                    $scope.speakerSelectBox = {};
                }
            );
        };

        // delete speaker(!) from list of speakers
        $scope.removeSpeaker = function (speakerId) {
            $http.delete(
                '/rest/agenda/item/' + $scope.item.id + '/manage_speaker/',
                {headers: {'Content-Type': 'application/json'},
                 data: JSON.stringify({speaker: speakerId})}
            )
            .then(function (success) {
            }, function (error) {
                $scope.alert = ErrorMessage.forAlert(error);
            });
        };

        //delete all speakers from list of speakers
        $scope.removeAllSpeakers = function () {
            var speakersOnList = [];
            angular.forEach($scope.item.speakers, function (speaker) {
                speakersOnList.push(speaker.id);
            });
            $http.delete(
                '/rest/agenda/item/' + $scope.item.id + '/manage_speaker/',
                {headers: {'Content-Type': 'application/json'},
                 data: JSON.stringify({speaker: speakersOnList})}
            )
            .then(function (success) {
            }, function (error) {
                $scope.alert = ErrorMessage.forAlert(error);
            });
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
                            !$scope.item.speaker_list_closed &&
                            $.inArray(operator.user.id, nextUsers) == -1);
                case 'remove':
                    if (operator.user) {
                        return ($.inArray(operator.user.id, nextUsers) != -1);
                    }
                    return false;
                case 'removeAll':
                    return (operator.hasPerms('agenda.can_manage_list_of_speakers') &&
                            $scope.speakers.length > 0);
                case 'showLastSpeakers':
                    return $scope.lastSpeakers.length > 0;
            }
        };

        // begin speech of selected/next speaker
        $scope.beginSpeech = function (speakerId) {
            $http.put('/rest/agenda/item/' + $scope.item.id + '/speak/', {'speaker': speakerId})
            .then(function (success) {
                $scope.alert.show = false;
            }, function (error) {
                $scope.alert = ErrorMessage.forAlert(error);
            });
        };

        // end speech of current speaker
        $scope.endSpeech = function () {
            $http.delete(
                '/rest/agenda/item/' + $scope.item.id + '/speak/',
                {headers: {'Content-Type': 'application/json'}, data: {}}
            ).then(
                function (success) {},
                function (error) {
                    $scope.alert = ErrorMessage.forAlert(error);
                }
            );
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
                var sortedSpeakers = _.map($scope.nextSpeakers, function (speaker) {
                    return speaker.id;
                });
                $http.post('/rest/agenda/item/' + $scope.item.id + '/sort_speakers/',
                    {speakers: sortedSpeakers}
                );
            }
        };

        // Marking a speaker
        $scope.toggleMarked = function (speaker) {
            $http.patch('/rest/agenda/item/' + $scope.item.id + '/manage_speaker/', {
                user: speaker.user.id,
                marked: !speaker.marked,
            }).then(function (success) {
                $scope.alert.show = false;
            }, function (error) {
                $scope.alert = ErrorMessage.forAlert(error);
            });
        };
    }
])

.controller('AgendaSortCtrl', [
    '$scope',
    '$http',
    'Agenda',
    'AgendaTree',
    'ErrorMessage',
    function($scope, $http, Agenda, AgendaTree, ErrorMessage) {
        // Bind agenda tree to the scope
        $scope.$watch(function () {
            return Agenda.lastModified();
        }, function () {
            $scope.items = AgendaTree.getTree(Agenda.getAll());
        });
        $scope.showInternalItems = true;
        $scope.alert = {};

        // save parent and weight of moved agenda item (and all items on same level)
        $scope.treeOptions = {
            dropped: function(event) {
                var parentID = null;
                var droppedItemID = event.source.nodeScope.$modelValue.id;
                if (event.dest.nodesScope.item) {
                    parentID = event.dest.nodesScope.item.id;
                }
                $http.post('/rest/agenda/item/sort/', {
                    nodes: event.dest.nodesScope.$modelValue,
                    parent_id: parentID}
                ).then(
                    function(success) {},
                    function(error){
                        $scope.alert = ErrorMessage.forAlert(error);
                    }
                );
            }
        };
    }
])

.controller('CurrentListOfSpeakersViewCtrl', [
    '$scope',
    '$http',
    '$filter',
    'Projector',
    'ProjectionDefault',
    'Agenda',
    'Config',
    'CurrentListOfSpeakersItem',
    'CurrentListOfSpeakersSlide',
    'gettextCatalog',
    'WebpageTitle',
    function($scope, $http, $filter, Projector, ProjectionDefault, Agenda, Config,
        CurrentListOfSpeakersItem, CurrentListOfSpeakersSlide, gettextCatalog, WebpageTitle) {
        $scope.alert = {};
        $scope.currentListOfSpeakers = CurrentListOfSpeakersSlide;

        // Watch for changes in the current list of speakers reference
        $scope.$watch(function () {
            return Config.lastModified('projector_currentListOfSpeakers_reference');
        }, function () {
            $scope.currentListOfSpeakersReference = $scope.config('projector_currentListOfSpeakers_reference');
            $scope.updateCurrentListOfSpeakersItem();
        });
        $scope.$watch(function () {
            return Projector.lastModified();
        }, function() {
            $scope.projectors = Projector.getAll();
            // If there is just one projector we provide just the overlay.
            if ($scope.projectors.length === 1) {
                $scope.currentListOfSpeakersAsOverlay = true;
            }
            $scope.updateCurrentListOfSpeakersItem();

            $scope.listOfSpeakersDefaultProjectorId = ProjectionDefault.filter({name: 'agenda_current_list_of_speakers'})[0].projector_id;
        });

        $scope.$watch(function () {
            return $scope.item ? Agenda.lastModified($scope.item.id) : void 0;
        }, function () {
            $scope.updateCurrentListOfSpeakersItem();
        });

        $scope.updateCurrentListOfSpeakersItem = function () {
            $scope.item = CurrentListOfSpeakersItem.getItem($scope.currentListOfSpeakersReference);
            if ($scope.item) {
                // all speakers
                $scope.speakers = $filter('orderBy')($scope.item.speakers, 'weight');
                // next speakers
                $scope.nextSpeakers = $filter('filter')($scope.speakers, {'begin_time': null});
                // current speaker
                $scope.currentSpeaker = $filter('filter')($scope.speakers, {'begin_time': '!!', 'end_time': null});
                // last speakers
                $scope.lastSpeakers = $filter('filter')($scope.speakers, {'end_time': '!!'});
                $scope.lastSpeakers = $filter('orderBy')($scope.lastSpeakers, 'begin_time');
            } else {
                $scope.speakers = void 0;
                $scope.nextSpeakers = void 0;
                $scope.currentSpeaker = void 0;
                $scope.lastSpeakers = void 0;
            }
            if ($scope.item) {
                WebpageTitle.updateTitle(gettextCatalog.getString('Current list of speakers') + ' ' +
                    gettextCatalog.getString('of') + ' ' + $scope.item.getTitle());
            } else {
                WebpageTitle.updateTitle(gettextCatalog.getString('Current list of speakers'));
            }
        };

        // Set the current overlay status
        if ($scope.currentListOfSpeakers.isProjected().length) {
            var isProjected = $scope.currentListOfSpeakers.isProjectedWithOverlayStatus();
            $scope.currentListOfSpeakersAsOverlay = isProjected[0].overlay;
        } else {
            $scope.currentListOfSpeakersAsOverlay = false;
        }
        $scope.setOverlay = function (overlay) {
            $scope.currentListOfSpeakersAsOverlay = overlay;
            var isProjected = $scope.currentListOfSpeakers.isProjectedWithOverlayStatus();
            if (isProjected.length) {
                _.forEach(isProjected, function (mapping) {
                    if (mapping.overlay != overlay) { // change the overlay if it is different
                        $scope.currentListOfSpeakers.project(mapping.projectorId, overlay);
                    }
                });
            }
        };
    }
])

//mark all agenda config strings for translation with Javascript
.config([
    'gettext',
    function (gettext) {
        gettext('Enable numbering for agenda items');
        gettext('Numbering prefix for agenda items');
        gettext('This prefix will be set if you run the automatic agenda numbering.');
        gettext('Agenda');
        gettext('Invalid input.');
        gettext('Numeral system for agenda items');
        gettext('Arabic');
        gettext('Roman');
        gettext('Begin of event');
        gettext('Input format: DD.MM.YYYY HH:MM');
        gettext('Hide internal items when projecting subitems');
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
