(function () {

'use strict';

angular.module('OpenSlidesApp.core.remove-format-plugin', [
    'OpenSlidesApp.core',
])

/*
 * Plugin for the CKEditor that hooks into the removeformat plugin
 * which is a default plugin enabled by 'cleanup' in the config
 * toolbar.
 * We change the behavior of the removeformat command here:
 * It should not remove any tags and styles, but only the
 * 'DISALLOWED_STYLES'. Removeformat traverses through the DOM
 * and calles for every element the custom filter down below.
 * We change the element and return false, so the removeformat
 * plugin does not clean it up.
 */
.factory('OSRemoveFormatPlugin', [
    'Editor',
    'gettextCatalog',
    function (Editor, gettextCatalog) {
        var DISALLOWED_STYLES = ['color', 'background-color'];
        return {
            getPlugin: function () {
                return {
                    init: function (editor) {
                        editor.addRemoveFormatFilter(function (element) {
                            _.forEach(DISALLOWED_STYLES, function (style) {
                                element.removeStyle(style);
                            });
                            return false;
                        });
                    },
                };
            },
        };
    }
])

.run([
    'Editor',
    'OSRemoveFormatPlugin',
    function (Editor, OSRemoveFormatPlugin, gettext) {
        Editor.registerPlugin('OSRemoveFormat', OSRemoveFormatPlugin.getPlugin());
    }
]);

}());
