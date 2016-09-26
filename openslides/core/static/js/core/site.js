(function () {

'use strict';

// The core module for the OpenSlides site
angular.module('OpenSlidesApp.core.site', [
    'OpenSlidesApp.core',
    'ui.router',
    'angular-loading-bar',
    'colorpicker.module',
    'formly',
    'formlyBootstrap',
    'localytics.directives',
    'ngBootbox',
    'ngDialog',
    'ngFileSaver',
    'ngMessages',
    'ngCsvImport',
    'ui.tinymce',
    'luegg.directives',
])

// Can be used to find out if the projector or the side is used
.constant('REALM', 'site')

//for global usage
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
}])

// Provider to register entries for the main menu.
.provider('mainMenu', [
    function() {
        var mainMenuList = [];
        var scope;

        this.register = function(config) {
            mainMenuList.push(config);
        };

        this.$get = ['operator', function(operator) {
            return {
                registerScope: function (scope) {
                    var that = this;
                    this.scope = scope;
                    this.updateMainMenu();
                    operator.onOperatorChange(function () {that.updateMainMenu();});
                },
                updateMainMenu: function () {
                    this.scope.elements = this.getElements();
                },
                getElements: function() {
                    var elements = mainMenuList.filter(function (element) {
                        return typeof element.perm === "undefined" || operator.hasPerms(element.perm);
                    });

                    elements.sort(function (a, b) {
                        return a.weight - b.weight;
                    });
                    return elements;
                }
            };
        }];
    }
])

// Load the global data when the operator changes
.run([
    'loadGlobalData',
    'operator',
    function(loadGlobalData, operator) {
        operator.onOperatorChange(loadGlobalData);
    }
])

.config([
    'mainMenuProvider',
    'gettext',
    function (mainMenuProvider, gettext) {
        mainMenuProvider.register({
            'ui_sref': 'home',
            'img_class': 'home',
            'title': gettext('Home'),
            'weight': 100,
            'perm': 'core.can_see_frontpage',
        });

        mainMenuProvider.register({
            'ui_sref': 'config',
            'img_class': 'cog',
            'title': gettext('Settings'),
            'weight': 1000,
            'perm': 'core.can_manage_config',
        });
    }
])

.config([
    '$urlRouterProvider',
    '$locationProvider',
    function($urlRouterProvider, $locationProvider) {
        // define fallback url and html5Mode
        $urlRouterProvider.otherwise('/');
        $locationProvider.html5Mode(true);
    }
])

.config([
    '$httpProvider',
    function($httpProvider) {
        // Combine the django csrf system with the angular csrf system
        $httpProvider.defaults.xsrfCookieName = 'csrftoken';
        $httpProvider.defaults.xsrfHeaderName = 'X-CSRFToken';
    }
])

.config([
    '$stateProvider',
    '$urlMatcherFactoryProvider',
    function($stateProvider, $urlMatcherFactoryProvider) {
        // Make the trailing slash optional
        $urlMatcherFactoryProvider.strictMode(false);

        // Use stateProvider.decorator to give default values to our states
        $stateProvider.decorator('views', function(state, parent) {
            var result = {},
                views = parent(state);

            if (state.abstract || state.data && state.data.extern) {
                return views;
            }

            angular.forEach(views, function(config, name) {

                // Sets default values for templateUrl
                var patterns = state.name.split('.'),
                    templateUrl,
                    controller,
                    defaultControllers = {
                        create: 'CreateCtrl',
                        update: 'UpdateCtrl',
                        list: 'ListCtrl',
                        detail: 'DetailCtrl',
                    };

                // templateUrl
                if (_.last(patterns).match(/(create|update)/)) {
                    // When state_patterns is in the form "app.module.create" or
                    // "app.module.update", use the form template.
                    templateUrl = 'static/templates/' + patterns[0] + '/' + patterns[1] + '-form.html';
                } else {
                    // Replaces the first point through a slash (the app name)
                    var appName = state.name.replace('.', '/');
                    // Replaces any folowing points though a -
                    templateUrl = 'static/templates/' + appName.replace(/\./g, '-') + '.html';
                }
                config.templateUrl = state.templateUrl || templateUrl;

                // controller
                if (patterns.length >= 3) {
                    controller = _.capitalize(patterns[1]) + defaultControllers[_.last(patterns)];
                    config.controller = state.controller || controller;
                }
                result[name] = config;
            });
            return result;
        })

        .decorator('url', function(state, parent) {
            var defaultUrl;

            if (state.abstract) {
                defaultUrl = '';
            } else {
                var patterns = state.name.split('.'),
                    defaultUrls = {
                        create: '/new',
                        update: '/edit',
                        list: '',
                        // The id is expected to be an integer, if not, the url has to
                        // be defined manually
                        detail: '/{id:int}',
                    };

                defaultUrl = defaultUrls[_.last(patterns)];
            }

            state.url = state.url || defaultUrl;
            return parent(state);
        });
    }
])

.config([
    '$stateProvider',
    '$locationProvider',
    function($stateProvider, $locationProvider) {
        // Core urls
        $stateProvider
            .state('home', {
                url: '/',
                templateUrl: 'static/templates/home.html'
            })
            .state('projector', {
                url: '/projector',
                templateUrl: 'static/templates/projector-container.html',
                data: {extern: true},
                onEnter: function($window) {
                    $window.location.href = this.url;
                }
            })
            .state('real-projector', {
                url: '/real-projector',
                templateUrl: 'static/templates/projector.html',
                data: {extern: true},
                onEnter: function($window) {
                    $window.location.href = this.url;
                }
            })
            .state('core', {
                url: '/core',
                abstract: true,
                template: "<ui-view/>",
            })

            // legal notice and version
            .state('legalnotice', {
                url: '/legalnotice',
                controller: 'LegalNoticeCtrl',
            })

            //config
            .state('config', {
                url: '/config',
                controller: 'ConfigCtrl',
                resolve: {
                    configOptions: function(Config) {
                        return Config.getConfigOptions();
                    }
                }
            })

            // search
            .state('search', {
                url: '/search?q',
                controller: 'SearchCtrl',
                templateUrl: 'static/templates/search.html',
            })

            // tag
            .state('core.tag', {
                url: '/tag',
                abstract: true,
                template: "<ui-view/>",
            })
            .state('core.tag.list', {
                resolve: {
                    tags: function(Tag) {
                        return Tag.findAll();
                    }
                }
            })
            .state('core.tag.create', {})
            .state('core.tag.detail', {
                resolve: {
                    tag: function(Tag, $stateParams) {
                        return Tag.find($stateParams.id);
                    }
                }
            })
            .state('core.tag.detail.update', {
                views: {
                    '@core.tag': {}
                }
            });

        $locationProvider.html5Mode(true);
    }
])

// Helper to add ui.router states at runtime.
// Needed for the django url_patterns.
.provider('runtimeStates', [
    '$stateProvider',
    function($stateProvider) {
        this.$get = function($q, $timeout, $state) {
            return {
                addState: function(name, state) {
                    $stateProvider.state(name, state);
                }
            };
        };
    }
])

// Load the django url patterns
.run([
    'runtimeStates',
    '$http',
    function(runtimeStates, $http) {
        $http.get('/core/url_patterns/').then(function(data) {
            for (var pattern in data.data) {
                runtimeStates.addState(pattern, {
                    'url': data.data[pattern],
                    data: {extern: true},
                    onEnter: function($window) {
                        $window.location.href = this.url;
                    }
                });
            }
        });
    }
])

// angular formly config options
.run([
    'formlyConfig',
    function (formlyConfig) {
        // NOTE: This next line is highly recommended. Otherwise Chrome's autocomplete
        // will appear over your options!
        formlyConfig.extras.removeChromeAutoComplete = true;

        // Configure custom types
        formlyConfig.setType({
          name: 'editor',
          extends: 'textarea',
          templateUrl: 'static/templates/core/editor.html',
        });
        formlyConfig.setType({
          name: 'select-single',
          extends: 'select',
          templateUrl: 'static/templates/core/select-single.html'
        });
        formlyConfig.setType({
          name: 'select-multiple',
          extends: 'select',
          templateUrl: 'static/templates/core/select-multiple.html'
        });
    }
])

// Load the global data on startup
.run([
    'loadGlobalData',
    function(loadGlobalData) {
        loadGlobalData();
    }
])

// Options for TinyMCE editor used in various create and edit views.
.factory('Editor', [
    'gettextCatalog',
    function (gettextCatalog) {
        return {
            getOptions: function (images, inlineMode) {
                if (inlineMode === undefined) {
                    inlineMode = false;
                }
                return {
                    language_url: '/static/tinymce/i18n/' + gettextCatalog.getCurrentLanguage() + '.js',
                    theme_url: '/static/js/openslides-libs.js',
                    skin_url: '/static/tinymce/skins/lightgray/',
                    inline: inlineMode,
                    statusbar: false,
                    browser_spellcheck: true,
                    image_advtab: true,
                    image_list: images,
                    plugins: [
                      'lists link autolink charmap preview searchreplace code fullscreen',
                      'paste textcolor colorpicker image imagetools'
                    ],
                    menubar: '',
                    toolbar: 'undo redo searchreplace | styleselect | bold italic underline strikethrough ' +
                        'forecolor backcolor removeformat | bullist numlist | outdent indent | ' +
                        'link image charmap table | code preview fullscreen'
                };
            }
        };
    }
])

// html-tag os-form-field to generate generic from fields
// TODO: make it possible to use other fields then config fields
.directive('osFormField', [
    '$parse',
    'Config',
    'gettextCatalog',
    function($parse, Config, gettextCatalog) {
        // remove resolution when changing to multiprojector
        function getHtmlType(type) {
            return {
                string: 'text',
                text: 'textarea',
                integer: 'number',
                boolean: 'checkbox',
                choice: 'choice',
                colorpicker: 'colorpicker',
                comments: 'comments',
                resolution: 'resolution',
            }[type];
        }

        return {
            restrict: 'E',
            scope: true,
            templateUrl: 'static/templates/config-form-field.html',
            link: function ($scope, iElement, iAttrs, controller, transcludeFn) {
                var field = $parse(iAttrs.field)($scope);
                var config = Config.get(field.key);
                $scope.type = getHtmlType(field.input_type);
                if ($scope.type == 'choice') {
                    $scope.choices = [];
                    angular.forEach(field.choices, function(choice) {
                        choice.display_name = gettextCatalog.getString(choice.display_name);
                        $scope.choices.push(choice);
                    });
                }
                $scope.label = field.label;
                $scope.key = 'field-' + field.key;
                $scope.value = gettextCatalog.getString(config.value);
                $scope.help_text = field.help_text;
                $scope.default_value = field.default_value;
                $scope.reset = function () {
                    $scope.value = gettextCatalog.getString($scope.default_value);
                    $scope.save(field.key, $scope.value);
                };
            }
        };
    }
])

.directive('routeLoadingIndicator', [
    '$rootScope',
    '$state',
    'gettext',
    function($rootScope, $state, gettext) {
        gettext('Loading ...');
        return {
            restrict: 'E',
            template: "<div class='header spacer-bottom' ng-if='isRouteLoading'><div class='title'><h1><translate>Loading ...</translate> <i class='fa fa-spinner fa-pulse'></i></h1></div></div>",
            link: function(scope, elem, attrs) {
                scope.isRouteLoading = false;
                $rootScope.$on('$stateChangeStart', function() {
                    scope.isRouteLoading = true;
                });
                $rootScope.$on('$stateChangeSuccess', function() {
                    scope.isRouteLoading = false;
                });
            }
        };
    }
])

.controller('MainMenuCtrl', [
    '$scope',
    'mainMenu',
    function ($scope, mainMenu) {
        mainMenu.registerScope($scope);
        $scope.isMenuOpen = false;
        $scope.closeMenu = function () {
            $scope.isMenuOpen = false;
        };
    }
])

.controller('LanguageCtrl', [
    '$scope',
    'gettextCatalog',
    'Languages',
    'filterFilter',
    function ($scope, gettextCatalog, Languages, filterFilter) {
        $scope.languages = Languages.getLanguages();
        $scope.selectedLanguage = filterFilter($scope.languages, {selected: true});
        // controller to switch app language
        $scope.switchLanguage = function (lang) {
            $scope.languages = Languages.setCurrentLanguage(lang);
            $scope.selectedLanguage = filterFilter($scope.languages, {selected: true});
        };
    }
])

// Projector Sidebar Controller
.controller('ProjectorSidebarCtrl', [
    '$scope',
    '$document',
    '$window',
    function ($scope, $document, $window) {
        $scope.isProjectorSidebar = false;
        $scope.showProjectorSidebar = function (show) {
            $scope.isProjectorSidebar = show;
        };

        // Sidebar scroll
        var marginTop = 20, // margin-top from #content
            marginBottom = 30, // 30px + 20px sidebar margin-bottom = 50px from footer
            sidebar;

        var sidebarScroll = function () {
            var sidebarHeight = sidebar.height(),
                sidebarOffset = sidebar.offset().top,
                sidebarMinOffset = $('#header').height() + $('#nav').height() + marginTop,
                documentHeight = $document.height(),
                windowHeight = $window.innerHeight,
                scrollTop = $window.pageYOffset;

            // First, check if there is a need to scroll: scroll if the sidebar is smaller then the content
            if (sidebarHeight < $('.col1').height()) {
                if ((scrollTop + marginTop + sidebarHeight) > (documentHeight - marginBottom)) {
                    // Stick to the bottom
                    var bottom = marginBottom + scrollTop + windowHeight - documentHeight;
                    sidebar.css({'position': 'fixed', 'top': '', 'bottom': bottom});
                } else if ((scrollTop + marginTop) > sidebarMinOffset) {
                    // scroll with the user
                    sidebar.css({'position': 'fixed', 'top': marginTop, 'bottom': ''});
                } else {
                    // Stick to the top
                    sidebar.css({'position': 'relative', 'top': 0, 'bottom': ''});
                }
            } else {
                // Stick to the top, if the sidebar is larger then the content
                sidebar.css({'position': 'relative', 'top': 0, 'bottom': ''});
            }
        };

        $scope.initSidebar = function () {
            sidebar = $('#sidebar');
            $scope.$watch(function () {
                return sidebar.height();
            }, sidebarScroll);
            angular.element($window).bind('scroll', sidebarScroll);
        };

    }
])

// Legal Notice Controller
.controller('LegalNoticeCtrl', [
    '$scope',
    '$http',
    function ($scope, $http) {
        $http.get('/core/version/').success(function(data) {
            $scope.core_version = data.openslides_version;
            $scope.plugins = data.plugins;
        });
    }
])

// Config Controller
.controller('ConfigCtrl', [
    '$scope',
    'Config',
    'configOptions',
    'gettextCatalog',
    function($scope, Config, configOptions, gettextCatalog) {
        Config.bindAll({}, $scope, 'configs');
        $scope.configGroups = configOptions.data.config_groups;

        // save changed config value
        $scope.save = function(key, value) {
            Config.get(key).value = value;
            Config.save(key);
        };

        /* For comments input */
        $scope.addComment = function (key, parent) {
            parent.value.push({
                name: gettextCatalog.getString('New'),
                public: false,
            });
            $scope.save(key, parent.value);
        };
        $scope.removeComment = function (key, parent, index) {
            parent.value.splice(index, 1);
            $scope.save(key, parent.value);
        };
    }
])

// Search Bar Controller
.controller('SearchBarCtrl', [
    '$scope',
    '$state',
    '$sanitize',
    function ($scope, $state, $sanitize) {
        $scope.search = function() {
            var query = _.escape($scope.querybar);
            $scope.querybar = '';
            $state.go('search', {q: query});
        };
    }
])

// Search Controller
.controller('SearchCtrl', [
    '$scope',
    '$http',
    '$stateParams',
    '$location',
    '$sanitize',
    'DS',
    function ($scope, $http, $stateParams, $location, $sanitize, DS) {
        $scope.fullword = false;
        $scope.filterAgenda = true;
        $scope.filterMotion = true;
        $scope.filterAssignment = true;
        $scope.filterUser = true;
        $scope.filterMedia = true;

        // search function
        $scope.search = function() {
            var query = _.escape($scope.query);
            if (query !== '') {
                var lastquery = query;
                // attach asterisks if search is not for full words only
                if (!$scope.fullword) {
                    if (query.charAt(0) != '*'){
                        query = "*" + query;
                    }
                    if (query.charAt(query.length - 1) != '*'){
                        query = query + "*";
                    }
                }
                $scope.query = lastquery;
                $http.get('/core/search_api/?q=' + query).then(function(success) {
                    $scope.results = [];
                    var elements = success.data.elements;
                    angular.forEach(elements, function(element) {
                        DS.find(element.collection, element.id).then(function(data) {
                            data.urlState = element.collection.replace('/','.')+'.detail';
                            data.urlParam = {id: element.id};
                            $scope.results.push(data);
                        });
                    });
                });
                $location.url('/search/?q=' + lastquery);
            }
        };

        //get search string from parameters submitted from outside the scope
        if ($stateParams.q) {
            $scope.query = $stateParams.q;
            $scope.search();
        }

        // returns element if part of the current search selection
        $scope.filterresult = function() {
            return function(result) {
                if ($scope.filterUser && result.urlState == 'users.user.detail') {
                    return result;
                }
                if ($scope.filterMotion && result.urlState == 'motions.motion.detail') {
                    return result;
                }
                if ($scope.filterAgenda && result.urlState == 'topics.topic.detail') {
                    return result;
                }
                if ($scope.filterAssignment && result.urlState == 'assignments.assignment.detail') {
                    return result;
                }
                if ($scope.filterMedia && result.urlState== 'mediafiles.mediafile.detail') {
                    return result;
                }
                return;
            };
        };
    }
])

// Projector Control Controller
.controller('ProjectorControlCtrl', [
    '$scope',
    '$http',
    '$interval',
    '$state',
    'Config',
    'Projector',
    function($scope, $http, $interval, $state, Config, Projector) {
         // bind projector elements to the scope, update after projector changed
        $scope.$watch(function () {
            return Projector.lastModified(1);
        }, function () {
            // stop ALL interval timer
            for (var i=0; i<$scope.countdowns.length; i++) {
                if ( $scope.countdowns[i].interval ) {
                    $interval.cancel($scope.countdowns[i].interval);
                }
            }
            // rebuild all variables after projector update
            $scope.rebuildAllElements();
        });
        $scope.$on('$destroy', function() {
            // Cancel all intervals if the controller is destroyed
            for (var i=0; i<$scope.countdowns.length; i++) {
                if ( $scope.countdowns[i].interval ) {
                    $interval.cancel($scope.countdowns[i].interval);
                }
            }

        });

        // watch for changes in Config
        var last_conf;
        $scope.$watch(function () {
            return Config.lastModified();
        }, function () {
            var conf = Config.get('projector_resolution').value;
            // With multiprojector, get the resolution from Prjector.get(pk).{width; height}
            if(!last_conf || last_conf.width != conf.width || last_conf.height != conf.height) {
                last_conf = conf;
                $scope.projectorWidth = conf.width;
                $scope.projectorHeight = conf.height;
                $scope.scale = 256.0 / $scope.projectorWidth;
                $scope.iframeHeight = $scope.scale * $scope.projectorHeight;
            }
        });

        // *** countdown functions ***
        $scope.calculateCountdownTime = function (countdown) {
            countdown.seconds = Math.floor( countdown.countdown_time - Date.now() / 1000 + $scope.serverOffset );
        };
        $scope.rebuildAllElements = function () {
            $scope.countdowns = [];
            $scope.messages = [];
            // iterate via all projector elements and catch all countdowns and messages
            $.each(Projector.get(1).elements, function(key, value) {
                if (value.name == 'core/countdown') {
                    $scope.countdowns.push(value);
                    if (value.status == "running") {
                        // calculate remaining seconds directly because interval starts with 1 second delay
                        $scope.calculateCountdownTime(value);
                        // start interval timer (every second)
                        value.interval = $interval( function() { $scope.calculateCountdownTime(value); }, 1000);
                    } else {
                        value.seconds = value.countdown_time;
                    }
                }
                if (value.name == 'core/message') {
                    $scope.messages.push(value);
                }
            });
            $scope.scrollLevel = Projector.get(1).scroll;
            $scope.scaleLevel = Projector.get(1).scale;
        };

        // get initial values for $scope.countdowns, $scope.messages, $scope.scrollLevel
        // and $scope.scaleLevel (after page reload)
        $scope.rebuildAllElements();

        $scope.addCountdown = function () {
            var defaultvalue = parseInt(Config.get('projector_default_countdown').value);
            $http.post('/rest/core/projector/1/activate_elements/', [{
                    name: 'core/countdown',
                    status: 'stop',
                    visible: false,
                    index: $scope.countdowns.length,
                    countdown_time: defaultvalue,
                    default: defaultvalue,
                    stable: true
            }]);
        };
        $scope.removeCountdown = function (countdown) {
            var data = {};
            var delta = 0;
            // rebuild index for all countdowns after the selected (deleted) countdown
            for (var i=0; i<$scope.countdowns.length; i++) {
                if ( $scope.countdowns[i].uuid == countdown.uuid ) {
                    delta = 1;
                } else if (delta > 0) {
                        data[$scope.countdowns[i].uuid] = { "index": i - delta };
                }
            }
            $http.post('/rest/core/projector/1/deactivate_elements/', [countdown.uuid]);
            if (Object.keys(data).length > 0) {
                $http.post('/rest/core/projector/1/update_elements/', data);
            }
        };
        $scope.showCountdown = function (countdown) {
            var data = {};
            data[countdown.uuid] = { "visible": !countdown.visible };
            $http.post('/rest/core/projector/1/update_elements/', data);
        };
        $scope.editCountdown = function (countdown) {
            var data = {};
            data[countdown.uuid] = {
                "description": countdown.description,
                "default": parseInt(countdown.default)
            };
            if (countdown.status == "stop") {
                data[countdown.uuid].countdown_time = parseInt(countdown.default);
            }
            $http.post('/rest/core/projector/1/update_elements/', data);
        };
        $scope.startCountdown = function (countdown) {
            var data = {};
            // calculate end point of countdown (in seconds!)
            var endTimestamp = Date.now() / 1000 - $scope.serverOffset + countdown.countdown_time;
            data[countdown.uuid] = {
                "status": "running",
                "countdown_time": endTimestamp
            };
            $http.post('/rest/core/projector/1/update_elements/', data);
        };
        $scope.stopCountdown = function (countdown) {
            var data = {};
            // calculate rest duration of countdown (in seconds!)
            var newDuration = Math.floor( countdown.countdown_time - Date.now() / 1000 + $scope.serverOffset );
            data[countdown.uuid] = {
                "status": "stop",
                "countdown_time": newDuration
            };
            $http.post('/rest/core/projector/1/update_elements/', data);
        };
        $scope.resetCountdown = function (countdown) {
            var data = {};
            data[countdown.uuid] = {
                "status": "stop",
                "countdown_time": countdown.default,
            };
            $http.post('/rest/core/projector/1/update_elements/', data);
        };

        // *** message functions ***
        $scope.addMessage = function () {
            $http.post('/rest/core/projector/1/activate_elements/', [{
                    name: 'core/message',
                    visible: false,
                    index: $scope.messages.length,
                    message: '',
                    stable: true
            }]);
        };
        $scope.removeMessage = function (message) {
            $http.post('/rest/core/projector/1/deactivate_elements/', [message.uuid]);
        };
        $scope.showMessage = function (message) {
            var data = {};
            // if current message is activated, deactivate all other messages
            if ( !message.visible ) {
                for (var i=0; i<$scope.messages.length; i++) {
                    if ( $scope.messages[i].uuid == message.uuid ) {
                        data[$scope.messages[i].uuid] = { "visible": true };
                    } else {
                        data[$scope.messages[i].uuid] = { "visible": false };
                    }
                }
            } else {
                data[message.uuid] = { "visible": false };
            }
            $http.post('/rest/core/projector/1/update_elements/', data);
        };
        $scope.editMessage = function (message) {
            var data = {};
            data[message.uuid] = {
                "message": message.message,
            };
            $http.post('/rest/core/projector/1/update_elements/', data);
            message.editMessageFlag = false;
        };

        // *** projector controls ***
        $scope.scrollLevel = Projector.get(1).scroll;
        $scope.scaleLevel = Projector.get(1).scale;
        $scope.controlProjector = function (action, direction) {
            $http.post('/rest/core/projector/1/control_view/', {"action": action, "direction": direction});
        };
        $scope.editCurrentSlide = function () {
            $.each(Projector.get(1).elements, function(key, value) {
                if (value.name == 'agenda/list-of-speakers') {
                    $state.go('agenda.item.detail', {id: value.id});
                } else if (
                    value.name != 'agenda/item-list' &&
                    value.name != 'core/clock' &&
                    value.name != 'core/countdown' &&
                    value.name != 'core/message' ) {
                    $state.go(value.name.replace('/', '.')+'.detail.update', {id: value.id});
                }
            });
        };
    }
])

// Tag Controller
.controller('TagListCtrl', [
    '$scope',
    'Tag',
    function($scope, Tag) {
        Tag.bindAll({}, $scope, 'tags');

        // setup table sorting
        $scope.sortColumn = 'name';
        $scope.reverse = false;
        // function to sort by clicked column
        $scope.toggleSort = function ( column ) {
            if ( $scope.sortColumn === column ) {
                $scope.reverse = !$scope.reverse;
            }
            $scope.sortColumn = column;
        };

        // save changed tag
        $scope.save = function (tag) {
            Tag.save(tag);
        };
        $scope.delete = function (tag) {
            Tag.destroy(tag.id).then(
                function(success) {
                    //TODO: success message
                }
            );
        };
    }
])

.controller('TagDetailCtrl', [
    '$scope',
    'Tag',
    'tag',
    function($scope, Tag, tag) {
        Tag.bindOne(tag.id, $scope, 'tag');
    }
])

.controller('TagCreateCtrl', [
    '$scope',
    '$state',
    'Tag',
    function($scope, $state, Tag) {
        $scope.tag = {};
        $scope.save = function (tag) {
            Tag.create(tag).then(
                function(success) {
                    $state.go('core.tag.list');
                }
            );
        };
    }
])

.controller('TagUpdateCtrl', [
    '$scope',
    '$state',
    'Tag',
    'tag',
    function($scope, $state, Tag, tag) {
        $scope.tag = tag;
        $scope.save = function (tag) {
            Tag.save(tag).then(
                function(success) {
                    $state.go('core.tag.list');
                }
            );
        };
    }
])

// counter of new (unread) chat messages
.value('NewChatMessages', [])

// ChatMessage Controller
.controller('ChatMessageCtrl', [
    '$scope',
    '$http',
    '$timeout',
    'ChatMessage',
    'NewChatMessages',
    function ($scope, $http, $timeout, ChatMessage, NewChatMessages) {
        ChatMessage.bindAll({}, $scope, 'chatmessages');
        $scope.unreadMessages = NewChatMessages.length;
        $scope.chatboxIsCollapsed = true;
        $scope.openChatbox = function () {
            $scope.chatboxIsCollapsed = !$scope.chatboxIsCollapsed;
            NewChatMessages = [];
            $scope.unreadMessages = NewChatMessages.length;
            $timeout(function () {
                angular.element('#messageInput').focus();
            }, 0);
        };
        $scope.sendMessage = function () {
            angular.element('#messageSendButton').addClass('disabled');
            angular.element('#messageInput').attr('disabled', '');
            $http.post(
                '/rest/core/chatmessage/',
                {message: $scope.newMessage}
            )
            .success(function () {
                $scope.newMessage = '';
                angular.element('#messageSendButton').removeClass('disabled');
                angular.element('#messageInput').removeAttr('disabled');
                $timeout(function () {
                    angular.element('#messageInput').focus();
                }, 0);
            })
            .error(function () {
                angular.element('#messageSendButton').removeClass('disabled');
                angular.element('#messageInput').removeAttr('disabled');
            });
        };
        // increment unread messages counter for each new message
        $scope.$watch('chatmessages', function (newVal, oldVal) {
            // add new message id if there is really a new message which is not yet tracked
            if (oldVal.length > 0) {
                if ((oldVal[oldVal.length-1].id != newVal[newVal.length-1].id) &&
                    ($.inArray(newVal[newVal.length-1].id, NewChatMessages) == -1)) {
                    NewChatMessages.push(newVal[newVal.length-1].id);
                    $scope.unreadMessages = NewChatMessages.length;
                }
            }
        });
    }
])

// format time string for model ("s") and view format ("h:mm:ss" or "mm:ss")
.directive('minSecFormat', [
    function () {
        return {
            require: 'ngModel',
            link: function(scope, element, attrs, ngModelController) {
                ngModelController.$parsers.push(function(data) {
                    //convert data from view format (mm:ss) to model format (s)
                    var time = data.split(':');
                    if (time.length > 1) {
                        data = (+time[0]) * 60 + (+time[1]);
                        if (data < 0) {
                            data = "-"+data;
                        }
                    }
                    return data;
                });

                ngModelController.$formatters.push(function(data) {
                    //convert data from model format (s) to view format (mm:ss)
                    var time;
                    // floor returns the largest integer of the absolut value of totalseconds
                    var total = Math.floor(Math.abs(data));
                    var mm = Math.floor(total / 60);
                    var ss = Math.floor(total % 60);
                    var zero = "0";
                    // Add leading "0" for double digit values
                    if (mm.length < 2) {
                        mm = (zero+mm).slice(-2);
                    }
                    ss = (zero+ss).slice(-2);
                    time =  mm + ':' + ss;
                    if (data < 0) {
                        time = "-"+time;
                    }
                    return time;
                });
            }
        };
    }
])

// format time string for model ("m") and view format ("h:mm" or "hh:mm")
.directive('hourMinFormat', [
    function () {
        return {
            require: 'ngModel',
            link: function(scope, element, attrs, ngModelController) {
                ngModelController.$parsers.push(function(data) {
                    //convert data from view format (hh:mm) to model format (m)
                    var time = data.split(':');
                    if (time.length > 1 && !isNaN(time[0]) && !isNaN(time[1])) {
                        data = (+time[0]) * 60 + (+time[1]);
                        if (data < 0) {
                            data = "-"+data;
                        }
                    }
                    if (data === '') {
                        data = 0;
                    }
                    return data;
                });

                ngModelController.$formatters.push(function(totalminutes) {
                    //convert data from model format (m) to view format (hh:mm)
                    var time = "";
                    if (totalminutes < 0) {
                        time = "-";
                        totalminutes = -totalminutes;
                    }
                    var hh = Math.floor(totalminutes / 60);
                    var mm = Math.floor(totalminutes % 60);
                    // Add leading "0" for double digit values
                    mm = ("0"+mm).slice(-2);
                    time += hh + ":" + mm;
                    return time;
                });
            }
        };
    }
])

.directive('osFocusMe', [
    '$timeout',
    function ($timeout) {
        return {
            link: function (scope, element, attrs, model) {
                $timeout(function () {
                    element[0].focus();
                });
            }
        };
    }
])

//Mark all core config strings for translation in Javascript
.config([
    'gettext',
    function (gettext) {
        gettext('Presentation and assembly system');
        gettext('Event name');
        gettext('<a href="http://www.openslides.org">OpenSlides</a> is a free ' +
                'web based presentation and assembly system for visualizing ' +
                'and controlling agenda, motions and elections of an ' +
                'assembly.');
        gettext('General');
        gettext('Event');
        gettext('Short description of event');
        gettext('Event date');
        gettext('Event location');
        gettext('Event organizer');
        gettext('Legal notice');
        gettext('Front page title');
        gettext('Welcome to OpenSlides');
        gettext('Front page text');
        gettext('[Space for your welcome text.]');
        gettext('Allow access for anonymous guest users');
        gettext('Show this text on the login page.');
        gettext('Show logo on projector');
        gettext('You can replace the logo. Just copy a file to ' +
                '"static/img/logo-projector.png" in your OpenSlides data ' +
                'path.');
        gettext('Projector');
        gettext('Show title and description of event on projector');
        gettext('Background color of projector header and footer');
        gettext('Font color of projector header and footer');
        gettext('Font color of projector headline');
        gettext('Default countdown');
    }
]);

}());
