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
    'operator',
    'gettextCatalog',
    'Agenda',
    'AgendaTree',
    function ($http, operator, gettextCatalog, Agenda, AgendaTree) {
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
            getFormFields: function (isCreateForm) {
                var formFields = [
                    {
                        key: 'title',
                        type: 'input',
                        templateOptions: {
                            label: gettextCatalog.getString('Title')
                        }
                    },
                ];

                // show as agenda item + parent item
                if (isCreateForm) {
                    formFields.push({
                        key: 'showAsAgendaItem',
                        type: 'checkbox',
                        templateOptions: {
                            label: gettextCatalog.getString('Show as agenda item'),
                            description: gettextCatalog.getString('If deactivated it appears as internal item on agenda.')
                        },
                        hide: !(operator.hasPerms('motions.can_manage') && operator.hasPerms('agenda.can_manage'))
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

.controller('MotionBlockListCtrl', [
    '$scope',
    'ngDialog',
    'MotionBlock',
    'MotionBlockForm',
    'Projector',
    'ProjectionDefault',
    function ($scope, ngDialog, MotionBlock, MotionBlockForm, Projector, ProjectionDefault) {
        $scope.$watch(function () {
            return Projector.lastModified();
        }, function () {
            var projectiondefault = ProjectionDefault.filter({name: 'motionBlocks'})[0];
            if (projectiondefault) {
                $scope.defaultProjectorId = projectiondefault.projector_id;
            }
        });
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
    'WebpageTitle',
    'gettextCatalog',
    'ErrorMessage',
    function($scope, $http, ngDialog, Motion, MotionBlockForm, MotionBlock, motionBlockId, Projector,
        ProjectionDefault, WebpageTitle, gettextCatalog, ErrorMessage) {
        $scope.$watch(function () {
            return MotionBlock.lastModified(motionBlockId);
        }, function () {
            $scope.motionBlock = MotionBlock.get(motionBlockId);
            WebpageTitle.updateTitle(gettextCatalog.getString('Motion block') + ' ' +
                $scope.motionBlock.agenda_item.getTitle());
        });
        Motion.bindAll({}, $scope, 'motions');
        $scope.$watch(function () {
            return Projector.lastModified();
        }, function () {
            var projectiondefault = ProjectionDefault.filter({name: 'motionBlocks'})[0];
            if (projectiondefault) {
                $scope.defaultProjectorId = projectiondefault.projector_id;
            }
        });
        $scope.openDialog = function (motionBlock) {
            ngDialog.open(MotionBlockForm.getDialog(motionBlock));
        };
        $scope.followRecommendations = function () {
            $http.post('/rest/motions/motion-block/' + motionBlockId + '/follow_recommendations/').then(
                function (success) {
                $scope.alert = { type: 'success', msg: success.data.detail, show: true };
            }, function (error) {
                $scope.alert = ErrorMessage.forAlert(error);
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
    function($scope, MotionBlock, MotionBlockForm) {
        // Prepare form.
        $scope.model = {};
        $scope.model.showAsAgendaItem = true;

        // Get all form fields.
        $scope.formFields = MotionBlockForm.getFormFields(true);

        // Save form.
        $scope.save = function (motionBlock) {
            motionBlock.agenda_type = motionBlock.showAsAgendaItem ? 1 : 2;
            // The attribute motionBlock.agenda_parent_id is set by the form, see form definition.
            MotionBlock.create(motionBlock).then(
                function (success) {
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
    'motionBlockId',
    function($scope, $state, MotionBlock, MotionBlockForm, motionBlockId) {
        $scope.alert = {};

        // Prepare form. Set initial values by creating a deep copy of
        // motionBlock object so list/detail view is not updated while editing.
        var motionBlock = MotionBlock.get(motionBlockId);
        $scope.model = angular.copy(motionBlock);

        // Get all form fields.
        $scope.formFields = MotionBlockForm.getFormFields();

        // Save form.
        $scope.save = function (motionBlock) {
            // inject the changed motionBlock (copy) object back into DS store
            MotionBlock.inject(motionBlock);
            // save changed motionBlock object on server
            MotionBlock.create(motionBlock).then(
                function (success) {
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
