(function () {

"use strict";

angular.module('OpenSlidesApp.motions', [
  'OpenSlidesApp.users',
  'OpenSlidesApp.motions.lineNumbering',
  'OpenSlidesApp.motions.diff'
])

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
                    });
                    return states;
                }
            }
        });
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
        });
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
    'gettextCatalog',
    'Config',
    function (DS, gettextCatalog, Config) {
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
                // returns object with value and percent
                getVote: function (vote) {
                    if (!this.has_votes) {
                        return;
                    }
                    var value = '';
                    switch (vote) {
                        case -1:
                            value = gettextCatalog.getString('majority');
                            break;
                        case -2:
                            value = gettextCatalog.getString('undocumented');
                            break;
                        default:
                            value = vote;
                            break;
                    }
                    // calculate percent value
                    var config = Config.get('motions_poll_100_percent_base').value;
                    var percentStr, percentNumber;
                    if (config == "WITHOUT_INVALID" && this.votesvalid > 0 && vote >= 0) {
                        percentNumber = Math.round(vote * 100 / this.votesvalid * 10) / 10;
                    } else if (config == "WITH_INVALID" && this.votescast > 0 && vote >= 0) {
                        percentNumber = Math.round(vote * 100 / (this.votescast) * 10) / 10;
                    }
                    if (percentNumber) {
                        percentStr = "(" + percentNumber + "%)";
                    }
                    return {
                        'value': value,
                        'percentStr': percentStr,
                        'percentNumber': percentNumber
                    };
                },
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
    'lineNumberingService',
    function(DS, MotionPoll, jsDataModel, gettext, operator, Config, lineNumberingService) {
        var name = 'motions/motion';
        return DS.defineResource({
            name: name,
            useClass: jsDataModel,
            verboseName: gettext('Motion'),
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
                            return element.id == versionId;
                        });
                    }
                    return this.versions[index] || {};
                },
                getTitle: function (versionId) {
                    return this.getVersion(versionId).title;
                },
                getText: function (versionId) {
                    return this.getVersion(versionId).text;
                },
                getTextWithLineBreaks: function (versionId) {
                    var lineLength = Config.get('motions_line_length').value,
                        html = this.getVersion(versionId).text;

                    return lineNumberingService.insertLineNumbers(html, lineLength);
                },
                setTextStrippingLineBreaks: function (versionId, text) {
                    this.text = lineNumberingService.stripLineNumbers(text);
                },
                getReason: function (versionId) {
                    return this.getVersion(versionId).reason;
                },
                // link name which is shown in search result
                getSearchResultName: function () {
                    return this.getTitle();
                },
                // subtitle of search result
                getSearchResultSubtitle: function () {
                    return "Motion";
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
                            return (
                                operator.hasPerms('motions.can_see') &&
                                (
                                    !this.state.required_permission_to_see ||
                                    operator.hasPerms(this.state.required_permission_to_see) ||
                                    (operator.user in this.submitters)
                                )
                            );
                        case 'update':
                            return (
                                operator.hasPerms('motions.can_manage') ||
                                (
                                    ($.inArray(operator.user, this.submitters) != -1) &&
                                    this.state.allow_submitter_edit
                                )
                            );
                        case 'quickedit':
                            return operator.hasPerms('motions.can_manage');
                        case 'delete':
                            return operator.hasPerms('motions.can_manage');
                        case 'create_poll':
                            return (
                                operator.hasPerms('motions.can_manage') &&
                                this.state.allow_create_poll
                            );
                        case 'support':
                            return (
                                operator.hasPerms('motions.can_support') &&
                                this.state.allow_support &&
                                Config.get('motions_min_supporters').value > 0 &&
                                ($.inArray(operator.user, this.submitters) == -1) &&
                                ($.inArray(operator.user, this.supporters) == -1)
                            );
                        case 'unsupport':
                            return (
                                this.state.allow_support &&
                                ($.inArray(operator.user, this.supporters) != -1)
                            );
                        case 'change_state':
                            return operator.hasPerms('motions.can_manage');
                        case 'reset_state':
                            return operator.hasPerms('motions.can_manage');
                        case 'can_manage':
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

.factory('Category', [
    'DS',
    function(DS) {
        return DS.defineResource({
            name: 'motions/category',
        });
    }
])

.factory('MotionList', [
    function () {
        return {
            getList: function (items){
                var list = [];
                _.each(items, function (item) {
                    list.push({ id: item.id,
                                item: item });
                });
                return list;
            }
        };
    }
])

.run([
    'Motion',
    'Category',
    function(Motion, Category) {}
])


// Mark all motion workflow state strings for translation in JavaScript.
// (see motions/signals.py)
.config([
    'gettext',
    function (gettext) {
        // workflow 1
        gettext('Simple Workflow');
        gettext('submitted');
        gettext('accepted');
        gettext('Accept');
        gettext('rejected');
        gettext('Reject');
        gettext('not decided');
        gettext('Do not decide');
        // workflow 2
        gettext('Complex Workflow');
        gettext('published');
        gettext('permitted');
        gettext('Permit');
        gettext('accepted');
        gettext('Accept');
        gettext('rejected');
        gettext('Reject');
        gettext('withdrawed');
        gettext('Withdraw');
        gettext('adjourned');
        gettext('Adjourn');
        gettext('not concerned');
        gettext('Do not concern');
        gettext('commited a bill');
        gettext('Commit a bill');
        gettext('needs review');
        gettext('Needs review');
        gettext('rejected (not authorized)');
        gettext('Reject (not authorized)');
    }
]);

}());
