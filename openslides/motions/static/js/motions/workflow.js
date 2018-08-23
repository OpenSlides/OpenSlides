(function () {

'use strict';

angular.module('OpenSlidesApp.motions.workflow', [])

.controller('WorkflowListCtrl', [
    '$scope',
    'Workflow',
    'ngDialog',
    'ErrorMessage',
    function ($scope, Workflow, ngDialog, ErrorMessage) {
        $scope.alert = {};
        Workflow.bindAll({}, $scope, 'workflows');
        $scope.create = function () {
            ngDialog.open({
                template: 'static/templates/motions/workflow-edit.html',
                controller: 'WorkflowCreateCtrl',
                className: 'ngdialog-theme-default wide-form',
                closeByEscape: false,
                closeByDocument: false,
            });
        };
        $scope.delete = function (workflow) {
            Workflow.destroy(workflow).then(null, function (error) {
                $scope.alert = ErrorMessage.forAlert(error);
            });
        };
    }
])

.controller('WorkflowDetailCtrl', [
    '$scope',
    '$sessionStorage',
    'permissions',
    'Workflow',
    'MotionState',
    'workflowId',
    'ngDialog',
    'gettext',
    'gettextCatalog',
    'ErrorMessage',
    function ($scope, $sessionStorage, permissions, Workflow, MotionState, workflowId,
        ngDialog, gettext, gettextCatalog, ErrorMessage) {
        $scope.permissions = permissions;
        $scope.alert = {};

        $scope.$watch(function () {
            return Workflow.lastModified(workflowId);
        }, function () {
            $scope.workflow = Workflow.get(workflowId);
            $scope.states = $scope.workflow.states;
            $scope.states = _.orderBy($scope.states, 'id');
            _.forEach($scope.states, function (state) {
                state.newActionWord = gettextCatalog.getString(state.action_word);
                state.newRecommendationLabel = gettextCatalog.getString(state.recommendation_label);
            });
        });

        $scope.booleanMembers = [
            {name: 'allow_support',
             displayName: gettext('Allow support'),},
            {name: 'allow_create_poll',
             displayName: gettext('Allow create poll'),},
            {name: 'allow_submitter_edit',
             displayName: gettext('Allow submitter edit'),},
            {name: 'versioning',
             displayName: gettext('Versioning'),},
            {name: 'leave_old_version_active',
             displayName: gettext('Leave old version active'),},
            {name: 'dont_set_identifier',
             displayName: gettext('Set identifier'),
             inverse: true,},
            {name: 'show_state_extension_field',
             displayName: gettext('Show state extension field'),},
            {name: 'show_recommendation_extension_field',
             displayName: gettext('Show recommendation extension field'),}
        ];
        $scope.cssClasses = {
            'danger': gettext('Red'),
            'success': gettext('Green'),
            'warning': gettext('Yellow'),
            'default': gettext('Grey'),
            'primary': gettext('Blue'),
        };
        $scope.getPermissionDisplayName = function (permission) {
            if (permission) {
                return _.find($scope.permissions, function (perm) {
                    return perm.value === permission;
                }).display_name;
            }
        };
        $scope.clickPermission = function (state, permission) {
            state.required_permission_to_see =
                state.required_permission_to_see === permission.value ? '' : permission.value;
            $scope.save(state);
        };
        $scope.xor = function (a, b) {
            return (a && !b) || (!a && b);
        };

        $scope.changeBooleanMember = function (state, memberName) {
            state[memberName] = !state[memberName];
            $scope.save(state);
        };
        $scope.setMember = function (state, member, value) {
            state[member] = value;
            $scope.save(state);
        };
        $scope.clickNextStateEntry = function (state, clickedStateId) {
            var index = state.next_states_id.indexOf(clickedStateId);
            if (index > -1) { // remove now
                state.next_states_id.splice(index, 1);
            } else { // add
                state.next_states_id.push(clickedStateId);
            }
            $scope.save(state);
        };
        $scope.save = function (state) {
            MotionState.save(state).then(null, function (error) {
                $scope.alert = ErrorMessage.forAlert(error);
            });
        };

        // Save expand state so the session
        if ($sessionStorage.motionStateTableExpandState) {
            $scope.toggleExpandContent();
        }
        $scope.saveExpandState = function (state) {
            $sessionStorage.motionStateTableExpandState = state;
        };

        $scope.openStateDialog = function (state) {
            ngDialog.open({
                template: 'static/templates/motions/state-edit.html',
                controller: state ? 'StateRenameCtrl' : 'StateCreateCtrl',
                className: 'ngdialog-theme-default wide-form',
                closeByEscape: false,
                closeByDocument: false,
                resolve: {
                    state: function () {return state;},
                    workflow: function () {return $scope.workflow;},
                }
            });
        };
        $scope.openWorkflowDialog = function () {
            ngDialog.open({
                template: 'static/templates/motions/workflow-edit.html',
                controller: 'WorkflowRenameCtrl',
                className: 'ngdialog-theme-default wide-form',
                closeByEscape: false,
                closeByDocument: false,
                resolve: {
                    workflow: function () {return $scope.workflow;},
                }
            });
        };

        $scope.delete = function (state) {
            MotionState.destroy(state).then(null, function (error) {
                $scope.alert = ErrorMessage.forAlert(error);
            });
        };
    }
])

.controller('WorkflowCreateCtrl', [
    '$scope',
    'Workflow',
    'ErrorMessage',
    function ($scope, Workflow, ErrorMessage) {
        $scope.save = function () {
            var workflow = {
                name: $scope.newName,
            };
            Workflow.create(workflow).then(function (success) {
                $scope.closeThisDialog();
            }, function (error) {
                $scope.alert = ErrorMessage.forAlert(error);
            });
        };
    }
])

.controller('WorkflowRenameCtrl', [
    '$scope',
    'workflow',
    'Workflow',
    'gettextCatalog',
    'ErrorMessage',
    function ($scope, workflow, Workflow, gettextCatalog, ErrorMessage) {
        $scope.workflow = workflow;
        $scope.newName = gettextCatalog.getString(workflow.name);
        $scope.save = function () {
            workflow.name = $scope.newName;
            Workflow.save(workflow).then(function (success) {
                $scope.closeThisDialog();
            }, function (error) {
                $scope.alert = ErrorMessage.forAlert(error);
            });
        };
    }
])

.controller('StateCreateCtrl', [
    '$scope',
    'workflow',
    'MotionState',
    'ErrorMessage',
    function ($scope, workflow, MotionState, ErrorMessage) {
        $scope.newName = '';
        $scope.actionWord = '';
        $scope.save = function () {
            var state = {
                name: $scope.newName,
                action_word: $scope.actionWord,
                workflow_id: workflow.id,
                allow_create_poll: true,
                allow_support: true,
                allow_submitter_edit: true,
            };
            MotionState.create(state).then(function () {
                $scope.closeThisDialog();
            }, function (error) {
                $scope.alert = ErrorMessage.forAlert(error);
            });
        };
    }
])

.controller('StateRenameCtrl', [
    '$scope',
    'MotionState',
    'state',
    'gettextCatalog',
    'ErrorMessage',
    function ($scope, MotionState, state, gettextCatalog, ErrorMessage) {
        $scope.state = state;
        $scope.newName = gettextCatalog.getString(state.name);
        $scope.actionWord = gettextCatalog.getString(state.action_word);
        $scope.save = function () {
            state.name = $scope.newName;
            state.action_word = $scope.actionWord;
            MotionState.save(state).then(function () {
                $scope.closeThisDialog();
            }, function (error) {
                $scope.alert = ErrorMessage.forAlert(error);
            });
        };
    }
]);

}());
