import { Injectable } from '@angular/core';

import { LineNumberingMode } from 'app/site/motions/motions.constants';

/**
 * Shape of line number objects
 */
interface LineNumberObject {
    lineNumber: number;
    marginBottom?: number;
}

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
     * Normal line height for paragraphs
     */
    private LINE_HEIGHT = 1.25;

    /**
     * space between paragraphs
     */
    private P_MARGIN_BOTTOM = 4.0;

    /**
     * Space above H
     */
    private H_MARGIN_TOP = 10.0;

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
        insert: ['color:green', 'text-decoration:underline'],
        paragraphcontext: ['color:grey']
    };

    /**
     * Constructor
     */
    public constructor() {}

    /**
     * Determine the ideal top margin for a given node
     *
     * @param nodeName the node to parse
     * @returns the margin tip as number
     */
    private getMarginTop(nodeName: string): number {
        switch (nodeName) {
            case 'h1':
            case 'h2':
            case 'h3':
            case 'h4':
            case 'h5':
            case 'h6': {
                return this.H_MARGIN_TOP;
            }
            default: {
                return 0;
            }
        }
    }

    /**
     * Determine the ideal margin for a given node
     *
     * @param nodeName the node to parse
     * @returns the margin bottom as number
     */
    private getMarginBottom(nodeName: string): number {
        switch (nodeName) {
            case 'h1':
            case 'h2':
            case 'h3':
            case 'h4':
            case 'h5':
            case 'h6': {
                return this.P_MARGIN_BOTTOM;
            }
            case 'li': {
                return this.P_MARGIN_BOTTOM;
            }
            default: {
                return this.P_MARGIN_BOTTOM;
            }
        }
    }

    /**
     * Function to convert plain html text without linenumbering.
     *
     * @param text The html text that should be converted to PDF.
     *
     * @returns {object} The converted html as DocDef.
     */
    public addPlainText(text: string): object {
        return {
            columns: [{ stack: this.convertHtml(text, LineNumberingMode.None) }]
        };
    }

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
        const htmlArray = Array.from(parsedHtml.body.childNodes) as Element[];

        // Parse the children of the current HTML element
        for (const child of htmlArray) {
            const parsedElement = this.parseElement(child);
            docDef.push(parsedElement);
        }

        // DEBUG: printing the following. Do not remove, just comment out
        // console.log('MakePDF doc :\n---\n', JSON.stringify(docDef), '\n---\n');

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
    public parseElement(element: Element, styles?: string[]): any {
        const nodeName = element.nodeName.toLowerCase();
        const childNodes = Array.from(element.childNodes) as Element[];
        const directChildIsCrNode = childNodes.some(child => this.isCrElement(child));
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
            case 'li':
            case 'p':
            case 'div': {
                const children = this.parseChildren(element, styles);

                if (
                    this.lineNumberingMode === LineNumberingMode.Outside &&
                    !classes.includes('insert') &&
                    !(nodeName === 'li' && directChildIsCrNode)
                ) {
                    //
                    newParagraph = this.create('stack');
                    newParagraph.stack = children;
                } else {
                    newParagraph = this.create('text');
                    newParagraph.text = children;
                }

                newParagraph.margin = [0, 0, 0, 0];

                // determine the "normal" top and button margins
                newParagraph.margin[1] = this.getMarginTop(nodeName);
                newParagraph.margin[3] = this.getMarginBottom(nodeName);

                if (this.lineNumberingMode === LineNumberingMode.Outside) {
                    // that is usually the case for inserted change which should appear
                    // under a set of line numbers with correct alignment
                    if (classes.includes('insert')) {
                        newParagraph.margin[0] = 20;
                        newParagraph.margin[3] = this.P_MARGIN_BOTTOM;
                    }
                }

                // stop enumeration if the list was inserted
                if (classes.includes('os-split-before')) {
                    newParagraph.listType = 'none';
                }

                // if the list ends (usually due to a new insert cr) prevent margins
                if (classes.includes('os-split-after') || this.withSublist(element)) {
                    newParagraph.margin[3] = 0;
                }

                newParagraph.lineHeight = this.LINE_HEIGHT;
                newParagraph = {
                    ...newParagraph,
                    ...this.computeStyle(styles),
                    ...this.computeStyle(this.elementStyles[nodeName])
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
                if (element.getAttribute('data-line-number') && !this.isInsideAList(element)) {
                    if (this.lineNumberingMode === LineNumberingMode.Inside) {
                        // TODO: algorithm for "inline" line numbers is not yet implemented
                    } else if (this.lineNumberingMode === LineNumberingMode.Outside) {
                        const currentLineNumber = element.getAttribute('data-line-number');
                        newParagraph = {
                            columns: [
                                // the line number column
                                this.getLineNumberObject({ lineNumber: +currentLineNumber }),
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
                if (
                    (this.lineNumberingMode === LineNumberingMode.None && classes.includes('os-line-break')) ||
                    (this.lineNumberingMode === LineNumberingMode.Outside && this.isInsideAList(element))
                ) {
                    break;
                } else {
                    newParagraph = this.create('text');
                    // yep thats all
                    newParagraph.text = '\n';
                    newParagraph.lineHeight = this.LINE_HEIGHT;
                }
                break;
            }
            case 'ul':
            case 'ol': {
                const list = this.create(nodeName);

                // keep the numbers of the ol list
                if (nodeName === 'ol') {
                    const start = element.getAttribute('start');
                    if (start) {
                        list.start = parseInt(start, 10);
                    }
                }

                // in case of line numbers and only of the list is not nested in another list.
                if (this.lineNumberingMode === LineNumberingMode.Outside) {
                    const lines = this.extractLineNumbers(element);

                    const cleanedChildDom = this.cleanLineNumbers(element);
                    const cleanedChildren = this.parseChildren(cleanedChildDom, styles);

                    if (lines.length > 0) {
                        const listCol = {
                            columns: [
                                {
                                    width: 20,
                                    stack: []
                                }
                            ],
                            margin: [0, 0, 0, 0]
                        };

                        // if this is a "fake list" lower put it close to the element above
                        if (this.isFakeList(element)) {
                            listCol.margin[3] = -this.P_MARGIN_BOTTOM;
                        }

                        for (const line of lines) {
                            listCol.columns[0].stack.push(this.getLineNumberObject(line));
                        }

                        list[nodeName] = cleanedChildren;
                        listCol.columns.push(list);
                        newParagraph = listCol;
                    } else {
                        // that is usually the case for "inserted" lists during change recomendations
                        list.margin = [20, 0, 0, 0];
                        newParagraph = list;
                        newParagraph[nodeName] = cleanedChildren;
                    }
                } else {
                    const children = this.parseChildren(element, styles);
                    newParagraph = list;
                    newParagraph[nodeName] = children;
                }
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
    private parseChildren(element: Element, styles?: string[]): Element[] {
        const childNodes = Array.from(element.childNodes) as Element[];
        const paragraph = [];
        if (childNodes.length > 0) {
            for (const child of childNodes) {
                // skip empty child nodes
                if (!(child.nodeName === '#text' && child.textContent.trim() === '')) {
                    const parsedElement = this.parseElement(child, styles);
                    const firstChild = element.firstChild as Element;

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
                        firstChild &&
                        firstChild.classList &&
                        firstChild.classList.contains('os-line-number')
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
     * Helper function to make a line-number object
     *
     * @param line and object in the shape: { lineNumber: X }
     * @returns line number as pdfmake-object
     */
    private getLineNumberObject(line: LineNumberObject): object {
        return {
            width: 20,
            text: [
                {
                    // Add a blank with the normal font size here, so in rare cases the text
                    // is rendered on the next page and the line number on the previous page.
                    text: ' ',
                    decoration: ''
                },
                {
                    text: line.lineNumber,
                    color: 'gray',
                    fontSize: 8
                }
            ],
            marginBottom: line.marginBottom,
            lineHeight: this.LINE_HEIGHT
        };
    }

    /**
     * Checks if a given LI has a sublist
     */
    private withSublist(element: Element): boolean {
        if (element.nodeName.toLowerCase() === 'li') {
            const hasUl = Array.from(element.children).some(child => child.nodeName.toLowerCase() === 'ul');
            return hasUl;
        }
        return false;
    }

    /**
     * Cleans the elements children from line-number spans
     *
     * @param element a html dom tree
     * @returns a DOM element without line number spans
     */
    private cleanLineNumbers(element: Element): Element {
        const elementCopy = element.cloneNode(true) as Element;
        const children = elementCopy.childNodes;

        // using for-of did not work as expected
        for (let i = 0; i < children.length; i++) {
            if (this.getLineNumber(children[i] as Element)) {
                children[i].remove();
            }

            if (children[i]?.childNodes.length > 0) {
                const cleanChildren = this.cleanLineNumbers(children[i] as Element);
                elementCopy.replaceChild(cleanChildren, children[i]);
            }
        }

        return elementCopy;
    }

    /**
     * Helper function to extract line numbers from child elements
     *
     * TODO: Cleanup
     *
     * @param element element to check for containing line numbers (usually a list)
     * @returns a list with the line numbers
     */
    private extractLineNumbers(element: Element): LineNumberObject[] {
        let foundLineNumbers = [];
        const lineNumber = this.getLineNumber(element);
        if (lineNumber) {
            foundLineNumbers.push({ lineNumber: lineNumber });
        } else if (element.nodeName === 'BR') {
            // Check if there is a new line, but it does not get a line number.
            // If so, insert a dummy line, so the line numbers stays aligned with
            // the text.
            if (!this.getLineNumber(element.nextSibling as Element)) {
                foundLineNumbers.push({ lineNumber: '' });
            }
        } else {
            const children = Array.from(element.childNodes) as Element[];
            let childrenLength = children.length;
            let childrenLineNumbers = [];
            for (let i = 0; i < children.length; i++) {
                childrenLineNumbers = childrenLineNumbers.concat(this.extractLineNumbers(children[i]));
                if (children.length < childrenLength) {
                    i -= childrenLength - children.length;
                    childrenLength = children.length;
                }
            }

            // if the found element is a list item, add some spacing
            if (childrenLineNumbers.length && (element.nodeName === 'LI' || element.parentNode.nodeName === 'LI')) {
                childrenLineNumbers[childrenLineNumbers.length - 1].marginBottom = this.P_MARGIN_BOTTOM;
            }

            foundLineNumbers = foundLineNumbers.concat(childrenLineNumbers);
        }
        return foundLineNumbers;
    }

    /**
     * Recursive helper function to determine if the element is inside a list
     *
     * @param element the current html node
     * @returns wether the element is inside a list or not
     */
    private isInsideAList(element: Element): boolean {
        let parent = element.parentNode;
        while (parent !== null) {
            if (parent.nodeName === 'UL' || parent.nodeName === 'OL') {
                return true;
            }
            parent = parent.parentNode;
        }
        return false;
    }

    /**
     * Checks if a given UL or LI list (as element) is a "fake list"
     * Fake lists in fact lists by should appear like the parent list
     * would seamlessly continue.
     * This usually happens when a user makes change recommendations in
     * lists
     *
     * @param element the list to check, can be UL or LI
     * returns wether the list is fake or not
     */
    private isFakeList(element: Element): boolean {
        if (element.firstElementChild && element.classList.contains('os-split-after')) {
            // either first child has split-before or last child has split-after
            const firstChild = element.firstElementChild;
            const lastChild = element.childNodes[element.childNodes.length - 1] as Element;
            const splitBefore = firstChild.nodeName === 'LI' && firstChild.classList.contains('os-split-before');
            const splitAfter = lastChild.nodeName === 'LI' && lastChild.classList.contains('os-split-after');
            return splitBefore || splitAfter;
        }
        return false;
    }

    /**
     * Helper function to safer extract a line number from an element
     *
     * @param element
     * @returns the line number of the element
     */
    private getLineNumber(element: Element): number {
        if (
            element &&
            element.nodeName === 'SPAN' &&
            element.getAttribute('class') &&
            element.getAttribute('class').indexOf('os-line-number') > -1
        ) {
            return parseInt(element.getAttribute('data-line-number'), 10);
        }
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
                const styleDefinition = style.trim().toLowerCase().split(':');
                const key = styleDefinition[0];
                const value = styleDefinition[1];

                if (styleDefinition.length === 2) {
                    switch (key) {
                        case 'padding-left': {
                            styleObject.margin = [parseInt(value, 10), 0, 0, 0];
                            break;
                        }
                        case 'font-size': {
                            styleObject.fontSize = parseInt(value, 10);
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
     * Detect if the given element is a cr exclusive node
     * @param child
     */
    private isCrElement(element: Element): boolean {
        const nodeName = element.nodeName.toLowerCase();
        const crNodeNames = ['ins', 'del'];
        return crNodeNames.includes(nodeName);
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
                let decimalValue = parseInt(decimalColors[i], 10);
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
