(function () {

"use strict";

angular.module('OpenSlidesApp.motions', ['OpenSlidesApp.users'])

.factory('WorkflowState', [
    'DS',
    function (DS) {
        return DS.defineResource({
            name: 'motions/workflowstate',
            methods: {
                getNextStates: function () {
                    var states = [];
                    _.forEach(this.next_states_id, function (stateId) {
                        states.push(DS.get('motions/workflowstate', stateId));
                    })
                    return states;
                }
            }
        })
    }
])

.factory('Workflow', [
    'DS',
    'jsDataModel',
    'WorkflowState',
    function (DS, jsDataModel, WorkflowState) {
        return DS.defineResource({
            name: 'motions/workflow',
            useClass: jsDataModel,
            relations: {
                hasMany: {
                    'motions/workflowstate': {
                        localField: 'states',
                        foreignKey: 'workflow_id',
                    }
                }
            }
        })
    }
])

// Load all MotionWorkflows at startup
.run([
    'Workflow',
    function (Workflow) {
        Workflow.findAll();
    }
])

.factory('MotionPoll', [
    'DS',
    'Config',
    function (DS, Config) {
        return DS.defineResource({
            name: 'motions/motionpoll',
            relations: {
                belongsTo: {
                    'motions/motion': {
                        localField: 'motion',
                        localKey: 'motion_id',
                    }
                }
            },
            methods: {
                getYesPercent: function (valueOnly) {
                    var config = Config.get('motions_poll_100_percent_base').value;
                    var returnvalue;
                    if (config == "WITHOUT_INVALID" && this.votesvalid > 0 && this.yes >= 0) {
                        returnvalue = Math.round(this.yes * 100 / this.votesvalid * 10) / 10;
                    } else if (config == "WITH_INVALID" && this.votescast > 0 && this.yes >= 0) {
                        returnvalue = Math.round(this.yes * 100 / (this.votescast) * 10) / 10;
                    } else {
                        returnvalue = null;
                    }
                    if (!valueOnly && returnvalue != null) {
                        returnvalue = "(" + returnvalue + "%)";
                    }
                    return returnvalue;
                },
                getNoPercent: function (valueOnly) {
                    var config = Config.get('motions_poll_100_percent_base').value;
                    var returnvalue;
                    if (config == "WITHOUT_INVALID" && this.votesvalid > 0 && this.no >= 0) {
                        returnvalue = Math.round(this.no * 100 / this.votesvalid * 10) / 10;
                    } else if (config == "WITH_INVALID" && this.votescast > 0 && this.no >= 0) {
                        returnvalue = Math.round(this.no * 100 / (this.votescast) * 10) / 10;
                    } else {
                        returnvalue = null;
                    }
                    if (!valueOnly && returnvalue != null) {
                        returnvalue = "(" + returnvalue + "%)";
                    }
                    return returnvalue;
                },
                getAbstainPercent: function (valueOnly) {
                    var config = Config.get('motions_poll_100_percent_base').value;
                    var returnvalue;
                    if (config == "WITHOUT_INVALID" && this.votesvalid > 0 && this.abstain >= 0) {
                        returnvalue = Math.round(this.abstain * 100 / this.votesvalid * 10) / 10;
                    } else if (config == "WITH_INVALID" && this.votescast > 0 && this.abstain >= 0) {
                        returnvalue = Math.round(this.abstain * 100 / (this.votescast) * 10) / 10;
                    } else {
                        returnvalue = null;
                    }
                    if (!valueOnly && returnvalue != null) {
                        returnvalue = "(" + returnvalue + "%)";
                    }
                    return returnvalue;
                },
                getVotesValidPercent: function (valueOnly) {
                    var config = Config.get('motions_poll_100_percent_base').value;
                    var returnvalue;
                    if (config == "WITHOUT_INVALID" && this.votevalid >= 0) {
                        returnvalue = 100;
                    } else if (config == "WITH_INVALID" && this.votevalid >= 0) {
                        returnvalue = Math.round(this.votesvalid * 100 / (this.votescast) * 10) / 10;
                    } else {
                        returnvalue = null;
                    }
                    if (!valueOnly && returnvalue != null) {
                        returnvalue = "(" + returnvalue + "%)";
                    }
                    return returnvalue;
                },
                getVotesInvalidPercent: function (valueOnly) {
                    var config = Config.get('motions_poll_100_percent_base').value;
                    var returnvalue;
                    if (config == "WITH_INVALID" && this.voteinvalid >= 0) {
                        returnvalue = Math.round(this.votesinvalid * 100 / (this.votescast) * 10) / 10;
                    } else {
                        returnvalue = null;
                    }
                    if (!valueOnly && returnvalue != null) {
                        returnvalue = "(" + returnvalue + "%)";
                    }
                    return returnvalue;
                },
                getVotesCastPercent: function (valueOnly) {
                    var config = Config.get('motions_poll_100_percent_base').value;
                    var returnvalue;
                    if (config == "WITH_INVALID" && this.votecast >= 0) {
                        returnvalue = 100;
                    } else {
                        returnvalue = null;
                    }
                    if (!valueOnly && returnvalue != null) {
                        returnvalue = "(" + returnvalue + "%)";
                    }
                    return returnvalue;
                }
            }
        });
    }
])

.factory('Motion', [
    'DS',
    'MotionPoll',
    'jsDataModel',
    'gettext',
    'operator',
    'Config',
    function(DS, MotionPoll, jsDataModel, gettext, operator, Config) {
        var name = 'motions/motion'
        return DS.defineResource({
            name: name,
            useClass: jsDataModel,
            agendaSupplement: gettext('Motion'),
            methods: {
                getResourceName: function () {
                    return name;
                },
                getVersion: function (versionId) {
                    versionId = versionId || this.active_version;
                    var index;
                    if (versionId == -1) {
                        index = this.versions.length - 1;
                    } else {
                        index = _.findIndex(this.versions, function (element) {
                            return element.id == versionId
                        });
                    }
                    return this.versions[index];
                },
                getTitle: function (versionId) {
                    return this.getVersion(versionId).title;
                },
                getText: function (versionId) {
                    return this.getVersion(versionId).text;
                },
                getReason: function (versionId) {
                    return this.getVersion(versionId).reason;
                },
                getAgendaTitle: function () {
                    var value = '';
                    if (this.identifier) {
                        value = ' ' + this.identifier;
                    }
                    return value + ': ' + this.getTitle();
                },
                isAllowed: function (action) {
                    /*
                     * Return true if the requested user is allowed to do the specific action.
                     * There are the following possible actions.
                     * - see
                     * - update
                     * - delete
                     * - create_poll
                     * - support
                     * - unsupport
                     * - change_state
                     * - reset_state
                     *
                     *  NOTE: If you update this function please also update the
                     *  'get_allowed_actions' function on server side in motions/models.py.
                     */
                    switch (action) {
                        case 'see':
                            return (operator.hasPerms('motions.can_see') &&
                                (!this.state.required_permission_to_see ||
                                 operator.hasPerms(this.state.required_permission_to_see) ||
                                 (operator.user in this.submitters)));
                        case 'update':
                            return (operator.hasPerms('motions.can_manage') ||
                                (($.inArray(operator.user, this.submitters) != -1) &&
                                this.state.allow_submitter_edit));
                        case 'quickedit':
                            return operator.hasPerms('motions.can_manage');
                        case 'delete':
                            return operator.hasPerms('motions.can_manage');
                        case 'create_poll':
                            return (operator.hasPerms('motions.can_manage') &&
                                this.state.allow_create_poll);
                        case 'support':
                            return (operator.hasPerms('motions.can_support') &&
                                    this.state.allow_support &&
                                    Config.get('motions_min_supporters').value > 0 &&
                                    !($.inArray(operator.user, this.submitters) != -1) &&
                                    !($.inArray(operator.user, this.supporters) != -1));
                        case 'unsupport':
                            return (this.state.allow_support &&
                                   ($.inArray(operator.user, this.supporters) != -1));
                        case 'change_state':
                            return operator.hasPerms('motions.can_manage');
                        case 'reset_state':
                            return operator.hasPerms('motions.can_manage');
                        default:
                            return false;
                    }
                }
            },
            relations: {
                belongsTo: {
                    'motions/category': {
                        localField: 'category',
                        localKey: 'category_id',
                    },
                    'agenda/item': {
                        localKey: 'agenda_item_id',
                        localField: 'agenda_item',
                    }
                },
                hasMany: {
                    'core/tag': {
                        localField: 'tags',
                        localKeys: 'tags_id',
                    },
                    'mediafiles/mediafile': {
                        localField: 'attachments',
                        localKeys: 'attachments_id',
                    },
                    'users/user': [
                        {
                            localField: 'submitters',
                            localKeys: 'submitters_id',
                        },
                        {
                            localField: 'supporters',
                            localKeys: 'supporters_id',
                        }
                    ],
                    'motions/motionpoll': {
                        localField: 'polls',
                        foreignKey: 'motion_id',
                    }
                },
                hasOne: {
                    'motions/workflowstate': {
                        localField: 'state',
                        localKey: 'state_id',
                    }
                }
            }
        });
    }
])

.factory('Category', ['DS', function(DS) {
    return DS.defineResource({
        name: 'motions/category',
    });
}])

.run(['Motion', 'Category', function(Motion, Category) {}]);

}());
