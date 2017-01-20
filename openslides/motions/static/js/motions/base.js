(function () {

"use strict";

angular.module('OpenSlidesApp.motions', [
    'OpenSlidesApp.motions.motionBlock',
    'OpenSlidesApp.motions.lineNumbering',
    'OpenSlidesApp.motions.diff',
    'OpenSlidesApp.poll.majority',
    'OpenSlidesApp.users',
])

.factory('WorkflowState', [
    'DS',
    function (DS) {
        return DS.defineResource({
            name: 'motions/workflowstate',
            methods: {
                getNextStates: function () {
                    // TODO: Use filter with params with operator 'in'.
                    var states = [];
                    _.forEach(this.next_states_id, function (stateId) {
                        states.push(DS.get('motions/workflowstate', stateId));
                    });
                    return states;
                },
                getRecommendations: function () {
                    var params = {
                        where: {
                            'workflow_id': {
                                '==': this.workflow_id
                            },
                            'recommendation_label': {
                                '!=': null
                            }
                        }
                    };
                    return DS.filter('motions/workflowstate', params);
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

.factory('MotionPoll', [
    'DS',
    'gettextCatalog',
    'Config',
    'MajorityMethods',
    function (DS, gettextCatalog, Config, MajorityMethods) {
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
                // Returns percent base. Returns undefined if calculation is not possible in general.
                getPercentBase: function (config, type) {
                    var base;
                    switch (config) {
                        case 'CAST':
                            if (this.votescast <= 0 || this.votesinvalid < 0) {
                                // It would be OK to check only this.votescast < 0 because 0
                                // is checked again later but this is a little bit faster.
                                break;
                            }
                            base = this.votescast;
                            /* falls through */
                        case 'VALID':
                            if (this.votesvalid < 0) {
                                base = void 0;
                                break;
                            }
                            if (typeof base === 'undefined' && type !== 'votescast' && type !== 'votesinvalid') {
                                base = this.votesvalid;
                            }
                            /* falls through */
                        case 'YES_NO_ABSTAIN':
                            if (this.abstain < 0) {
                                base = void 0;
                                break;
                            }
                            if (typeof base === 'undefined' && type !== 'votescast' && type !== 'votesinvalid' && type !== 'votesvalid') {
                                base = this.yes + this.no + this.abstain;
                            }
                            /* falls through */
                        case 'YES_NO':
                            if (this.yes < 0 || this.no < 0 || this.abstain === -1 ) {
                                // It is not allowed to set 'Abstain' to 'majority' but exclude it from calculation.
                                // Setting 'Abstain' to 'undocumented' is possible, of course.
                                base = void 0;
                                break;
                            }
                            if (typeof base === 'undefined' && (type === 'yes' || type === 'no')) {
                                base = this.yes + this.no;
                            }
                    }
                    return base;
                },

                // Returns object with value and percent for this poll.
                getVote: function (vote, type) {
                    if (!this.has_votes) {
                        // Return undefined if this poll has no votes.
                        return;
                    }

                    // Initial values
                    var value = '',
                        percentStr = '',
                        percentNumber,
                        config = Config.get('motions_poll_100_percent_base').value;

                    // Check special values
                    switch (vote) {
                        case -1:
                            value = gettextCatalog.getString('majority');
                            break;
                        case -2:
                            value = gettextCatalog.getString('undocumented');
                            break;
                        default:
                            if (vote >= 0) {
                                value = vote;
                            } else {
                                value = 0;  // Vote was not defined. Set value to 0.
                            }
                    }

                    // Calculate percent value
                    var base = this.getPercentBase(config, type);
                    if (base) {
                        percentNumber = Math.round(vote * 100 / (base) * 10) / 10;
                        percentStr = '(' + percentNumber + ' %)';
                    }
                    return {
                        'value': value,
                        'percentStr': percentStr,
                        'percentNumber': percentNumber,
                        'display': value + ' ' + percentStr
                    };
                },

                // Returns 0 or positive integer if quorum is reached or surpassed.
                // Returns negativ integer if quorum is not reached.
                // Returns undefined if we can not calculate the quorum.
                isReached: function (method) {
                    if (!this.has_votes) {
                        // Return undefined if this poll has no votes.
                        return;
                    }

                    var isReached;
                    var config = Config.get('motions_poll_100_percent_base').value;
                    var base = this.getPercentBase(config, 'yes');
                    if (base) {
                        // Provide result only if base is not undefined and not 0.
                        isReached = MajorityMethods[method](this.yes, base);
                    }
                    return isReached;
                }
            }
        });
    }
])

.factory('Motion', [
    'DS',
    '$http',
    '$filter',
    'MotionPoll',
    'MotionChangeRecommendation',
    'MotionComment',
    'jsDataModel',
    'gettext',
    'gettextCatalog',
    'Config',
    'lineNumberingService',
    'diffService',
    'OpenSlidesSettings',
    'Projector',
    'operator',
    function(DS, $http, $filter, MotionPoll, MotionChangeRecommendation, MotionComment, jsDataModel, gettext, gettextCatalog,
        Config, lineNumberingService, diffService, OpenSlidesSettings, Projector, operator) {
        var name = 'motions/motion';
        return DS.defineResource({
            name: name,
            useClass: jsDataModel,
            verboseName: gettext('Motion'),
            verboseNamePlural: gettext('Motions'),
            validate: function (resource, data, callback) {
                MotionComment.populateFieldsReverse(data);
                callback(null, data);
            },
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
                getTextWithLineBreaks: function (versionId, highlight, callback) {
                    var lineLength = Config.get('motions_line_length').value,
                        html = this.getVersion(versionId).text;

                    return lineNumberingService.insertLineNumbers(html, lineLength, highlight, callback);
                },
                getTextBetweenChangeRecommendations: function (versionId, change1, change2, highlight) {
                    var line_from = (change1 ? change1.line_to : 1),
                        line_to = (change2 ? change2.line_from : null);

                    if (line_from > line_to) {
                        throw 'Invalid call of getTextBetweenChangeRecommendations: change1 needs to be before change2';
                    }
                    if (line_from == line_to) {
                        return '';
                    }

                    var lineLength = Config.get('motions_line_length').value,
                        html = lineNumberingService.insertLineNumbers(this.getVersion(versionId).text, lineLength);

                    var data = diffService.extractRangeByLineNumbers(html, line_from, line_to);

                    html = data.outerContextStart + data.innerContextStart + data.html +
                        data.innerContextEnd + data.outerContextEnd;
                    html = lineNumberingService.insertLineNumbers(html, lineLength, highlight, null, line_from);

                    return html;
                },
                getTextRemainderAfterLastChangeRecommendation: function(versionId, changes, highlight) {
                    var maxLine = 0;
                    for (var i = 0; i < changes.length; i++) {
                        if (changes[i].line_to > maxLine) {
                            maxLine = changes[i].line_to;
                        }
                    }

                    var lineLength = Config.get('motions_line_length').value,
                        html = lineNumberingService.insertLineNumbers(this.getVersion(versionId).text, lineLength);

                    var data = diffService.extractRangeByLineNumbers(html, maxLine, null);
                    html = data.outerContextStart + data.innerContextStart +
                        data.html +
                        data.innerContextEnd + data.outerContextEnd;
                    html = lineNumberingService.insertLineNumbers(html, lineLength, highlight, null, maxLine);

                    return html;
                },
                _getTextWithChangeRecommendations: function (versionId, highlight, statusCompareCb) {
                    var lineLength = Config.get('motions_line_length').value,
                        html = this.getVersion(versionId).text,
                        changes = this.getChangeRecommendations(versionId, 'DESC');

                    for (var i = 0; i < changes.length; i++) {
                        var change = changes[i];
                        if (typeof statusCompareCb === 'undefined' || statusCompareCb(change.rejected)) {
                            html = lineNumberingService.insertLineNumbers(html, lineLength);
                            html = diffService.replaceLines(html, change.text, change.line_from, change.line_to);
                        }
                    }

                    return lineNumberingService.insertLineNumbers(html, lineLength, highlight);
                },
                getTextWithAllChangeRecommendations: function (versionId, highlight) {
                    return this._getTextWithChangeRecommendations(versionId, highlight, function() {
                        return true;
                    });
                },
                getTextWithoutRejectedChangeRecommendations: function (versionId, highlight) {
                    return this._getTextWithChangeRecommendations(versionId, highlight, function(rejected) {
                        return !rejected;
                    });
                },
                getTextByMode: function(mode, versionId, highlight) {
                    /*
                     * @param mode ['original', 'diff', 'changed', 'agreed']
                     * @param versionId [if undefined, active_version will be used]
                     * @param highlight [the line number to highlight]
                     */
                    var text;
                    switch (mode) {
                        case 'original':
                            text = this.getTextWithLineBreaks(versionId, highlight);
                            break;
                        case 'diff':
                            var changes = this.getChangeRecommendations(versionId, 'ASC');
                            text = '';
                            for (var i = 0; i < changes.length; i++) {
                                text += this.getTextBetweenChangeRecommendations(versionId, (i === 0 ? null : changes[i - 1]), changes[i], highlight);
                                text += changes[i].getDiff(this, versionId);
                            }
                            text += this.getTextRemainderAfterLastChangeRecommendation(versionId, changes);
                            break;
                        case 'changed':
                            text = this.getTextWithAllChangeRecommendations(versionId, highlight);
                            break;
                        case 'agreed':
                            text = this.getTextWithoutRejectedChangeRecommendations(versionId, highlight);
                            break;
                    }
                    return text;
                },
                setTextStrippingLineBreaks: function (text) {
                    this.text = lineNumberingService.stripLineNumbers(text);
                },
                getReason: function (versionId) {
                    return this.getVersion(versionId).reason;
                },
                // full state name - optional with custom state name extension
                // depended by state and provided by a custom comment field
                getStateName: function () {
                    var name = '';
                    var additionalName = '';
                    if (this.state) {
                        name = gettextCatalog.getString(this.state.name);
                        if (this.state.show_state_extension_field) {
                            // check motion comment fields for flag 'forState'
                            var fields = Config.get('motions_comments').value;
                            var index = _.findIndex(fields, ['forState', true]);
                            if (index > -1) {
                                additionalName = ' ' + this.comments[index];
                            }
                        }
                    }
                    return name + additionalName;
                },
                // full recommendation string - optional with custom recommendationextension
                // depended by state and provided by a custom comment field
                getRecommendationName: function () {
                    var recommendation = '';
                    var additionalName = '';
                    if (Config.get('motions_recommendations_by').value !== '' && this.recommendation) {
                        recommendation = gettextCatalog.getString(this.recommendation.recommendation_label);
                        if (this.recommendation.show_recommendation_extension_field) {
                            // check motion comment fields for flag 'forRecommendation'
                            var fields = Config.get('motions_comments').value;
                            var index = _.findIndex(fields, ['forRecommendation', true]);
                            if (index > -1) {
                                additionalName = ' ' + this.comments[index];
                            }
                        }
                    }
                    return recommendation + additionalName;
                },
                // link name which is shown in search result
                getSearchResultName: function () {
                    return this.getTitle();
                },
                // return true if a specific relation matches for given searchquery
                // e.g. submitter, supporters or category
                hasSearchResult: function (results, searchquery) {
                    var motion = this;
                    // search for submitters and supporters (check if any user.id from already found users matches)
                    var foundSomething = _.some(results, function(result) {
                        if (result.getResourceName() === "users/user") {
                            if (_.some(motion.submitters, {'id': result.id})) {
                                return true;
                            } else if (_.some(motion.supporters, { 'id': result.id })) {
                                return true;
                            }
                        }
                    });
                    // search for category
                    if (!foundSomething && motion.category && motion.category.name.match(new RegExp(searchquery, 'i'))) {
                        foundSomething = true;
                    }
                    return foundSomething;
                },
                getChangeRecommendations: function (versionId, order) {
                    /*
                     * Returns all change recommendations for this given version, sorted by line
                     * @param versionId
                     * @param order ['DESC' or 'ASC' (default)]
                     * @returns {*}
                     */
                    versionId = versionId || this.active_version;
                    order = order || 'ASC';
                    return MotionChangeRecommendation.filter({
                        where: {
                            motion_version_id: versionId
                        },
                        orderBy: [
                            ['line_from', order]
                        ]
                    });
                },
                isAmendment: function () {
                    return this.parent_id !== null;
                },
                hasAmendments: function () {
                    return DS.filter('motions/motion', {parent_id: this.id}).length > 0;
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
                     * - change_recommendation
                     *
                     *  NOTE: If you update this function please think about
                     *        server permissions, see motions/views.py.
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
                                    (_.indexOf(this.submitters, operator.user) !== -1) &&
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
                                (_.indexOf(this.submitters, operator.user) === -1) &&
                                (_.indexOf(this.supporters, operator.user) === -1)
                            );
                        case 'unsupport':
                            return this.state.allow_support && _.indexOf(this.supporters, operator.user) !== -1;
                        case 'change_state':
                            return operator.hasPerms('motions.can_manage');
                        case 'reset_state':
                            return operator.hasPerms('motions.can_manage');
                        case 'change_recommendation':
                            return operator.hasPerms('motions.can_manage');
                        case 'can_manage':
                            return operator.hasPerms('motions.can_manage');
                        case 'can_see_amendments':
                            var result;
                            if (operator.hasPerms('motions.can_create')) {
                                result = Config.get('motions_amendments_enabled').value &&
                                    (this.hasAmendments() || this.isAllowed('can_create_amendment'));
                            } else if (operator.hasPerms('motions.can_see')) {
                                result = Config.get('motions_amendments_enabled').value && this.hasAmendments();
                            }
                            return result;
                        case 'can_create_amendment':
                            return (
                                operator.hasPerms('motions.can_create') &&
                                Config.get('motions_amendments_enabled').value &&
                                ( !this.isAmendment() ||
                                  (this.isAmendment() && OpenSlidesSettings.MOTIONS_ALLOW_AMENDMENTS_OF_AMENDMENTS))
                            );
                        default:
                            return false;
                    }
                },
                /* Overrides from jsDataModel factory.
                 * Also sets the projection mode if given; If not it projects in 'original' mode. */
                project: function (projectorId, mode) {
                    // if this object is already projected on projectorId, delete this element from this projector
                    var isProjected = this.isProjectedWithMode();
                    _.forEach(isProjected, function (mapping) {
                        $http.post('/rest/core/projector/' + mapping.projectorId + '/clear_elements/');
                    });
                    // Was there a projector with the same id and mode as the given id and mode?
                    // If not, project the motion.
                    var wasProjectedBefore = _.some(isProjected, function (mapping) {
                        var value = (mapping.projectorId === projectorId);
                        if (mode) {
                            value = value && (mapping.mode === mode);
                        }
                        return value;
                    });
                    mode = mode || 'original';
                    if (!wasProjectedBefore) {
                        return $http.post(
                            '/rest/core/projector/' + projectorId + '/prune_elements/',
                            [{name: name,
                              id: this.id,
                              mode: mode}]
                        );
                    }
                },
                isProjected: function (mode) {
                    var self = this;
                    var predicate = function (element) {
                        var value = element.name === name &&
                            element.id === self.id;
                        if (mode) {
                            value = value && (element.mode === mode);
                        }
                        return value;
                    };
                    var projectorIds = [];
                    _.forEach(Projector.getAll(), function (projector) {
                        if (typeof _.findKey(projector.elements, predicate) === 'string') {
                            projectorIds.push(projector.id);
                        }
                    });
                    return projectorIds;
                },
                /* returns a list of mappings between projector id and mode:
                 * [ {projectorId: 2, mode: 'original'}, ... ] */
                isProjectedWithMode: function () {
                    var self = this;
                    var mapping = [];
                    _.forEach(Projector.getAll(), function (projector) {
                        _.forEach(projector.elements, function (element) {
                            if (element.name === name && element.id === self.id) {
                                mapping.push({
                                    projectorId: projector.id,
                                    mode: element.mode || 'original',
                                });
                            }
                        });
                    });
                    return mapping;
                },
            },
            relations: {
                belongsTo: {
                    'motions/category': {
                        localField: 'category',
                        localKey: 'category_id',
                    },
                    'motions/motion-block': {
                        localField: 'motionBlock',
                        localKey: 'motion_block_id',
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
                    'motions/workflowstate': [
                        {
                            localField: 'state',
                            localKey: 'state_id',
                        },
                        {
                            localField: 'recommendation',
                            localKey: 'recommendation_id',
                        }
                    ]
                }
            }
        });
    }
])

// Service for generic comment fields
.factory('MotionComment', [
    'Config',
    'operator',
    'Editor',
    function (Config, operator, Editor) {
        return {
            getFormFields: function () {
                var fields = Config.get('motions_comments').value;
                return _.map(
                    _.filter(fields, function(element) { return !element.forState && !element.forRecommendation; }),
                    function (field) {
                        return {
                            key: 'comment ' + field.name,
                            type: 'editor',
                            templateOptions: {
                                label: field.name,
                            },
                            data: {
                                ckeditorOptions: Editor.getOptions()
                            },
                            hide: !operator.hasPerms("motions.can_see_and_manage_comments")
                        };
                    }
                );
            },
            populateFields: function (motion) {
                // Populate content of motion.comments to the single comment
                // fields like motion['comment MyComment'], motion['comment MyOtherComment'], ...
                var fields = Config.get('motions_comments').value;
                if (!motion.comments) {
                    motion.comments = [];
                }
                for (var i = 0; i < fields.length; i++) {
                    motion['comment ' + fields[i].name] = motion.comments[i];
                }
            },
            populateFieldsReverse: function (motion) {
                // Reverse equivalent to populateFields.
                var fields = Config.get('motions_comments').value;
                motion.comments = [];
                for (var i = 0; i < fields.length; i++) {
                    motion.comments.push(motion['comment ' + fields[i].name] || '');
                }
            },
            getFieldNameForFlag: function (flag) {
                var fields = Config.get('motions_comments').value;
                var fieldName = '';
                var index = _.findIndex(fields, [flag, true]);
                if (index > -1) {
                    fieldName = fields[index].name;
                }
                return fieldName;
            },
        };
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

.factory('MotionChangeRecommendation', [
    'DS',
    'Config',
    'jsDataModel',
    'diffService',
    'lineNumberingService',
    'gettextCatalog',
    function (DS, Config, jsDataModel, diffService, lineNumberingService, gettextCatalog) {
        return DS.defineResource({
            name: 'motions/motionchangerecommendation',
            useClass: jsDataModel,
            methods: {
                saveStatus: function() {
                    this.DSSave();
                },
                getDiff: function(motion, version, highlight) {
                    var lineLength = Config.get('motions_line_length').value,
                        html = lineNumberingService.insertLineNumbers(motion.getVersion(version).text, lineLength);

                    var data = diffService.extractRangeByLineNumbers(html, this.line_from, this.line_to),
                        oldText = data.outerContextStart + data.innerContextStart +
                            data.html + data.innerContextEnd + data.outerContextEnd;

                    var diff = diffService.diff(oldText, this.text, lineLength, this.line_from);
                    return lineNumberingService.insertLineNumbers(diff, lineLength, highlight, null, this.line_from);
                },
                getType: function(original_full_html) {
                    return this.type;
                },
                getTitle: function(original_full_html) {
                    var title;
                    if (this.line_to > (this.line_from + 1)) {
                        title = gettextCatalog.getString('%TYPE% from line %FROM% to %TO%');
                    } else {
                        title = gettextCatalog.getString('%TYPE% in line %FROM%');
                    }
                    switch (this.getType(original_full_html)) {
                        case diffService.TYPE_INSERTION:
                            title = title.replace('%TYPE%', gettextCatalog.getString('Insertion'));
                            break;
                        case diffService.TYPE_DELETION:
                            title = title.replace('%TYPE%', gettextCatalog.getString('Deletion'));
                            break;
                        case diffService.TYPE_REPLACEMENT:
                            title = title.replace('%TYPE%', gettextCatalog.getString('Replacement'));
                            break;
                    }
                    title = title.replace('%FROM%', this.line_from).replace('%TO%', (this.line_to - 1));
                    return title;
                }
            }
        });
    }
])

.run([
    'Motion',
    'Category',
    'Workflow',
    'MotionChangeRecommendation',
    function(Motion, Category, Workflow, MotionChangeRecommendation) {}
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
        gettext('Acceptance');
        gettext('rejected');
        gettext('Reject');
        gettext('Rejection');
        gettext('not decided');
        gettext('Do not decide');
        gettext('No decision');
        // workflow 2
        gettext('Complex Workflow');
        gettext('published');
        gettext('permitted');
        gettext('Permit');
        gettext('Permission');
        gettext('accepted');
        gettext('Accept');
        gettext('Acceptance');
        gettext('rejected');
        gettext('Reject');
        gettext('Rejection');
        gettext('withdrawed');
        gettext('Withdraw');
        gettext('adjourned');
        gettext('Adjourn');
        gettext('Adjournment');
        gettext('not concerned');
        gettext('Do not concern');
        gettext('No concernment');
        gettext('refered to committee');
        gettext('Refer to committee');
        gettext('Referral to committee');
        gettext('needs review');
        gettext('Needs review');
        gettext('rejected (not authorized)');
        gettext('Reject (not authorized)');
        gettext('Rejection (not authorized)');
    }
]);

}());
