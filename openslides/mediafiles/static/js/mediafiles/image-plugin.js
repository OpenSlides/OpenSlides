(function () {

'use strict';

angular.module('OpenSlidesApp.mediafiles.image-plugin', [
    'OpenSlidesApp.mediafiles.resources',
    'gettext',
    'OpenSlidesApp.core',
])

.factory('ImageBrowserPlugin', [
    '$templateCache',
    'Mediafile',
    'gettextCatalog',
    'Editor',
    function ($templateCache, Mediafile, gettextCatalog, Editor) {
        return {
            getPlugin: function () {
                return {
                    init: function (editor) {
                        CKEDITOR.tools.imagebrowser = {};

                        // Initialize this dialog, if it is opened.
                        editor.on('dialogShow', function (event) {
                            var dialog = event.data;
                            if (dialog.getName() === 'imagebrowser-dialog') {
                                CKEDITOR.dialog.getCurrent().disableButton('ok');

                                // Load the main plugin template and paste it into the container
                                var template = $templateCache.get('static/templates/mediafiles/image-plugin.html');
                                if (!template) {
                                    throw 'Template for image plugin not found!';
                                }
                                $('#imageBrowserContainer').html(template);

                                // Load all images.
                                var images = '';
                                _.forEach(Mediafile.getAllImages(), function (image) {
                                        images += '<div class="image" onclick="CKEDITOR.tools.imagebrowser.selectImage(\'' +
                                            image.value + '\');" style="background-image:url(\'' +
                                            image.value + '\');" data-image="' + image.value + '"></div>';
                                });
                                $('#imageBrowser').html(images);

                                // Translate some strings. Angular tags are not available in CKEditor.
                                $('#scaleLabel').html(gettextCatalog.getString('Scale'));

                                // If the dialog was opened via double click, check the selected element. It
                                // may be an image, so preselect it.
                                var selectedElement = editor.getSelection().getStartElement();
                                if (selectedElement.is('img')) {
                                    // Check for given scale of this image.
                                    var styleAttr = $(selectedElement).attr('style');
                                    var scale;
                                    var scaleRegex = /width\s*:\s*(\d+)\s*%/g;
                                    var scaleMatch = scaleRegex.exec(styleAttr);
                                    if (scaleMatch) {
                                        scale = parseInt(scaleMatch[1]);
                                    }
                                    CKEDITOR.tools.imagebrowser.selectImage(
                                        selectedElement.getAttribute('src'), scale);
                                }
                                // Setup event listeners.
                                $('#image-scale').bind('keyup mouseup', function (event) {
                                    var scale = parseInt($('#image-scale').val());
                                    if (scale !== CKEDITOR.tools.imagebrowser.scale) {
                                        CKEDITOR.tools.imagebrowser.updateImageSize(scale);
                                    }
                                });
                            }
                        });
                        // React on double clicks in the textarea. If an image was selected, open this dialog.
                        editor.on('doubleclick', function (event) {
                            var element = event.data.element;
                            if (!element.isReadOnly()) {
                                if (element.is('img')) {
                                    event.data.dialog = 'imagebrowser-dialog';
                                    editor.getSelection().selectElement(element);
                                }
                            }
                        });
                        // Handler for selecting an image. It may be called by clicking on a thumbnail or by
                        // just giving the url. The scale is optional.
                        CKEDITOR.tools.imagebrowser.selectImage = function (url, scale) {
                            var browser = $('#imageBrowser');
                            _.forEach(browser.children(), function (child) { // check every available image
                                if (child.getAttribute('data-image') == url) { //match
                                    child.classList.add('selected');
                                    var image = $('#imagePreview img');
                                    // Setup an load event handler, so we can get the size of the image when loaded.
                                    image.on('load', function (event) {
                                        var w = event.target.naturalWidth;
                                        var h = event.target.naturalHeight;
                                        $('#originalSizeText').html(gettextCatalog.getString('Original size') +
                                            ': ' + w + ' &times; ' + h );
                                        $('#fullSizeContainer').width(w).height(h);
                                        if (scale !== undefined) {
                                            // Use custom scale.
                                            CKEDITOR.tools.imagebrowser.updateImageSize(scale);
                                        } else {
                                            CKEDITOR.tools.imagebrowser.updateImageSize(100);
                                        }
                                    });
                                    // Set the url of the main preview image.
                                    image.attr('src', url);
                                    $('#imagePreviewSection').removeClass('hidden');
                                    CKEDITOR.tools.imagebrowser.selected = url;
                                } else {
                                    // Wrong image, deselect it in the preview window.
                                    child.classList.remove('selected');
                                }
                            });
                        };
                        // Handler for updateing the image size.
                        CKEDITOR.tools.imagebrowser.updateImageSize = function (scale) {
                            if (isNaN(scale) || scale <= 0) {
                                CKEDITOR.dialog.getCurrent().disableButton('ok');
                            } else {
                                CKEDITOR.dialog.getCurrent().enableButton('ok');
                                CKEDITOR.tools.imagebrowser.scale = scale;
                                $('#imagePreview img').width(scale + '%');
                                $('#image-scale').val(scale);
                            }
                        };
                        // Insert the selected image into the textarea.
                        CKEDITOR.tools.imagebrowser.insertImage = function (url, scale) {
                            var editor = CKEDITOR.currentInstance;
                            var dialog = CKEDITOR.dialog.getCurrent();
                            var html = '<img src="' + url + '" data-cke-saved-src="' + url +
                                '" alt="' + url + '" style="width: ' + scale + '%;" />';
                            editor.config.allowedContent = true;
                            editor.insertHtml(html.trim());
                            dialog.hide();
                        };
                        editor.addCommand('imagebrowser-open', new CKEDITOR.dialogCommand('imagebrowser-dialog'));
                        // By naming the button 'image', it gets the same image as the original image button.
                        editor.ui.addButton('image', {
                            label: gettextCatalog.getString('Open image browser'),
                            command: 'imagebrowser-open',
                            toolbar: 'insert',
                        });
                    },
                };
            },
            getDialog: function () {
                return function (editor) {
                    return {
                        title: gettextCatalog.getString('Image browser'),
                        minWidth: 1000,
                        minHeight: 500,
                        contents: [
                            {
                                id: 'imagebrowser-tab1',
                                label: gettextCatalog.getString('Browse for images'),
                                elements: [
                                    {
                                        type: 'html',
                                        align: 'left',
                                        id: 'titleid',
                                        style: 'font-size: 20px; font-weight: bold;',
                                        html: gettextCatalog.getString('Browse for images'),
                                    }, {
                                        type: 'html',
                                        align: 'left',
                                        id: 'msg',
                                        style: '',
                                        html: '<div id="imageBrowserContainer"></div>'
                                    }
                                ],
                            },
                        ],
                        // insert image on OK.
                        onOk: function (event) {
                            var url = CKEDITOR.tools.imagebrowser.selected;
                            if (url) {
                                var scale = CKEDITOR.tools.imagebrowser.scale;
                                CKEDITOR.tools.imagebrowser.insertImage(url, scale);
                            }
                        },
                    };
                };
            },
        };
    }
])

.run([
    'Editor',
    'ImageBrowserPlugin',
    'gettext',
    function (Editor, ImageBrowserPlugin, gettext) {
        Editor.registerDialog('imagebrowser-dialog', ImageBrowserPlugin.getDialog());
        Editor.registerPlugin('imagebrowser', ImageBrowserPlugin.getPlugin());

        // mark all plugin strings
        gettext('Original size');
        gettext('Scale');
        gettext('Image browser');
        gettext('Browse for images');
    }
]);

}());
