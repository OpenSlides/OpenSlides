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
            .state('agenda.item.import', {
                url: '/import',
                controller: 'AgendaImportCtrl',
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
    'CustomslideForm',
    'AgendaTree',
    'Projector',
    function($scope, $filter, $http, $state, DS, operator, ngDialog, Agenda, CustomslideForm, AgendaTree, Projector) {
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

        // pagination
        $scope.currentPage = 1;
        $scope.itemsPerPage = 100;
        $scope.limitBegin = 0;
        $scope.pageChanged = function() {
            $scope.limitBegin = ($scope.currentPage - 1) * $scope.itemsPerPage;
        };

        // check open permission
        $scope.isAllowedToSeeOpenLink = function (item) {
            var collection = item.content_object.collection;
            switch (collection) {
                case 'core/customslide':
                    return operator.hasPerms('core.can_manage_projector');
                case 'motions/motion':
                    return operator.hasPerms('motions.can_see');
                case 'assignments/assignment':
                    return operator.hasPerms('assignments.can_see');
                default:
                    return false;
            }
        };
        // open new dialog
        $scope.newDialog = function () {
            ngDialog.open(CustomslideForm.getDialog());
        };
        // open edit dialog
        $scope.editDialog = function (item) {
            $state.go(item.content_object.collection.replace('/','.')+'.detail.update',
                {id: item.content_object.id});
        };
        // detail view of related item (content object)
        $scope.open = function (item) {
            $state.go(item.content_object.collection.replace('/','.')+'.detail',
                {id: item.content_object.id});
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
        // delete selected items only if items are customslides
        $scope.delete = function () {
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

        // go to detail view of related item (content object)
        $scope.open = function (item) {
            $state.go(item.content_object.collection.replace('/','.')+'.detail',
                {id: item.content_object.id});
        };

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

.controller('AgendaImportCtrl', [
    '$scope',
    'gettext',
    'Agenda',
    'Customslide',
    function($scope, gettext, Agenda, Customslide) {
        // import from textarea
        $scope.importByLine = function () {
            if ($scope.itemlist) {
                $scope.titleItems = $scope.itemlist[0].split("\n");
                $scope.importcounter = 0;
                $scope.titleItems.forEach(function(title, index) {
                    var item = {title: title};
                    // TODO: create all items in bulk mode
                    Customslide.create(item).then(
                        function(success) {
                            // find related agenda item
                            Agenda.find(success.agenda_item_id).then(function(item) {
                                // import all items as type AGENDA_ITEM = 1
                                item.type = 1;
                                item.weight = 1000 + index;
                                Agenda.save(item);
                            });
                            $scope.importcounter++;
                        }
                    );
                });
            }
        };

        // *** CSV import ***
        // set initial data for csv import
        $scope.items = [];
        $scope.separator = ',';
        $scope.encoding = 'UTF-8';
        $scope.encodingOptions = ['UTF-8', 'ISO-8859-1'];
        $scope.accept = '.csv, .txt';
        $scope.csv = {
            content: null,
            header: true,
            headerVisible: false,
            separator: $scope.separator,
            separatorVisible: false,
            encoding: $scope.encoding,
            encodingVisible: false,
            accept: $scope.accept,
            result: null
        };
        // set csv file encoding
        $scope.setEncoding = function () {
            $scope.csv.encoding = $scope.encoding;
        };
        // set csv file encoding
        $scope.setSeparator = function () {
            $scope.csv.separator = $scope.separator;
        };
        // detect if csv file is loaded
        $scope.$watch('csv.result', function () {
            $scope.items = [];
            var quotionRe = /^"(.*)"$/;
            angular.forEach($scope.csv.result, function (item, index) {
                // title
                if (item.title) {
                    item.title = item.title.replace(quotionRe, '$1');
                }
                if (!item.title) {
                    item.importerror = true;
                    item.title_error = gettext('Error: Title is required.');
                }
                // text
                if (item.text) {
                    item.text = item.text.replace(quotionRe, '$1');
                }
                // duration
                if (item.duration) {
                    item.duration = item.duration.replace(quotionRe, '$1');
                }
                // comment
                if (item.comment) {
                    item.comment = item.comment.replace(quotionRe, '$1');
                }
                // is_hidden
                if (item.is_hidden) {
                    item.is_hidden = item.is_hidden.replace(quotionRe, '$1');
                    if (item.is_hidden == '1') {
                        item.type = 2;
                    } else {
                        item.type = 1;
                    }
                } else {
                    item.type = 1;
                }
                // set weight for right csv row order
                // (Use 1000+ to protect existing items and prevent collision
                // with new items which use weight 10000 as default.)
                item.weight = 1000 + index;
                $scope.items.push(item);
            });
        });

        // import from csv file
        $scope.import = function () {
            $scope.csvImporting = true;
            angular.forEach($scope.items, function (item) {
                if (!item.importerror) {
                    Customslide.create(item).then(
                        function(success) {
                            item.imported = true;
                            // find related agenda item
                            Agenda.find(success.agenda_item_id).then(function(agendaItem) {
                                agendaItem.duration = item.duration;
                                agendaItem.comment = item.comment;
                                agendaItem.type = item.type;
                                agendaItem.weight = item.weight;
                                Agenda.save(agendaItem);
                            });
                        }
                    );
                }
            });
            $scope.csvimported = true;
        };
        $scope.clear = function () {
            $scope.csv.result = null;
        };
        // download CSV example file
        $scope.downloadCSVExample = function () {
            var element = document.getElementById('downloadLink');
            var csvRows = [
                // column header line
                ['title', 'text', 'duration', 'comment', 'is_hidden'],
                // example entries
                ['Demo 1', 'Demo text 1', '1:00', 'test comment', ''],
                ['Break', '', '0:10', '', '1'],
                ['Demo 2', 'Demo text 2', '1:30', '', '']

            ];
            var csvString = csvRows.join("%0A");
            element.href = 'data:text/csv;charset=utf-8,' + csvString;
            element.download = 'agenda-example.csv';
            element.target = '_blank';
        };
     }
])

.controller('ListOfSpeakersViewCtrl', [
    '$scope',
    '$state',
    '$http',
    'Projector',
    'Assignment',
    'Customslide',
    'Motion',
    'Agenda',
    function($scope, $state, $http, Projector, Assignment, Customslide, Motion, Agenda) {
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
                            case 'core/customslide':
                                Customslide.find(element.id).then(function(customslide) {
                                    Customslide.loadRelations(customslide, 'agenda_item').then(function() {
                                        $scope.AgendaItem = customslide.agenda_item;
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
