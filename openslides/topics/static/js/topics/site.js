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
                abstract: true,
                template: "<ui-view/>",
            })
            .state('topics.topic.detail', {
                resolve: {
                    topicId: ['$stateParams', function($stateParams) {
                        return $stateParams.id;
                    }],
                }
            })
            // redirects to topic detail and opens topic edit form dialog, uses edit url,
            // used by ui-sref links from agenda only
            // (from topic controller use TopicForm factory instead to open dialog in front
            // of current view without redirect)
            .state('topics.topic.detail.update', {
                onEnter: ['$stateParams', '$state', 'ngDialog',
                    function($stateParams, $state, ngDialog) {
                        ngDialog.open({
                            template: 'static/templates/topics/topic-form.html',
                            controller: 'TopicUpdateCtrl',
                            className: 'ngdialog-theme-default wide-form',
                            closeByEscape: false,
                            closeByDocument: false,
                            resolve: {
                                topicId: function() {
                                    return $stateParams.id;
                                },
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
    '$filter',
    'gettextCatalog',
    'operator',
    'Editor',
    'Mediafile',
    'Agenda',
    'AgendaTree',
    function ($filter, gettextCatalog, operator, Editor, Mediafile, Agenda, AgendaTree) {
        return {
            // ngDialog for topic form
            getDialog: function (topic) {
                return {
                    template: 'static/templates/topics/topic-form.html',
                    controller: (topic) ? 'TopicUpdateCtrl' : 'TopicCreateCtrl',
                    className: 'ngdialog-theme-default wide-form',
                    closeByEscape: false,
                    closeByDocument: false,
                    resolve: {
                        topicId: function () {return topic ? topic.id: void 0;}
                    },
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
                            options: $filter('orderBy')(Mediafile.getAll(), 'title_or_filename'),
                            ngOptions: 'option.id as option.title_or_filename for option in to.options',
                            placeholder: gettextCatalog.getString('Select or search an attachment ...')
                        }
                    });
                }

                // show as agenda item + parent item
                if (isCreateForm) {
                    formFields.push({
                        key: 'showAsAgendaItem',
                        type: 'checkbox',
                        templateOptions: {
                            label: gettextCatalog.getString('Show as agenda item'),
                            description: gettextCatalog.getString('If deactivated it appears as internal item on agenda.')
                        },
                        hide: !operator.hasPerms('agenda.can_manage')
                    });
                    formFields.push({
                        key: 'agenda_parent_id',
                        type: 'select-single',
                        templateOptions: {
                            label: gettextCatalog.getString('Parent item'),
                            options: AgendaTree.getFlatTree(Agenda.getAll()),
                            ngOptions: 'item.id as item.getListViewTitle() for item in to.options | notself : model.agenda_item_id',
                            placeholder: gettextCatalog.getString('Select a parent item ...')
                        },
                        hide: !operator.hasPerms('agenda.can_manage')
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
    'topicId',
    'Projector',
    'ProjectionDefault',
    'WebpageTitle',
    'gettextCatalog',
    function($scope, ngDialog, TopicForm, Topic, topicId, Projector, ProjectionDefault, WebpageTitle,
        gettextCatalog) {
        $scope.$watch(function () {
            return Topic.lastModified(topicId);
        }, function () {
            $scope.topic = Topic.get(topicId);
            WebpageTitle.updateTitle(gettextCatalog.getString('Topic') + ' ' +
                $scope.topic.agenda_item.getTitle());
        });
        $scope.$watch(function () {
            return Projector.lastModified();
        }, function () {
            var projectiondefault = ProjectionDefault.filter({name: 'topics'})[0];
            if (projectiondefault) {
                $scope.defaultProjectorId = projectiondefault.projector_id;
            }
        });
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
    'ErrorMessage',
    function($scope, $state, Topic, TopicForm, Agenda, ErrorMessage) {
        $scope.topic = {};
        $scope.model = {};
        $scope.model.showAsAgendaItem = true;
        // get all form fields
        $scope.formFields = TopicForm.getFormFields(true);
        // save form
        $scope.save = function (topic) {
            topic.agenda_type = topic.showAsAgendaItem ? 1 : 2;
            // The attribute topic.agenda_parent_id is set by the form, see form definition.
            Topic.create(topic).then(
                function (success) {
                    $scope.closeThisDialog();
                }, function (error) {
                    $scope.alert = ErrorMessage.forAlert(error);
                }
            );
        };
    }
])

.controller('TopicUpdateCtrl', [
    '$scope',
    '$state',
    'Topic',
    'TopicForm',
    'Agenda',
    'topicId',
    'ErrorMessage',
    function($scope, $state, Topic, TopicForm, Agenda, topicId, ErrorMessage) {
        var topic = Topic.get(topicId);
        $scope.alert = {};
        // set initial values for form model by create deep copy of topic object
        // so list/detail view is not updated while editing
        $scope.model = angular.copy(topic);
        // get all form fields
        $scope.formFields = TopicForm.getFormFields();

        // save form
        $scope.save = function (topic) {
            // inject the changed topic (copy) object back into DS store
            Topic.inject(topic);
            // save changed topic object on server
            Topic.save(topic).then(
                function(success) {
                    $scope.closeThisDialog();
                },
                function (error) {
                    // save error: revert all changes by restore
                    // (refresh) original topic object from server
                    Topic.refresh(topic);
                    $scope.alert = ErrorMessage.forAlert(error);
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
                $scope.titleItems = _.filter($scope.itemlist[0].split("\n"));
                $scope.importcounter = 0;
                _.forEach($scope.titleItems, function(title, index) {
                    var item = {title: title};
                    item.agenda_type = 1;  // The new topic is not hidden.
                    item.agenda_weight = 1000 + index;
                    // TODO: create all items in bulk mode
                    Topic.create(item).then(
                        function(success) {
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
                    delete item.duration;
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
                    item.agenda_type = item.type;
                    item.agenda_comment = item.comment;
                    item.agenda_duration = item.duration;
                    item.agenda_weight = item.weight;
                    Topic.create(item).then(
                        function(success) {
                            item.imported = true;
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
            TopicsCsvExample.downloadExample();
        };
     }
]);

}());
