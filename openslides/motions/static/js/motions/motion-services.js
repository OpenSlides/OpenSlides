(function () {

"use strict";

angular.module('OpenSlidesApp.motions.motionservices', ['OpenSlidesApp.motions', 'OpenSlidesApp.motions.lineNumbering'])

/* Generic inline editing factory.
 *
 * getOriginalData: Function that should return the editor data. The editor object is passed.
 * saveData: Function that is called whith the editor object as argument. This function
 *      should prepare the save. If the function returns true, the save process won't be
 *      continued. Else a patch request is send.
 */
.factory('MotionInlineEditing', [
    'Motion',
    '$timeout',
    'gettextCatalog',
    function (Motion, $timeout, gettextCatalog) {
        var createInstance = function ($scope, motion, selector, versioning, ckeditorOptions, getOriginalData, saveData) {
            var obj = {
                active: false,
                changed: false,
                isEditable: false,
                trivialChange: false,
                originalHtml: null,
            };
            ckeditorOptions.readOnly = true;

            obj.setVersion = function (_motion, versionId) {
                motion = _motion; // If this is not updated,
                obj.originalHtml = motion.getTextWithLineBreaks(versionId);
                obj.changed = false;
                if (obj.editor) {
                    obj.editor.setReadOnly(true);
                    obj.editor.setData(obj.originalHtml);
                }
            };

            obj.enable = function () {
                obj.active = true;
                obj.isEditable = true;
                ckeditorOptions.language = localStorage.getItem('language');
                obj.editor = CKEDITOR.inline(selector, ckeditorOptions);
                obj.editor.on('change', function () {
                    $timeout(function() {
                        if (obj.editor.getData() !== obj.originalHtml) {
                            obj.changed = true;
                        } else {
                            obj.changed = false;
                        }
                    });
                });
                obj.revert();
            };

            obj.disable = function () {
                if (obj.editor) {
                    obj.editor.setReadOnly(true);
                    obj.editor.setData(obj.originalHtml, {
                        callback: function() {
                            obj.editor.destroy();
                        }
                    });
                }
                $timeout(function() {
                    obj.active = false;
                    obj.changed = false;
                    obj.isEditable = false;
                });
            };

            // sets editor content to the initial motion state
            obj.revert = function(originalData) {
                if (obj.editor) {
                    obj.originalHtml = getOriginalData(obj);
                    obj.editor.setData(
                        getOriginalData(obj), {
                        callback: function() {
                            obj.originalHtml = obj.editor.getData();
                            obj.editor.setReadOnly(false);
                            $timeout(function() {
                                obj.changed = false;
                            });
                            $timeout(function () {
                                obj.editor.focus();
                            }, 100);
                        }
                    });
                }
            };

            obj.save = function () {
                if (!saveData(obj)) {
                    obj.disable();

                    Motion.inject(motion);
                    // save change motion object on server
                    Motion.save(motion, {method: 'PATCH'}).then(
                        function (success) {
                            if (versioning) {
                                $scope.showVersion(motion.getVersion(-1));
                            }
                            obj.revert();
                        },
                        function (error) {
                            // save error: revert all changes by restore
                            // (refresh) original motion object from server
                            Motion.refresh(motion);
                            obj.revert();
                            var message = '';
                            for (var e in error.data) {
                                message += e + ': ' + error.data[e] + ' ';
                            }
                            $scope.alert = {type: 'danger', msg: message, show: true};
                        }
                    );
                }
            };

            return obj;
        };
        return {
            createInstance: createInstance
        };
    }
])

.factory('MotionCommentsInlineEditing', [
    'MotionInlineEditing',
    'Editor',
    function (MotionInlineEditing, Editor) {
        var createInstances = function ($scope, motion) {
            var commentsInlineEditing = {
                editors: {}, // Map comment id to editor instance.
            };
            var options = Editor.getOptions('inline', 'YOffset');
            _.forEachRight($scope.noSpecialCommentsFields, function (field, id) {
                var inlineEditing = MotionInlineEditing.createInstance($scope, motion,
                    'view-original-comment-inline-editor-' + id, false, options,
                    function (obj) {
                        return motion['comment_' + id];
                    },
                    function (obj) {
                        if (obj.editor) {
                            motion['comment_' + id] = obj.editor.getData();
                        }
                    }
                );
                commentsInlineEditing.editors[id] = inlineEditing;
            });
            commentsInlineEditing.saveToolbarVisible = function () {
                return _.some(commentsInlineEditing.editors, function (instance) {
                    return instance.changed && instance.active;
                });
            };
            commentsInlineEditing.active = function (commentId) {
                return commentsInlineEditing.editors[commentId].active;
            };
            commentsInlineEditing.save = function () {
                _.forEach(commentsInlineEditing.editors, function (instance) {
                    instance.save();
                });
            };
            commentsInlineEditing.revert = function () {
                _.forEach(commentsInlineEditing.editors, function (instance) {
                    instance.revert();
                });
            };
            commentsInlineEditing.enable = function (commentId) {
                commentsInlineEditing.editors[commentId].enable();
            };
            commentsInlineEditing.disable = function (commentId) {
                commentsInlineEditing.editors[commentId].disable();
            };

            return commentsInlineEditing;
        };
        return {
            createInstances: createInstances,
        };
    }
])

.factory('ChangeRecommendationCreate', [
    'ngDialog',
    'ChangeRecommendationTitleForm',
    'ChangeRecommendationTextForm',
    function(ngDialog, ChangeRecommendationTitleForm, ChangeRecommendationTextForm) {
        var MODE_INACTIVE = 0,
            MODE_SELECTING_FROM = 1,
            MODE_SELECTING_TO = 2,

            TITLE_DUMMY_LINE_NUMBER = 0;

        var obj = {
            mode: MODE_INACTIVE,
            lineFrom: 1,
            lineTo: 2,
            html: '',
            reviewingHtml: ''
        };

        var $scope, motion, version;

        obj._getAffectedLineNumbers = function () {
            var changeRecommendations = motion.getTextChangeRecommendations(version.id),
                affectedLines = [];
            for (var i = 0; i < changeRecommendations.length; i++) {
                var change = changeRecommendations[i];
                for (var j = change.line_from; j < change.line_to; j++) {
                    affectedLines.push(j);
                }
            }
            return affectedLines;
        };

        // startCreating is called right at the beginning after the users interacts with the text for the first time.
        // This ensures all necessary nodes have been initialized
        obj.startCreating = function () {
            if (obj.mode > MODE_SELECTING_FROM || !motion.isAllowed('can_manage')) {
                return;
            }

            $(".tt_change_recommendation_create_help").removeClass("opened");
            var $lineNumbers = $(".motion-text-original .os-line-number"),
                $title = $(".motion-title .change-title");
            if ($lineNumbers.filter(".selectable").length === 0) {
                obj.mode = MODE_SELECTING_FROM;
                var alreadyAffectedLines = obj._getAffectedLineNumbers();
                $lineNumbers.each(function () {
                    var $this = $(this),
                        lineNumber = $this.data("line-number");
                    if (alreadyAffectedLines.indexOf(lineNumber) === -1) {
                        $(this).addClass("selectable");
                    }
                });
                if (alreadyAffectedLines.indexOf(TITLE_DUMMY_LINE_NUMBER) === -1) {
                    $title.addClass("selectable");
                }
            }
        };

        obj.cancelCreating = function (ev) {
            var $target = $(ev.target),
                query = ".line-numbers-outside .os-line-number.selectable";
            if (!$target.is(query) && $target.parents(query).length === 0) {
                obj.mode = MODE_INACTIVE;
                obj.lineFrom = 0;
                obj.lineTo = 0;
                $(".motion-text-original .os-line-number").removeClass("selected selectable");
                obj.startCreating();
            }
        };

        obj.setFromLine = function (line) {
            obj.mode = MODE_SELECTING_TO;
            obj.lineFrom = line;

            var alreadyAffectedLines = obj._getAffectedLineNumbers(),
                foundCollission = false;

            $(".motion-text-original .os-line-number").each(function () {
                var $this = $(this);
                if ($this.data("line-number") >= line && !foundCollission) {
                    if (alreadyAffectedLines.indexOf($this.data("line-number")) === -1) {
                        $(this).addClass("selectable");
                    } else {
                        $(this).removeClass("selectable");
                        foundCollission = true;
                    }
                } else {
                    $(this).removeClass("selectable");
                }
            });

            var tt_pos = $(".motion-text-original .line-number-" + line).position().top - 45;
            $(".tt_change_recommendation_create_help").css("top", tt_pos).addClass("opened");
        };

        obj.titleClicked = function () {
            ngDialog.open(ChangeRecommendationTitleForm.getCreateDialog(motion, version));

            obj.mode = MODE_INACTIVE;
            obj.lineFrom = 0;
            obj.lineTo = 0;
            $(".motion-text-original .os-line-number").removeClass("selected selectable");
            obj.startCreating();
        };

        obj.setToLine = function (line) {
            if (line < obj.lineFrom) {
                return;
            }
            obj.mode = MODE_INACTIVE;
            ngDialog.open(ChangeRecommendationTextForm.getCreateDialog(motion, version, obj.lineFrom, line + 1));

            obj.lineFrom = 0;
            obj.lineTo = 0;
            $(".motion-text-original .os-line-number").removeClass("selected selectable");
            obj.startCreating();
        };

        obj.lineClicked = function (ev) {
            if (obj.mode === MODE_INACTIVE) {
                return;
            }
            if (obj.mode === MODE_SELECTING_FROM) {
                obj.setFromLine($(ev.target).data("line-number"));
                $(ev.target).addClass("selected");
            } else if (obj.mode === MODE_SELECTING_TO) {
                obj.setToLine($(ev.target).data("line-number"));
            }
        };

        obj.mouseOver = function (ev) {
            if (obj.mode !== MODE_SELECTING_TO) {
                return;
            }
            var hoverLine = $(ev.target).data("line-number");
            $(".motion-text-original .os-line-number").each(function () {
                var line = $(this).data("line-number");
                if (line >= obj.lineFrom && line <= hoverLine) {
                    $(this).addClass("selected");
                } else {
                    $(this).removeClass("selected");
                }
            });
        };

        obj.setVersion = function (_motion, _version) {
            motion = _motion;
            version = motion.getVersion(_version);
        };

        obj.editTextDialog = function(change_recommendation) {
            ngDialog.open(ChangeRecommendationTextForm.getEditDialog(change_recommendation));
        };

        obj.editTitleDialog = function(change_recommendation) {
            ngDialog.open(ChangeRecommendationTitleForm.getEditDialog(change_recommendation));
        };

        obj.init = function (_scope, _motion) {
            $scope = _scope;
            motion = _motion;
            version = motion.getVersion($scope.version);

            var $content = $("#content");
            $content.on("click", ".line-numbers-outside .os-line-number.selectable", obj.lineClicked);
            $content.on("click", ".motion-title .change-title.selectable", obj.titleClicked);
            $content.on("click", obj.cancelCreating);
            $content.on("mouseover", ".line-numbers-outside .os-line-number.selectable", obj.mouseOver);
            $content.on("mouseover", ".motion-text-original, .motion-title", obj.startCreating);

            $scope.$watch(function () {
                return $scope.change_recommendations.length;
            }, function () {
                if (obj.mode === MODE_INACTIVE || obj.mode === MODE_SELECTING_FROM) {
                    // Recalculate the affected lines so we cannot select lines affected by a recommendation
                    // that has just been created
                    $(".motion-text-original .os-line-number").removeClass("selected selectable");
                    $(".motion-title .change-title").removeClass("selected selectable");
                    obj.startCreating();
                }
            });

            $scope.$on("$destroy", function () {
                obj.destroy();
            });
        };

        obj.destroy = function () {
            var $content = $("#content");
            $content.off("click", ".line-numbers-outside .os-line-number.selectable", obj.lineClicked);
            $content.off("click", ".motion-title .change-title.selectable", obj.titleClicked);
            $content.off("click", obj.cancelCreating);
            $content.off("mouseover", ".line-numbers-outside .os-line-number.selectable", obj.mouseOver);
            $content.off("mouseover", ".motion-text-original, .motion-title", obj.startCreating);
        };

        return obj;
    }
])

.factory('ChangeRecommendationView', [
    'Motion',
    'MotionChangeRecommendation',
    'Config',
    'lineNumberingService',
    'diffService',
    '$interval',
    '$timeout',
    function (Motion, MotionChangeRecommendation, Config, lineNumberingService, diffService, $interval, $timeout) {
        var $scope;

        var obj = {
            mode: 'original'
        };

        obj.diffFormatterCb = function (change, oldFragment, newFragment) {
            for (var i = 0; i < oldFragment.childNodes.length; i++) {
                diffService.addCSSClass(oldFragment.childNodes[i], 'delete');
            }
            for (i = 0; i < newFragment.childNodes.length; i++) {
                diffService.addCSSClass(newFragment.childNodes[i], 'insert');
            }
            var mergedFragment = document.createDocumentFragment(),
                diffSection = document.createElement('SECTION'),
                el;

            mergedFragment.appendChild(diffSection);
            diffSection.setAttribute('class', 'diff');
            diffSection.setAttribute('data-change-id', change.id);

            while (oldFragment.firstChild) {
                el = oldFragment.firstChild;
                oldFragment.removeChild(el);
                diffSection.appendChild(el);
            }
            while (newFragment.firstChild) {
                el = newFragment.firstChild;
                newFragment.removeChild(el);
                diffSection.appendChild(el);
            }

            return mergedFragment;
        };

        obj.delete = function (changeId) {
            MotionChangeRecommendation.destroy(changeId);
        };

        obj.rejectAll = function (motion) {
            var changeRecommendations = MotionChangeRecommendation.filter({
                'where': {'motion_version_id': {'==': motion.active_version}}
            });
            _.forEach(changeRecommendations, function(change) {
                change.rejected = true;
                change.saveStatus();
            });
        };

        obj.repositionOriginalAnnotations = function () {
            var $changeRecommendationList = $('.change-recommendation-list'),
                $lineNumberReference = $('.motion-text-original');

            $changeRecommendationList.children().each(function() {
                var $this = $(this),
                    lineFrom = $this.data('line-from'),
                    lineTo = ($this.data('line-to') - 1),
                    $lineFrom = $lineNumberReference.find('.line-number-' + lineFrom),
                    $lineTo = $lineNumberReference.find('.line-number-' + lineTo),
                    fromTop = $lineFrom.position().top + 3,
                    toTop = $lineTo.position().top + 20,
                    height = (toTop - fromTop);

                if (height < 10) {
                    height = 10;
                }

                // $lineFrom.position().top seems to depend on the scrolling position when the line numbers
                // have position: absolute. Maybe a bug in the used version of jQuery?
                // This cancels the effect.
                /*
                if ($lineNumberReference.hasClass('line-numbers-outside')) {
                    fromTop += window.scrollY;
                }
                */

                $this.css({ 'top': fromTop, 'height': height });
            });
        };

        obj.newVersionIncludingChanges = function (motion, version) {
            if (!motion.isAllowed('update')) {
                throw 'No permission to update motion';
            }

            var newHtml = motion.getTextByMode('agreed');
            motion.setTextStrippingLineBreaks(newHtml);

            Motion.inject(motion);
            // save change motion object on server
            Motion.save(motion, {method: 'PATCH'}).then(
                function (success) {
                    $scope.showVersion(motion.getVersion(-1));
                },
                function (error) {
                    // save error: revert all changes by restore
                    // (refresh) original motion object from server
                    Motion.refresh(motion);
                    var message = '';
                    for (var e in error.data) {
                        message += e + ': ' + error.data[e] + ' ';
                    }
                    $scope.alert = {type: 'danger', msg: message, show: true};
                }
            );
        };

        obj.scrollToDiffBox = function (changeId) {
            obj.mode = 'diff';
            $timeout(function() {
                var $diffBox = $('.diff-box-' + changeId);
                $('html, body').animate({
                    scrollTop: $diffBox.offset().top - 50
                }, 300);
            }, 0, false);
        };

        obj.init = function (_scope, viewMode) {
            $scope = _scope;
            $scope.$evalAsync(function() {
                obj.repositionOriginalAnnotations();
            });
            $scope.$watch(function() {
                return $('.change-recommendation-list').children().length;
            }, obj.repositionOriginalAnnotations);

            var checkGotoOriginal = function () {
                if ($scope.change_recommendations.length === 0 && $scope.title_change_recommendation === null) {
                    obj.mode = 'original';
                }
            };
            $scope.$watch(function () {
                return $scope.change_recommendations.length;
            }, checkGotoOriginal);
            $scope.$watch(function () {
                return $scope.title_change_recommendation;
            }, checkGotoOriginal);

            var sizeCheckerLastSize = null,
                sizeCheckerLastClass = null,
                sizeChecker = $interval(function() {
                    var $holder = $(".motion-text-original"),
                        newHeight = $holder.height(),
                        classes = $holder.attr("class");
                    if (newHeight != sizeCheckerLastSize || sizeCheckerLastClass != classes) {
                        sizeCheckerLastSize = newHeight;
                        sizeCheckerLastClass = classes;
                        obj.repositionOriginalAnnotations();
                    }
                }, 100, 0, false);

            $scope.$on('$destroy', function() {
                $interval.cancel(sizeChecker);
            });

            obj.mode = viewMode;
        };

        return obj;
    }
]);

}());
