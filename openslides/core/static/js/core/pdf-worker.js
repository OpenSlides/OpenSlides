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
    var pdf = pdfMake.createPdf(data);
    pdf.getBase64(function (base64) {
        self.postMessage(base64);
    });
}, false);
