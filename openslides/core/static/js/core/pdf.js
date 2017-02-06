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
    'gettextCatalog',
    'Config',
    'PDFLayout',
    function(gettextCatalog, Config, PDFLayout) {
        /**
         * Provides the global document
         * @constructor
         * @param {object} contentProvider - Object with on method `getContent`, which
         * returns an array for content
         */
        var createInstance = function(contentProvider) {
            // PDF header
            var getHeader = function() {
                var columns = [];

                // add here your custom logo (which has to be added to a custom vfs_fonts.js)
                // see https://github.com/pdfmake/pdfmake/wiki/Custom-Fonts---client-side
                /*
                columns.push({
                    image: 'logo.png',
                    fit: [180,40]
                });*/

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
                    fontSize:10,
                    width: '100%'
                });
                return {
                    color: '#555',
                    fontSize: 9,
                    margin: [75, 30, 75, 10], // [left, top, right, bottom]
                    columns: columns,
                    columnGap: 10
                };
            };


            // PDF footer
            // Used placeholder for currentPage and pageCount which
            // are replaced by dynamic footer function in pdf-worker.js.
            var getFooter = function() {
                return {
                    alignment: 'right',
                    margin: [0, 15, 75, 0],
                    fontSize: 9,
                    color: '#555',
                    text: '{{currentPage}} / {{pageCount}}'
                };
            };
            // Generates the document(definition) for pdfMake
            var getDocument = function(noFooter) {
                var content = contentProvider.getContent();
                return {
                    pageSize: 'A4',
                    pageMargins: [75, 90, 75, 100],
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

            return {
                getDocument: getDocument
            };
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
                                            o.color = value;
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
                                    nodeClass.split(" ").forEach(function(nodeClass) {
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
                                    currentParagraph = create("text");
                                    currentParagraph.marginBottom = 4;
                                    currentParagraph.marginTop = 10;
                                    /* falls through */
                                case "a":
                                    currentParagraph = parseChildren(alreadyConverted, element, currentParagraph, styles.concat(elementStyles[nodeName]), diff_mode);
                                    alreadyConverted.push(currentParagraph);
                                    break;
                                case "b":
                                case "strong":
                                case "u":
                                case "em":
                                case "i":
                                case "ins":
                                case "del":
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
                                    //in case of inline-line-numbers and the os-line-break class ignore the break
                                    if (!(lineNumberMode == "inline" && element.getAttribute("class") == "os-line-break")) {
                                        currentParagraph = create("text");
                                        currentParagraph.lineHeight = 1.25;
                                        alreadyConverted.push(currentParagraph);
                                    }
                                    break;
                                case "li":
                                case "div":
                                    currentParagraph = create("text");
                                    var stackDiv = create("stack");
                                    stackDiv.stack.push(currentParagraph);
                                    ComputeStyle(stackDiv, styles);
                                    currentParagraph = parseChildren(stackDiv.stack, element, currentParagraph, [], diff_mode);
                                    alreadyConverted.push(stackDiv);
                                    break;
                                case "p":
                                    currentParagraph = create("text");
                                    currentParagraph.marginTop = 8;
                                    currentParagraph.lineHeight = 1.25;
                                    var stackP = create("stack");
                                    stackP.stack.push(currentParagraph);
                                    ComputeStyle(stackP, styles);
                                    currentParagraph = parseChildren(stackP.stack, element, currentParagraph, [], diff_mode);
                                    alreadyConverted.push(stackP);
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
                                        image: BaseMap[element.getAttribute("src")],
                                        width: width,
                                        height: height
                                    });
                                    break;
                                case "ul":
                                case "ol":
                                    var list = create(nodeName);
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
                                                    margin: [0, 2.35, 0, 0]
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
                BaseMap = images,
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
}])

.factory('PdfCreate', [
    '$timeout',
    'FileSaver',
    function ($timeout, FileSaver) {
        var stateChangeCallbacks = [];
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
            _.forEach(stateChangeCallbacks, function (cb) {
                $timeout(function () {cb(state, filename, error);}, 1);
            });
        };
        return {
            download: function (pdfDocument, filename) {
                stateChange('generating', filename);
                var pdfWorker = new Worker('/static/js/workers/pdf-worker.js');

                pdfWorker.addEventListener('message', function (event) {
                    var blob = b64toBlob(event.data);
                    stateChange('finished', filename);
                    FileSaver.saveAs(blob, filename);
                });
                pdfWorker.addEventListener('error', function (event) {
                    stateChange('error', filename, event.message);
                });
                pdfWorker.postMessage(JSON.stringify(pdfDocument));
            },
            registerStateChangeCallback: function (cb) {
                if (cb && typeof cb === 'function') {
                    stateChangeCallbacks.push(cb);
                }
            },
        };
    }
])

.directive('pdfGenerationStatus', [
    '$timeout',
    'PdfCreate',
    function($timeout, PdfCreate) {
        return {
            restrict: 'E',
            templateUrl: 'static/templates/pdf-status.html',
            scope: {},
            controller: function ($scope, $element, $attrs, $location) {
                $scope.pdfs = {};

                var createStateChange = function (state, filename, error) {
                    $scope.pdfs[filename] = {
                        state: state,
                        errorMessage: error
                    };
                    if (state === 'finished') {
                        $timeout(function () {
                            $scope.close(filename);
                        }, 3000);
                    }
                };
                PdfCreate.registerStateChangeCallback(createStateChange);

                $scope.close = function (filename) {
                    delete $scope.pdfs[filename];
                };
            },
        };
    }
]);

}());
