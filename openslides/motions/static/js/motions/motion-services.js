(function () {

"use strict";

angular.module('OpenSlidesApp.motions.motionservices', ['OpenSlidesApp.motions', 'OpenSlidesApp.motions.lineNumbering'])

.factory('MotionInlineEditing', [
    'Editor',
    'Motion',
    'Config',
    '$timeout',
    function (Editor, Motion, Config, $timeout) {
        var obj = {
            active: false,
            changed: false,
            trivialChange: false,
            editor: null,
            lineBrokenText: null,
            originalHtml: null
        };

        var $scope, motion;

        obj.init = function (_scope, _motion) {
            $scope = _scope;
            motion = _motion;
            obj.lineBrokenText = motion.getTextWithLineBreaks($scope.version);
            obj.originalHtml = obj.lineBrokenText;

            if (motion.state.versioning && Config.get('motions_allow_disable_versioning').value) {
                obj.trivialChange = true;
            }
        };


        obj.tinymceOptions = Editor.getOptions(null, true);
        obj.tinymceOptions.readonly = 1;
        obj.tinymceOptions.setup = function (editor) {
            obj.editor = editor;
            editor.on("init", function () {
                obj.lineBrokenText = motion.getTextWithLineBreaks($scope.version);
                obj.editor.setContent(obj.lineBrokenText);
                obj.originalHtml = obj.editor.getContent();
                obj.changed = false;
            });
            editor.on("change", function () {
                obj.changed = (editor.getContent() != obj.originalHtml);
            });
            editor.on("undo", function () {
                obj.changed = (editor.getContent() != obj.originalHtml);
            });
        };

        obj.setVersion = function (_motion, versionId) {
            motion = _motion; // If this is not updated,
            console.log(versionId, motion.getTextWithLineBreaks(versionId));
            obj.lineBrokenText = motion.getTextWithLineBreaks(versionId);
            obj.changed = false;
            obj.active = false;
            if (obj.editor) {
                obj.editor.setContent(obj.lineBrokenText);
                obj.editor.setMode("readonly");
                obj.originalHtml = obj.editor.getContent();
            } else {
                obj.originalHtml = obj.lineBrokenText;
            }
        };

        obj.enable = function () {
            obj.editor.setMode("design");
            obj.active = true;
            obj.changed = false;

            obj.lineBrokenText = motion.getTextWithLineBreaks($scope.version);
            obj.editor.setContent(obj.lineBrokenText);
            obj.originalHtml = obj.editor.getContent();
            $timeout(function () {
                obj.editor.focus();
            }, 100);
        };

        obj.disable = function () {
            obj.editor.setMode("readonly");
            obj.active = false;
            obj.changed = false;
            obj.lineBrokenText = obj.originalHtml;
            obj.editor.setContent(obj.originalHtml);
        };

        obj.save = function () {
            if (!motion.isAllowed('update')) {
                throw "No permission to update motion";
            }

            motion.setTextStrippingLineBreaks(motion.active_version, obj.editor.getContent());
            motion.disable_versioning = (obj.trivialChange && Config.get('motions_allow_disable_versioning').value);

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

        return obj;
    }
]);

}());
