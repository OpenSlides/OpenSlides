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

        // returns a promise for converting an image in data URL format
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
                    resolve(dataURL);
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

    //checks if str is valid HTML. Returns valid HTML if not,
    //return emptystring if empty
    HTMLValidizer.validize = function(str) {
        if (str) {
            var a = document.createElement('div');
            a.innerHTML = str;
            angular.forEach(a.childNodes, function (child) {
                if (child.nodeType == 1) {
                    return str;
                }
            });
            return "<p>" + str + "</p>";
        } else {
            return ""; //needed for blank "reaons" field
        }
    };
    return HTMLValidizer;
})


.factory('PdfMakeDocumentProvider', [
    '$q',
    'Config',
    'PDFLayout',
    'PdfImageConverter',
    function($q, Config, PDFLayout, PdfImageConverter) {
        /**
         * Provides the global document
         * @constructor
         * @param {object} contentProvider - Object with on method `getContent`, which
         * returns an array for content
         */
        //images shall contain the the logos as URL: base64Str, just like the converter
        var createInstance = function(contentProvider) {
            // Logo urls
            var logoHeaderUrl = Config.get('logo_pdf_header').value.path,
                logoFooterUrl = Config.get('logo_pdf_footer').value.path;
            var imageMap = {};

            // PDF header
            var getHeader = function() {
                var columns = [];

                if (logoHeaderUrl) {
                    columns.push({
                        image: imageMap[logoHeaderUrl],
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
                    columns.push({
                        image: imageMap[logoFooterUrl],
                        fit: [400,50],
                        width: '80%'
                    });
                }
                columns.push({
                    text: '{{currentPage}} / {{pageCount}}',
                    color: '#555',
                    fontSize: 9,
                    alignment: 'right',
                    margin: [0, 15, 0, 0],
                });
                return {
                    margin: [75, 0, 75, 10],
                    columns: columns,
                    columnGap: 10,
                };
            };
            // Generates the document(definition) for pdfMake
            var getDocument = function(noFooter) {
                var content = contentProvider.getContent();
                return {
                    pageSize: 'A4',
                    pageMargins: [75, 90, 75, 75],
                    defaultStyle: {
                        font: 'PdfFont',
                        fontSize: 10
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
                            fontSize: 10,
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

            return $q(function (resolve) {
                var imageSources = [
                    logoHeaderUrl,
                    logoFooterUrl
                ];
                PdfImageConverter.toBase64(imageSources).then(function (_imageMap) {
                    imageMap = _imageMap;
                    resolve({
                        getDocument: getDocument
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
            return {
                getDocument: getDocument
            };
        };
        return {
            createInstance: createInstance
        };
    }
])

.factory('PdfMakeConverter', [
    'HTMLValidizer',
    function(HTMLValidizer) {
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
                        /**
                         * Removes all line number nodes (not line-breaks)
                         * and returns an array containing the reoved numbers (as integer, not as node)
                         *
                         * @function
                         * @param {object} element
                         */
                        extractLineNumbers = function(element) {
                            var foundLineNumbers = [];
                            if (element.nodeName == 'SPAN' && element.getAttribute('class') && element.getAttribute('class').indexOf('os-line-number') > -1) {
                                foundLineNumbers.push(element.getAttribute('data-line-number'));
                                element.parentNode.removeChild(element);
                            } else {
                                var children = element.childNodes,
                                    childrenLength = children.length;
                                for (var i = 0; i < children.length; i++) {
                                    foundLineNumbers = _.union(foundLineNumbers, extractLineNumbers(children[i]));
                                    if (children.length < childrenLength) {
                                        i -= (childrenLength - children.length);
                                        childrenLength = children.length;
                                    }
                                }
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

                            if (hexRegex.test(color)) {
                                return color;
                            } else if(rgbRegex.test(color)) {
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
                                if (styleDefinition.length == 2) {
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
                                            o.background = value;
                                            break;
                                    }
                                }
                            });
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
                            styles = styles || [];
                            var classes = [];
                            if (element.getAttribute) {
                                styles = [];
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
                                    // Special case quick fix to handle the dirty HTML format*/
                                    // see following issue: https://github.com/OpenSlides/OpenSlides/issues/3025
                                    if (lineNumberMode === "outside") {
                                        var HeaderOutsideLineNumber = {
                                            width: 20,
                                            text: element.childNodes[0].getAttribute("data-line-number"),
                                            color: "gray",
                                            fontSize: 8,
                                            margin: [0, 2, 0, 0]
                                        };
                                        var HeaderOutsideLineNumberText = {
                                            text: element.childNodes[1].textContent,
                                        };
                                        ComputeStyle(HeaderOutsideLineNumberText, elementStyles[nodeName]);
                                        var HeaderOutsideLineNumberColumns = {
                                            columns: [
                                                HeaderOutsideLineNumber,
                                                HeaderOutsideLineNumberText
                                            ]
                                        };
                                        alreadyConverted.push(HeaderOutsideLineNumberColumns);
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
                                    if (border)
                                        if (parseInt(border) == 1) isBorder = true;
                                    if (!isBorder) t.layout = 'noBorders';
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
                                        if (lineNumberMode == "inline") {
                                            if (diff_mode != DIFF_MODE_INSERT) {
                                                var lineNumberInline = element.getAttribute("data-line-number"),
                                                    lineNumberObjInline = {
                                                        text: lineNumberInline,
                                                        color: "gray",
                                                        fontSize: 5
                                                    };
                                                currentParagraph.text.push(lineNumberObjInline);
                                            }
                                        } else if (lineNumberMode == "outside") {
                                            var lineNumberOutline;
                                            if (diff_mode == DIFF_MODE_INSERT) {
                                                lineNumberOutline = "";
                                            } else {
                                                lineNumberOutline = element.getAttribute("data-line-number");
                                            }
                                            var lineNumberObject = {
                                                    width: 20,
                                                    text: lineNumberOutline,
                                                    color: "gray",
                                                    fontSize: 8,
                                                    margin: [0, 2, 0, 0]
                                            },
                                                col = {
                                                    columns: [
                                                        lineNumberObject,
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
                                    //in case of inline-line-numbers and the os-line-break class ignore the break
                                    if ((lineNumberMode == "inline" &&
                                                element.getAttribute("class") == "os-line-break") ||
                                        (lineNumberMode == "outside" &&
                                                element.getAttribute("class") == "os-line-break" &&
                                                brParent.getAttribute("class") == "insert") ||
                                        (lineNumberMode == "outside" &&
                                                element.getAttribute("class") == "os-line-break" &&
                                                brParent.getAttribute("class") == "merge-before")) {
                                        break;
                                    } else {
                                        currentParagraph = create("text");
                                        if (lineNumberMode == "outside" && brParentNodeName == ("INS" || "DEL")) {
                                            currentParagraph.margin = [20, 0, 0, 0];
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
                                    stackDiv.stack.push(currentParagraph);
                                    ComputeStyle(stackDiv, styles);
                                    currentParagraph = parseChildren(stackDiv.stack, element, currentParagraph, [], diff_mode);
                                    alreadyConverted.push(stackDiv);
                                    break;
                                case "p":
                                    var pObjectToPush; //determine what to push later
                                    currentParagraph = create("text");
                                    if (classes.indexOf("merge-before") > -1) {
                                        currentParagraph.marginTop = 0;
                                    } else {
                                        currentParagraph.marginTop = 8;
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
                                                element.getAttribute("class") === "insert" ||
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
                                    // TODO: need a proper way to calculate the space
                                    // left on the page.
                                    // This requires further information
                                    // A4 in 72dpi: 595px x 842px
                                    var maxResolution = {
                                        width: 435,
                                        height: 830
                                    },
                                        width = parseInt(element.getAttribute("width")),
                                        height = parseInt(element.getAttribute("height"));

                                    if (width > maxResolution.width) {
                                        var scaleByWidth = maxResolution.width/width;
                                        width *= scaleByWidth;
                                        height *= scaleByWidth;
                                    }
                                    if (height > maxResolution.height) {
                                        var scaleByHeight = maxResolution.height/height;
                                        width *= scaleByHeight;
                                        height *= scaleByHeight;
                                    }
                                    alreadyConverted.push({
                                        image: images[element.getAttribute("src")],
                                        width: width,
                                        height: height
                                    });
                                    break;
                                case "ul":
                                case "ol":
                                    var list = create(nodeName);
                                    ComputeStyle(list, styles);
                                    if (lineNumberMode == "outside") {
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
                                                listCol.columns[0].stack.push({
                                                    width: 20,
                                                    text: line,
                                                    color: "gray",
                                                    fontSize: 8,
                                                    lineHeight: 1.25,
                                                    margin: [0, 2.85, 0, 0]
                                                });
                                            });
                                            listCol.columns.push(list);
                                            listCol.margin = [0,10,0,0];
                                            alreadyConverted.push(listCol);
                                        } else {
                                            alreadyConverted.push(list);
                                        }
                                    } else {
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

.factory('PdfImageConverter', [
    '$q',
    'PDFLayout',
    function ($q, PDFLayout) {
        return {
            toBase64: function (imageSources) {
                var imageMap = {};
                var imagePromises = _.map(imageSources, function (imageSource) {
                    if (imageSource) {
                        return PDFLayout.imageURLtoBase64(imageSource).then(function (base64Str) {
                            imageMap[imageSource] = base64Str;
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

.factory('PdfCreate', [
    '$timeout',
    '$q',
    'gettextCatalog',
    'FileSaver',
    'Messaging',
    function ($timeout, $q, gettextCatalog, FileSaver, Messaging) {
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
            getBase64FromDocument: function (pdfDocument) {
                return $q(function (resolve, reject) {
                    var pdfWorker = new Worker('/static/js/workers/pdf-worker.js');
                    pdfWorker.addEventListener('message', function (event) {
                        resolve(event.data);
                    });
                    pdfWorker.addEventListener('error', function (event) {
                        reject(event);
                    });
                    pdfWorker.postMessage(JSON.stringify(pdfDocument));
                });
            },
            download: function (pdfDocument, filename) {
                stateChange('info', filename);

                this.getBase64FromDocument(pdfDocument).then(function (data) {
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
