/* Worker for creating PDFs in a separate thread. The creation of larger PDFs
 * needs (currently) a lot of time and we don't want to block the UI.
 */

// Setup fake environment for pdfMake
var document = {
    'createElementNS': function () {
        return {};
    },
};
var window = this;

// PdfMake and Fonts
importScripts('/static/js/workers/pdf-worker-libs.js');

// Set default font family.
// To use custom ttf font files you have to replace the vfs_fonts.js file.
// See https://github.com/pdfmake/pdfmake/wiki/Custom-Fonts---client-side
// "PdfFont" is used as generic name in core/pdf.js. Adjust the four
// font style names only.
pdfMake.fonts = {
    PdfFont: {
        normal: 'Roboto-Regular.ttf',
        bold: 'Roboto-Medium.ttf',
        italics: 'Roboto-Italic.ttf',
        bolditalics: 'Roboto-Italic.ttf'
    }
};

// Create PDF on message and return the base64 decoded document
self.addEventListener('message', function(e) {
    var data = JSON.parse(e.data);

    // Workaround for using dynamic footer with page number.
    // TODO: Needs improvement of pdfmake's web worker support.
    // see https://github.com/bpampuch/pdfmake/issues/38
    if (data.footerTpl) {
        data.footer = function (currentPage, pageCount) {
            var footerText = data.footerTpl.text
                .replace('{{currentPage}}', currentPage)
                .replace('{{pageCount}}', pageCount);
            return {
                text: footerText,
                alignment: data.footerTpl.alignment,
                margin: data.footerTpl.margin,
                fontSize: data.footerTpl.fontSize,
                color: data.footerTpl.color
            };
        };
    }

    // Workaround for using table layout functions.
    // TODO: Needs improvement of pdfmake's web worker support.
    // Currently only functions are allowed for 'layout'.
    // But functions cannot be passed to workers (via JSON).
    //
    // ballot paper crop marks
    for (var i = 0; i < data.content.length; i++) {
        if (data.content[i].layout === "{{ballot-placeholder-to-insert-functions-here}}") {
            data.content[i].layout = {
                hLineWidth: function(i, node) {
                    if (i === 0){
                        return 0;
                    } else if (i === node.table.body.length) {
                        if (node.rowsperpage && node.rowsperpage > i) {
                            return 0.5;
                        } else {
                            return 0;
                        }
                    } else {
                        return 0.5;
                    }
                },
                vLineWidth: function(i, node) {
                    return (i === 0 || i === node.table.widths.length) ? 0 : 0.5;
                },
                hLineColor: function() {
                    return 'gray';
                },
                vLineColor: function() {
                    return 'gray';
                }
            };
        }
        // motion meta table border lines
        if (data.content[i].layout === "{{motion-placeholder-to-insert-functions-here}}") {
            data.content[i].layout = {
                hLineWidth: function(i, node) {
                    return (i === 0 || i === node.table.body.length) ? 0 : 0.5;
                },
                vLineWidth: function() {
                    return 0;
                },
                hLineColor: function() {
                    return 'white';
                }
            };
        }
    }
    var pdf = pdfMake.createPdf(data);
    pdf.getBase64(function (base64) {
        self.postMessage(base64);
    });
}, false);
