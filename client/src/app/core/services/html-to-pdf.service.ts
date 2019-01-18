import { Injectable } from '@angular/core';
import { LineNumberingMode } from 'app/site/motions/models/view-motion';

/**
 * Converts HTML strings to pdfmake compatible document definition.
 *
 * TODO: Bring back upstream to pdfmake, so other projects may benefit from this converter and
 *       to exclude complex code from OpenSlides.
 *       Everything OpenSlides specific, such as line numbering and change recommendations,
 *       should be excluded from this and handled elsewhere.
 *
 * @example
 * ```
 * const dd = htmlToPdfService.convertHtml('<h3>Hello World!</h3>');
 * ```
 */
@Injectable({
    providedIn: 'root'
})
export class HtmlToPdfService {
    /**
     * holds the desired line number mode
     */
    private lineNumberingMode: LineNumberingMode;

    /**
     * Space between list elements
     */
    private LI_MARGIN_BOTTOM = 1.5;

    /**
     * Normal line height for paragraphs
     */
    private LINE_HEIGHT = 1.25;

    /**
     * space between paragraphs
     */
    private P_MARGIN_BOTTOM = 4.0;

    /**
     * Conversion of HTML tags into pdfmake directives
     */
    private elementStyles = {
        // should be the same for most HTML code
        b: ['font-weight:bold'],
        strong: ['font-weight:bold'],
        u: ['text-decoration:underline'],
        em: ['font-style:italic'],
        i: ['font-style:italic'],
        h1: ['font-size:14', 'font-weight:bold'],
        h2: ['font-size:12', 'font-weight:bold'],
        h3: ['font-size:10', 'font-weight:bold'],
        h4: ['font-size:10', 'font-style:italic'],
        h5: ['font-size:10'],
        h6: ['font-size:10'],
        a: ['color:blue', 'text-decoration:underline'],
        strike: ['text-decoration:line-through'],
        // Pretty specific stuff that might be excluded for other projects than OpenSlides
        del: ['color:red', 'text-decoration:line-through'],
        ins: ['color:green', 'text-decoration:underline']
    };

    /**
     * Treatment of required CSS-Classes
     * Checking CSS is not possible
     */
    private classStyles = {
        delete: ['color:red', 'text-decoration:line-through'],
        insert: ['color:green', 'text-decoration:underline']
    };

    /**
     * Constructor
     */
    public constructor() {}

    /**
     * Takes an HTML string, converts to HTML using a DOM parser and recursivly parses
     * the content into pdfmake compatible doc definition
     *
     * @param htmlText the html text to translate as string
     * @param lnMode determines the line numbering
     * @returns pdfmake doc definition as object
     */
    public convertHtml(htmlText: string, lnMode?: LineNumberingMode): object {
        const docDef = [];
        this.lineNumberingMode = lnMode || LineNumberingMode.None;

        // Cleanup of dirty html would happen here

        // Create a HTML DOM tree out of html string
        const parser = new DOMParser();
        const parsedHtml = parser.parseFromString(htmlText, 'text/html');
        // Since the spread operator did not work for HTMLCollection, use Array.from
        const htmlArray = Array.from(parsedHtml.body.children);

        // Parse the children of the current HTML element
        for (const child of htmlArray) {
            const parsedElement = this.parseElement(child);
            docDef.push(parsedElement);
        }

        return docDef;
    }

    /**
     * Converts a single HTML element to pdfmake, calls itself recursively for child html elements
     *
     * @param element can be an HTML element (<p>) or plain text ("Hello World")
     * @param currentParagraph usually holds the parent element, to allow nested structures
     * @param styles holds the style attributes of HTML elements (`<div style="color: green">...`)
     * @returns the doc def to the given element in consideration to the given paragraph and styles
     */
    public parseElement(element: any, styles?: string[]): any {
        const nodeName = element.nodeName.toLowerCase();
        let classes = [];
        let newParagraph: any;

        // extract explicit style information
        styles = styles || [];

        // to leave out plain text elements
        if (element.getAttribute) {
            const nodeStyle = element.getAttribute('style');
            const nodeClass = element.getAttribute('class');

            // add styles like `color:#ff00ff` content into styles array
            if (nodeStyle) {
                styles = nodeStyle
                    .split(';')
                    .map(style => style.replace(/\s/g, ''))
                    .concat(styles);
            }

            // Handle CSS classes
            if (nodeClass) {
                classes = nodeClass.toLowerCase().split(' ');

                for (const cssClass of classes) {
                    if (this.classStyles[cssClass]) {
                        this.classStyles[cssClass].forEach(style => {
                            styles.push(style);
                        });
                    }
                }
            }
        }

        switch (nodeName) {
            case 'h1':
            case 'h2':
            case 'h3':
            case 'h4':
            case 'h5':
            case 'h6':
            case 'p': {
                const children = this.parseChildren(element, newParagraph);

                if (this.lineNumberingMode === LineNumberingMode.Outside) {
                    newParagraph = this.create('stack');
                    newParagraph.stack = children;
                } else {
                    newParagraph = this.create('text');
                    newParagraph.text = children;
                }

                newParagraph.margin = [0, this.P_MARGIN_BOTTOM];
                newParagraph.lineHeight = this.LINE_HEIGHT;

                styles = this.computeStyle(styles);
                const implicitStyles = this.computeStyle(this.elementStyles[nodeName]);

                newParagraph = {
                    ...newParagraph,
                    ...styles,
                    ...implicitStyles
                };
                break;
            }
            case 'a':
            case 'b':
            case 'strong':
            case 'u':
            case 'em':
            case 'i':
            case 'ins':
            case 'del':
            case 'strike': {
                const children = this.parseChildren(element, styles.concat(this.elementStyles[nodeName]));
                newParagraph = this.create('text');
                newParagraph.text = children;
                break;
            }
            case 'span': {
                // Line numbering feature, will prevent compatibility to most other projects
                if (element.getAttribute('data-line-number')) {
                    if (this.lineNumberingMode === LineNumberingMode.Inside) {
                        // TODO: algorithm for "inline" line numbers is not yet implemented
                    } else if (this.lineNumberingMode === LineNumberingMode.Outside) {
                        const currentLineNumber = element.getAttribute('data-line-number');
                        newParagraph = {
                            columns: [
                                // the line number column
                                {
                                    width: 20,
                                    text: currentLineNumber,
                                    color: 'gray',
                                    fontSize: 8,
                                    margin: [0, 2, 0, 0],
                                    lineHeight: this.LINE_HEIGHT
                                },
                                // target to push text into the line
                                {
                                    text: []
                                }
                            ]
                        };
                    }
                } else {
                    const children = this.parseChildren(element, styles);
                    newParagraph = {
                        ...this.create('text'),
                        ...this.computeStyle(styles)
                    };

                    newParagraph.text = children;
                }
                break;
            }
            case 'br': {
                newParagraph = this.create('text');
                // Add a dummy line, if the next tag is a BR tag again. The line could
                // not be empty otherwise it will be removed and the empty line is not displayed
                if (element.nextSibling && element.nextSibling.nodeName === 'BR') {
                    newParagraph.text.push(this.create('text', ' '));
                }

                newParagraph.lineHeight = this.LINE_HEIGHT;
                break;
            }
            case 'li':
            case 'div': {
                newParagraph = this.create('text');
                newParagraph.lineHeight = this.LI_MARGIN_BOTTOM;
                newParagraph = {
                    ...newParagraph,
                    ...this.computeStyle(styles)
                };

                const children = this.parseChildren(element, newParagraph);
                newParagraph = children;
                break;
            }
            case 'ul':
            case 'ol': {
                newParagraph = this.create(nodeName);
                const children = this.parseChildren(element, newParagraph);
                newParagraph[nodeName] = children;
                break;
            }
            default: {
                newParagraph = {
                    ...this.create('text', element.textContent.replace(/\n/g, '')),
                    ...this.computeStyle(styles)
                };
                break;
            }
        }
        return newParagraph;
    }

    /**
     * Helper routine to parse an elements children and return the children as parsed pdfmake doc string
     *
     * @param element the parent element to parse
     * @param currentParagraph the context of the element
     * @param styles the styles array, usually just to parse back into the `parseElement` function
     * @returns an array of parsed children
     */
    private parseChildren(element: any, styles?: Array<string>): any {
        const childNodes = element.childNodes;
        const paragraph = [];
        if (childNodes.length > 0) {
            for (const child of childNodes) {
                // skip empty child nodes
                if (!(child.nodeName === '#text' && child.textContent.trim() === '')) {
                    const parsedElement = this.parseElement(child, styles);

                    if (
                        // add the line number column
                        this.lineNumberingMode === LineNumberingMode.Outside &&
                        child &&
                        child.classList &&
                        child.classList.contains('os-line-number')
                    ) {
                        paragraph.push(parsedElement);
                    } else if (
                        // if the first child of the parsed element is line number
                        this.lineNumberingMode === LineNumberingMode.Outside &&
                        element.firstChild &&
                        element.firstChild.classList &&
                        element.firstChild.classList.contains('os-line-number')
                    ) {
                        const currentLine = paragraph.pop();
                        // push the parsed element into the "text" array
                        currentLine.columns[1].text.push(parsedElement);
                        paragraph.push(currentLine);
                    } else {
                        paragraph.push(parsedElement);
                    }
                }
            }
        }
        return paragraph;
    }

    /**
     * Extracts the style information from the given array
     *
     * @param styles an array of inline css styles (i.e. `style="margin: 10px"`)
     * @returns an object with style pdfmake compatible style information
     */
    private computeStyle(styles: string[]): any {
        const styleObject: any = {};
        if (styles && styles.length > 0) {
            for (const style of styles) {
                const styleDefinition = style
                    .trim()
                    .toLowerCase()
                    .split(':');
                const key = styleDefinition[0];
                const value = styleDefinition[1];

                if (styleDefinition.length === 2) {
                    switch (key) {
                        case 'padding-left': {
                            styleObject.margin = [+value, 0, 0, 0];
                            break;
                        }
                        case 'font-size': {
                            styleObject.fontSize = +value;
                            break;
                        }
                        case 'text-align': {
                            switch (value) {
                                case 'right':
                                case 'center':
                                case 'justify': {
                                    styleObject.alignment = value;
                                    break;
                                }
                            }
                            break;
                        }
                        case 'font-weight': {
                            switch (value) {
                                case 'bold': {
                                    styleObject.bold = true;
                                    break;
                                }
                            }
                            break;
                        }
                        case 'text-decoration': {
                            switch (value) {
                                case 'underline': {
                                    styleObject.decoration = 'underline';
                                    break;
                                }
                                case 'line-through': {
                                    styleObject.decoration = 'lineThrough';
                                    break;
                                }
                            }
                            break;
                        }
                        case 'font-style': {
                            switch (value) {
                                case 'italic': {
                                    styleObject.italics = true;
                                    break;
                                }
                            }
                            break;
                        }
                        case 'color': {
                            styleObject.color = this.parseColor(value);
                            break;
                        }
                        case 'background-color': {
                            styleObject.background = this.parseColor(value);
                            break;
                        }
                    }
                }
            }
        }
        return styleObject;
    }

    /**
     * Returns the color in a hex format (e.g. #12ff00).
     * Also tries to convert RGB colors into hex values
     *
     * @param color color as string representation
     * @returns color as hex values for pdfmake
     */
    private parseColor(color: string): string {
        const haxRegex = new RegExp('^#([0-9a-f]{3}|[0-9a-f]{6})$');

        // e.g. `#fff` or `#ff0048`
        const rgbRegex = new RegExp('^rgb\\((\\d+),\\s*(\\d+),\\s*(\\d+)\\)$');

        // e.g. rgb(0,255,34) or rgb(22, 0, 0)
        const nameRegex = new RegExp('^[a-z]+$');

        if (haxRegex.test(color)) {
            return color;
        } else if (rgbRegex.test(color)) {
            const decimalColors = rgbRegex.exec(color).slice(1);
            for (let i = 0; i < 3; i++) {
                let decimalValue = +decimalColors[i];
                if (decimalValue > 255) {
                    decimalValue = 255;
                }
                let hexString = '0' + decimalValue.toString(16);
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
    }

    /**
     * Helper function to create valid doc definitions container elements for pdfmake
     *
     * @param name should be a pdfMake container element, like 'text' or 'stack'
     * @param content
     */
    private create(name: string, content?: any): any {
        const container = {};
        const docDef = content ? content : [];
        container[name] = docDef;
        return container;
    }
}
