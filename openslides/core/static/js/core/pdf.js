(function () {

'use strict';

angular.module('OpenSlidesApp.core.pdf', [])

.factory('PdfPredefinedFunctions', [
    function() {
        var PdfPredefinedFunctions = {};
        var BallotCircleDimensions = {
            yDistance: 6,
            size: 8
        };

        PdfPredefinedFunctions.createTitle = function(titleString) {
            return {
                text: titleString,
                style: "title"
            };
        };

        // function to apply a pagebreak-keyword
        PdfPredefinedFunctions.addPageBreak = function() {
            return [
                {
                    text: '',
                    pageBreak: 'after'
                }
            ];
        };

        PdfPredefinedFunctions.flipTableRowStyle = function(currentTableSize) {
            if (currentTableSize % 2 === 0) {
                return "tableEven";
            } else {
                return "tableOdd";
            }
        };

        //draws a circle
        PdfPredefinedFunctions.drawCircle = function(y, size) {
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

        //Returns an entry in the ballot with a circle to draw into
        PdfPredefinedFunctions.createBallotEntry = function(decision) {
            return {
                margin: [40+BallotCircleDimensions.size, 10, 0, 0],
                columns: [
                    {
                        width: 15,
                        canvas: PdfPredefinedFunctions.drawCircle(BallotCircleDimensions.yDistance, BallotCircleDimensions.size)
                    },
                    {
                        width: "auto",
                        text: decision
                    }
                ],
            };
        };

        PdfPredefinedFunctions.getBallotLayoutLines = function() {
            return {
                hLineWidth: function(i, node) {
                    return (i === 0 || i === node.table.body.length) ? 0 : 0.5;
                },
                vLineWidth: function(i, node) {
                    return (i === 0 || i === node.table.widths.length) ? 0 : 0.5;
                },
                hLineColor: function(i, node) {
                    return (i === 0 || i === node.table.body.length) ? 'none' : 'gray';
                },
                vLineColor: function(i, node) {
                    return (i === 0 || i === node.table.widths.length) ? 'none' : 'gray';
                },
            };
        };

        return PdfPredefinedFunctions;
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
    function(gettextCatalog, Config) {
        /**
         * Provides the global Document
         * @constructor
         * @param {object} contentProvider - Object with on method `getContent`, which returns an array for content
         * @param {string} defaultFont - Default font for the document
         */
        var createInstance = function(contentProvider, defaultFont) {
            /**
             * Generates header for PDF
             * @constructor
             */
            var header = function() {
                    var date = new Date();
                    return {
                        // alignment: 'center',
                        color: '#555',
                        fontSize: 10,
                        margin: [80, 50, 80, 0], //margin: [left, top, right, bottom]
                        columns: [
                          {
                            text: Config.get('general_event_name').value + ' · ' + Config.get('general_event_description').value ,
                            fontSize:10,
                            width: '70%'
                          },
                          {
                            fontSize: 6,
                            width: '30%',
                            text: gettextCatalog.getString('As of') + " " + date.toLocaleDateString() + " " + date.toLocaleTimeString(),
                            alignment: 'right'
                        }]
                    };
                },
                /**
                 * Generates footer line
                 * @function
                 * @param {object} currentPage   - An object representing the current page
                 * @param {number} pageCount - number for pages
                 */
                footer = function(currentPage, pageCount) {
                    return {
                        alignment: 'center',
                        fontSize: 8,
                        color: '#555',
                        text: gettextCatalog.getString('Page') + ' ' + currentPage.toString() + ' / ' + pageCount.toString()
                    };
                },
                /**
                 * Generates the document(definition) for pdfMake
                 * @function
                 */
                getDocument = function() {
                    var content = contentProvider.getContent();
                    return {
                        pageSize: 'A4',
                        pageMargins: [80, 90, 80, 60],
                        defaultStyle: {
                            font: defaultFont,
                            fontSize: 10
                        },
                        header: header,
                        footer: footer,
                        content: content,
                        styles: {
                            title: {
                                fontSize: 30,
                                margin: [0,0,0,20],
                                bold: true
                            },
                            preamble: {
                                fontSize: 12,
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
                            heading: {
                                fontSize: 16,
                                margin: [0,0,0,10],
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
                                fontSize: 14,
                                margin: [0,5]
                            },
                            listChild: {
                                fontSize: 11,
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
    'gettextCatalog',
    'Config',
    function(gettextCatalog, Config) {
        /**
         * Provides the global Document
         * @constructor
         * @param {object} contentProvider - Object with on method `getContent`, which returns an array for content
         * @param {string} defaultFont - Default font for the document
         */
        var createInstance = function(contentProvider, defaultFont) {
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
                        font: defaultFont,
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
         * @param {object} fonts    - Key-Value structure representing fonts (detailed description below)
         * @param {object} pdfMake  - the converter component enhances pdfMake
         */
        var createInstance = function(images, fonts, pdfMake) {
            var slice = Function.prototype.call.bind([].slice),
                map = Function.prototype.call.bind([].map),

                DIFF_MODE_NORMAL = 0,
                DIFF_MODE_INSERT = 1,
                DIFF_MODE_DELETE = 2,

                /**
                 * Adds a custom font to pdfMake.vfs
                 * @function
                 * @param {object} fontFiles - object with Files to add to pdfMake.vfs
                 * {
                 *      normal: $Filename
                 *      bold: $Filename
                 *      italics: $Filename
                 *      bolditalics: $Filename
                 *  }
                 */
                addFontToVfs = function(fontFiles) {
                    Object.keys(fontFiles).forEach(function(name) {
                        var file = fontFiles[name];
                        pdfMake.vfs[file.name] = file.content;
                    });
                },
                /**
                 * Adds custom fonts to pdfMake
                 * @function
                 * @param {object} fontInfo - Font configuration from Backend
                 * {
                 *     $FontName : {
                 *         normal: $Filename
                 *         bold: $Filename
                 *         italics: $Filename
                 *         bolditalics: $Filename
                 *      }
                 *  }
                 */
                registerFont = function(fontInfo) {
                    Object.keys(fontInfo).forEach(function(name) {
                        var font = fontInfo[name];
                        addFontToVfs(font);
                        pdfMake.fonts = pdfMake.fonts || {};
                        pdfMake.fonts[name] = Object.keys(font).reduce(function(fontDefinition, style) {
                            fontDefinition[style] = font[style].name;
                            return fontDefinition;
                        }, {});
                    });
                },
                /**
                 * Convertes HTML for use with pdfMake
                 * @function
                 * @param {object} html - html
                 */
                convertHTML = function(html, scope) {
                    var elementStyles = {
                            "b": ["font-weight:bold"],
                            "strong": ["font-weight:bold"],
                            "u": ["text-decoration:underline"],
                            "em": ["font-style:italic"],
                            "i": ["font-style:italic"],
                            "h1": ["font-size:30"],
                            "h2": ["font-size:28"],
                            "h3": ["font-size:26"],
                            "h4": ["font-size:24"],
                            "h5": ["font-size:22"],
                            "h6": ["font-size:20"],
                            "a": ["color:blue", "text-decoration:underline"]
                        },
                        classStyles = {
                            "delete": ["color:red", "text-decoration:line-through"],
                            "insert": ["color:green", "text-decoration:underline"]
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
                                    /* falls through */
                                case "a":
                                    parseChildren(alreadyConverted, element, currentParagraph, styles.concat(elementStyles[nodeName]), diff_mode);
                                    alreadyConverted.push(currentParagraph);
                                    break;
                                case "b":
                                case "strong":
                                case "u":
                                case "em":
                                case "i":
                                    parseChildren(alreadyConverted, element, currentParagraph, styles.concat(elementStyles[nodeName]), diff_mode);
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
                                    parseChildren(t.table.body, element, currentParagraph, styles, diff_mode);
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
                                    parseChildren(alreadyConverted, element, currentParagraph, styles, diff_mode);
                                    break;
                                case "tr":
                                    var row = [];
                                    parseChildren(row, element, currentParagraph, styles, diff_mode);
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
                                    parseChildren(st.stack, element, currentParagraph, styles, diff_mode);
                                    alreadyConverted.push(st);
                                    break;
                                case "span":
                                    if (scope.lineNumberMode == "inline") {
                                        if (diff_mode != DIFF_MODE_INSERT) {
                                            var lineNumberInline = element.getAttribute("data-line-number"),
                                                lineNumberObjInline = {
                                                    text: lineNumberInline,
                                                    color: "gray",
                                                    fontSize: 5
                                                };
                                            currentParagraph.text.push(lineNumberObjInline);
                                        }
                                        parseChildren(alreadyConverted, element, currentParagraph, styles, diff_mode);
                                    } else if (scope.lineNumberMode == "outside") {
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
                                        col.columns.push(currentParagraph);
                                        parseChildren(col.columns[0], element, currentParagraph, styles, diff_mode);
                                        alreadyConverted.push(col);
                                    } else {
                                        parseChildren(alreadyConverted, element, currentParagraph, styles, diff_mode);
                                    }
                                    break;
                                case "br":
                                    //in case of inline-line-numbers and the os-line-break class ignore the break
                                    if (!(scope.lineNumberMode == "inline" && element.getAttribute("class") == "os-line-break")) {
                                        currentParagraph = create("text");
                                        alreadyConverted.push(currentParagraph);
                                    }
                                    break;
                                case "li":
                                case "div":
                                    currentParagraph = create("text");
                                    var stackDiv = create("stack");
                                    stackDiv.stack.push(currentParagraph);
                                    ComputeStyle(stackDiv, styles);
                                    parseChildren(stackDiv.stack, element, currentParagraph, [], diff_mode);
                                    alreadyConverted.push(stackDiv);
                                    break;
                                case "p":
                                    currentParagraph = create("text");
                                    currentParagraph.margin = [0,5];
                                    var stackP = create("stack");
                                    stackP.stack.push(currentParagraph);
                                    ComputeStyle(stackP, styles);
                                    parseChildren(stackP.stack, element, currentParagraph, [], diff_mode);
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
                                    var u = create("ul");
                                    parseChildren(u.ul, element, currentParagraph, styles, diff_mode);
                                    alreadyConverted.push(u);
                                    break;
                                case "ol":
                                    var o = create("ol");
                                    parseChildren(o.ol, element, currentParagraph, styles, diff_mode);
                                    alreadyConverted.push(o);
                                    break;
                                default:
                                    var temporary = create("text", element.textContent.replace(/\n/g, ""));
                                    if (styles) {
                                        ComputeStyle(temporary, styles);
                                    }
                                    // TODO: This if-clause is a hotfix for issue #2442.
                                    // Do this right! Why is currentParagraph undefined?
                                    if (!currentParagraph) {
                                        currentParagraph = {};
                                        currentParagraph.text = [];
                                    }
                                    currentParagraph.text.push(temporary);
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
            fonts.forEach(function(fontInfo) {
                registerFont(fontInfo);
            });
            return {
                convertHTML: convertHTML,
                createElement: create
            };
        };
        return {
            createInstance: createInstance
        };
}]);

}());
