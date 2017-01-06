(function () {

'use strict';

angular.module('OpenSlidesApp.topics.site', ['OpenSlidesApp.topics', 'OpenSlidesApp.topics.csv'])

.config([
    '$stateProvider',
    'gettext',
    function($stateProvider, gettext) {
        $stateProvider
            .state('topics', {
                url: '/topics',
                abstract: true,
                template: "<ui-view/>",
                data: {
                    title: gettext('Topics'),
                },
            })

            .state('topics.topic', {
                url: '/topic',
                abstract: true,
                template: "<ui-view/>",
            })
            .state('topics.topic.detail', {
                resolve: {
                    topic: function(Topic, $stateParams) {
                        return Topic.find($stateParams.id);
                    },
                    items: function(Agenda) {
                        return Agenda.findAll();
                    }
                }
            })
            // redirects to topic detail and opens topic edit form dialog, uses edit url,
            // used by ui-sref links from agenda only
            // (from topic controller use TopicForm factory instead to open dialog in front
            // of current view without redirect)
            .state('topics.topic.detail.update', {
                onEnter: ['$stateParams', '$state', 'ngDialog', 'Topic',
                    function($stateParams, $state, ngDialog, Topic) {
                        ngDialog.open({
                            template: 'static/templates/topics/topic-form.html',
                            controller: 'TopicUpdateCtrl',
                            className: 'ngdialog-theme-default wide-form',
                            closeByEscape: false,
                            closeByDocument: false,
                            resolve: {
                                topic: function() {
                                    return Topic.find($stateParams.id);
                                },
                                items: function(Agenda) {
                                    return Agenda.findAll().catch(
                                        function() {
                                            return null;
                                        }
                                    );
                                }
                            },
                            preCloseCallback: function() {
                                $state.go('topics.topic.detail', {topic: $stateParams.id});
                                return true;
                            }
                        });
                    }],
            })
            .state('topics.topic.import', {
                url: '/import',
                controller: 'TopicImportCtrl',
            });
    }
])

.factory('TopicForm', [
    'gettextCatalog',
    'Editor',
    'Mediafile',
    'Agenda',
    'AgendaTree',
    function (gettextCatalog, Editor, Mediafile, Agenda, AgendaTree) {
        return {
            // ngDialog for topic form
            getDialog: function (topic) {
                var resolve = {};
                if (topic) {
                    resolve = {
                        topic: function (Topic) {return Topic.find(topic.id);}
                    };
                }
                resolve.mediafiles = function (Mediafile) {
                    return Mediafile.findAll();
                };
                return {
                    template: 'static/templates/topics/topic-form.html',
                    controller: (topic) ? 'TopicUpdateCtrl' : 'TopicCreateCtrl',
                    className: 'ngdialog-theme-default wide-form',
                    closeByEscape: false,
                    closeByDocument: false,
                    resolve: (resolve) ? resolve : null
                };
            },
            getFormFields: function (isCreateForm) {
                var images = Mediafile.getAllImages();
                var formFields = [
                {
                    key: 'title',
                    type: 'input',
                    templateOptions: {
                        label: gettextCatalog.getString('Title'),
                        required: true
                    }
                },
                {
                    key: 'text',
                    type: 'editor',
                    templateOptions: {
                        label: gettextCatalog.getString('Text')
                    },
                    data: {
                        ckeditorOptions: Editor.getOptions(images)
                    }
                }];
                // attachments
                if (Mediafile.getAll().length > 0) {
                    formFields.push({
                        key: 'attachments_id',
                        type: 'select-multiple',
                        templateOptions: {
                            label: gettextCatalog.getString('Attachment'),
                            options: Mediafile.getAll(),
                            ngOptions: 'option.id as option.title_or_filename for option in to.options',
                            placeholder: gettextCatalog.getString('Select or search an attachment ...')
                        }
                    });
                }
                // show as agenda item
                formFields.push({
                    key: 'showAsAgendaItem',
                    type: 'checkbox',
                    templateOptions: {
                        label: gettextCatalog.getString('Show as agenda item'),
                        description: gettextCatalog.getString('If deactivated it appears as internal item on agenda.')
                    }
                });

                // parent item
                if (isCreateForm) {
                    formFields.push({
                        key: 'agenda_parent_item_id',
                        type: 'select-single',
                        templateOptions: {
                            label: gettextCatalog.getString('Parent item'),
                            options: AgendaTree.getFlatTree(Agenda.getAll()),
                            ngOptions: 'item.id as item.getListViewTitle() for item in to.options | notself : model.agenda_item_id',
                            placeholder: gettextCatalog.getString('Select a parent item ...')
                        }
                    });
                }

                return formFields;
            }
        };
    }
])

.controller('TopicDetailCtrl', [
    '$scope',
    'ngDialog',
    'TopicForm',
    'Topic',
    'topic',
    'Projector',
    'ProjectionDefault',
    function($scope, ngDialog, TopicForm, Topic, topic, Projector, ProjectionDefault) {
        Topic.bindOne(topic.id, $scope, 'topic');
        $scope.$watch(function () {
            return Projector.lastModified();
        }, function () {
            var projectiondefault = ProjectionDefault.filter({name: 'topics'})[0];
            if (projectiondefault) {
                $scope.defaultProjectorId = projectiondefault.projector_id;
            }
        });
        Topic.loadRelations(topic, 'agenda_item');
        $scope.openDialog = function (topic) {
            ngDialog.open(TopicForm.getDialog(topic));
        };
    }
])

.controller('TopicCreateCtrl', [
    '$scope',
    '$state',
    'Topic',
    'TopicForm',
    'Agenda',
    'AgendaUpdate',
    function($scope, $state, Topic, TopicForm, Agenda, AgendaUpdate) {
        $scope.topic = {};
        $scope.model = {};
        $scope.model.showAsAgendaItem = true;
        // get all form fields
        $scope.formFields = TopicForm.getFormFields(true);
        // save form
        $scope.save = function (topic) {
            Topic.create(topic).then(
                function (success) {
                    // type: Value 1 means a non hidden agenda item, value 2 means a hidden agenda item,
                    // see openslides.agenda.models.Item.ITEM_TYPE.
                    var changes = [{key: 'type', value: (topic.showAsAgendaItem ? 1 : 2)},
                                   {key: 'parent_id', value: topic.agenda_parent_item_id}];
                    AgendaUpdate.saveChanges(success.agenda_item_id,changes);
                });
            $scope.closeThisDialog();
        };
    }
])

.controller('TopicUpdateCtrl', [
    '$scope',
    '$state',
    'Topic',
    'TopicForm',
    'Agenda',
    'AgendaUpdate',
    'topic',
    function($scope, $state, Topic, TopicForm, Agenda, AgendaUpdate, topic) {
        Topic.loadRelations(topic, 'agenda_item');
        $scope.alert = {};
        // set initial values for form model by create deep copy of topic object
        // so list/detail view is not updated while editing
        $scope.model = angular.copy(topic);
        // get all form fields
        $scope.formFields = TopicForm.getFormFields();
        for (var i = 0; i < $scope.formFields.length; i++) {
            if ($scope.formFields[i].key == "showAsAgendaItem") {
                // get state from agenda item (hidden/internal or agenda item)
                $scope.formFields[i].defaultValue = !topic.agenda_item.is_hidden;
            } else if ($scope.formFields[i].key == "agenda_parent_item_id") {
                $scope.formFields[i].defaultValue = topic.agenda_item.parent_id;
            }
        }
        // save form
        $scope.save = function (topic) {
            Topic.create(topic).then(
                function(success) {
                    // type: Value 1 means a non hidden agenda item, value 2 means a hidden agenda item,
                    // see openslides.agenda.models.Item.ITEM_TYPE.
                    var changes = [{key: 'type', value: (topic.showAsAgendaItem ? 1 : 2)},
                                   {key: 'parent_id', value: topic.agenda_parent_item_id}];
                    AgendaUpdate.saveChanges(success.agenda_item_id,changes);
                    $scope.closeThisDialog();
                }, function (error) {
                    // save error: revert all changes by restore
                    // (refresh) original topic object from server
                    Topic.refresh(topic);
                    var message = '';
                    for (var e in error.data) {
                        message += e + ': ' + error.data[e] + ' ';
                    }
                    $scope.alert = {type: 'danger', msg: message, show: true};
                }
            );
        };
    }
])

.controller('TopicImportCtrl', [
    '$scope',
    'gettext',
    'Agenda',
    'Topic',
    'HumanTimeConverter',
    'TopicsCsvExample',
    function($scope, gettext, Agenda, Topic, HumanTimeConverter, TopicsCsvExample) {
        // Big TODO: Change wording from "item" to "topic".
        // import from textarea
        $scope.importByLine = function () {
            if ($scope.itemlist) {
                $scope.titleItems = $scope.itemlist[0].split("\n");
                $scope.importcounter = 0;
                $scope.titleItems.forEach(function(title, index) {
                    var item = {title: title};
                    // TODO: create all items in bulk mode
                    Topic.create(item).then(
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
        $scope.csvConfig = {
            accept: '.csv, .txt',
            encodingOptions: ['UTF-8', 'ISO-8859-1'],
            parseConfig: {
                skipEmptyLines: true,
            },
        };
        var FIELDS = ['title', 'text', 'duration', 'comment', 'is_hidden'];
        $scope.items = [];
        $scope.onCsvChange = function (csv) {
            $scope.items = [];

            var items = [];
            _.forEach(csv.data, function (row) {
                if (row.length > 1) {
                    var filledRow = _.zipObject(FIELDS, row);
                    items.push(filledRow);
                }
            });

            _.forEach(items, function (item, index) {
                item.selected = true;

                if (!item.title) {
                    item.importerror = true;
                    item.title_error = gettext('Error: Title is required.');
                }
                // duration
                if (item.duration) {
                    var time = HumanTimeConverter.humanTimeToSeconds(item.duration, {hours: true})/60;
                    if (time <= 0) { // null instead of 0 or negative duration
                        time = null;
                    }
                    item.duration = time;
                } else {
                    item.duration = null;
                }
                // is_hidden
                if (item.is_hidden) {
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
            $scope.calcStats();
        };

        $scope.calcStats = function () {
            $scope.itemsWillNotBeImported = 0;
            $scope.itemsWillBeImported = 0;

            $scope.items.forEach(function(item) {
                if (item.selected && !item.importerror) {
                    $scope.itemsWillBeImported++;
                } else {
                    $scope.itemsWillNotBeImported++;
                }
            });
        };

        // import from csv file
        $scope.import = function () {
            $scope.csvImporting = true;
            angular.forEach($scope.items, function (item) {
                if (item.selected && !item.importerror) {
                    Topic.create(item).then(
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
            $scope.items = null;
        };
        // download CSV example file
        $scope.downloadCSVExample = function () {
            var element = document.getElementById('downloadLink');
            TopicsCsvExample.downloadExample(element);
        };
     }
]);

}());
