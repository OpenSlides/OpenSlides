(function () {

'use strict';

angular.module('OpenSlidesApp.motions.motionBlock', [])


// MotionBlock model

.factory('MotionBlock', [
    'DS',
    'jsDataModel',
    'gettext',
    function(DS, jsDataModel, gettext) {
        var name = 'motions/motion-block';
        return DS.defineResource({
            name: name,
            useClass: jsDataModel,
            verboseName: gettext('Motion block'),
            methods: {
                getResourceName: function () {
                    return name;
                },
                getAgendaTitle: function () {
                    return this.title;
                },
            },
            relations: {
                belongsTo: {
                    'agenda/item': {
                        localKey: 'agenda_item_id',
                        localField: 'agenda_item',
                    }
                },
                hasMany: {
                    'motions/motion': {
                        localField: 'motions',
                        foreignKey: 'motion_block_id',
                        osProtectedRelation: true,
                    }
                },
            }
        });
    }
])

.run(['MotionBlock', function(MotionBlock) {}])

// MotionBlock views (list view, create dialog, update dialog)
.factory('MotionBlockForm', [
    '$http',
    'gettextCatalog',
    'Agenda',
    'AgendaTree',
    function ($http, gettextCatalog, Agenda, AgendaTree) {
        return {
            // Get ngDialog configuration.
            getDialog: function (motionBlock) {
                return {
                    template: 'static/templates/motions/motion-block-form.html',
                    controller: (motionBlock) ? 'MotionBlockUpdateCtrl' : 'MotionBlockCreateCtrl',
                    className: 'ngdialog-theme-default wide-form',
                    closeByEscape: false,
                    closeByDocument: false,
                    resolve: {
                        motionBlockId: function () {return motionBlock ? motionBlock.id : void 0;}
                    }
                };
            },
            // Get angular-formly fields.
            getFormFields: function () {
                return [
                    {
                        key: 'title',
                        type: 'input',
                        templateOptions: {
                            label: gettextCatalog.getString('Title')
                        }
                    },
                    {
                        key: 'showAsAgendaItem',
                        type: 'checkbox',
                        templateOptions: {
                            label: gettextCatalog.getString('Show as agenda item'),
                            description: gettextCatalog.getString('If deactivated it appears as internal item on agenda.')
                        }
                    },
                    {
                        key: 'agenda_parent_item_id',
                        type: 'select-single',
                        templateOptions: {
                            label: gettextCatalog.getString('Parent item'),
                            options: AgendaTree.getFlatTree(Agenda.getAll()),
                            ngOptions: 'item.id as item.getListViewTitle() for item in to.options | notself : model.agenda_item_id',
                            placeholder: gettextCatalog.getString('Select a parent item ...')
                        }
                    }
                ];
            }
        };
    }
])

.controller('MotionBlockListCtrl', [
    '$scope',
    'ngDialog',
    'MotionBlock',
    'MotionBlockForm',
    function ($scope, ngDialog, MotionBlock, MotionBlockForm) {
        // Two-way data binding for all MotionBlock instances.
        MotionBlock.bindAll({}, $scope, 'motionBlocks');

        // Dialog with a form to create or update a MotionBlock instance.
        $scope.openFormDialog = function (motionBlock) {
            ngDialog.open(MotionBlockForm.getDialog(motionBlock));
        };

        // Confirm dialog to delete a MotionBlock instance.
        $scope.delete = function (motionBlock) {
            MotionBlock.destroy(motionBlock.id);
        };
    }
])

.controller('MotionBlockDetailCtrl', [
    '$scope',
    '$http',
    'ngDialog',
    'Motion',
    'MotionBlockForm',
    'MotionBlock',
    'motionBlockId',
    'Projector',
    'ProjectionDefault',
    function($scope, $http, ngDialog, Motion, MotionBlockForm, MotionBlock, motionBlockId, Projector, ProjectionDefault) {
        MotionBlock.bindOne(motionBlockId, $scope, 'motionBlock');
        Motion.bindAll({}, $scope, 'motions');
        $scope.$watch(function () {
            return Projector.lastModified();
        }, function () {
            var projectiondefault = ProjectionDefault.filter({name: 'motionBlocks'})[0];
            if (projectiondefault) {
                $scope.defaultProjectorId = projectiondefault.projector_id;
            }
        });
        $scope.openDialog = function (topic) {
            ngDialog.open(MotionBlockForm.getDialog(motionBlock));
        };
        $scope.followRecommendations = function () {
            $http.post('/rest/motions/motion-block/' + motionBlockId + '/follow_recommendations/')
            .success(function(data) {
                $scope.alert = { type: 'success', msg: data.detail, show: true };
            })
            .error(function(data) {
                $scope.alert = { type: 'danger', msg: data.detail, show: true };
            });
        };
        $scope.delete = function (motion) {
            motion.motion_block_id = null;
            motion.title = motion.getTitle(-1);
            motion.text = motion.getText(-1);
            motion.reason = motion.getReason(-1);
            Motion.save(motion);
        };
    }
])

.controller('MotionBlockCreateCtrl', [
    '$scope',
    'MotionBlock',
    'MotionBlockForm',
    'AgendaUpdate',
    function($scope, MotionBlock, MotionBlockForm, AgendaUpdate) {
        // Prepare form.
        $scope.model = {};
        $scope.model.showAsAgendaItem = true;

        // Get all form fields.
        $scope.formFields = MotionBlockForm.getFormFields();

        // Save form.
        $scope.save = function (motionBlock) {
            MotionBlock.create(motionBlock).then(
                function (success) {
                    // type: Value 1 means a non hidden agenda item, value 2 means a hidden agenda item,
                    // see openslides.agenda.models.Item.ITEM_TYPE.
                    var changes = [{key: 'type', value: (motionBlock.showAsAgendaItem ? 1 : 2)},
                                   {key: 'parent_id', value: motionBlock.agenda_parent_item_id}];
                    AgendaUpdate.saveChanges(success.agenda_item_id, changes);
                    $scope.closeThisDialog();
                },
                function (error) {
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

.controller('MotionBlockUpdateCtrl', [
    '$scope',
    '$state',
    'MotionBlock',
    'MotionBlockForm',
    'AgendaUpdate',
    'motionBlockId',
    function($scope, $state, MotionBlock, MotionBlockForm, AgendaUpdate, motionBlockId) {
        // TODO: Check #2486 and remove some agenda related code.
        //MotionBlock.loadRelations(motionBlock, 'agenda_item');
        $scope.alert = {};

        // Prepare form. Set initial values by creating a deep copy of
        // motionBlock object so list/detail view is not updated while editing.
        var motionBlock = MotionBlock.get(motionBlockId);
        $scope.model = angular.copy(motionBlock);

        // Get all form fields.
        $scope.formFields = MotionBlockForm.getFormFields();
        for (var i = 0; i < $scope.formFields.length; i++) {
            if ($scope.formFields[i].key == 'showAsAgendaItem') {
                // Get state from agenda item (hidden/internal or agenda item).
                $scope.formFields[i].defaultValue = !motionBlock.agenda_item.is_hidden;
            } else if ($scope.formFields[i].key == 'agenda_parent_item_id') {
                $scope.formFields[i].defaultValue = motionBlock.agenda_item.parent_id;
            }
        }
        // Save form.
        $scope.save = function (motionBlock) {
            MotionBlock.create(motionBlock).then(
                function (success) {
                    // type: Value 1 means a non hidden agenda item, value 2 means a hidden agenda item,
                    // see openslides.agenda.models.Item.ITEM_TYPE.
                    var changes = [{key: 'type', value: (motionBlock.showAsAgendaItem ? 1 : 2)},
                                   {key: 'parent_id', value: motionBlock.agenda_parent_item_id}];
                    AgendaUpdate.saveChanges(success.agenda_item_id,changes);
                    $scope.closeThisDialog();
                },
                function (error) {
                    // Save error: revert all changes by restore
                    // (refresh) original motionBlock object from server
                    MotionBlock.refresh(motionBlock);  // TODO: Why do we need a refresh here?
                    var message = '';
                    for (var e in error.data) {
                        message += e + ': ' + error.data[e] + ' ';
                    }
                    $scope.alert = {type: 'danger', msg: message, show: true};
                }
            );
        };
    }
]);

}());
