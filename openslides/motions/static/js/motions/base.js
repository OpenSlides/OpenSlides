(function () {

"use strict";

angular.module('OpenSlidesApp.motions', [
    'OpenSlidesApp.motions.motionBlock',
    'OpenSlidesApp.motions.lineNumbering',
    'OpenSlidesApp.motions.diff',
    'OpenSlidesApp.poll.majority',
    'OpenSlidesApp.users',
])

.factory('MotionState', [
    'DS',
    function (DS) {
        return DS.defineResource({
            name: 'motions/state',
            methods: {
                getNextStates: function () {
                    return _.map(this.next_states_id, function (stateId) {
                        return DS.get('motions/state', stateId);
                    });
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
                    return DS.filter('motions/state', params);
                }
            },
            relations: {
                hasOne: {
                    'motions/workflow': {
                        localField: 'workflow',
                        localKey: 'workflow_id',
                    }
                }
            },
        });
    }
])

.factory('Workflow', [
    'DS',
    function (DS) {
        return DS.defineResource({
            name: 'motions/workflow',
            methods: {
                getFirstState: function () {
                    return DS.get('motions/state', this.first_state_id);
                },
            },
            relations: {
                hasMany: {
                    'motions/state': {
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
            name: 'motions/motion-poll',
            relations: {
                belongsTo: {
                    'motions/motion': {
                        localField: 'motion',
                        localKey: 'motion_id',
                    }
                }
            },
            beforeInject: function (resource, instance) {
                var attrs = ['yes', 'no', 'abstain', 'votescast', 'votesinvalid', 'votesvalid'];
                _.forEach(attrs, function (attr) {
                    if (instance[attr] !== null) {
                        instance[attr] = parseFloat(instance[attr]);
                    }
                });
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
                        percentNumber = Math.round(vote * 100 / (base) * 100) / 100;
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

.provider('MotionPollDecimalPlaces', [
    function () {
        this.$get = ['$q', function ($q) {
            return {
                getPlaces: function (poll, find) {
                    if (find) {
                        return $q(function (resolve) {
                            resolve(0);
                        });
                    } else {
                        return 0;
                    }
                },
            };
        }];
    }
])

.factory('MotionStateAndRecommendationParser', [
    'DS',
    'gettextCatalog',
    function (DS, gettextCatalog) {
        return {
            formatMotion: function (motion) {
                return '[motion:' + motion.id + ']';
            },
            parse: function (recommendation) {
                return recommendation.replace(/\[motion:(\d+)\]/g, function (match, id) {
                    var motion = DS.get('motions/motion', id);
                    if (motion) {
                        return motion.identifier ? motion.identifier : motion.getTitle();
                    } else {
                        return gettextCatalog.getString('<unknown motion>');
                    }
                });
            },
        };
    }
])

.factory('Submitter', [
    'DS',
    function (DS) {
        return DS.defineResource({
            name: 'motions/submitter',
            relations: {
                belongsTo: {
                    'users/user': {
                        localField: 'user',
                        localKey: 'user_id',
                    }
                }
            }
        });
    }
])

.factory('Motion', [
    'DS',
    '$http',
    '$cacheFactory',
    'MotionPoll',
    'MotionStateAndRecommendationParser',
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
    'ProjectHelper',
    'operator',
    'UnifiedChangeObjectCollission',
    function(DS, $http, $cacheFactory, MotionPoll, MotionStateAndRecommendationParser, MotionChangeRecommendation,
        MotionComment, jsDataModel, gettext, gettextCatalog, Config, lineNumberingService,
        diffService, OpenSlidesSettings, Projector, ProjectHelper, operator, UnifiedChangeObjectCollission) {

        var diffCache = $cacheFactory('motion.service');

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
            computed: {
                isAmendment: function () {
                    return this.parent_id !== null;
                },
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
                isParagraphBasedAmendment: function () {
                    var version = this.getVersion();
                    return this.isAmendment && version.amendment_paragraphs;
                },
                getTitle: function (versionId) {
                    return this.getVersion(versionId).title;
                },
                getAgendaTitle: function () {
                    var title = gettextCatalog.getString('Motion');
                    if (this.identifier) {
                        title += ' ' + this.identifier;
                    } else {
                        title += ' (' + this.getTitle() + ')';
                    }
                    return title;
                },
                getListOfSpeakersTitle: function () {
                    var title = gettextCatalog.getString('Motion');
                    if (this.identifier) {
                        title += ' ' + this.identifier;
                    } else {
                        title += ' (' + this.getTitle() + ')';
                    }
                    return title;
                },
                getTitleWithChanges: function (changeRecommendationMode, versionId) {
                    var titleChange = this.getTitleChangeRecommendation(versionId);
                    var title;
                    if (titleChange) {
                        if (changeRecommendationMode === "changed") {
                            title = titleChange.text;
                        } else if ((changeRecommendationMode === 'agreed' ||
                                changeRecommendationMode === 'modified_agreed') && !titleChange.rejected) {
                            title = titleChange.text;
                        } else {
                            title = this.getTitle();
                        }
                    } else {
                        title = this.getTitle();
                    }
                    return title;
                },
                getSequentialNumber: function () {
                    var id = this.id + '';
                    var zeros = Math.max(0, OpenSlidesSettings.MOTION_IDENTIFIER_MIN_DIGITS - id.length);
                    for (var i = 0; i < zeros; i++) {
                        id = '0' + id;
                    }
                    return id;
                },
                getText: function (versionId) {
                    return this.getVersion(versionId).text;
                },
                getTextWithLineBreaks: function (versionId, highlight, callback) {
                    var lineLength = Config.get('motions_line_length').value,
                        html = this.getVersion(versionId).text;

                    return lineNumberingService.insertLineNumbers(html, lineLength, highlight, callback);
                },
                getModifiedFinalVersionWithLineBreaks: function (versionId) {
                    var lineLength = Config.get('motions_line_length').value,
                        html = this.getVersion(versionId).modified_final_version;

                    return lineNumberingService.insertLineNumbers(html, lineLength);
                },
                getTextBetweenChanges: function (versionId, change1, change2, highlight) {
                    var line_from = (change1 ? change1.line_to : 1),
                        line_to = (change2 ? change2.line_from : null);

                    if (line_from > line_to) {
                        throw 'Invalid call of getTextBetweenChanges: change1 needs to be before change2';
                    }
                    if (line_from === line_to) {
                        return '';
                    }

                    return this.getTextInLineRange(versionId, line_from, line_to, highlight);
                },
                getTextInLineRange: function (versionId, line_from, line_to, highlight) {
                    var lineLength = Config.get('motions_line_length').value,
                        htmlRaw = this.getVersion(versionId).text;

                    var cacheKey = 'getTextInLineRange ' + line_from + ' ' + line_to + ' ' + highlight + ' ' +
                        lineNumberingService.djb2hash(htmlRaw),
                        cached = diffCache.get(cacheKey);
                    if (!angular.isUndefined(cached)) {
                        return cached;
                    }

                    var html = lineNumberingService.insertLineNumbers(htmlRaw, lineLength),
                        data;

                    try {
                        data = diffService.extractRangeByLineNumbers(html, line_from, line_to);
                    } catch (e) {
                        // This only happens (as far as we know) when the motion text has been altered (shortened)
                        // without modifying the change recommendations accordingly.
                        // That's a pretty serious inconsistency that should not happen at all,
                        // we're just doing some basic damage control here.
                        var msg = 'Inconsistent data. A change recommendation is probably referring to a non-existant line number.';
                        return '<em style="color: red; font-weight: bold;">' + msg + '</em>';
                    }

                    // Add "merge-before"-css-class if the first line begins in the middle of a paragraph. Used for PDF.
                    html = diffService.addCSSClassToFirstTag(data.outerContextStart + data.innerContextStart, "merge-before") +
                        data.html + data.innerContextEnd + data.outerContextEnd;
                    html = lineNumberingService.insertLineNumbers(html, lineLength, highlight, null, line_from);

                    diffCache.put(cacheKey, html);

                    return html;
                },
                getTextRemainderAfterLastChange: function(versionId, changes, highlight) {
                    var maxLine = 0;
                    for (var i = 0; i < changes.length; i++) {
                        if (changes[i].line_to > maxLine) {
                            maxLine = changes[i].line_to;
                        }
                    }

                    var lineLength = Config.get('motions_line_length').value,
                        html = lineNumberingService.insertLineNumbers(this.getVersion(versionId).text, lineLength),
                        data;

                    try {
                        data = diffService.extractRangeByLineNumbers(html, maxLine, null);
                    } catch (e) {
                        // This only happens (as far as we know) when the motion text has been altered (shortened)
                        // without modifying the change recommendations accordingly.
                        // That's a pretty serious inconsistency that should not happen at all,
                        // we're just doing some basic damage control here.
                        var msg = 'Inconsistent data. A change recommendation is probably referring to a non-existant line number.';
                        return '<em style="color: red; font-weight: bold;">' + msg + '</em>';
                    }

                    if (data.html !== '') {
                        // Add "merge-before"-css-class if the first line begins in the middle of a paragraph. Used for PDF.
                        html = diffService.addCSSClassToFirstTag(data.outerContextStart + data.innerContextStart, "merge-before") +
                            data.html + data.innerContextEnd + data.outerContextEnd;
                        html = lineNumberingService.insertLineNumbers(html, lineLength, highlight, null, maxLine);
                    } else {
                        // Prevents empty lines at the end of the motion
                        html = '';
                    }
                    return html;
                },
                _getTextWithChanges: function (versionId, highlight, lineBreaks, recommendation_filter, amendment_filter) {
                    var lineLength = Config.get('motions_line_length').value,
                        html = this.getVersion(versionId).text,
                        change_recommendations = this.getTextChangeRecommendations(versionId, 'DESC'),
                        amendments = this.getParagraphBasedAmendments();

                    var allChanges = [];
                    change_recommendations.filter(recommendation_filter).forEach(function(change) {
                        allChanges.push({"text": change.text, "line_from": change.line_from, "line_to": change.line_to});
                    });
                    amendments.filter(amendment_filter).forEach(function(amend) {
                        var change = amend.getAmendmentsAffectedLinesChanged();
                        allChanges.push({"text": change.text, "line_from": change.line_from, "line_to": change.line_to});
                    });

                    // Changes need to be applied from the bottom up, to prevent conflicts with changing line numbers.
                    allChanges.sort(function(change1, change2) {
                        if (change1.line_from < change2.line_from) {
                            return 1;
                        } else if (change1.line_from > change2.line_from) {
                            return -1;
                        }  else {
                            return 0;
                        }
                    });


                    allChanges.forEach(function(change) {
                        html = lineNumberingService.insertLineNumbers(html, lineLength, null, null, 1);
                        html = diffService.replaceLines(html, change.text, change.line_from, change.line_to);
                    });

                    if (lineBreaks) {
                        html = lineNumberingService.insertLineNumbers(html, lineLength, highlight, null, 1);
                    }

                    return html;
                },
                getTextWithAllChangeRecommendations: function (versionId, highlight, lineBreaks) {
                    return this._getTextWithChanges(versionId, highlight, lineBreaks, function() {
                        return true; // All change recommendations
                    }, function() {
                        return false; // No amendments
                    });
                },
                getTextWithAgreedChanges: function (versionId, highlight, lineBreaks) {
                    return this._getTextWithChanges(versionId, highlight, lineBreaks, function(recommendation) {
                        return !recommendation.rejected;
                    }, function(amendment) {
                        if (amendment.state && amendment.state.name === 'rejected') {
                            return false;
                        }
                        if (amendment.state && amendment.state.name === 'accepted') {
                            return true;
                        }
                        return (amendment.recommendation && amendment.recommendation.name === 'accepted');
                    });
                },
                getTextByMode: function(mode, versionId, highlight, lineBreaks) {
                    /*
                     * @param mode ['original', 'diff', 'changed', 'agreed', 'modified_agreed']
                     * @param versionId [if undefined, active_version will be used]
                     * @param highlight [the line number to highlight]
                     * @param lineBreaks [if line numbers / breaks should be included in the result]
                     */

                    lineBreaks = (lineBreaks === undefined ? true : lineBreaks);

                    var text;
                    switch (mode) {
                        case 'original':
                            if (lineBreaks) {
                                text = this.getTextWithLineBreaks(versionId, highlight);
                            } else {
                                text = this.getVersion(versionId).text;
                            }
                            break;
                        case 'diff':
                            var amendments_crs = this.getTextChangeRecommendations(versionId, 'ASC').map(function (cr) {
                                return cr.getUnifiedChangeObject();
                            }).concat(
                                this.getParagraphBasedAmendmentsForDiffView().map(function (amendment) {
                                    return amendment.getUnifiedChangeObject();
                                })
                            );
                            amendments_crs.sort(function (change1, change2) {
                                if (change1.line_from > change2.line_from) {
                                    return 1;
                                } else if (change1.line_from < change2.line_from) {
                                    return -1;
                                } else {
                                    return 0;
                                }
                            });

                            text = '';
                            for (var i = 0; i < amendments_crs.length; i++) {
                                if (i===0) {
                                    text += this.getTextBetweenChanges(versionId, null, amendments_crs[0], highlight);
                                } else if (amendments_crs[i - 1].line_to < amendments_crs[i].line_from) {
                                    text += this.getTextBetweenChanges(versionId, amendments_crs[i - 1], amendments_crs[i], highlight);

                                }
                                text += amendments_crs[i].getDiff(this, versionId, highlight);
                            }
                            text += this.getTextRemainderAfterLastChange(versionId, amendments_crs);

                            if (!lineBreaks) {
                                text = lineNumberingService.stripLineNumbers(text);
                            }
                            break;
                        case 'changed':
                            text = this.getTextWithAllChangeRecommendations(versionId, highlight, lineBreaks);
                            break;
                        case 'agreed':
                            text = this.getTextWithAgreedChanges(versionId, highlight, lineBreaks);
                            break;
                        case 'modified_agreed':
                            text = this.getModifiedFinalVersion(versionId);
                            if (text) {
                                // Insert line numbers
                                var lineLength = Config.get('motions_line_length').value;
                                text = lineNumberingService.insertLineNumbers(text, lineLength);
                            } else {
                                // Use the agreed version as fallback
                                text = this.getTextByMode('agreed', versionId, highlight, lineBreaks);
                            }
                            break;
                    }
                    return text;
                },
                getTextParagraphs: function(versionId, lineBreaks) {
                    /*
                     * @param versionId [if undefined, active_version will be used]
                     * @param lineBreaks [if line numbers / breaks should be included in the result]
                     */
                    var text;
                    if (lineBreaks) {
                        text = this.getTextWithLineBreaks(versionId);
                    } else {
                        text = this.getVersion(versionId).text;
                    }

                    return lineNumberingService.splitToParagraphs(text);
                },
                getTextHeadings: function(versionId) {
                    var html = this.getTextWithLineBreaks(versionId);
                    return lineNumberingService.getHeadingsWithLineNumbers(html);
                },
                getAmendmentParagraphsByMode: function (mode, versionId, lineBreaks) {
                    /*
                     * @param mode ['original', 'diff', 'changed']
                     * @param versionId [if undefined, active_version will be used]
                     * @param lineBreaks [if line numbers / breaks should be included in the result]
                     *
                     * Structure of the return array elements:
                     * {
                     *   "paragraphNo": paragraph number, starting with 0
                     *   "lineFrom": First line number of the affected paragraph
                     *   "lineTo": Last line number of the affected paragraph;
                     *             refers to the line breaking element at the end, i.e. the start of the following line
                     *   "text": the actual text
                     * }
                     */

                    lineBreaks = (lineBreaks === undefined ? true : lineBreaks);

                    var cacheKey = 'getAmendmentParagraphsByMode ' + mode + ' ' + versionId + ' ' + lineBreaks +
                        lineNumberingService.djb2hash(JSON.stringify(this.getVersion(versionId).amendment_paragraphs)),
                        cached = diffCache.get(cacheKey);
                    if (!angular.isUndefined(cached)) {
                        return cached;
                    }

                    var original_text = this.getParentMotion().getTextByMode('original', null, null, true);
                    var original_paragraphs = lineNumberingService.splitToParagraphs(original_text);

                    var output = [];

                    this.getVersion(versionId).amendment_paragraphs.forEach(function(paragraph_amend, paragraphNo) {
                        if (paragraph_amend === null) {
                            return;
                        }
                        if (original_paragraphs[paragraphNo] === undefined) {
                            throw "The amendment appears to have more paragraphs than the motion. This means, the data might be corrupt";
                        }
                        var paragraph_orig = original_paragraphs[paragraphNo];
                        var line_range = lineNumberingService.getLineNumberRange(paragraph_orig);
                        var line_length = Config.get('motions_line_length').value;
                        paragraph_orig = lineNumberingService.stripLineNumbers(paragraph_orig);

                        var text = null;

                        switch (mode) {
                            case "diff":
                                if (lineBreaks) {
                                    text = diffService.diff(paragraph_orig, paragraph_amend, line_length, line_range.from);
                                } else {
                                    text = diffService.diff(paragraph_orig, paragraph_amend);
                                }
                                break;
                            case "original":
                                text = paragraph_orig;
                                if (lineBreaks) {
                                    text = lineNumberingService.insertLineNumbers(text, line_length, null, null, line_range.from);
                                }
                                break;
                            case "changed":
                                text = paragraph_amend;
                                if (lineBreaks) {
                                    text = lineNumberingService.insertLineNumbers(text, line_length, null, null, line_range.from);
                                }
                                break;
                            default:
                                throw "Invalid text mode: " + mode;
                        }
                        output.push({
                            "paragraphNo": paragraphNo,
                            "lineFrom": line_range.from,
                            "lineTo": line_range.to,
                            "text": text
                        });
                    });

                    diffCache.put(cacheKey, output);

                    return output;
                },
                getAmendmentParagraphsLinesByMode: function (mode, versionId, lineBreaks) {
                    /*
                     * @param mode ['original', 'diff', 'changed']
                     * @param versionId [if undefined, active_version will be used]
                     * @param lineBreaks [if line numbers / breaks should be included in the result]
                     *
                     * Structure of the return array elements:
                     * {
                     *   "paragraphNo": paragraph number, starting with 0
                     *   "paragraphLineFrom": First line number of the affected paragraph
                     *   "paragraphLineTo": End of the affected paragraph (line number + 1)
                     *   "diffLineFrom": First line number of the affected lines
                     *   "diffLineTo": End of the affected lines (line number + 1)
                     *   "textPre": The beginning of the paragraph, before the diff
                     *   "text": the diff
                     *   "textPost": The end of the paragraph, after the diff
                     * }
                     */

                    if (!this.isParagraphBasedAmendment() || !this.getParentMotion()) {
                        return [];
                    }

                    var cacheKey = 'getAmendmentParagraphsLinesByMode ' + mode + ' ' + versionId + ' ' + lineBreaks +
                        lineNumberingService.djb2hash(JSON.stringify(this.getVersion(versionId).amendment_paragraphs)),
                        cached = diffCache.get(cacheKey);
                    if (!angular.isUndefined(cached)) {
                        return cached;
                    }

                    var original_text = this.getParentMotion().getTextByMode('original', null, null, true);
                    var original_paragraphs = lineNumberingService.splitToParagraphs(original_text);

                    var output = [];

                    this.getVersion(versionId).amendment_paragraphs.forEach(function(paragraph_amend, paragraphNo) {
                        if (paragraph_amend === null) {
                            return;
                        }
                        if (original_paragraphs[paragraphNo] === undefined) {
                            throw "The amendment appears to have more paragraphs than the motion. This means, the data might be corrupt";
                        }
                        var line_length = Config.get('motions_line_length').value,
                            paragraph_orig = original_paragraphs[paragraphNo],
                            paragraph_line_range = lineNumberingService.getLineNumberRange(paragraph_orig),
                            diff = diffService.diff(paragraph_orig, paragraph_amend),
                            affected_lines = diffService.detectAffectedLineRange(diff);

                        if (!affected_lines) {
                            return;
                        }

                        // TODO: Make this work..
                        var base_paragraph;
                        switch (mode) {
                            case 'original':
                                //base_paragraph = paragraph_orig;
                                //base_paragraph = diffService.diff(paragraph_orig, paragraph_orig, line_length, paragraph_line_range.from);
                                base_paragraph = diff;
                                break;
                            case 'diff':
                                base_paragraph = diff;
                                break;
                            case 'changed':
                                //base_paragraph = paragraph_amend;
                                //base_paragraph = diffService.diff(paragraph_amend, paragraph_amend, line_length, paragraph_line_range.from);
                                base_paragraph = diff;
                                break;
                        }

                        var textPre = '';
                        var textPost = '';
                        if (affected_lines.from > paragraph_line_range.from) {
                            textPre = diffService.extractRangeByLineNumbers(base_paragraph, paragraph_line_range.from, affected_lines.from);
                            if (lineBreaks) {
                                textPre = diffService.formatDiffWithLineNumbers(textPre, line_length, paragraph_line_range.from);
                            }
                        }
                        if (paragraph_line_range.to > affected_lines.to) {
                            textPost = diffService.extractRangeByLineNumbers(base_paragraph, affected_lines.to, paragraph_line_range.to);
                            if (lineBreaks) {
                                textPost = diffService.formatDiffWithLineNumbers(textPost, line_length, affected_lines.to);
                            }
                        }

                        var text = diffService.extractRangeByLineNumbers(base_paragraph, affected_lines.from, affected_lines.to);
                        if (lineBreaks) {
                            text = diffService.formatDiffWithLineNumbers(text, line_length, affected_lines.from);
                        }

                        output.push({
                            "paragraphNo": paragraphNo,
                            "paragraphLineFrom": paragraph_line_range.from,
                            "paragraphLineTo": paragraph_line_range.to,
                            "diffLineFrom": affected_lines.from,
                            "diffLineTo": affected_lines.to,
                            "textPre": textPre,
                            "text": text,
                            "textPost": textPost
                        });
                    });

                    diffCache.put(cacheKey, output);

                    return output;
                },
                getAmendmentParagraphsLinesDiff: function (versionId) {
                    /*
                     * @param versionId [if undefined, active_version will be used]
                     *
                     */
                    return this.getAmendmentParagraphsLinesByMode('diff', versionId, true);
                },
                getAmendmentsAffectedLinesChanged: function () {
                    var paragraph_diff = this.getAmendmentParagraphsByMode("diff")[0],
                        affected_lines = diffService.detectAffectedLineRange(paragraph_diff.text);

                    var extracted_lines = diffService.extractRangeByLineNumbers(paragraph_diff.text, affected_lines.from, affected_lines.to);

                    var diff_html = extracted_lines.outerContextStart + extracted_lines.innerContextStart +
                            extracted_lines.html + extracted_lines.innerContextEnd + extracted_lines.outerContextEnd;
                    diff_html = diffService.diffHtmlToFinalText(diff_html);

                    return {
                        "line_from": affected_lines.from,
                        "line_to": affected_lines.to,
                        "text": diff_html
                    };
                },
                getUnifiedChangeObject: function () {
                    var paragraph = this.getAmendmentParagraphsByMode("diff")[0];
                    var affected_lines = diffService.detectAffectedLineRange(paragraph.text);

                    if (!affected_lines) {
                        // no changes, no object to use
                        return null;
                    }

                    var extracted_lines = diffService.extractRangeByLineNumbers(paragraph.text, affected_lines.from, affected_lines.to);
                    var lineLength = Config.get('motions_line_length').value;

                    var diff_html = diffService.formatDiffWithLineNumbers(extracted_lines, lineLength, affected_lines.from);

                    var acceptance_state = null;
                    var rejection_state = null;
                    this.state.getRecommendations().forEach(function(state) {
                        if (state.name === "accepted") {
                            acceptance_state = state.id;
                        }
                        if (state.name === "rejected") {
                            rejection_state = state.id;
                        }
                    });

                    // The interface of this object needs to be synchronized with the same method in MotionChangeRecommendation
                    //
                    // The change object needs to be cached to prevent confusing Angular's change detection
                    // Otherwise, a new object would be created with every call, leading to flickering
                    var amendment = this;

                    if (this._change_object === undefined) {
                        // Properties that are guaranteed to be constant
                        this._change_object = {
                            "type": "amendment",
                            "id": "amendment-" + amendment.id,
                            "original": amendment,
                            "saveStatus": function () {
                                // The status needs to be reset first, as the workflow does not allow changing from
                                // acceptance to rejection directly or vice-versa.
                                amendment.setState(null).then(function () {
                                    if (amendment._change_object.accepted) {
                                        amendment.setState(acceptance_state);
                                    }
                                    if (amendment._change_object.rejected) {
                                        amendment.setState(rejection_state);
                                    }
                                });
                            },
                            "getDiff": function (motion, version, highlight) {
                                if (highlight > 0) {
                                    diff_html = lineNumberingService.highlightLine(diff_html, highlight);
                                }
                                return diff_html;
                            }
                        };
                    }

                    // Properties that might change when the Amendment is edited
                    this._change_object.line_from = affected_lines.from;
                    this._change_object.line_to = affected_lines.to;

                    this._change_object.accepted = false;
                    this._change_object.rejected = false;
                    if (this.state && this.state.name === 'rejected') {
                        this._change_object.rejected = true;
                    } else if (this.state && this.state.name === 'accepted') {
                        this._change_object.accepted = true;
                    } else if (this.recommendation && this.recommendation.name === 'rejected') {
                        this._change_object.rejected = true;
                    }

                    UnifiedChangeObjectCollission.populate(this._change_object);

                    return this._change_object;
                },
                setTextStrippingLineBreaks: function (text) {
                    this.text = lineNumberingService.stripLineNumbers(text);
                },
                setModifiedFinalVersionStrippingLineBreaks: function (html) {
                    this.modified_final_version = lineNumberingService.stripLineNumbers(html);
                },
                // Copies to final version to the modified_final_version field
                copyModifiedFinalVersionStrippingLineBreaks: function () {
                    var finalVersion = this.getTextByMode('agreed');
                    this.setModifiedFinalVersionStrippingLineBreaks(finalVersion);
                },
                getModifiedFinalVersion: function (versionId) {
                    return this.getVersion(versionId).modified_final_version;
                },
                getReason: function (versionId) {
                    return this.getVersion(versionId).reason;
                },
                // full state name - optional with custom state name extension
                // depended by state and provided by a custom comment field
                getStateName: function () {
                    var name = '';
                    if (this.state) {
                        name = gettextCatalog.getString(this.state.name);
                        if (this.state.show_state_extension_field) {
                            // check motion comment fields for flag 'forState'
                            var commentFieldForStateId = MotionComment.getFieldIdForFlag('forState');
                            if (commentFieldForStateId > -1) {
                                name += ' ' + this.comments[commentFieldForStateId];
                            }
                        }
                    }
                    return MotionStateAndRecommendationParser.parse(name);
                },
                // ID of the state - or null, if to be reset
                setState: function(state_id) {
                    if (state_id === null) {
                        return $http.put('/rest/motions/motion/' + this.id + '/set_state/', {});
                    } else {
                        return $http.put('/rest/motions/motion/' + this.id + '/set_state/', {'state': state_id});
                    }
                },
                // full recommendation string - optional with custom recommendationextension
                // depended by state and provided by a custom comment field
                getRecommendationName: function () {
                    var recommendation = '';
                    if (Config.get('motions_recommendations_by').value !== '' && this.recommendation) {
                        recommendation = gettextCatalog.getString(this.recommendation.recommendation_label);
                        if (this.recommendation.show_recommendation_extension_field) {
                            // check motion comment fields for flag 'forRecommendation'
                            var commentFieldForRecommendationId = MotionComment.getFieldIdForFlag('forRecommendation');
                            if (commentFieldForRecommendationId > -1) {
                                recommendation += ' ' + this.comments[commentFieldForRecommendationId];
                            }
                        }
                    }
                    return MotionStateAndRecommendationParser.parse(recommendation);
                },
                // ID of the state - or null, if to be reset
                setRecommendation: function(recommendation_id) {
                    if (recommendation_id === null) {
                        return $http.put('/rest/motions/motion/' + this.id + '/set_recommendation/', {});
                    } else {
                        return $http.put('/rest/motions/motion/' + this.id + '/set_recommendation/', {'recommendation': recommendation_id});
                    }
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

                    // search for change recommendation
                    if (!foundSomething) {
                        var recommendations = MotionChangeRecommendation.filter({
                            where: {motion_version_id: this.active_version}
                        });
                        foundSomething = _.some(recommendations, function(recommendation) {
                            if (recommendation.text.match(new RegExp(searchquery, 'i'))) {
                                return true;
                            }
                        });
                    }
                    return foundSomething;
                },
                getTextChangeRecommendations: function (versionId, order) {
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
                    }).filter(function(change) {
                        return change.isTextRecommendation();
                    });
                },
                getTitleChangeRecommendation: function (versionId) {
                    /**
                     * Returns the change recommendation affecting the title, or null
                     * @param versionId
                     * @returns MotionChangeRecommendation|null
                     */
                    versionId = versionId || this.active_version;
                    var changes = MotionChangeRecommendation.filter({
                        where: {
                            motion_version_id: versionId,
                            line_from: 0,
                            line_to: 0
                        }
                    });
                    return (changes.length > 0 ? changes[0] : null);
                },
                getAmendments: function () {
                    return DS.filter('motions/motion', {parent_id: this.id});
                },
                hasAmendments: function () {
                    return DS.filter('motions/motion', {parent_id: this.id}).length > 0;
                },
                getParagraphBasedAmendments: function () {
                    return DS.filter('motions/motion', {parent_id: this.id}).filter(function(amendment) {
                        return (amendment.isParagraphBasedAmendment());
                    });
                },
                getParagraphBasedAmendmentsForDiffView: function () {
                    return _.filter(this.getParagraphBasedAmendments(), function(amendment) {
                        // If no accepted/rejected status is given, only amendments that have a recommendation
                        // of "accepted" and have not been officially rejected are to be shown in the diff-view
                        if (amendment.state && amendment.state.name === 'rejected') {
                            return false;
                        }
                        if (amendment.state && amendment.state.name === 'accepted') {
                            return true;
                        }
                        return (amendment.recommendation && amendment.recommendation.name === 'accepted');
                    });
                },
                getParentMotion: function () {
                    if (this.parent_id > 0) {
                        var parents = DS.filter('motions/motion', {id: this.parent_id});
                        if (parents.length > 0) {
                            return parents[0];
                        } else {
                            return null;
                        }
                    } else {
                        return null;
                    }
                },
                isAllowed: function (action) {
                    /*
                     * Return true if the requested user is allowed to do the specific action.
                     * There are the following possible actions.
                     * - see
                     * - update
                     * - update_submitters
                     * - delete
                     * - create_poll
                     * - support
                     * - unsupport
                     * - change_state
                     * - reset_state
                     * - change_comments
                     * - change_recommendation
                     * - can_manage
                     * - can_see_amendments
                     * - can_create_amendments
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
                        case 'update_submitters':
                            return operator.hasPerms('motions.can_manage');
                        case 'delete':
                            return (
                                operator.hasPerms('motions.can_manage') ||
                                (
                                    (_.indexOf(this.submitters, operator.user) !== -1) &&
                                    this.state.allow_submitter_edit
                                )
                            );
                        case 'create_poll':
                            return (
                                operator.hasPerms('motions.can_manage') &&
                                this.state &&
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
                        case 'change_comments':
                            return operator.hasPerms('motions.can_manage_comments');
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
                                ( !this.isAmendment ||
                                  (this.isAmendment && OpenSlidesSettings.MOTIONS_ALLOW_AMENDMENTS_OF_AMENDMENTS))
                            );
                        default:
                            return false;
                    }
                },
                /* Overrides from jsDataModel factory.
                 * Also sets the projection mode if given; If not it projects in 'original' mode. */
                project: function (projectorId, mode) {
                    // if this object is already projected on projectorId, delete this element from this projector
                    var requestData = {
                        clear_ids: this.isProjected(),
                    };
                    // Was there a projector with the same id and mode as the given id and mode?
                    // If not, project the motion.
                    var wasProjectedBefore = _.some(this.isProjectedWithMode(), function (mapping) {
                        var value = (mapping.projectorId === projectorId);
                        if (mode) {
                            value = value && (mapping.mode === mode);
                        }
                        return value;
                    });
                    mode = mode || Config.get('motions_recommendation_text_mode').value;
                    if (!wasProjectedBefore) {
                        requestData.prune = {
                            id: projectorId,
                            element: {
                                name: name,
                                id: this.id,
                                mode: mode,
                            },
                        };
                    }
                    return ProjectHelper.project(requestData);
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
                isRelatedProjected: function () {
                    // A motion related object is the list of speakers (through the agenda item)
                    if (this.agenda_item) {
                        return this.agenda_item.isListOfSpeakersProjected();
                    } else {
                        return [];
                    }
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
                    'users/user': {
                        localField: 'supporters',
                        localKeys: 'supporters_id',
                    },
                    'motions/motion-poll': {
                        localField: 'polls',
                        foreignKey: 'motion_id',
                    },
                    'motions/submitter': {
                        localField: 'submitters',
                        foreignKey: 'motion_id',
                    },
                },
                hasOne: {
                    'motions/state': [
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
    '$filter',
    'Config',
    'operator',
    'Editor',
    function ($filter, Config, operator, Editor) {
        return {
            isSpecialCommentField: function (field) {
                if (field) {
                    return field.forState || field.forRecommendation;
                } else {
                    return false;
                }
            },
            getCommentsFields: function () {
                var fields = Config.get('motions_comments').value;
                return $filter('excludeDeletedAndForbiddenCommentsFields')(fields);
            },
            getNoSpecialCommentsFields: function () {
                var fields = this.getCommentsFields();
                return $filter('excludeSpecialCommentsFields')(fields);
            },
            getFormFields: function () {
                var fields = this.getNoSpecialCommentsFields();
                return _.map(fields, function (field, id) {
                        return {
                            key: 'comment_' + id,
                            type: 'editor',
                            templateOptions: {
                                label: field.name,
                            },
                            data: {
                                ckeditorOptions: Editor.getOptions()
                            },
                            hide: !operator.hasPerms("motions.can_manage_comments")
                        };
                    }
                );
            },
            getFormField : function (id) {
                var fields = this.getNoSpecialCommentsFields();
                var field = fields[id];
                if (field) {
                    return {
                        key: 'comment_' + id,
                        type: 'editor',
                        templateOptions: {
                            label: field.name,
                        },
                        data: {
                            ckeditorOptions: Editor.getOptions()
                        },
                        hide: !operator.hasPerms("motions.can_manage_comments")
                    };
                }
            },
            populateFields: function (motion) {
                // Populate content of motion.comments to the single comment
                var fields = this.getCommentsFields();
                if (motion.comments) {
                    _.forEach(fields, function (field, id) {
                        motion['comment_' + id] = motion.comments[id];
                    });
                }
            },
            populateFieldsReverse: function (motion) {
                // Reverse equivalent to populateFields.
                var fields = this.getCommentsFields();
                motion.comments = {};
                _.forEach(fields, function (field, id) {
                    motion.comments[id] = motion['comment_' + id] || '';
                });
            },
            getFieldIdForFlag: function (flag) {
                var fields = this.getCommentsFields();
                return _.findKey(fields, [flag, true]);
            },
        };
    }
])

.filter('excludeSpecialCommentsFields', [
    'MotionComment',
    function (MotionComment) {
        return function (commentsFields) {
            var withoutSpecialCommentsFields = {};
            _.forEach(commentsFields, function (field, id) {
                if (!MotionComment.isSpecialCommentField(field)) {
                    withoutSpecialCommentsFields[id] = field;
                }
            });
            return withoutSpecialCommentsFields;
        };
    }
])

.filter('excludeDeletedAndForbiddenCommentsFields', [
    'MotionComment',
    'operator',
    function (MotionComment, operator) {
        return function (commentsFields) {
            var withoutDeletedAndForbiddenCommentsFields = {};
            _.forEach(commentsFields, function (field, id) {
                if (field && (field.public || operator.hasPerms('motions.can_see_comments'))) {
                    withoutDeletedAndForbiddenCommentsFields[id] = field;
                }
            });
            return withoutDeletedAndForbiddenCommentsFields;
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

.factory('MotionChangeRecommendation', [
    'DS',
    'Config',
    'jsDataModel',
    'diffService',
    'lineNumberingService',
    'UnifiedChangeObjectCollission',
    'gettextCatalog',
    function (DS, Config, jsDataModel, diffService, lineNumberingService,
        UnifiedChangeObjectCollission, gettextCatalog) {
        return DS.defineResource({
            name: 'motions/motion-change-recommendation',
            useClass: jsDataModel,
            methods: {
                saveStatus: function() {
                    this.DSSave();
                },
                isTitleRecommendation: function() {
                    return (this.line_from === 0 && this.line_to === 0);
                },
                isTextRecommendation: function() {
                    return (this.line_from !== 0 || this.line_to !== 0);
                },
                getDiff: function(motion, version, highlight) {
                    var lineLength = Config.get('motions_line_length').value,
                        html = lineNumberingService.insertLineNumbers(motion.getVersion(version).text, lineLength),
                        data, oldText;

                    try {
                        data = diffService.extractRangeByLineNumbers(html, this.line_from, this.line_to);
                        oldText = data.outerContextStart + data.innerContextStart +
                            data.html + data.innerContextEnd + data.outerContextEnd;
                    } catch (e) {
                        // This only happens (as far as we know) when the motion text has been altered (shortened)
                        // without modifying the change recommendations accordingly.
                        // That's a pretty serious inconsistency that should not happen at all,
                        // we're just doing some basic damage control here.
                        var msg = 'Inconsistent data. A change recommendation is probably referring to a non-existant line number.';
                        return '<em style="color: red; font-weight: bold;">' + msg + '</em>';
                    }
                    oldText = lineNumberingService.insertLineNumbers(oldText, lineLength, null, null, this.line_from);
                    var diff = diffService.diff(oldText, this.text);

                    // If an insertion makes the line longer than the line length limit, we need two line breaking runs:
                    // - First, for the official line numbers, ignoring insertions (that's been done some lines before)
                    // - Second, another one to prevent the displayed including insertions to exceed the page width
                    diff = lineNumberingService.insertLineBreaksWithoutNumbers(diff, lineLength, true);

                    if (highlight > 0) {
                        diff = lineNumberingService.highlightLine(diff, highlight);
                    }

                    var origBeginning = data.outerContextStart + data.innerContextStart;
                    if (diff.toLowerCase().indexOf(origBeginning.toLowerCase()) === 0) {
                        // Add "merge-before"-css-class if the first line begins in the middle of a paragraph. Used for PDF.
                        diff = diffService.addCSSClassToFirstTag(origBeginning, "merge-before") + diff.substring(origBeginning.length);
                    }

                    return diff;
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
                        case diffService.TYPE_OTHER:
                            title = title.replace('%TYPE%', this.other_description);
                            break;
                    }
                    title = title.replace('%FROM%', this.line_from).replace('%TO%', (this.line_to - 1));
                    return title;
                },
                getUnifiedChangeObject: function () {
                    // The interface of this object needs to be synchronized with the same method in Motion
                    //
                    // The change object needs to be cached to prevent confusing Angular's change detection
                    // Otherwise, a new object would be created with every call, leading to flickering
                    var recommendation = this;

                    if (this._change_object === undefined) {
                        // Properties that are guaranteed to be constant
                        this._change_object = {
                            "type": "recommendation",
                            "other_description": recommendation.other_description,
                            "id": "recommendation-" + recommendation.id,
                            "original": recommendation,
                            "saveStatus": function () {
                                recommendation.rejected = recommendation._change_object.rejected;
                                recommendation.saveStatus();
                            },
                            "getDiff": function (motion, version, highlight) {
                                return recommendation.getDiff(motion, version, highlight);
                            }
                        };
                    }
                    // Properties that might change when the Change Recommendation is edited
                    this._change_object.line_from = recommendation.line_from;
                    this._change_object.line_to = recommendation.line_to;
                    this._change_object.rejected = recommendation.rejected;
                    this._change_object.accepted = !recommendation.rejected;

                    UnifiedChangeObjectCollission.populate(this._change_object);

                    return this._change_object;
                }
            }
        });
    }
])

.factory('UnifiedChangeObjectCollission', [
    function () {
        return {
            populate: function (obj) {
                obj.otherChanges = [];
                obj.setOtherChangesForCollission = function (changes) {
                    obj.otherChanges = changes;
                };
                obj.getCollissions = function(onlyAccepted) {
                    return obj.otherChanges.filter(function(otherChange) {
                        if (onlyAccepted && !otherChange.accepted) {
                            return false;
                        }
                        return (otherChange.id !== obj.id && (
                            (otherChange.line_from >= obj.line_from && otherChange.line_from < obj.line_to) ||
                            (otherChange.line_to > obj.line_from && otherChange.line_to <= obj.line_to) ||
                            (otherChange.line_from < obj.line_from && otherChange.line_to > obj.line_to)
                        ));
                    });
                };
                obj.getAcceptedCollissions = function() {
                    return obj.getCollissions().filter(function(colliding) {
                        return colliding.accepted;
                    });
                };
                obj.setAccepted = function($event) {
                    if (obj.getAcceptedCollissions().length > 0) {
                        $event.preventDefault();
                        $event.stopPropagation();
                        return;
                    }
                    obj.accepted = true;
                    obj.rejected = false;
                    obj.saveStatus();
                };
                obj.setRejected = function($event) {
                    obj.rejected = true;
                    obj.accepted = false;
                    obj.saveStatus();
                };
            },
        };
    }
])

.run([
    'Motion',
    'Category',
    'Workflow',
    'MotionState',
    'MotionChangeRecommendation',
    'Submitter',
    function(Motion, Category, Workflow, MotionState, MotionChangeRecommendation, Submitter) {}
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
