(function () {

'use strict';

angular.module('OpenSlidesApp.core.pdf', [])

.factory('PdfPredefinedFunctions', [
    function() {
        var PdfPredefinedFunctions = {};

        PdfPredefinedFunctions.createTitle = function(titleString) {
            return {
                text: titleString,
                style: "title"
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
                            heading: {
                                fontSize: 16,
                                margin: [0,0,0,10],
                                bold: true
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
                        /**
                         * Parses Children of the current paragraph
                         * @function
                         * @param {object} converted  -
                         * @param {object} element   -
                         * @param {object} currentParagraph -
                         * @param {object} styles -
                         */
                        parseChildren = function(converted, element, currentParagraph, styles) {
                            var elements = [];
                            var children = element.childNodes;
                            if (children.length !== 0) {
                                _.forEach(children, function(child) {
                                    currentParagraph = ParseElement(elements, child, currentParagraph, styles);
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
                         */
                        ParseElement = function(alreadyConverted, element, currentParagraph, styles) {
                            styles = styles || [];
                            if (element.getAttribute) {
                                var nodeStyle = element.getAttribute("style");
                                if (nodeStyle) {
                                    nodeStyle.split(";").forEach(function(nodeStyle) {
                                        var tmp = nodeStyle.replace(/\s/g, '');
                                        styles.push(tmp);
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
                                    parseChildren(alreadyConverted, element, currentParagraph, styles.concat(elementStyles[nodeName]));
                                    alreadyConverted.push(currentParagraph);
                                    break;
                                case "b":
                                case "strong":
                                case "u":
                                case "em":
                                case "i":
                                    parseChildren(alreadyConverted, element, currentParagraph, styles.concat(elementStyles[nodeName]));
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
                                    parseChildren(t.table.body, element, currentParagraph, styles);
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
                                    parseChildren(alreadyConverted, element, currentParagraph, styles);
                                    break;
                                case "tr":
                                    var row = [];
                                    parseChildren(row, element, currentParagraph, styles);
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
                                    parseChildren(st.stack, element, currentParagraph, styles);
                                    alreadyConverted.push(st);
                                    break;
                                case "span":
                                    if (scope.lineNumberMode == "inline") {
                                        var lineNumberInline = element.getAttribute("data-line-number"),
                                            lineNumberObjInline = {
                                            text: lineNumberInline,
                                            color: "gray",
                                            fontSize: 5
                                        };
                                        currentParagraph.text.push(lineNumberObjInline);
                                        parseChildren(alreadyConverted, element, currentParagraph, styles);
                                    } else if (scope.lineNumberMode == "outside") {
                                        var lineNumberOutline = element.getAttribute("data-line-number"),
                                            lineNumberObject = {
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
                                        parseChildren(col.columns[0], element, currentParagraph, styles);
                                        alreadyConverted.push(col);
                                    } else {
                                        parseChildren(alreadyConverted, element, currentParagraph, styles);
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
                                    parseChildren(stackDiv.stack, element, currentParagraph);
                                    alreadyConverted.push(stackDiv);
                                    break;
                                case "p":
                                    currentParagraph = create("text");
                                    currentParagraph.margin = [0,5];
                                    var stackP = create("stack");
                                    stackP.stack.push(currentParagraph);
                                    ComputeStyle(stackP, styles);
                                    parseChildren(stackP.stack, element, currentParagraph);
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
                                    parseChildren(u.ul, element, currentParagraph, styles);
                                    alreadyConverted.push(u);
                                    break;
                                case "ol":
                                    var o = create("ol");
                                    parseChildren(o.ol, element, currentParagraph, styles);
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
                                ParseElement(converted, element);
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
