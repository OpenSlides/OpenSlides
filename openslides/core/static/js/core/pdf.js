(function () {

'use strict';

angular.module('OpenSlidesApp.core.pdf', [])

/*
 * General layout functions for building PDFs with pdfmake.
 */
.factory('PDFLayout', [
    function() {
        var PDFLayout = {};
        var BallotCircleDimensions = {
            yDistance: 6,
            size: 8
        };

        // page title
        PDFLayout.createTitle = function(title) {
            return {
                text: title,
                style: "title"
            };
        };

        // page subtitle
        PDFLayout.createSubtitle = function(subtitle) {
            return {
                text: subtitle.join('\n'),
                style: "subtitle"
            };
        };

        // pagebreak
        PDFLayout.addPageBreak = function() {
            return [
                {
                    text: '',
                    pageBreak: 'after'
                }
            ];
        };

        // table row style
        PDFLayout.flipTableRowStyle = function(currentTableSize) {
            if (currentTableSize % 2 === 0) {
                return "tableEven";
            } else {
                return "tableOdd";
            }
        };

        // draws a circle
        PDFLayout.drawCircle = function(y, size) {
            return [
                {
                    type: 'ellipse',
                    x: 0,
                    y: y,
                    lineColor: 'black',
                    r1: size,
                    r2: size
                }
            ];
        };

        // returns an entry in the ballot with a circle to draw into
        PDFLayout.createBallotEntry = function(decision) {
            return {
                margin: [40+BallotCircleDimensions.size, 10, 0, 0],
                columns: [
                    {
                        width: 15,
                        canvas: PDFLayout.drawCircle(BallotCircleDimensions.yDistance,
                                BallotCircleDimensions.size)
                    },
                    {
                        width: "auto",
                        text: decision
                    }
                ],
            };
        };

        // crop marks for ballot papers
        PDFLayout.getBallotLayoutLines = function() {
            return '{{ballot-placeholder-to-insert-functions-here}}';
        };

        // returns a promise for converting an image in data URL format with size information
        PDFLayout.imageURLtoBase64 = function(url) {
            var promise = new Promise(function(resolve) {
                var img = new Image();
                img.crossOrigin = "Anonymous";
                img.onload = function() {
                    var canvas = document.createElement("canvas");
                    canvas.width = img.width;
                    canvas.height = img.height;
                    var ctx = canvas.getContext("2d");
                    ctx.drawImage(img, 0, 0);
                    var dataURL = canvas.toDataURL("image/png");
                    var imageData = {
                        data: dataURL,
                        width: img.width,
                        height: img.height
                    };
                    resolve(imageData);
                };
                img.src = url;
            });
            return promise;
        };

        return PDFLayout;
    }
])


.factory('HTMLValidizer', function() {
    var HTMLValidizer = {};

    // In some cases copying from word to OpenSlides results in umlauts
    // that are the base letter and then the entity #776; to make the dots
    // above the base letter. This breaks the PDF.
    HTMLValidizer.replaceMalformedUmlauts = function (text) {
        return text.replace(/([aeiouAEIOUy])[\u0308]/g, function (match, baseChar) {
            return '&' + baseChar + 'uml;';
        });
    };


    //checks if str is valid HTML. Returns valid HTML if not,
    //return emptystring if empty
    HTMLValidizer.validize = function(str) {
        if (str) {
            str = HTMLValidizer.replaceMalformedUmlauts(str);
            // Sometimes, some \n are in the text instead of whitespaces. Replace them.
            str = str.replace(/\n/g, ' ');

            var a = document.createElement('div');
            a.innerHTML = str;
            angular.forEach(a.childNodes, function (child) {
                if (child.nodeType == 1) {
                    return str;
                }
            });
            return '<p>' + str + '</p>';
        } else {
            return ''; //needed for blank "reasons" field
        }
    };
    return HTMLValidizer;
})


.factory('PdfMakeDocumentProvider', [
    '$q',
    'Config',
    'PDFLayout',
    'ImageConverter',
    function($q, Config, PDFLayout, ImageConverter) {
        /**
         * Provides the global document
         * @constructor
         * @param {object} contentProvider - Object with on method `getContent`, which
         * returns an array for content
         */
        //images shall contain the the logos as URL: base64Str, just like the converter
        var createInstance = function(contentProvider, noFooter) {
            // Logo urls
            var logoHeaderUrl = Config.get('logo_pdf_header').value.path,
                logoFooterUrl = Config.get('logo_pdf_footer').value.path;
            var imageMap = contentProvider.getImageMap ? contentProvider.getImageMap() : {};

            // PDF header
            var getHeader = function() {
                var columns = [];

                if (logoHeaderUrl) {
                    if (logoHeaderUrl.indexOf('/') === 0) {
                        logoHeaderUrl = logoHeaderUrl.substr(1); // remove trailing /
                    }
                    columns.push({
                        image: logoHeaderUrl,
                        fit: [180, 40],
                        width: '20%'
                    });
                }

                var line1 = [
                    Config.translate(Config.get('general_event_name').value),
                    Config.translate(Config.get('general_event_description').value)
                ].filter(Boolean).join(' – ');
                var line2 = [
                    Config.get('general_event_location').value,
                    Config.get('general_event_date').value
                ].filter(Boolean).join(', ');
                var text = [line1, line2].join('\n');
                columns.push({
                    text: text,
                    fontSize: 10,
                    alignment: 'right',
                    margin: [0, 10, 0, 0],
                });
                return {
                    color: '#555',
                    fontSize: 9,
                    margin: [75, 30, 75, 10], // [left, top, right, bottom]
                    columns: columns,
                    columnGap: 10,
                };
            };


            // PDF footer
            // Used placeholder for currentPage and pageCount which
            // are replaced by dynamic footer function in pdf-worker.js.
            var getFooter = function() {
                var columns = [];

                if (logoFooterUrl) {
                    if (logoFooterUrl.indexOf('/') === 0) {
                        logoFooterUrl = logoFooterUrl.substr(1); // remove trailing /
                    }
                    columns.push({
                        image: logoFooterUrl,
                        fit: [400,50],
                        width: '80%'
                    });
                }
                columns.push({
                    text: '{{currentPage}} / {{pageCount}}',
                    color: '#555',
                    fontSize: 9,
                    alignment: Config.get('general_export_pdf_pagenumber_alignment').value,
                    margin: [0, 15, 0, 0],
                });
                return {
                    margin: [75, 0, 75, 10],
                    columns: columns,
                    columnGap: 10,
                };
            };
            // Generates the document(definition) for pdfMake
            var getDocument = function() {
                var content = contentProvider.getContent();
                var standardFontsize = Config.get('general_export_pdf_fontsize').value;
                return {
                    pageSize: 'A4',
                    pageMargins: [75, 90, 75, 75],
                    defaultStyle: {
                        font: 'PdfFont',
                        fontSize: standardFontsize
                    },
                    header: getHeader(),
                    footerTpl: noFooter ? '' : getFooter(),
                    content: content,
                    styles: {
                        title: {
                            fontSize: 18,
                            margin: [0,0,0,20],
                            bold: true
                        },
                        subtitle: {
                            fontSize: 9,
                            margin: [0,-20,0,20],
                            color: 'grey'
                        },
                        preamble: {
                            fontSize: standardFontsize,
                            margin: [0,0,0,10],
                        },
                        userDataTitle: {
                            fontSize: 26,
                            margin: [0,0,0,0],
                            bold: true
                        },
                        textItem: {
                            fontSize: 11,
                            margin: [0,7]
                        },
                        heading2: {
                            fontSize: 14,
                            margin: [0,0,0,10],
                            bold: true
                        },
                        heading3: {
                            fontSize: 12,
                            margin: [0,10,0,0],
                            bold: true
                        },
                        userDataHeading: {
                            fontSize: 14,
                            margin: [0,10],
                            bold: true
                        },
                        userDataTopic: {
                            fontSize: 12,
                            margin: [0,5]
                        },
                        userDataValue: {
                            fontSize: 12,
                            margin: [15,5]
                        },
                        tableofcontent: {
                            fontSize: 12,
                            margin: [0,3]
                        },
                        listParent: {
                            fontSize: 12,
                            margin: [0,5]
                        },
                        listChild: {
                            fontSize: 10,
                            margin: [0,5]
                        },
                        tableHeader: {
                            bold: true,
                            fillColor: 'white'
                        },
                        tableEven: {
                            fillColor: 'white'
                        },
                        tableOdd: {
                            fillColor: '#eee'
                        },
                        tableConclude: {
                            fillColor: '#ddd',
                            bold: true
                        },
                        grey: {
                            fillColor: '#ddd',
                        },
                        lightgrey: {
                            fillColor: '#aaa',
                        },
                        bold: {
                            bold: true,
                        },
                        small: {
                            fontSize: 8,
                        }
                    }
                };
            };

            var getImageMap = function () {
                return imageMap;
            };

            return $q(function (resolve) {
                var imageSources = [
                    logoHeaderUrl,
                    logoFooterUrl
                ];
                ImageConverter.toBase64(imageSources).then(function (_imageMap) {
                    _.forEach(_imageMap, function (data, path) {
                        if (!imageMap[path]) {
                            imageMap[path] = data;
                        }
                    });
                    resolve({
                        getDocument: getDocument,
                        getImageMap: getImageMap,
                    });
                });
            });
        };
        return {
            createInstance: createInstance
        };
    }
])

.factory('PdfMakeBallotPaperProvider', [
    'PDFLayout',
    function(PDFLayout) {
        /**
         * Provides the global Document
         * @constructor
         * @param {object} contentProvider - Object with on method `getContent`, which returns an array for content
         */
        var createInstance = function(contentProvider) {
            /**
             * Generates the document(definition) for pdfMake
             * @function
             */
            var getDocument = function() {
                var content = contentProvider.getContent();
                return {
                    pageSize: 'A4',
                    pageMargins: [0, 0, 0, 0],
                    defaultStyle: {
                        font: 'PdfFont',
                        fontSize: 10
                    },
                    content: content,
                    styles: {
                        title: {
                            fontSize: 14,
                            bold: true,
                            margin: [30, 30, 0, 0]
                        },
                        description: {
                            fontSize: 11,
                            margin: [30, 0, 0, 0]
                        }
                    }
                };
            };

            var getImageMap = function() {
                return contentProvider.getImageMap();
            };

            return {
                getDocument: getDocument,
                getImageMap: getImageMap,
            };
        };
        return {
            createInstance: createInstance
        };
    }
])

.factory('PdfMakeConverter', [
    'HTMLValidizer',
    'Config',
    function(HTMLValidizer, Config) {
        /**
         * Converter component for HTML->JSON for pdfMake
         * @constructor
         * @param {object} images   - Key-Value structure representing image.src/BASE64 of images
         */
        var createInstance = function(images) {
            var slice = Function.prototype.call.bind([].slice),
                map = Function.prototype.call.bind([].map),

                DIFF_MODE_NORMAL = 0,
                DIFF_MODE_INSERT = 1,
                DIFF_MODE_DELETE = 2,

                // Space between list elements
                LI_MARGIN_BOTTOM = 8,

                /**
                 * Convertes HTML for use with pdfMake
                 * @function
                 * @param {object} html - html
                 * @param {string} lineNumberMode - [inline, outside, none]
                 */
                convertHTML = function(html, lineNumberMode) {
                    var elementStyles = {
                            "b": ["font-weight:bold"],
                            "strong": ["font-weight:bold"],
                            "u": ["text-decoration:underline"],
                            "em": ["font-style:italic"],
                            "i": ["font-style:italic"],
                            "h1": ["font-size:14", "font-weight:bold"],
                            "h2": ["font-size:12", "font-weight:bold"],
                            "h3": ["font-size:10", "font-weight:bold"],
                            "h4": ["font-size:10", "font-style:italic"],
                            "h5": ["font-size:10"],
                            "h6": ["font-size:10"],
                            "a": ["color:blue", "text-decoration:underline"],
                            "strike": ["text-decoration:line-through"],
                            "del": ["color:red", "text-decoration:line-through"],
                            "ins": ["color:green", "text-decoration:underline"]
                        },
                        classStyles = {
                            "delete": ["color:red", "text-decoration:line-through"],
                            "insert": ["color:green", "text-decoration:underline"]
                        },
                        getLineNumber = function (element) {
                            if (element && element.nodeName == 'SPAN' && element.getAttribute('class') &&
                                element.getAttribute('class').indexOf('os-line-number') > -1) {
                                return element.getAttribute('data-line-number');
                            }
                        },
                        /**
                         *
                         * Removes all line number nodes (not line-breaks)
                         * and returns an array containing the reoved numbers in this format:
                         * { lineNumber: '<lineNumber>', marginBottom: <number> }
                         * where marginBottom is optional.
                         *
                         * @function
                         * @param {object} element
                         */
                        extractLineNumbers = function(element) {
                            var foundLineNumbers = [];
                            var lineNumber = getLineNumber(element);
                            if (lineNumber) {
                                foundLineNumbers.push({lineNumber: lineNumber});
                                element.parentNode.removeChild(element);
                            } else if (element.nodeName === 'BR') {
                                // Check if there is a new line, but it does not get a line number.
                                // If so, insert a dummy line, so the line nubers stays aligned with
                                // the text.
                                if (!getLineNumber(element.nextSibling)) {
                                    foundLineNumbers.push({lineNumber: ''});
                                }
                            } else {
                                var children = element.childNodes,
                                    childrenLength = children.length,
                                    childrenLineNumbers = [];
                                for (var i = 0; i < children.length; i++) {
                                    childrenLineNumbers = _.concat(childrenLineNumbers, extractLineNumbers(children[i]));
                                    if (children.length < childrenLength) {
                                        i -= (childrenLength - children.length);
                                        childrenLength = children.length;
                                    }
                                }
                                // If this is an list item, add some space to the lineNumbers:
                                if (childrenLineNumbers.length && element.nodeName === 'LI') {
                                    _.last(childrenLineNumbers).marginBottom = LI_MARGIN_BOTTOM;
                                }
                                foundLineNumbers = _.concat(foundLineNumbers, childrenLineNumbers);
                            }
                            return foundLineNumbers;
                        },
                        /**
                         * Parses Children of the current paragraph
                         * @function
                         * @param {object} converted  -
                         * @param {object} element   -
                         * @param {object} currentParagraph -
                         * @param {object} styles -
                         * @param {number} diff_mode
                         */
                        parseChildren = function(converted, element, currentParagraph, styles, diff_mode) {
                            var elements = [];
                            var children = element.childNodes;
                            if (children.length !== 0) {
                                _.forEach(children, function(child) {
                                    currentParagraph = ParseElement(elements, child, currentParagraph, styles, diff_mode);
                                });
                            }
                            if (elements.length !== 0) {
                                _.forEach(elements, function(el) {
                                    converted.push(el);
                                });
                            }
                            return currentParagraph;
                        },
                        /**
                         * Returns the color in a hex format (e.g. #12ff00).
                         * Tries to convert the rgb form into this.
                         * @function
                         * @param {string} color
                         */
                        parseColor = function (color) {
                            var hexRegex = new RegExp('^#([0-9a-f]{3}|[0-9a-f]{6})$');
                            // e.g. #fff or #ff0048
                            var rgbRegex = new RegExp('^rgb\\((\\d+),\\s*(\\d+),\\s*(\\d+)\\)$');
                            // e.g. rgb(0,255,34) or rgb(22, 0, 0)
                            var nameRegex = new RegExp('^[a-z]+$');
                            // matches just text like 'red', 'black', 'green'

                            if (hexRegex.test(color)) {
                                return color;
                            } else if (rgbRegex.test(color)) {
                                var decimalColors = rgbRegex.exec(color).slice(1);
                                for (var i = 0; i < 3; i++) {
                                    var decimalValue = parseInt(decimalColors[i]);
                                    if (decimalValue > 255) {
                                        decimalValue = 255;
                                    }
                                    var hexString = '0' + decimalValue.toString(16);
                                    hexString = hexString.slice(-2);
                                    decimalColors[i] = hexString;
                                }
                                return '#' + decimalColors.join('');
                            } else if (nameRegex.test(color)) {
                                return color;
                            } else {
                                console.error('Could not parse color "' + color + '"');
                                return color;
                            }
                        },
                        /**
                         * Extracts the style from an object
                         * @function
                         * @param {object} o       - the current object
                         * @param {object} styles  - an array with styles
                         */
                        ComputeStyle = function(o, styles) {
                            styles.forEach(function(singleStyle) {
                                var styleDefinition = singleStyle.trim().toLowerCase().split(":");
                                var style = styleDefinition[0];
                                var value = styleDefinition[1];
                                if (styleDefinition.length === 2) {
                                    switch (style) {
                                        case "padding-left":
                                            o.margin = [parseInt(value), 0, 0, 0];
                                            break;
                                        case "font-size":
                                            o.fontSize = parseInt(value);
                                            break;
                                        case "text-align":
                                            switch (value) {
                                                case "right":
                                                case "center":
                                                case "justify":
                                                    o.alignment = value;
                                                    break;
                                            }
                                            break;
                                        case "font-weight":
                                            switch (value) {
                                                case "bold":
                                                    o.bold = true;
                                                    break;
                                            }
                                            break;
                                        case "text-decoration":
                                            switch (value) {
                                                case "underline":
                                                    o.decoration = "underline";
                                                    break;
                                                case "line-through":
                                                    o.decoration = "lineThrough";
                                                    break;
                                            }
                                            break;
                                        case "font-style":
                                            switch (value) {
                                                case "italic":
                                                    o.italics = true;
                                                    break;
                                            }
                                            break;
                                        case "color":
                                            o.color = parseColor(value);
                                            break;
                                        case "background-color":
                                            o.background = parseColor(value);
                                            break;
                                    }
                                }
                            });
                        },
                        // A little helper function to check, if an element has the given class.
                        hasClass = function (element, className) {
                            var classes = element.getAttribute('class');
                            if (classes) {
                                classes = classes.toLowerCase().split(' ');
                                return _.indexOf(classes, className) > -1;
                            } else {
                                return false;
                            }
                        },
                        // Helper function for determinating whether a parent of element is a list item.
                        isInsideAList = function (element) {
                            var parent = element.parentNode;
                            while(parent !== null) {
                                if (parent.nodeName.toLowerCase() === 'li') {
                                    return true;
                                }
                                parent = parent.parentNode;
                            }
                            return false;
                        },
                        /**
                         * Parses a single HTML element
                         * @function
                         * @param {object} alreadyConverted  -
                         * @param {object} element   -
                         * @param {object} currentParagraph -
                         * @param {object} styles -
                         * @param {number} diff_mode
                         */
                        ParseElement = function(alreadyConverted, element, currentParagraph, styles, diff_mode) {
                            styles = styles ? _.clone(styles) : [];
                            var classes = [];
                            if (element.getAttribute) {
                                var nodeStyle = element.getAttribute("style");
                                if (nodeStyle) {
                                    nodeStyle.split(";").forEach(function(nodeStyle) {
                                        var tmp = nodeStyle.replace(/\s/g, '');
                                        styles.push(tmp);
                                    });
                                }
                                var nodeClass = element.getAttribute("class");
                                if (nodeClass) {
                                    classes = nodeClass.toLowerCase().split(" ");
                                    classes.forEach(function(nodeClass) {
                                        if (typeof(classStyles[nodeClass]) != 'undefined') {
                                            classStyles[nodeClass].forEach(function(style) {
                                                styles.push(style);
                                            });
                                        }
                                        if (nodeClass == 'insert') {
                                            diff_mode = DIFF_MODE_INSERT;
                                        }
                                        if (nodeClass == 'delete') {
                                            diff_mode = DIFF_MODE_DELETE;
                                        }
                                    });
                                }
                            }
                            var nodeName = element.nodeName.toLowerCase();
                            switch (nodeName) {
                                case "h1":
                                case "h2":
                                case "h3":
                                case "h4":
                                case "h5":
                                case "h6":
                                    if (lineNumberMode === "outside" &&
                                            element.childNodes.length > 0 &&
                                            element.childNodes[0].getAttribute) {
                                        // A heading may have multiple lines, so handle line by line separated by line number elements
                                        var outerStack = create("stack");
                                        var currentCol;
                                        _.forEach(element.childNodes, function (node) {
                                            if (node.getAttribute && node.getAttribute('data-line-number')) {
                                                if (currentCol) {
                                                    ComputeStyle(currentCol, elementStyles[nodeName]);
                                                    outerStack.stack.push(currentCol);
                                                }
                                                currentCol = {
                                                    columns: [
                                                        getLineNumberObject({
                                                            lineNumber: node.getAttribute('data-line-number')
                                                        }),
                                                    ],
                                                    margin: [0, 2, 0, 0],
                                                };
                                            } else if (node.textContent) {
                                                var HeaderText = {
                                                    text: node.textContent,
                                                };
                                                currentCol.columns.push(HeaderText);
                                            }
                                        });
                                        ComputeStyle(currentCol, elementStyles[nodeName]);
                                        outerStack.stack.push(currentCol);
                                        outerStack.margin = [0, 0, 0, 0];
                                        if (!/h[1-6]/.test(element.previousSibling.nodeName.toLowerCase())) {
                                            outerStack.margin[1] = 10;
                                        }
                                        alreadyConverted.push(outerStack);
                                    } else {
                                        currentParagraph = create("text");
                                        currentParagraph.marginBottom = 4;
                                        currentParagraph.marginTop = 10;
                                        currentParagraph = parseChildren(alreadyConverted, element, currentParagraph, styles.concat(elementStyles[nodeName]), diff_mode);
                                        alreadyConverted.push(currentParagraph);
                                    }
                                    break;
                                case "a":
                                case "b":
                                case "strong":
                                case "u":
                                case "em":
                                case "i":
                                case "ins":
                                case "del":
                                case "strike":
                                    currentParagraph = parseChildren(alreadyConverted, element, currentParagraph, styles.concat(elementStyles[nodeName]), diff_mode);
                                    break;
                                case "table":
                                    var t = create("table", {
                                        widths: [],
                                        body: []
                                    });
                                    var border = element.getAttribute("border");
                                    var isBorder = false;
                                    if (border) {
                                        isBorder = (parseInt(border) === 1);
                                    } else {
                                        t.layout = 'noBorders';
                                    }
                                    currentParagraph = parseChildren(t.table.body, element, currentParagraph, styles, diff_mode);
                                    var widths = element.getAttribute("widths");
                                    if (!widths) {
                                        if (t.table.body.length !== 0) {
                                            if (t.table.body[0].length !== 0)
                                                for (var k = 0; k < t.table.body[0].length; k++)
                                                    t.table.widths.push("*");
                                        }
                                    } else {
                                        var w = widths.split(",");
                                        for (var ko = 0; ko < w.length; ko++) t.table.widths.push(w[ko]);
                                    }
                                    alreadyConverted.push(t);
                                    break;
                                case "tbody":
                                    currentParagraph = parseChildren(alreadyConverted, element, currentParagraph, styles, diff_mode);
                                    break;
                                case "tr":
                                    var row = [];
                                    currentParagraph = parseChildren(row, element, currentParagraph, styles, diff_mode);
                                    alreadyConverted.push(row);
                                    break;
                                case "td":
                                    currentParagraph = create("text");
                                    var st = create("stack");
                                    st.stack.push(currentParagraph);
                                    var rspan = element.getAttribute("rowspan");
                                    if (rspan)
                                        st.rowSpan = parseInt(rspan);
                                    var cspan = element.getAttribute("colspan");
                                    if (cspan)
                                        st.colSpan = parseInt(cspan);
                                    currentParagraph = parseChildren(st.stack, element, currentParagraph, styles, diff_mode);
                                    alreadyConverted.push(st);
                                    break;
                                case "span":
                                    if (element.getAttribute("data-line-number")) {
                                        if (lineNumberMode === "inline") {
                                            if (diff_mode !== DIFF_MODE_INSERT) {
                                                var lineNumberInline = element.getAttribute("data-line-number"),
                                                    lineNumberObjInline = {
                                                        text: lineNumberInline,
                                                        color: "gray",
                                                        fontSize: 5
                                                    };
                                                currentParagraph.text.push(lineNumberObjInline);
                                            }
                                        } else if (lineNumberMode === "outside") {
                                            var lineNumberOutline;
                                            if (diff_mode === DIFF_MODE_INSERT) {
                                                lineNumberOutline = "";
                                            } else {
                                                lineNumberOutline = element.getAttribute("data-line-number");
                                            }
                                            var col = {
                                                columns: [
                                                    getLineNumberObject({
                                                        lineNumber: lineNumberOutline,
                                                    }),
                                                ]
                                            };
                                            currentParagraph = create("text");
                                            currentParagraph.lineHeight = 1.25;
                                            col.columns.push(currentParagraph);
                                            alreadyConverted.push(col);
                                        }
                                    }
                                    else {
                                        currentParagraph = parseChildren(alreadyConverted, element, currentParagraph, styles, diff_mode);
                                    }
                                    break;
                                case "br":
                                    var brParent = element.parentNode;
                                    var brParentNodeName = brParent.nodeName;
                                    //in case of no or inline-line-numbers and the ignore os-line-breaks.
                                    if ((lineNumberMode === 'inline' || lineNumberMode === 'none') &&
                                                hasClass(element, 'os-line-break')) {
                                        break;
                                    } else {
                                        currentParagraph = create("text");
                                        if (lineNumberMode === "outside" &&
                                                brParentNodeName !== "LI" &&
                                                element.parentNode.parentNode.nodeName !== "LI") {
                                            if (brParentNodeName === 'INS' || brParentNodeName === 'DEL') {

                                                var hasPrevSiblingALineNumber = function (element) {
                                                    // Iterare all nodes up to the top from element.
                                                    while (element) {
                                                        if (getLineNumber(element)) {
                                                            return true;
                                                        }
                                                        if (element.previousSibling) {
                                                            element = element.previousSibling;
                                                        } else {
                                                            element = element.parentNode;
                                                        }
                                                    }
                                                    return false;
                                                };
                                                if (hasPrevSiblingALineNumber(brParent)) {
                                                     currentParagraph.margin = [20, 0, 0, 0];
                                                 }
                                             } else {
                                                 currentParagraph.margin = [20, 0, 0, 0];
                                             }
                                        }
                                        // Add a dummy line, if the next tag is a BR tag again. The line could
                                        // not be empty otherwise it will be removed and the empty line is not displayed
                                        if (element.nextSibling && element.nextSibling.nodeName === 'BR') {
                                            currentParagraph.text.push(create('text', ' '));
                                        }
                                        currentParagraph.lineHeight = 1.25;
                                        alreadyConverted.push(currentParagraph);
                                    }
                                    break;
                                case "li":
                                case "div":
                                    currentParagraph = create("text");
                                    currentParagraph.lineHeight = 1.25;
                                    var stackDiv = create("stack");
                                    if (_.indexOf(classes, 'os-split-before') > -1) {
                                        stackDiv.listType = 'none';
                                    }
                                    if (nodeName === 'li') {
                                        stackDiv.marginBottom = LI_MARGIN_BOTTOM;
                                    }
                                    stackDiv.stack.push(currentParagraph);
                                    ComputeStyle(stackDiv, styles);
                                    currentParagraph = parseChildren(stackDiv.stack, element, currentParagraph, [], diff_mode);
                                    alreadyConverted.push(stackDiv);
                                    break;
                                case "p":
                                    var pObjectToPush; //determine what to push later
                                    currentParagraph = create("text");
                                    // If this element is inside a list (happens if copied from word), do not set spaces
                                    // and margins. Just leave the paragraph there..
                                    if (!isInsideAList(element)) {
                                        currentParagraph.margin = [0, 0, 0, 0];
                                        if (classes.indexOf('os-split-before') === -1) {
                                            currentParagraph.margin[1] = 8;
                                        }
                                        if (classes.indexOf('insert') > -1) {
                                            currentParagraph.margin[0] = 20;
                                        }
                                    }
                                    currentParagraph.lineHeight = 1.25;
                                    var stackP = create("stack");
                                    stackP.stack.push(currentParagraph);
                                    ComputeStyle(stackP, styles);
                                    currentParagraph = parseChildren(stackP.stack, element, currentParagraph, [], diff_mode);
                                    pObjectToPush = stackP; //usually we want to push stackP
                                    if (lineNumberMode === "outside") {
                                        if (element.childNodes.length > 0) { //if we hit = 0, the code would fail
                                            // add empty line number column for inline diff or pragraph diff mode
                                            if (element.childNodes[0].tagName === "INS" ||
                                                element.childNodes[0].tagName === "DEL") {
                                                var pLineNumberPlaceholder = {
                                                    width: 20,
                                                    text: "",
                                                    fontSize: 8,
                                                    margin: [0, 2, 0, 0]
                                                };
                                                var pLineNumberPlaceholderCol = {
                                                    columns: [
                                                        pLineNumberPlaceholder,
                                                        stackP
                                                    ]
                                                };
                                                pObjectToPush = pLineNumberPlaceholderCol; //overwrite the object to push
                                            }
                                        }
                                    }
                                    alreadyConverted.push(pObjectToPush);
                                    break;
                                case "img":
                                    var regex = /([\w-]*)\s*:\s*([^;]*)/g;
                                    var match; //helper variable for the regex
                                    var imageSize={};
                                    var maxResolution = {
                                        width: 435,
                                        height: 830
                                    };

                                    if (element.getAttribute("style")) {
                                        while ((match = regex.exec(element.getAttribute("style"))) !== null) {
                                            imageSize[match[1]] = parseInt(match[2].trim());
                                        }
                                    } else {
                                        imageSize = {
                                            height: images[element.getAttribute("src")].height,
                                            width: images[element.getAttribute("src")].width
                                        };
                                    }

                                    if (imageSize.width > maxResolution.width) {
                                        var scaleByWidth = maxResolution.width/imageSize.width;
                                        imageSize.width *= scaleByWidth;
                                        imageSize.height *= scaleByWidth;
                                    }
                                    if (imageSize.height > maxResolution.height) {
                                        var scaleByHeight = maxResolution.height/imageSize.height;
                                        imageSize.width *= scaleByHeight;
                                        imageSize.height *= scaleByHeight;
                                    }
                                    var path = element.getAttribute("src");
                                    if (path.indexOf('/') === 0) {
                                        path = path.substr(1); // remove trailing /
                                    }
                                    alreadyConverted.push({
                                        image: path,
                                        width: imageSize.width,
                                        height: imageSize.height
                                    });
                                    break;
                                case "ul":
                                case "ol":
                                    var list = create(nodeName);
                                    if (nodeName == 'ol') {
                                        var start = element.getAttribute('start');
                                        if (start) {
                                            list.start = start;
                                        }
                                    }
                                    ComputeStyle(list, styles);
                                    if (lineNumberMode === "outside") {
                                        var lines = extractLineNumbers(element);
                                        currentParagraph = parseChildren(list[nodeName], element, currentParagraph, styles, diff_mode);
                                        if (lines.length > 0) {
                                            var listCol = {
                                                columns: [{
                                                    width: 20,
                                                    stack: []
                                                }]
                                            };
                                            _.forEach(lines, function(line) {
                                                listCol.columns[0].stack.push(getLineNumberObject(line));
                                            });
                                            listCol.columns.push(list);
                                            if (!hasClass(element, 'os-split-before')) {
                                                listCol.margin = [0, 5, 0, 0];
                                            }
                                            alreadyConverted.push(listCol);
                                        } else {
                                            list.margin = [20, 0, 0, 0];
                                            alreadyConverted.push(list);
                                        }
                                    } else {
                                        list.margin = [0, LI_MARGIN_BOTTOM, 0, 0];
                                        currentParagraph = parseChildren(list[nodeName], element, currentParagraph, styles, diff_mode);
                                        alreadyConverted.push(list);
                                    }
                                    break;
                                default:
                                    var defaultText = create("text", element.textContent.replace(/\n/g, ""));
                                    ComputeStyle(defaultText, styles);
                                    if (!currentParagraph) {
                                        currentParagraph = {};
                                        currentParagraph.text = [];
                                    }
                                    currentParagraph.text.push(defaultText);
                                    break;
                            }
                            return currentParagraph;
                        },
                        /**
                         * Parses HTML
                         * @function
                         * @param {string} converted      -
                         * @param {object} htmlText   -
                         */
                        ParseHtml = function(converted, htmlText) {
                            var html = HTMLValidizer.validize(htmlText);
                            html = $(html.replace(/\t/g, "").replace(/\n/g, ""));
                            var emptyParagraph = create("text");
                            slice(html).forEach(function(element) {
                                ParseElement(converted, element, null, [], DIFF_MODE_NORMAL);
                            });
                        },
                        /* Returns the object to push first into every column, that represents the given line. */
                        getLineNumberObject = function (line) {
                            var standardFontsize = Config.get('general_export_pdf_fontsize').value;
                            return {
                                width: 20,
                                text: [
                                    {
                                        text: ' ', // Add a blank with the normal font size here, so in rare cases the text
                                                   // is rendered on the next page and the linenumber on the previous page.
                                        fontSize: standardFontsize,
                                        decoration: '',
                                    },
                                    {
                                        text: line.lineNumber,
                                        color: "gray",
                                        fontSize: standardFontsize - 2,
                                        decoration: '',
                                    },
                                ],
                                marginBottom: line.marginBottom,
                                lineHeight: 1.25,
                            };
                        },
                        content = [];
                    ParseHtml(content, html);
                    return content;
                },
                /**
                 * Creates containerelements for pdfMake
                 * e.g create("text":"MyText") result in { text: "MyText" }
                 * or complex objects create("stack", [{text:"MyText"}, {text:"MyText2"}])
                 *for units / paragraphs of text
                 *
                 * @function
                 * @param {string} name      - name of the attribute holding content
                 * @param {object} content   - the actual content (maybe empty)
                 */
                create = function(name, content) {
                    var o = {};
                    content = content || [];
                    o[name] = content;
                    return o;
                };
            return {
                convertHTML: convertHTML,
                createElement: create
            };
        };
        return {
            createInstance: createInstance
        };
    }
])

.factory('ImageConverter', [
    '$q',
    'PDFLayout',
    function ($q, PDFLayout) {
        return {
            toBase64: function (imageSources) {
                var imageMap = {};
                var imagePromises = _.map(imageSources, function (imageSource) {
                    if (imageSource) {
                        return PDFLayout.imageURLtoBase64(imageSource).then(function (imgInfo) {
                            imageMap[imageSource] = imgInfo;
                        });
                    }
                });

                return $q(function (resolve) {
                    //resolve promises to get base64
                    $q.all(imagePromises).then(function() {
                        resolve(imageMap);
                    });
                });
            }
        };
    }
])

// Creates the virtual filesystem for PdfMake.
.factory('PdfVfs', [
    '$q',
    '$http',
    'Fonts',
    'Config',
    function ($q, $http, Fonts, Config) {
        var urlCache = {}; // Caches the get request. Maps urls to base64 data ready to use.

        var loadFont = function (url) {
            return $q(function (resolve, reject) {
                // Get font
                return $http.get(url, {responseType: 'blob'}).then(function (success) {
                    // Convert to base64
                    var reader = new FileReader();
                    reader.readAsDataURL(success.data);
                    reader.onloadend = function() {
                        resolve(reader.result.split(',')[1]);
                    };
                }, function (error) {
                    reject(error);
                });
            });
        };

        /*
         * Returns a map from urls to arrays of font types used by PdfMake.
         * E.g. if the font "regular" and bold" have the urls "fonts/myFont.ttf",
         * the map fould be "fonts/myFont.ttf": ["OSFont-regular.ttf", "OSFont-bold.ttf"]
         */
        var getUrlMapping = function () {
            var urlMap = {};
            var fonts = ['regular', 'italic', 'bold', 'bold_italic'];
            _.forEach(fonts, function (font) {
                var url = Fonts.getUrl('font_' + font);
                if (!urlMap[url]) {
                    urlMap[url] = [];
                }
                urlMap[url].push('OSFont-' + font + '.ttf');
            });
            return urlMap;
        };

        /*
         * Create the virtual filesystem needed by PdfMake for the fonts. Gets the url
         * mapping and loads all fonts via get requests or the urlCache.
         * Adds all image sources to the vfs given by the imageMap.
         */
        var getVfs = function (imageMap) {
            var vfs = {};
            _.forEach(imageMap || {}, function (data, path) {
                if (path.indexOf('/') === 0) {
                    path = path.substr(1); // remove trailing /
                }
                vfs[path] = data.data.split(',')[1];
            });
            return $q(function (resolve, reject) {
                var urls = getUrlMapping();
                var promises = _.chain(urls)
                    .map(function (filenames, url) {
                        if (urlCache[url]) {
                            // Just save the cache data into vfs.
                            _.forEach(filenames, function (filename) {
                                vfs[filename] = urlCache[url];
                            });
                            return false; // No promise here, it was all cached.
                        } else {
                            // Not in the cache, get the font and save the data into vfs.
                            return loadFont(url).then(function (data) {
                                urlCache[url] = data;
                                _.forEach(filenames, function (filename) {
                                    vfs[filename] = data;
                                });
                            });
                        }
                    })
                    .filter(function (promise) {
                        return promise;
                    })
                    .value();
                $q.all(promises).then(function () {
                    resolve(vfs);
                });
            });
        };

        return {
            get: getVfs,
        };
    }
])

.factory('PdfCreate', [
    '$timeout',
    '$q',
    'gettextCatalog',
    'FileSaver',
    'PdfVfs',
    'Messaging',
    function ($timeout, $q, gettextCatalog, FileSaver, PdfVfs, Messaging) {
        var filenameMessageMap = {};
        var b64toBlob = function(b64Data) {
            var byteCharacters = atob(b64Data);
            var byteNumbers = new Array(byteCharacters.length);
            for (var i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            var byteArray = new Uint8Array(byteNumbers);
            var blob = new Blob([byteArray]);
            return blob;
        };
        var stateChange = function (state, filename, error) {
            var text, timeout;
            switch (state) {
                case 'info':
                    text = '<i class="fa fa-spinner fa-pulse fa-lg spacer-right"></i>' +
                        gettextCatalog.getString('Generating PDF file') + ' (' + filename + ') ...';
                    break;
                case 'success':
                    text = '<i class="fa fa-check fa-lg spacer-right"></i>' +
                        gettextCatalog.getString('PDF successfully generated.');
                    timeout = 3000;
                    break;
                case 'error':
                    text = '<i class="fa fa-exclamation-triangle fa-lg spacer-right"></i>' +
                        gettextCatalog.getString('Error while generating PDF file') +
                        ' (' + filename + '): <code>' + error + '</code>';
                    break;
            }
            $timeout(function () {
                filenameMessageMap[filename] = Messaging.createOrEditMessage(
                    filenameMessageMap[filename], text, state, {timeout: timeout});
            }, 1);
        };
        return {
            getBase64FromDocument: function (documentProvider) {
                return $q(function (resolve, reject) {
                    PdfVfs.get(documentProvider.getImageMap()).then(function (vfs) {
                        var pdfWorker = new Worker('/static/js/workers/pdf-worker.js');
                        pdfWorker.addEventListener('message', function (event) {
                            resolve(event.data);
                        });
                        pdfWorker.addEventListener('error', function (event) {
                            reject(event);
                        });
                        pdfWorker.postMessage(JSON.stringify({
                            pdfDocument: documentProvider.getDocument(),
                            vfs: vfs,
                        }));
                    });
                });
            },
            // Struckture of pdfDocuments: { filname1: doc, filename2: doc, ...}
            getBase64FromMultipleDocuments: function (pdfDocuments) {
                // concat all image sources together
                var imageMap = {};
                _.forEach(pdfDocuments, function (doc) {
                    _.forEach(doc.getImageMap(), function (data, path) {
                        if (!imageMap[path]) {
                            imageMap[path] = data;
                        }
                    });
                });
                return $q(function (resolve, reject) {
                    PdfVfs.get(imageMap).then(function (vfs) {
                        var pdfWorker = new Worker('/static/js/workers/pdf-worker.js');
                        var resultCount = 0;
                        var base64Map = {}; // Maps filename to base64
                        pdfWorker.addEventListener('message', function (event) {
                            resultCount++;
                            var data = JSON.parse(event.data);
                            base64Map[data.filename] = data.base64;
                            if (resultCount === _.keys(pdfDocuments).length) {
                                resolve(base64Map);
                            }
                        });
                        pdfWorker.addEventListener('error', function (event) {
                            reject(event);
                        });
                        _.forEach(pdfDocuments, function (doc, filename) {
                            pdfWorker.postMessage(JSON.stringify({
                                filename: filename,
                                pdfDocument: doc.getDocument(),
                                vfs: vfs,
                            }));
                        });
                    });
                });
            },
            download: function (documentProvider, filename) {
                stateChange('info', filename);

                this.getBase64FromDocument(documentProvider).then(function (data) {
                    var blob = b64toBlob(data);
                    stateChange('success', filename);
                    FileSaver.saveAs(blob, filename);
                }, function (error) {
                    stateChange('error', filename, error.message);
                });
            },
        };
    }
]);

}());
