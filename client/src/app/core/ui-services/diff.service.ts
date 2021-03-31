import { Injectable } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';

import { LineNumberedString, LinenumberingService, LineNumberRange } from './linenumbering.service';
import { ViewUnifiedChange } from '../../shared/models/motions/view-unified-change';

const ELEMENT_NODE = 1;
const TEXT_NODE = 3;
const DOCUMENT_FRAGMENT_NODE = 11;

/**
 * Indicates the type of a modification when comparing ("diff"ing) two versions of a text.
 * - TYPE_INSERTION indicates an insertion. An insertion is when the new version of a text contains a certain string
 *   that did not exist in the original version of the.
 * - TYPE_DELETION indicates a replacement. A deletion is when the new version of a text does not contain a certain
 *   string contained in the original version of the text anymore.
 * - TYPE_REPLACEMENT indicates both of the above: the new version of the text contains text not present in the original
 *   version, but also removes some parts of that text.
 *
 * This enumeration is used when _automatically_ detecting the change type of an amendment / change recommendation.
 */
export enum ModificationType {
    TYPE_REPLACEMENT,
    TYPE_INSERTION,
    TYPE_DELETION
}

/**
 * This data structure is used when determining the most specific common ancestor of two HTML node
 * (`node1` and `node2`)
 * within the same Document Fragment.
 */
interface CommonAncestorData {
    /**
     * The most specific common ancestor node.
     */
    commonAncestor: Node;
    /**
     * The nodes inbetween `commonAncestor` and the `node1` in the DOM hierarchy.
     * Empty, if node1 is a direct descendant.
     */
    trace1: Node[];
    /**
     * The nodes inbetween `commonAncestor` and the `node2` in the DOM hierarchy.
     * Empty, if node2 is a direct descendant.
     */
    trace2: Node[];
    /**
     * Starting the root node, this indicates the depth level of the `commonAncestor`.
     */
    index: number;
}

/**
 * An object produced by `extractRangeByLineNumbers``. It contains both the extracted lines as well as
 * information about the context in which these lines occur.
 * This additional information is meant to render the snippet correctly without producing broken HTML
 */
interface ExtractedContent {
    /**
     * The HTML between the two line numbers. Line numbers and automatically set line breaks are stripped.
     * All HTML tags are converted to uppercase
     * (e.g. Line 2</LI><LI>Line3</LI><LI>Line 4 <br>)
     */
    html: string;
    /**
     * The most specific DOM element that contains the HTML snippet (e.g. a UL, if several LIs are selected)
     */
    ancestor: Node;
    /**
     * An HTML string that opens all necessary tags to get the browser into the rendering mode
     * of the ancestor element (e.g. <DIV><UL> in the case of the multiple LIs)
     */
    outerContextStart: string;
    /**
     * An HTML string that closes all necessary tags from the ancestor element (e.g. </UL></DIV>
     */
    outerContextEnd: string;
    /**
     * A string that opens all necessary tags between the ancestor and the beginning of the selection (e.g. <LI>)
     */
    innerContextStart: string;
    /**
     * A string that closes all tags after the end of the selection to the ancestor (e.g. </LI>)
     */
    innerContextEnd: string;
    /**
     * The HTML before the selected area begins (including line numbers)
     */
    previousHtml: string;
    /**
     * A HTML snippet that closes all open tags from previousHtml
     */
    previousHtmlEndSnippet: string;
    /**
     * The HTML after the selected area
     */
    followingHtml: string;
    /**
     * A HTML snippet that opens all HTML tags necessary to render "followingHtml"
     */
    followingHtmlStartSnippet: string;
}

/**
 * An object specifying a range of line numbers.
 */
export interface LineRange {
    /**
     * The first line number to be included.
     */
    from: number;
    /**
     * The end line number.
     * HINT: As this object is usually referring to actual line numbers, not lines,
     * the line starting by `to` is not included in the extracted content anymore,
     * only the text between `from` and `to`.
     */
    to: number;
}

/**
 * An object representing a paragraph with some changed lines
 */
export interface DiffLinesInParagraph {
    /**
     * The paragraph number
     */
    paragraphNo: number;
    /**
     * The first line of the paragraph
     */
    paragraphLineFrom: number;
    /**
     * The end line number (after the paragraph)
     */
    paragraphLineTo: number;
    /**
     * The first line number with changes
     */
    diffLineFrom: number;
    /**
     * The line number after the last change
     */
    diffLineTo: number;
    /**
     * The HTML of the not-changed lines before the changed ones
     */
    textPre: string;
    /**
     * The HTML of the changed lines
     */
    text: string;
    /**
     * The HTML of the not-changed lines after the changed ones
     */
    textPost: string;
}

/**
 * Functionality regarding diffing, merging and extracting line ranges.
 *
 * ## Examples
 *
 * Cleaning up a string generated by CKEditor:
 *
 * ```ts
 * this.diffService.removeDuplicateClassesInsertedByCkeditor(motion.text)
 * ```
 *
 * Extracting a range specified by line numbers from a motion text:
 *
 * ```ts
 * const lineLength = 80;
 * const lineNumberedText = this.lineNumbering.insertLineNumbers(
 *   '<p>A line</p><p>Another line</p><ul><li>A list item</li><li>Yet another item</li></ul>', lineLength
 * );
 * const extractFrom = 2;
 * const extractUntil = 3;
 * const extractedData = this.diffService.extractRangeByLineNumbers(lineNumberedText, extractFrom, extractUntil)
 * ```
 *
 * Creating a valid HTML from such a extracted text, including line numbers:
 *
 * ```ts
 * const extractedHtml = this.diffService.formatDiffWithLineNumbers(extractedData, lineLength, extractFrom);
 * ```
 *
 * Creating the diff between two html strings:
 *
 * ```ts
 * const before = '<P>Lorem ipsum dolor sit amet, sed diam voluptua. At </P>';
 * const beforeLineNumbered = this.lineNumbering.insertLineNumbers(before, 80)
 * const after = '<P>Lorem ipsum dolor sit amet, sed diam voluptua. At2</P>';
 * const diff = this.diffService.diff(before, after);
 * ```ts
 *
 * Given a (line numbered) diff string, detect the line number range with changes:
 *
 * ```ts
 * this.diffService.detectAffectedLineRange(diff);
 * ```
 *
 * Given a diff'ed string, apply all changes to receive the new version of the text:
 *
 * ```ts
 * const diffedHtml =
 *   '<p>Test <span class="delete">Test 2</span> Another test <del>Test 3</del></p><p class="delete">Test 4</p>';
 * const newVersion = this.diffService.diffHtmlToFinalText(diffedHtml);
 * ```
 *
 * Replace a line number range in a text by new text:
 *
 * ```ts
 * const lineLength = 80;
 * const lineNumberedText =
 *   this.lineNumbering.insertLineNumbers(
 *     '<p>A line</p><p>Another line</p><ul><li>A list item</li><li>Yet another item</li></ul>',
 *     lineLength
 *   );
 * const merged = this.diffService.replaceLines(lineNumberedText, '<p>Replaced paragraph</p>', 1, 2);
 * ```
 */
@Injectable({
    providedIn: 'root'
})
export class DiffService {
    // @TODO Decide on a more sophisticated implementation
    private diffCache = {
        _cache: {},
        get: (key: string): any => {
            return this.diffCache._cache[key] === undefined ? null : this.diffCache._cache[key];
        },
        put: (key: string, val: any): void => {
            this.diffCache._cache[key] = val;
        }
    };

    /**
     * Creates the DiffService.
     *
     * @param {LinenumberingService} lineNumberingService
     */
    public constructor(
        private readonly lineNumberingService: LinenumberingService,
        protected translate: TranslateService
    ) {}

    /**
     * Searches for the line breaking node within the given Document specified by the given lineNumber.
     * This is performed by using a querySelector.
     *
     * @param {DocumentFragment} fragment
     * @param {number} lineNumber
     * @returns {Element}
     */
    public getLineNumberNode(fragment: DocumentFragment, lineNumber: number): Element {
        return fragment.querySelector('os-linebreak.os-line-number.line-number-' + lineNumber);
    }

    /**
     * This returns the first line breaking node within the given node.
     * If none is found, `null` is returned.
     *
     * @param {Node} node
     * @returns {Element}
     */
    private getFirstLineNumberNode(node: Node): Element {
        if (node.nodeType === TEXT_NODE) {
            return null;
        }
        const element = <Element>node;
        if (element.nodeName === 'OS-LINEBREAK') {
            return element;
        }
        const found = element.querySelectorAll('OS-LINEBREAK');
        if (found.length > 0) {
            return found.item(0);
        } else {
            return null;
        }
    }

    /**
     * This returns the last line breaking node within the given node.
     * If none is found, `null` is returned.
     *
     * @param {Node} node
     * @returns {Element}
     */
    private getLastLineNumberNode(node: Node): Element {
        if (node.nodeType === TEXT_NODE) {
            return null;
        }
        const element = <Element>node;
        if (element.nodeName === 'OS-LINEBREAK') {
            return element;
        }
        const found = element.querySelectorAll('OS-LINEBREAK');
        if (found.length > 0) {
            return found.item(found.length - 1);
        } else {
            return null;
        }
    }

    /**
     * Given a node, this method returns an array containing all parent elements of this node, recursively.
     *
     * @param {Node} node
     * @returns {Node[]}
     */
    private getNodeContextTrace(node: Node): Node[] {
        const context = [];
        let currNode = node;
        while (currNode) {
            context.unshift(currNode);
            currNode = currNode.parentNode;
        }
        return context;
    }

    /**
     * This method checks if the given `child`-Node is the first non-empty child element of the given parent Node
     * called `node`. Hence the name of this method.
     *
     * @param node
     * @param child
     */
    private isFirstNonemptyChild(node: Node, child: Node): boolean {
        for (let i = 0; i < node.childNodes.length; i++) {
            if (node.childNodes[i] === child) {
                return true;
            }
            if (node.childNodes[i].nodeType !== TEXT_NODE || node.childNodes[i].nodeValue.match(/\S/)) {
                return false;
            }
        }
        return false;
    }

    /**
     * Adds elements like <OS-LINEBREAK class="os-line-number line-number-23" data-line-number="23"/>
     * to a given fragment
     *
     * @param {DocumentFragment} fragment
     */
    public insertInternalLineMarkers(fragment: DocumentFragment): void {
        if (fragment.querySelectorAll('OS-LINEBREAK').length > 0) {
            // Prevent duplicate calls
            return;
        }
        const lineNumbers = fragment.querySelectorAll('span.os-line-number');
        let lineMarker,
            maxLineNumber = 0;

        lineNumbers.forEach((insertBefore: Node) => {
            const lineNumberElement = <Element>insertBefore;
            while (
                insertBefore.parentNode.nodeType !== DOCUMENT_FRAGMENT_NODE &&
                this.isFirstNonemptyChild(insertBefore.parentNode, insertBefore)
            ) {
                insertBefore = insertBefore.parentNode;
            }
            lineMarker = document.createElement('OS-LINEBREAK');
            lineMarker.setAttribute('data-line-number', lineNumberElement.getAttribute('data-line-number'));
            lineMarker.setAttribute('class', lineNumberElement.getAttribute('class'));
            insertBefore.parentNode.insertBefore(lineMarker, insertBefore);
            maxLineNumber = parseInt(lineNumberElement.getAttribute('data-line-number'), 10);
        });

        // Add one more "fake" line number at the end and beginning, so we can select the last line as well
        lineMarker = document.createElement('OS-LINEBREAK');
        lineMarker.setAttribute('data-line-number', (maxLineNumber + 1).toString(10));
        lineMarker.setAttribute('class', 'os-line-number line-number-' + (maxLineNumber + 1).toString(10));
        fragment.appendChild(lineMarker);

        lineMarker = document.createElement('OS-LINEBREAK');
        lineMarker.setAttribute('data-line-number', '0');
        lineMarker.setAttribute('class', 'os-line-number line-number-0');
        fragment.insertBefore(lineMarker, fragment.firstChild);
    }

    /**
     * An OL element has a number of child LI nodes. Given a `descendantNode` that might be anywhere within
     * the hierarchy of this OL element, this method returns the index (starting with 1) of the LI element
     * that contains this node.
     *
     * @param olNode
     * @param descendantNode
     */
    private isWithinNthLIOfOL(olNode: Element, descendantNode: Node): number {
        let nthLIOfOL = null;
        while (descendantNode.parentNode) {
            if (descendantNode.parentNode === olNode) {
                let lisBeforeOl = 0,
                    foundMe = false;
                for (let i = 0; i < olNode.childNodes.length && !foundMe; i++) {
                    if (olNode.childNodes[i] === descendantNode) {
                        foundMe = true;
                    } else if (olNode.childNodes[i].nodeName === 'LI') {
                        lisBeforeOl++;
                    }
                }
                nthLIOfOL = lisBeforeOl + 1;
            }
            descendantNode = descendantNode.parentNode;
        }
        return nthLIOfOL;
    }

    /**
     * Returns information about the common ancestors of two given nodes.
     *
     * @param {Node} node1
     * @param {Node} node2
     * @returns {CommonAncestorData}
     */
    public getCommonAncestor(node1: Node, node2: Node): CommonAncestorData {
        const trace1 = this.getNodeContextTrace(node1),
            trace2 = this.getNodeContextTrace(node2),
            childTrace1 = [],
            childTrace2 = [];
        let commonAncestor = null,
            commonIndex = null;

        for (let i = 0; i < trace1.length && i < trace2.length; i++) {
            if (trace1[i] === trace2[i]) {
                commonAncestor = trace1[i];
                commonIndex = i;
            }
        }
        for (let i = commonIndex + 1; i < trace1.length; i++) {
            childTrace1.push(trace1[i]);
        }
        for (let i = commonIndex + 1; i < trace2.length; i++) {
            childTrace2.push(trace2[i]);
        }
        return {
            commonAncestor: commonAncestor,
            trace1: childTrace1,
            trace2: childTrace2,
            index: commonIndex
        };
    }

    /**
     * This converts a HTML Node element into a rendered HTML string.
     *
     * @param {Node} node
     * @returns {string}
     */
    private serializeTag(node: Node): string {
        if (node.nodeType !== ELEMENT_NODE) {
            // Fragments are only placeholders and do not have an HTML representation
            return '';
        }
        const element = <Element>node;
        let html = '<' + element.nodeName;
        for (let i = 0; i < element.attributes.length; i++) {
            const attr = element.attributes[i];
            if (attr.name !== 'os-li-number') {
                html += ' ' + attr.name + '="' + attr.value + '"';
            }
        }
        html += '>';
        return html;
    }

    /**
     * This converts the given HTML string into a DOM tree contained by a DocumentFragment, which is reqturned.
     *
     * @param {string} html
     * @return {DocumentFragment}
     */
    public htmlToFragment(html: string): DocumentFragment {
        const template = document.createElement('template');
        template.innerHTML = html;
        return template.content;
    }

    /**
     * This performs HTML normalization to prevent the Diff-Algorithm from detecting changes when there are actually
     * none. Common problems covered by this method are differently ordered Attributes of HTML elements or HTML-encoded
     * special characters.
     * Unfortunately, the conversion of HTML-encoded characters to the actual characters is done by a lookup-table for
     * now, as we haven't figured out a way to decode them automatically.
     *
     * @param {string} html
     * @returns {string}
     * @private
     */
    public normalizeHtmlForDiff(html: string): string {
        // Convert all HTML tags to uppercase, but leave the values of attributes unchanged
        // All attributes and CSS class names  are sorted alphabetically
        // If an attribute is empty, it is removed
        html = html.replace(
            /<(\/?[a-z]*)( [^>]*)?>/gi,
            (_fullHtml: string, tag: string, attributes: string): string => {
                const tagNormalized = tag.toUpperCase();
                if (attributes === undefined) {
                    attributes = '';
                }
                const attributesList = [],
                    attributesMatcher = /( [^"'=]*)(= *((["'])(.*?)\4))?/gi;
                let match;
                do {
                    match = attributesMatcher.exec(attributes);
                    if (match) {
                        let attrNormalized = match[1].toUpperCase(),
                            attrValue = match[5];
                        if (match[2] !== undefined) {
                            if (attrNormalized === ' CLASS') {
                                attrValue = attrValue
                                    .split(' ')
                                    .sort()
                                    .join(' ')
                                    .replace(/^\s+/, '')
                                    .replace(/\s+$/, '');
                            }
                            attrNormalized += '=' + match[4] + attrValue + match[4];
                        }
                        if (attrValue !== '') {
                            attributesList.push(attrNormalized);
                        }
                    }
                } while (match);
                attributes = attributesList.sort().join('');
                return '<' + tagNormalized + attributes + '>';
            }
        );

        const entities = {
            '&nbsp;': ' ',
            '&ndash;': '-',
            '&auml;': 'ä',
            '&ouml;': 'ö',
            '&uuml;': 'ü',
            '&Auml;': 'Ä',
            '&Ouml;': 'Ö',
            '&Uuml;': 'Ü',
            '&szlig;': 'ß',
            '&bdquo;': '„',
            '&ldquo;': '“',
            '&bull;': '•',
            '&sect;': '§',
            '&eacute;': 'é',
            '&rsquo;': '’',
            '&euro;': '€',
            '&reg;': '®',
            '&trade;': '™',
            '&raquo;': '»',
            '&laquo;': '«',
            '&Acirc;': 'Â',
            '&acirc;': 'â',
            '&Ccedil;': 'Ç',
            '&ccedil;': 'ç',
            '&Egrave;': 'È',
            '&egrave;': 'è',
            '&Ntilde;': 'Ñ',
            '&ntilde;': 'ñ',
            '&Euml;': 'Ë',
            '&euml;': 'ë'
        };

        html = html
            .replace(/\s+<\/P>/gi, '</P>')
            .replace(/\s+<\/DIV>/gi, '</DIV>')
            .replace(/\s+<\/LI>/gi, '</LI>');
        html = html.replace(/\s+<LI>/gi, '<LI>').replace(/<\/LI>\s+/gi, '</LI>');
        html = html.replace(/\u00A0/g, ' ');
        html = html.replace(/\u2013/g, '-');
        Object.keys(entities).forEach(ent => {
            html = html.replace(new RegExp(ent, 'g'), entities[ent]);
        });

        // Newline characters: after closing block-level-elements, but not after BR (which is inline)
        html = html.replace(/(<br *\/?>)\n/gi, '$1');
        html = html.replace(/[ \n\t]+/gi, ' ');
        html = html.replace(/(<\/(div|p|ul|li|blockquote>)>) /gi, '$1\n');

        return html;
    }

    /**
     * Get all the siblings of the given node _after_ this node, in the order as they appear in the DOM tree.
     *
     * @param {Node} node
     * @returns {Node[]}
     */
    private getAllNextSiblings(node: Node): Node[] {
        const nodes: Node[] = [];
        while (node.nextSibling) {
            nodes.push(node.nextSibling);
            node = node.nextSibling;
        }
        return nodes;
    }

    /**
     * Get all the siblings of the given node _before_ this node,
     * with the one closest to the given node first (=> reversed order in regard to the DOM tree order)
     *
     * @param {Node} node
     * @returns {Node[]}
     */
    private getAllPrevSiblingsReversed(node: Node): Node[] {
        const nodes = [];
        while (node.previousSibling) {
            nodes.push(node.previousSibling);
            node = node.previousSibling;
        }
        return nodes;
    }

    /**
     * Given two strings, this method tries to guess if `htmlNew` can be produced from `htmlOld` by inserting
     * or deleting text, or if both is necessary (replac)
     *
     * @param {string} htmlOld
     * @param {string} htmlNew
     * @returns {number}
     */
    public detectReplacementType(htmlOld: string, htmlNew: string): ModificationType {
        htmlOld = this.normalizeHtmlForDiff(htmlOld);
        htmlNew = this.normalizeHtmlForDiff(htmlNew);

        if (htmlOld === htmlNew) {
            return ModificationType.TYPE_REPLACEMENT;
        }

        let i, foundDiff;
        for (i = 0, foundDiff = false; i < htmlOld.length && i < htmlNew.length && foundDiff === false; i++) {
            if (htmlOld[i] !== htmlNew[i]) {
                foundDiff = true;
            }
        }

        const remainderOld = htmlOld.substr(i - 1),
            remainderNew = htmlNew.substr(i - 1);
        let type = ModificationType.TYPE_REPLACEMENT;

        if (remainderOld.length > remainderNew.length) {
            if (remainderOld.substr(remainderOld.length - remainderNew.length) === remainderNew) {
                type = ModificationType.TYPE_DELETION;
            }
        } else if (remainderOld.length < remainderNew.length) {
            if (remainderNew.substr(remainderNew.length - remainderOld.length) === remainderOld) {
                type = ModificationType.TYPE_INSERTION;
            }
        }

        return type;
    }

    /**
     * This method adds a CSS class name to a given node.
     *
     * @param {Node} node
     * @param {string} className
     */
    public addCSSClass(node: Node, className: string): void {
        if (node.nodeType !== ELEMENT_NODE) {
            return;
        }
        const element = <Element>node;
        const classesStr = element.getAttribute('class');
        const classes = classesStr ? classesStr.split(' ') : [];
        if (classes.indexOf(className) === -1) {
            classes.push(className);
        }
        element.setAttribute('class', classes.join(' '));
    }

    /**
     * This method removes a CSS class name from a given node.
     *
     * @param {Node} node
     * @param {string} className
     */
    public removeCSSClass(node: Node, className: string): void {
        if (node.nodeType !== ELEMENT_NODE) {
            return;
        }
        const element = <Element>node;
        const classesStr = element.getAttribute('class');
        const newClasses = [];
        const classes = classesStr ? classesStr.split(' ') : [];
        for (let i = 0; i < classes.length; i++) {
            if (classes[i] !== className) {
                newClasses.push(classes[i]);
            }
        }
        if (newClasses.length === 0) {
            element.removeAttribute('class');
        } else {
            element.setAttribute('class', newClasses.join(' '));
        }
    }

    /**
     * Adapted from http://ejohn.org/projects/javascript-diff-algorithm/
     * by John Resig, MIT License
     * @param {array} oldArr
     * @param {array} newArr
     * @returns {object}
     */
    private diffArrays(oldArr: any, newArr: any): any {
        const ns = {},
            os = {};
        let i;

        for (i = 0; i < newArr.length; i++) {
            if (ns[newArr[i]] === undefined) {
                ns[newArr[i]] = { rows: [], o: null };
            }
            ns[newArr[i]].rows.push(i);
        }

        for (i = 0; i < oldArr.length; i++) {
            if (os[oldArr[i]] === undefined) {
                os[oldArr[i]] = { rows: [], n: null };
            }
            os[oldArr[i]].rows.push(i);
        }

        for (i in ns) {
            if (ns[i].rows.length === 1 && typeof os[i] !== 'undefined' && os[i].rows.length === 1) {
                newArr[ns[i].rows[0]] = { text: newArr[ns[i].rows[0]], row: os[i].rows[0] };
                oldArr[os[i].rows[0]] = { text: oldArr[os[i].rows[0]], row: ns[i].rows[0] };
            }
        }

        for (i = 0; i < newArr.length - 1; i++) {
            if (
                newArr[i].text !== null &&
                newArr[i + 1].text === undefined &&
                newArr[i].row + 1 < oldArr.length &&
                oldArr[newArr[i].row + 1].text === undefined &&
                newArr[i + 1] === oldArr[newArr[i].row + 1]
            ) {
                newArr[i + 1] = { text: newArr[i + 1], row: newArr[i].row + 1 };
                oldArr[newArr[i].row + 1] = { text: oldArr[newArr[i].row + 1], row: i + 1 };
            }
        }

        for (i = newArr.length - 1; i > 0; i--) {
            if (
                newArr[i].text !== null &&
                newArr[i - 1].text === undefined &&
                newArr[i].row > 0 &&
                oldArr[newArr[i].row - 1].text === undefined &&
                newArr[i - 1] === oldArr[newArr[i].row - 1]
            ) {
                newArr[i - 1] = { text: newArr[i - 1], row: newArr[i].row - 1 };
                oldArr[newArr[i].row - 1] = { text: oldArr[newArr[i].row - 1], row: i - 1 };
            }
        }

        return { o: oldArr, n: newArr };
    }

    /**
     * This method splits a string into an array of strings, such as that it can be used by the diff method.
     * Mainly it tries to split it into single words, but prevents HTML tags from being split into different elements.
     *
     * @param {string} str
     * @returns {string[]}
     */
    private tokenizeHtml(str: string): string[] {
        const splitArrayEntriesEmbedSeparator = (arrIn: string[], by: string, prepend: boolean): string[] => {
            const newArr = [];
            for (let i = 0; i < arrIn.length; i++) {
                if (arrIn[i][0] === '<' && (by === ' ' || by === '\n')) {
                    // Don't split HTML tags
                    newArr.push(arrIn[i]);
                    continue;
                }

                const parts = arrIn[i].split(by);
                if (parts.length === 1) {
                    newArr.push(arrIn[i]);
                } else {
                    let j;
                    if (prepend) {
                        if (parts[0] !== '') {
                            newArr.push(parts[0]);
                        }
                        for (j = 1; j < parts.length; j++) {
                            newArr.push(by + parts[j]);
                        }
                    } else {
                        for (j = 0; j < parts.length - 1; j++) {
                            newArr.push(parts[j] + by);
                        }
                        if (parts[parts.length - 1] !== '') {
                            newArr.push(parts[parts.length - 1]);
                        }
                    }
                }
            }
            return newArr;
        };
        const splitArrayEntriesSplitSeparator = (arrIn: string[], by: string): string[] => {
            const newArr = [];
            for (let i = 0; i < arrIn.length; i++) {
                if (arrIn[i][0] === '<') {
                    newArr.push(arrIn[i]);
                    continue;
                }
                const parts = arrIn[i].split(by);
                for (let j = 0; j < parts.length; j++) {
                    if (j > 0) {
                        newArr.push(by);
                    }
                    newArr.push(parts[j]);
                }
            }
            return newArr;
        };
        let arr = splitArrayEntriesEmbedSeparator([str], '<', true);
        arr = splitArrayEntriesEmbedSeparator(arr, '>', false);
        arr = splitArrayEntriesSplitSeparator(arr, ' ');
        arr = splitArrayEntriesSplitSeparator(arr, '.');
        arr = splitArrayEntriesSplitSeparator(arr, ',');
        arr = splitArrayEntriesSplitSeparator(arr, '!');
        arr = splitArrayEntriesSplitSeparator(arr, '-');
        arr = splitArrayEntriesEmbedSeparator(arr, '\n', false);

        const arrWithoutEmpties = [];
        for (let i = 0; i < arr.length; i++) {
            if (arr[i] !== '') {
                arrWithoutEmpties.push(arr[i]);
            }
        }

        return arrWithoutEmpties;
    }

    /**
     * Given two strings, this method generates a consolidated new string that indicates the operations necessary
     * to get from `oldStr` to `newStr` by <ins>...</ins> and <del>...</del>-Tags
     *
     * @param {string} oldStr
     * @param {string} newStr
     * @returns {string}
     */
    private diffString(oldStr: string, newStr: string): string {
        oldStr = this.normalizeHtmlForDiff(oldStr.replace(/\s+$/, '').replace(/^\s+/, ''));
        newStr = this.normalizeHtmlForDiff(newStr.replace(/\s+$/, '').replace(/^\s+/, ''));

        const out = this.diffArrays(this.tokenizeHtml(oldStr), this.tokenizeHtml(newStr));

        // This fixes the problem tested by "does not lose words when changes are moved X-wise"
        let lastRow = 0;
        for (let z = 0; z < out.n.length; z++) {
            if (out.n[z].row && out.n[z].row > lastRow) {
                lastRow = out.n[z].row;
            }
            if (out.n[z].row && out.n[z].row < lastRow) {
                out.o[out.n[z].row] = out.o[out.n[z].row].text;
                out.n[z] = out.n[z].text;
            }
        }

        let str = '';
        let i;

        if (out.n.length === 0) {
            for (i = 0; i < out.o.length; i++) {
                str += '<del>' + out.o[i] + '</del>';
            }
        } else {
            if (out.n[0].text === undefined) {
                for (let k = 0; k < out.o.length && out.o[k].text === undefined; k++) {
                    str += '<del>' + out.o[k] + '</del>';
                }
            }

            let currOldRow = 0;
            for (i = 0; i < out.n.length; i++) {
                if (out.n[i].text === undefined) {
                    if (out.n[i] !== '') {
                        str += '<ins>' + out.n[i] + '</ins>';
                    }
                } else if (out.n[i].row < currOldRow) {
                    str += '<ins>' + out.n[i].text + '</ins>';
                } else {
                    let pre = '';

                    if (i + 1 < out.n.length && out.n[i + 1].row !== undefined && out.n[i + 1].row > out.n[i].row + 1) {
                        for (let n = out.n[i].row + 1; n < out.n[i + 1].row; n++) {
                            if (out.o[n].text === undefined) {
                                pre += '<del>' + out.o[n] + '</del>';
                            } else {
                                pre += '<del>' + out.o[n].text + '</del>';
                            }
                        }
                    } else {
                        for (let j = out.n[i].row + 1; j < out.o.length && out.o[j].text === undefined; j++) {
                            pre += '<del>' + out.o[j] + '</del>';
                        }
                    }
                    str += out.n[i].text + pre;

                    currOldRow = out.n[i].row;
                }
            }
        }

        return str.replace(/^\s+/g, '').replace(/\s+$/g, '').replace(/ {2,}/g, ' ');
    }

    /**
     * This checks if this string is valid inline HTML.
     * It does so by leveraging the browser's auto-correction mechanism and coun the number of "<"s (opening and closing
     * HTML tags) of the original and the cleaned-up string.
     * This is mainly helpful to decide if a given string can be put into <del>...</del> or <ins>...</ins>-Tags without
     * producing broken HTML.
     *
     * @param {string} html
     * @return {boolean}
     * @private
     */
    private isValidInlineHtml(html: string): boolean {
        // If there are no HTML tags, we assume it's valid and skip further checks
        if (!html.match(/<[^>]*>/)) {
            return true;
        }

        // We check if this is a valid HTML that closes all its tags again using the innerHTML-Hack to correct
        // the string and check if the number of HTML tags changes by this
        const doc = document.createElement('div');
        doc.innerHTML = html;
        const tagsBefore = (html.match(/</g) || []).length;
        const tagsCorrected = (doc.innerHTML.match(/</g) || []).length;
        if (tagsBefore !== tagsCorrected) {
            // The HTML has changed => it was not valid
            return false;
        }

        // If there is any block element inside, we consider it as broken, as this string will be displayed
        // inside of <ins>/<del> tags
        if (html.match(/<(div|p|ul|li|blockquote)\W/i)) {
            return false;
        }

        return true;
    }

    /**
     * This detects if a given string contains broken HTML. This can happen when the Diff accidentally produces
     * wrongly nested HTML tags.
     *
     * @param {string} html
     * @returns {boolean}
     * @private
     */
    private diffDetectBrokenDiffHtml(html: string): boolean {
        // If other HTML tags are contained within INS/DEL (e.g. "<ins>Test</p></ins>"), let's better be cautious
        // The "!!(found=...)"-construction is only used to make jshint happy :)
        const findDel = /<del>([\s\S]*?)<\/del>/gi,
            findIns = /<ins>([\s\S]*?)<\/ins>/gi;
        let found, inner;
        while (!!(found = findDel.exec(html))) {
            inner = found[1].replace(/<br[^>]*>/gi, '');
            if (inner.match(/<[^>]*>/)) {
                return true;
            }
        }
        while (!!(found = findIns.exec(html))) {
            inner = found[1].replace(/<br[^>]*>/gi, '');
            if (!this.isValidInlineHtml(inner)) {
                return true;
            }
        }

        // If non of the conditions up to now is met, we consider the diff as being sane
        return false;
    }

    /**
     * Adds a CSS class to the first opening HTML tag within the given string.
     *
     * @param {string} html
     * @param {string} className
     * @returns {string}
     */
    public addCSSClassToFirstTag(html: string, className: string): string {
        return html.replace(/<[a-z][^>]*>/i, (match: string): string => {
            if (match.match(/class=["'][a-z0-9 _-]*["']/i)) {
                return match.replace(
                    /class=["']([a-z0-9 _-]*)["']/i,
                    (match2: string, previousClasses: string): string => {
                        return 'class="' + previousClasses + ' ' + className + '"';
                    }
                );
            } else {
                return match.substring(0, match.length - 1) + ' class="' + className + '">';
            }
        });
    }

    /**
     * Adds a CSS class to the last opening HTML tag within the given string.
     *
     * @param {string} html
     * @param {string} className
     * @returns {string}
     */
    public addClassToLastNode(html: string, className: string): string {
        const node = document.createElement('div');
        node.innerHTML = html;
        let foundLast = false;
        for (let i = node.childNodes.length - 1; i >= 0 && !foundLast; i--) {
            if (node.childNodes[i].nodeType === ELEMENT_NODE) {
                const childElement = <Element>node.childNodes[i];
                let classes = [];
                if (childElement.getAttribute('class')) {
                    classes = childElement.getAttribute('class').split(' ');
                }
                classes.push(className);
                childElement.setAttribute('class', classes.sort().join(' ').replace(/^\s+/, '').replace(/\s+$/, ''));
                foundLast = true;
            }
        }
        return node.innerHTML;
    }

    /**
     * This function removes color-Attributes from the styles of this node or a descendant,
     * as they interfer with the green/red color in HTML and PDF
     *
     * For the moment, it is sufficient to do this only in paragraph diff mode, as we fall back to this mode anyway
     * once we encounter SPANs or other tags inside of INS/DEL-tags
     *
     * @param {Element} node
     * @private
     */
    private removeColorStyles(node: Element): void {
        const styles = node.getAttribute('style');
        if (styles && styles.indexOf('color') > -1) {
            const stylesNew = [];
            styles.split(';').forEach((style: string): void => {
                if (!style.match(/^\s*color\s*:/i)) {
                    stylesNew.push(style);
                }
            });
            if (stylesNew.join(';') === '') {
                node.removeAttribute('style');
            } else {
                node.setAttribute('style', stylesNew.join(';'));
            }
        }
        for (let i = 0; i < node.childNodes.length; i++) {
            if (node.childNodes[i].nodeType === ELEMENT_NODE) {
                this.removeColorStyles(<Element>node.childNodes[i]);
            }
        }
    }

    /**
     * Add the CSS-class to the existing "class"-attribute, or add one.
     * Works on strings, not nodes
     *
     * @param {string} tagStr
     * @param {string} className
     * @returns {string}
     */
    private addClassToHtmlTag(tagStr: string, className: string): string {
        return tagStr.replace(/<(\w+)( [^>]*)?>/gi, (whole: string, tag: string, tagArguments: string): string => {
            tagArguments = tagArguments ? tagArguments : '';
            if (tagArguments.match(/class="/gi)) {
                // class="someclass" => class="someclass insert"
                tagArguments = tagArguments.replace(
                    /(class\s*=\s*)(["'])([^\2]*)\2/gi,
                    (classWhole: string, attr: string, para: string, content: string): string => {
                        return attr + para + content + ' ' + className + para;
                    }
                );
            } else {
                tagArguments += ' class="' + className + '"';
            }
            return '<' + tag + tagArguments + '>';
        });
    }

    /**
     * This fixes a very specific, really weird bug that is tested in the test case "does not a change in a very
     * specific case.
     *
     * @param {string}diffStr
     * @return {string}
     */
    private fixWrongChangeDetection(diffStr: string): string {
        if (diffStr.indexOf('<del>') === -1 || diffStr.indexOf('<ins>') === -1) {
            return diffStr;
        }

        const findDelGroupFinder = /(?:<del>.*?<\/del>)+/gi;
        let found,
            returnStr = diffStr;

        while (!!(found = findDelGroupFinder.exec(diffStr))) {
            const del = found[0],
                split = returnStr.split(del);

            const findInsGroupFinder = /^(?:<ins>.*?<\/ins>)+/gi,
                foundIns = findInsGroupFinder.exec(split[1]);
            if (foundIns) {
                const ins = foundIns[0];

                let delShortened = del
                    .replace(
                        /<del>((<BR CLASS="os-line-break"><\/del><del>)?(<span[^>]+os-line-number[^>]+?>)(\s|<\/?del>)*<\/span>)<\/del>/gi,
                        ''
                    )
                    .replace(/<\/del><del>/g, '');
                const insConv = ins
                    .replace(/<ins>/g, '<del>')
                    .replace(/<\/ins>/g, '</del>')
                    .replace(/<\/del><del>/g, '');
                if (delShortened.indexOf(insConv) !== -1) {
                    delShortened = delShortened.replace(insConv, '');
                    if (delShortened === '') {
                        returnStr = returnStr.replace(del + ins, del.replace(/<del>/g, '').replace(/<\/del>/g, ''));
                    }
                }
            }
        }
        return returnStr;
    }

    /**
     * Converts a given HTML node into HTML string and optionally strips line number nodes from it.
     *
     * @param {Node} node
     * @param {boolean} stripLineNumbers
     * @returns {string}
     */
    private serializeDom(node: Node, stripLineNumbers: boolean): string {
        if (node.nodeType === TEXT_NODE) {
            return node.nodeValue.replace(/</g, '&lt;').replace(/>/g, '&gt;');
        }
        if (
            stripLineNumbers &&
            (this.lineNumberingService.isOsLineNumberNode(node) || this.lineNumberingService.isOsLineBreakNode(node))
        ) {
            return '';
        }
        if (node.nodeName === 'OS-LINEBREAK') {
            return '';
        }
        if (node.nodeName === 'BR') {
            const element = <Element>node;
            let br = '<BR';
            for (let i = 0; i < element.attributes.length; i++) {
                const attr = element.attributes[i];
                br += ' ' + attr.name + '="' + attr.value + '"';
            }
            return br + '>';
        }

        let html = this.serializeTag(node);
        for (let i = 0; i < node.childNodes.length; i++) {
            if (node.childNodes[i].nodeType === TEXT_NODE) {
                html += node.childNodes[i].nodeValue.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            } else if (
                !stripLineNumbers ||
                (!this.lineNumberingService.isOsLineNumberNode(node.childNodes[i]) &&
                    !this.lineNumberingService.isOsLineBreakNode(node.childNodes[i]))
            ) {
                html += this.serializeDom(node.childNodes[i], stripLineNumbers);
            }
        }
        if (node.nodeType !== DOCUMENT_FRAGMENT_NODE) {
            html += '</' + node.nodeName + '>';
        }

        return html;
    }

    /**
     * When a <li> with a os-split-before-class (set by extractRangeByLineNumbers) is edited when creating a
     * change recommendation and is split again in CKEditor, the second list items also gets that class.
     * This is not correct however, as the second one actually is a new list item. So we need to remove it again.
     *
     * @param {string} html
     * @returns {string}
     */
    public removeDuplicateClassesInsertedByCkeditor(html: string): string {
        const fragment = this.htmlToFragment(html);
        const items = fragment.querySelectorAll('li.os-split-before');
        for (let i = 0; i < items.length; i++) {
            if (!this.isFirstNonemptyChild(items[i].parentNode, items[i])) {
                this.removeCSSClass(items[i], 'os-split-before');
            }
        }
        return this.serializeDom(fragment, false);
    }

    /**
     * Given a DOM tree and a specific node within that tree, this method returns the HTML string from the beginning
     * of this tree up to this node.
     * The returned string in itself is not renderable, as it stops in the middle of the complete HTML, with
     * opened tags.
     *
     * Implementation hint: the first element of "toChildTrace" array needs to be a child element of "node"
     * @param {Node} node
     * @param {Node[]} toChildTrace
     * @param {boolean} stripLineNumbers
     * @returns {string}
     */
    public serializePartialDomToChild(node: Node, toChildTrace: Node[], stripLineNumbers: boolean): string {
        if (this.lineNumberingService.isOsLineNumberNode(node) || this.lineNumberingService.isOsLineBreakNode(node)) {
            return '';
        }
        if (node.nodeName === 'OS-LINEBREAK') {
            return '';
        }

        let html = this.serializeTag(node),
            found = false;

        for (let i = 0; i < node.childNodes.length && !found; i++) {
            if (node.childNodes[i] === toChildTrace[0]) {
                found = true;
                const childElement = <Element>node.childNodes[i];
                const remainingTrace = toChildTrace;
                remainingTrace.shift();
                if (!this.lineNumberingService.isOsLineNumberNode(childElement)) {
                    html += this.serializePartialDomToChild(childElement, remainingTrace, stripLineNumbers);
                }
            } else if (node.childNodes[i].nodeType === TEXT_NODE) {
                html += node.childNodes[i].nodeValue;
            } else {
                const childElement = <Element>node.childNodes[i];
                if (
                    !stripLineNumbers ||
                    (!this.lineNumberingService.isOsLineNumberNode(childElement) &&
                        !this.lineNumberingService.isOsLineBreakNode(childElement))
                ) {
                    html += this.serializeDom(childElement, stripLineNumbers);
                }
            }
        }
        if (!found) {
            throw new Error('Inconsistency or invalid call of this function detected (to)');
        }
        return html;
    }

    /**
     * Given a DOM tree and a specific node within that tree, this method returns the HTML string beginning after this
     * node to the end of the tree.
     * The returned string in itself is not renderable, as it starts in the middle of the complete HTML
     * with opened tags.
     *
     * Implementation hint: the first element of "fromChildTrace" array needs to be a child element of "node"
     * @param {Node} node
     * @param {Node[]} fromChildTrace
     * @param {boolean} stripLineNumbers
     * @returns {string}
     */
    public serializePartialDomFromChild(node: Node, fromChildTrace: Node[], stripLineNumbers: boolean): string {
        if (this.lineNumberingService.isOsLineNumberNode(node) || this.lineNumberingService.isOsLineBreakNode(node)) {
            return '';
        }
        if (node.nodeName === 'OS-LINEBREAK') {
            return '';
        }

        let html = '',
            found = false;
        for (let i = 0; i < node.childNodes.length; i++) {
            if (node.childNodes[i] === fromChildTrace[0]) {
                found = true;
                const childElement = <Element>node.childNodes[i];
                const remainingTrace = fromChildTrace;
                remainingTrace.shift();
                if (!this.lineNumberingService.isOsLineNumberNode(childElement)) {
                    html += this.serializePartialDomFromChild(childElement, remainingTrace, stripLineNumbers);
                }
            } else if (found) {
                if (node.childNodes[i].nodeType === TEXT_NODE) {
                    html += node.childNodes[i].nodeValue;
                } else {
                    const childElement = <Element>node.childNodes[i];
                    if (
                        !stripLineNumbers ||
                        (!this.lineNumberingService.isOsLineNumberNode(childElement) &&
                            !this.lineNumberingService.isOsLineBreakNode(childElement))
                    ) {
                        html += this.serializeDom(childElement, stripLineNumbers);
                    }
                }
            }
        }
        if (!found) {
            throw new Error('Inconsistency or invalid call of this function detected (from)');
        }
        if (node.nodeType !== DOCUMENT_FRAGMENT_NODE) {
            html += '</' + node.nodeName + '>';
        }
        return html;
    }

    /**
     * Returns the HTML snippet between two given line numbers.
     * extractRangeByLineNumbers
     * Hint:
     * - The last line (toLine) is not included anymore, as the number refers to the line breaking element at the end
     *   of the line
     * - if toLine === null, then everything from fromLine to the end of the fragment is returned
     *
     * In addition to the HTML snippet, additional information is provided regarding the most specific DOM element
     * that contains the whole section specified by the line numbers (like a P-element if only one paragraph is selected
     * or the most outer DIV, if multiple sections selected).
     *
     * This additional information is meant to render the snippet correctly without producing broken HTML
     *
     * In some cases, the returned HTML tags receive additional CSS classes, providing information both for
     * rendering it and for merging it again correctly.
     * - os-split-*:        These classes are set for all HTML Tags that have been split into two by this process,
     *                      e.g. if the fromLine- or toLine-line-break was somewhere in the middle of this tag.
     *                      If a tag is split, the first one receives "os-split-after", and the second
     *                      one "os-split-before".
     * For example, for the following string <p>Line 1<br>Line 2<br>Line 3</p>:
     * - extracting line 1 to 2 results in <p class="os-split-after">Line 1</p>
     * - extracting line 2 to 3 results in <p class="os-split-after os-split-before">Line 2</p>
     * - extracting line 3 to null/4 results in <p class="os-split-before">Line 3</p>
     *
     * @param {LineNumberedString} htmlIn
     * @param {number} fromLine
     * @param {number} toLine
     * @returns {ExtractedContent}
     */
    public extractRangeByLineNumbers(htmlIn: LineNumberedString, fromLine: number, toLine: number): ExtractedContent {
        if (typeof htmlIn !== 'string') {
            throw new Error('Invalid call - extractRangeByLineNumbers expects a string as first argument');
        }

        const cacheKey = fromLine + '-' + toLine + '-' + this.lineNumberingService.djb2hash(htmlIn),
            cached = this.diffCache.get(cacheKey);

        if (cached) {
            return cached;
        }

        const fragment = this.htmlToFragment(htmlIn);
        this.insertInternalLineMarkers(fragment);
        if (toLine === null) {
            const internalLineMarkers = fragment.querySelectorAll('OS-LINEBREAK'),
                lastMarker = <Element>internalLineMarkers[internalLineMarkers.length - 1];
            toLine = parseInt(lastMarker.getAttribute('data-line-number'), 10);
        }

        const fromLineNode = this.getLineNumberNode(fragment, fromLine),
            toLineNode = toLine ? this.getLineNumberNode(fragment, toLine) : null,
            ancestorData = this.getCommonAncestor(fromLineNode, toLineNode);

        const fromChildTraceRel = ancestorData.trace1,
            fromChildTraceAbs = this.getNodeContextTrace(fromLineNode),
            toChildTraceRel = ancestorData.trace2,
            toChildTraceAbs = this.getNodeContextTrace(toLineNode),
            ancestor = ancestorData.commonAncestor;
        let htmlOut = '',
            outerContextStart = '',
            outerContextEnd = '',
            innerContextStart = '',
            innerContextEnd = '',
            previousHtmlEndSnippet = '',
            followingHtmlStartSnippet = '',
            fakeOl,
            offset;

        fromChildTraceAbs.shift();
        const previousHtml = this.serializePartialDomToChild(fragment, fromChildTraceAbs, false);
        toChildTraceAbs.shift();

        const followingHtml = this.serializePartialDomFromChild(fragment, toChildTraceAbs, false);

        let currNode: Node = fromLineNode,
            isSplit = false;
        while (currNode.parentNode) {
            if (!this.isFirstNonemptyChild(currNode.parentNode, currNode)) {
                isSplit = true;
            }
            if (isSplit) {
                this.addCSSClass(currNode.parentNode, 'os-split-before');
            }
            if (currNode.nodeName !== 'OS-LINEBREAK') {
                previousHtmlEndSnippet += '</' + currNode.nodeName + '>';
            }
            currNode = currNode.parentNode;
        }

        currNode = toLineNode;
        isSplit = false;
        while (currNode.parentNode) {
            if (!this.isFirstNonemptyChild(currNode.parentNode, currNode)) {
                isSplit = true;
            }
            if (isSplit) {
                this.addCSSClass(currNode.parentNode, 'os-split-after');
            }
            if (currNode.parentNode.nodeName === 'OL') {
                const parentElement = <Element>currNode.parentNode;
                fakeOl = parentElement.cloneNode(false);
                offset = parentElement.getAttribute('start')
                    ? parseInt(parentElement.getAttribute('start'), 10) - 1
                    : 0;
                fakeOl.setAttribute('start', (this.isWithinNthLIOfOL(parentElement, toLineNode) + offset).toString());
                followingHtmlStartSnippet = this.serializeTag(fakeOl) + followingHtmlStartSnippet;
            } else {
                followingHtmlStartSnippet = this.serializeTag(currNode.parentNode) + followingHtmlStartSnippet;
            }
            currNode = currNode.parentNode;
        }

        let found = false;
        isSplit = false;
        for (let i = 0; i < fromChildTraceRel.length && !found; i++) {
            if (fromChildTraceRel[i].nodeName === 'OS-LINEBREAK') {
                found = true;
            } else {
                if (!this.isFirstNonemptyChild(fromChildTraceRel[i], fromChildTraceRel[i + 1])) {
                    isSplit = true;
                }
                if (fromChildTraceRel[i].nodeName === 'OL') {
                    const element = <Element>fromChildTraceRel[i];
                    fakeOl = element.cloneNode(false);
                    offset = element.getAttribute('start') ? parseInt(element.getAttribute('start'), 10) - 1 : 0;
                    fakeOl.setAttribute('start', (offset + this.isWithinNthLIOfOL(element, fromLineNode)).toString());
                    innerContextStart += this.serializeTag(fakeOl);
                } else {
                    if (i < fromChildTraceRel.length - 1 && isSplit) {
                        this.addCSSClass(fromChildTraceRel[i], 'os-split-before');
                    }
                    innerContextStart += this.serializeTag(fromChildTraceRel[i]);
                }
            }
        }
        found = false;
        for (let i = 0; i < toChildTraceRel.length && !found; i++) {
            if (toChildTraceRel[i].nodeName === 'OS-LINEBREAK') {
                found = true;
            } else {
                innerContextEnd = '</' + toChildTraceRel[i].nodeName + '>' + innerContextEnd;
            }
        }

        found = false;
        for (let i = 0; i < ancestor.childNodes.length; i++) {
            if (ancestor.childNodes[i] === fromChildTraceRel[0]) {
                found = true;
                fromChildTraceRel.shift();
                htmlOut += this.serializePartialDomFromChild(ancestor.childNodes[i], fromChildTraceRel, true);
            } else if (ancestor.childNodes[i] === toChildTraceRel[0]) {
                found = false;
                toChildTraceRel.shift();
                htmlOut += this.serializePartialDomToChild(ancestor.childNodes[i], toChildTraceRel, true);
            } else if (found === true) {
                htmlOut += this.serializeDom(ancestor.childNodes[i], true);
            }
        }

        currNode = ancestor;
        while (currNode.parentNode) {
            if (currNode.nodeName === 'OL') {
                const currElement = <Element>currNode;
                fakeOl = currElement.cloneNode(false);
                offset = currElement.getAttribute('start') ? parseInt(currElement.getAttribute('start'), 10) - 1 : 0;
                fakeOl.setAttribute('start', (this.isWithinNthLIOfOL(currElement, fromLineNode) + offset).toString());
                outerContextStart = this.serializeTag(fakeOl) + outerContextStart;
            } else {
                outerContextStart = this.serializeTag(currNode) + outerContextStart;
            }
            outerContextEnd += '</' + currNode.nodeName + '>';
            currNode = currNode.parentNode;
        }

        const ret = {
            html: htmlOut,
            ancestor: ancestor,
            outerContextStart: outerContextStart,
            outerContextEnd: outerContextEnd,
            innerContextStart: innerContextStart,
            innerContextEnd: innerContextEnd,
            previousHtml: previousHtml,
            previousHtmlEndSnippet: previousHtmlEndSnippet,
            followingHtml: followingHtml,
            followingHtmlStartSnippet: followingHtmlStartSnippet
        };

        this.diffCache.put(cacheKey, ret);
        return ret;
    }

    /**
     * Convenience method that takes the html-attribute from an extractRangeByLineNumbers()-method and
     * wraps it with the context.
     *
     * @param {ExtractedContent} diff
     */
    public formatDiff(diff: ExtractedContent): string {
        return (
            diff.outerContextStart + diff.innerContextStart + diff.html + diff.innerContextEnd + diff.outerContextEnd
        );
    }

    /**
     * Convenience method that takes the html-attribute from an extractRangeByLineNumbers()-method,
     * wraps it with the context and adds line numbers.
     *
     * @param {ExtractedContent} diff
     * @param {number} lineLength
     * @param {number} firstLine
     */
    public formatDiffWithLineNumbers(diff: ExtractedContent, lineLength: number, firstLine: number): string {
        let text = this.formatDiff(diff);
        text = this.lineNumberingService.insertLineNumbers(text, lineLength, null, null, firstLine);
        return text;
    }

    /**
     * This is a workardoun to prevent the last word of the inserted text from accidently being merged with the
     * first word of the following line.
     *
     * This happens as trailing spaces in the change recommendation's text are frequently stripped,
     * which is pretty nasty if the original text goes on after the affected line. So we insert a space
     * if the original line ends with one.
     *
     * @param {Element|DocumentFragment} element
     */
    private insertDanglingSpace(element: Element | DocumentFragment): void {
        if (element.childNodes.length > 0) {
            let lastChild = element.childNodes[element.childNodes.length - 1];
            if (
                lastChild.nodeType === TEXT_NODE &&
                !lastChild.nodeValue.match(/[\S]/) &&
                element.childNodes.length > 1
            ) {
                // If the text node only contains whitespaces, chances are high it's just space between block elmeents,
                // like a line break between </LI> and </UL>
                lastChild = element.childNodes[element.childNodes.length - 2];
            }
            if (lastChild.nodeType === TEXT_NODE) {
                if (lastChild.nodeValue === '' || lastChild.nodeValue.substr(-1) !== ' ') {
                    lastChild.nodeValue += ' ';
                }
            } else {
                this.insertDanglingSpace(<Element>lastChild);
            }
        }
    }

    /**
     * This functions merges to arrays of nodes. The last element of nodes1 and the first element of nodes2
     * are merged, if they are of the same type.
     *
     * This is done recursively until a TEMPLATE-Tag is is found, which was inserted in this.replaceLines.
     * Using a TEMPLATE-Tag is a rather dirty hack, as it is allowed inside of any other element, including <ul>.
     *
     * @param {Node[]} nodes1
     * @param {Node[]} nodes2
     * @returns {Node[]}
     */
    public replaceLinesMergeNodeArrays(nodes1: Node[], nodes2: Node[]): Node[] {
        if (nodes1.length === 0 || nodes2.length === 0) {
            return nodes1.length ? nodes1 : nodes2;
        }

        const out: Node[] = nodes1.slice(0, -1);
        const lastNode: Node = nodes1[nodes1.length - 1];
        const firstNode: Node = nodes2[0];
        if (lastNode.nodeType === TEXT_NODE && firstNode.nodeType === TEXT_NODE) {
            const newTextNode: Text = lastNode.ownerDocument.createTextNode(lastNode.nodeValue + firstNode.nodeValue);
            out.push(newTextNode);
        } else if (lastNode.nodeName === firstNode.nodeName) {
            const lastElement: Element = lastNode as Element;
            const newNode: HTMLElement = lastNode.ownerDocument.createElement(lastNode.nodeName);

            for (const attr of Array.from(lastElement.attributes)) {
                newNode.setAttribute(attr.name, attr.value);
            }

            // Remove #text nodes inside of List elements (OL/UL), as they are confusing
            let lastChildren: Node[];
            let firstChildren: Node[];
            if (lastElement.nodeName === 'OL' || lastElement.nodeName === 'UL') {
                lastChildren = Array.from(lastElement.childNodes).filter(child => child.nodeType === ELEMENT_NODE);
                firstChildren = Array.from(firstNode.childNodes).filter(child => child.nodeType === ELEMENT_NODE);
            } else {
                lastChildren = Array.from(lastElement.childNodes);
                firstChildren = Array.from(firstNode.childNodes);
            }

            const children = this.replaceLinesMergeNodeArrays(lastChildren, firstChildren) as Node[];
            for (const child of children) {
                newNode.appendChild(child);
            }

            out.push(newNode);
        } else {
            if (lastNode.nodeName !== 'TEMPLATE') {
                out.push(lastNode);
            }
            if (firstNode.nodeName !== 'TEMPLATE') {
                out.push(firstNode);
            }
        }

        return out.concat(nodes2.slice(1, nodes2.length));
    }

    /**
     * This returns the line number range in which changes (insertions, deletions) are encountered.
     * As in extractRangeByLineNumbers(), "to" refers to the line breaking element at the end, i.e. the start of the
     * following line.
     *
     * @param {string} diffHtml
     * @returns {LineRange}
     */
    public detectAffectedLineRange(diffHtml: string): LineRange {
        const cacheKey = this.lineNumberingService.djb2hash(diffHtml),
            cached = this.diffCache.get(cacheKey);
        if (cached) {
            return cached;
        }

        const fragment = this.htmlToFragment(diffHtml);

        this.insertInternalLineMarkers(fragment);

        const changes = fragment.querySelectorAll('ins, del, .insert, .delete'),
            firstChange = changes.item(0),
            lastChange = changes.item(changes.length - 1);

        if (!firstChange || !lastChange) {
            // There are no changes
            return null;
        }

        const firstTrace = this.getNodeContextTrace(firstChange);
        let lastLineNumberBefore = null;
        for (let j = firstTrace.length - 1; j >= 0 && lastLineNumberBefore === null; j--) {
            const prevSiblings = this.getAllPrevSiblingsReversed(firstTrace[j]);
            for (let i = 0; i < prevSiblings.length && lastLineNumberBefore === null; i++) {
                lastLineNumberBefore = this.getLastLineNumberNode(prevSiblings[i]);
            }
        }

        const lastTrace = this.getNodeContextTrace(lastChange);
        let firstLineNumberAfter = null;
        for (let j = lastTrace.length - 1; j >= 0 && firstLineNumberAfter === null; j--) {
            const nextSiblings = this.getAllNextSiblings(lastTrace[j]);
            for (let i = 0; i < nextSiblings.length && firstLineNumberAfter === null; i++) {
                firstLineNumberAfter = this.getFirstLineNumberNode(nextSiblings[i]);
            }
        }

        const range = {
            from: parseInt(lastLineNumberBefore.getAttribute('data-line-number'), 10),
            to: parseInt(firstLineNumberAfter.getAttribute('data-line-number'), 10)
        };

        this.diffCache.put(cacheKey, range);
        return range;
    }

    /**
     * Removes .delete-nodes and <del>-Tags (including content)
     * Removes the .insert-classes and the wrapping <ins>-Tags (while maintaining content)
     *
     * @param {string} html
     * @returns {string}
     */
    public diffHtmlToFinalText(html: string): string {
        const fragment = this.htmlToFragment(html);

        const delNodes = fragment.querySelectorAll('.delete, del');
        for (let i = 0; i < delNodes.length; i++) {
            delNodes[i].parentNode.removeChild(delNodes[i]);
        }

        const insNodes = fragment.querySelectorAll('ins');
        for (let i = 0; i < insNodes.length; i++) {
            const ins = insNodes[i];
            while (ins.childNodes.length > 0) {
                const child = ins.childNodes.item(0);
                ins.removeChild(child);
                ins.parentNode.insertBefore(child, ins);
            }
            ins.parentNode.removeChild(ins);
        }

        const insertNodes = fragment.querySelectorAll('.insert');
        for (let i = 0; i < insertNodes.length; i++) {
            this.removeCSSClass(insertNodes[i], 'insert');
        }

        return this.serializeDom(fragment, false);
    }

    /**
     * Given a line numbered string (`oldHtml`), this method removes the text between `fromLine` and `toLine`
     * and replaces it by the string given by `newHTML`.
     * While replacing it, it also merges HTML tags that have been split to create the `newHTML` fragment,
     * indicated by the CSS classes .os-split-before and .os-split-after.
     *
     * This is used for creating the consolidated version of motions.
     *
     * @param {string} oldHtml
     * @param {string} newHTML
     * @param {number} fromLine
     * @param {number} toLine
     */
    public replaceLines(oldHtml: string, newHTML: string, fromLine: number, toLine: number): string {
        const data = this.extractRangeByLineNumbers(oldHtml, fromLine, toLine),
            previousHtml = data.previousHtml + '<TEMPLATE></TEMPLATE>' + data.previousHtmlEndSnippet,
            previousFragment = this.htmlToFragment(previousHtml),
            followingHtml = data.followingHtmlStartSnippet + '<TEMPLATE></TEMPLATE>' + data.followingHtml,
            followingFragment = this.htmlToFragment(followingHtml),
            newFragment = this.htmlToFragment(newHTML);

        if (data.html.length > 0 && data.html.substr(-1) === ' ') {
            this.insertDanglingSpace(newFragment);
        }

        let merged = this.replaceLinesMergeNodeArrays(
            Array.prototype.slice.call(previousFragment.childNodes),
            Array.prototype.slice.call(newFragment.childNodes)
        );
        merged = this.replaceLinesMergeNodeArrays(merged, Array.prototype.slice.call(followingFragment.childNodes));

        const mergedFragment = document.createDocumentFragment();
        for (let i = 0; i < merged.length; i++) {
            mergedFragment.appendChild(merged[i]);
        }

        const forgottenTemplates = mergedFragment.querySelectorAll('TEMPLATE');
        for (let i = 0; i < forgottenTemplates.length; i++) {
            const el = forgottenTemplates[i];
            el.parentNode.removeChild(el);
        }

        const forgottenSplitClasses = mergedFragment.querySelectorAll('.os-split-before, .os-split-after');
        for (let i = 0; i < forgottenSplitClasses.length; i++) {
            this.removeCSSClass(forgottenSplitClasses[i], 'os-split-before');
            this.removeCSSClass(forgottenSplitClasses[i], 'os-split-after');
        }

        const replacedHtml = this.serializeDom(mergedFragment, true);
        return replacedHtml;
    }

    /**
     * If the inline diff does not work, we fall back to showing the diff on a paragraph base, i.e. deleting the old
     * paragraph (adding the "deleted"-class) and adding the new one (adding the "added" class).
     * If the provided Text is not wrapped in HTML elements but inline text, the returned text is using
     * <ins>/<del>-tags instead of adding CSS-classes to the wrapping element.
     *
     * @param {string} oldText
     * @param {string} newText
     * @param {number|null} lineLength
     * @param {number|null} firstLineNumber
     * @returns {string}
     */
    private diffParagraphs(oldText: string, newText: string, lineLength: number, firstLineNumber: number): string {
        let oldTextWithBreaks, newTextWithBreaks, currChild;

        if (lineLength !== null) {
            oldTextWithBreaks = this.lineNumberingService.insertLineNumbersNode(
                oldText,
                lineLength,
                null,
                firstLineNumber
            );
            newText = this.lineNumberingService.insertLineBreaksWithoutNumbers(newText, lineLength);
        } else {
            oldTextWithBreaks = document.createElement('div');
            oldTextWithBreaks.innerHTML = oldText;
        }
        newText = newText.replace(/^\s+/g, '').replace(/\s+$/g, '');
        newTextWithBreaks = document.createElement('div');
        newTextWithBreaks.innerHTML = newText;

        for (let i = 0; i < oldTextWithBreaks.childNodes.length; i++) {
            currChild = oldTextWithBreaks.childNodes[i];
            if (currChild.nodeType === TEXT_NODE) {
                const wrapDel = document.createElement('del');
                oldTextWithBreaks.insertBefore(wrapDel, currChild);
                oldTextWithBreaks.removeChild(currChild);
                wrapDel.appendChild(currChild);
            } else {
                this.addCSSClass(currChild, 'delete');
                this.removeColorStyles(currChild);
            }
        }
        for (let i = 0; i < newTextWithBreaks.childNodes.length; i++) {
            currChild = newTextWithBreaks.childNodes[i];
            if (currChild.nodeType === TEXT_NODE) {
                const wrapIns = document.createElement('ins');
                newTextWithBreaks.insertBefore(wrapIns, currChild);
                newTextWithBreaks.removeChild(currChild);
                wrapIns.appendChild(currChild);
            } else {
                this.addCSSClass(currChild, 'insert');
                this.removeColorStyles(currChild);
            }
        }

        const mergedFragment = document.createDocumentFragment();
        let el;
        while (oldTextWithBreaks.firstChild) {
            el = oldTextWithBreaks.firstChild;
            oldTextWithBreaks.removeChild(el);
            mergedFragment.appendChild(el);
        }
        while (newTextWithBreaks.firstChild) {
            el = newTextWithBreaks.firstChild;
            newTextWithBreaks.removeChild(el);
            mergedFragment.appendChild(el);
        }

        return this.serializeDom(mergedFragment, false);
    }

    /**
     * This function calculates the diff between two strings and tries to fix problems with the resulting HTML.
     * If lineLength and firstLineNumber is given, line numbers will be returned es well
     *
     * @param {string} htmlOld
     * @param {string} htmlNew
     * @param {number} lineLength - optional
     * @param {number} firstLineNumber - optional
     * @returns {string}
     */
    public diff(htmlOld: string, htmlNew: string, lineLength: number = null, firstLineNumber: number = null): string {
        const cacheKey =
                lineLength +
                ' ' +
                firstLineNumber +
                ' ' +
                this.lineNumberingService.djb2hash(htmlOld) +
                this.lineNumberingService.djb2hash(htmlNew),
            cached = this.diffCache.get(cacheKey);
        if (cached) {
            return cached;
        }

        // This fixes a really strange artefact with the diff that occures under the following conditions:
        // - The first tag of the two texts is identical, e.g. <p>
        // - A change happens in the next tag, e.g. inserted text
        // - The first tag occures a second time in the text, e.g. another <p>
        // In this condition, the first tag is deleted first and inserted afterwards again
        // Test case: "does not break when an insertion followes a beginning tag occuring twice"
        // The work around inserts to tags at the beginning and removes them afterwards again,
        // to make sure this situation does not happen (and uses invisible pseudo-tags in case something goes wrong)
        const workaroundPrepend = '<DUMMY><PREPEND>';

        // os-split-after should not be considered for detecting changes in paragraphs, so we strip it here
        // and add it afterwards.
        // We only do this for P for now, as for more complex types like UL/LI that tend to be nestend,
        // information would get lost by this that we will need to recursively merge it again later on.
        let oldIsSplitAfter = false,
            newIsSplitAfter = false;
        htmlOld = htmlOld.replace(
            /(\s*<p[^>]+class\s*=\s*["'][^"']*)os-split-after/gi,
            (match: string, beginning: string): string => {
                oldIsSplitAfter = true;
                return beginning;
            }
        );
        htmlNew = htmlNew.replace(
            /(\s*<p[^>]+class\s*=\s*["'][^"']*)os-split-after/gi,
            (match: string, beginning: string): string => {
                newIsSplitAfter = true;
                return beginning;
            }
        );

        // Performing the actual diff
        const str = this.diffString(workaroundPrepend + htmlOld, workaroundPrepend + htmlNew);
        let diffUnnormalized = str.replace(/^\s+/g, '').replace(/\s+$/g, '').replace(/ {2,}/g, ' ');

        diffUnnormalized = this.fixWrongChangeDetection(diffUnnormalized);

        // Remove <del> tags that only delete line numbers
        // We need to do this before removing </del><del> as done in one of the next statements
        diffUnnormalized = diffUnnormalized.replace(
            /<del>(((<BR CLASS="os-line-break">)<\/del><del>)?(<span[^>]+os-line-number[^>]+?>)(\s|<\/?del>)*<\/span>)<\/del>/gi,
            (found: string, tag: string, brWithDel: string, plainBr: string, span: string): string => {
                return (plainBr !== undefined ? plainBr : '') + span + ' </span>';
            }
        );

        // Merging individual insert/delete statements into bigger blocks
        diffUnnormalized = diffUnnormalized.replace(/<\/ins><ins>/gi, '').replace(/<\/del><del>/gi, '');

        // If we have a <del>deleted word</del>LINEBREAK<ins>new word</ins>, let's assume that the insertion
        // was actually done in the same line as the deletion.
        // We don't have the LINEBREAK-markers in the new string, hence we can't be a 100% sure, but
        // this will probably the more frequent case.
        // This only really makes a differences for change recommendations anyway, where we split the text into lines
        // Hint: if there is no deletion before the line break, we have the same issue, but cannot solve this here.
        diffUnnormalized = diffUnnormalized.replace(
            /(<\/del>)(<BR CLASS="os-line-break"><span[^>]+os-line-number[^>]+?>\s*<\/span>)(<ins>[\s\S]*?<\/ins>)/gi,
            (found: string, del: string, br: string, ins: string): string => {
                return del + ins + br;
            }
        );

        // If only a few characters of a word have changed, don't display this as a replacement of the whole word,
        // but only of these specific characters
        diffUnnormalized = diffUnnormalized.replace(
            /<del>([a-z0-9,_-]* ?)<\/del><ins>([a-z0-9,_-]* ?)<\/ins>/gi,
            (found: string, oldText: string, newText: string): string => {
                let foundDiff = false,
                    commonStart = '',
                    commonEnd = '',
                    remainderOld = oldText,
                    remainderNew = newText;

                while (remainderOld.length > 0 && remainderNew.length > 0 && !foundDiff) {
                    if (remainderOld[0] === remainderNew[0]) {
                        commonStart += remainderOld[0];
                        remainderOld = remainderOld.substr(1);
                        remainderNew = remainderNew.substr(1);
                    } else {
                        foundDiff = true;
                    }
                }

                foundDiff = false;
                while (remainderOld.length > 0 && remainderNew.length > 0 && !foundDiff) {
                    if (remainderOld[remainderOld.length - 1] === remainderNew[remainderNew.length - 1]) {
                        commonEnd = remainderOld[remainderOld.length - 1] + commonEnd;
                        remainderNew = remainderNew.substr(0, remainderNew.length - 1);
                        remainderOld = remainderOld.substr(0, remainderOld.length - 1);
                    } else {
                        foundDiff = true;
                    }
                }

                let out = commonStart;
                if (remainderOld !== '') {
                    out += '<del>' + remainderOld + '</del>';
                }
                if (remainderNew !== '') {
                    out += '<ins>' + remainderNew + '</ins>';
                }
                out += commonEnd;

                return out;
            }
        );

        // Replace spaces in line numbers by &nbsp;
        diffUnnormalized = diffUnnormalized.replace(
            /<span[^>]+os-line-number[^>]+?>\s*<\/span>/gi,
            (found: string): string => {
                return found.toLowerCase().replace(/> <\/span/gi, '>&nbsp;</span');
            }
        );

        // <P><ins>NEUE ZEILE</P>\n<P></ins> => <ins><P>NEUE ZEILE</P>\n</ins><P>
        diffUnnormalized = diffUnnormalized.replace(
            /<(p|div|blockquote|li)([^>]*)><(ins|del)>([\s\S]*?)<\/\1>(\s*)<(p|div|blockquote|li)([^>]*)><\/\3>/gi,
            (
                whole: string,
                block1: string,
                att1: string,
                insDel: string,
                content: string,
                space: string,
                block2: string,
                att2: string
            ): string => {
                return (
                    '<' +
                    insDel +
                    '><' +
                    block1 +
                    att1 +
                    '>' +
                    content +
                    '</' +
                    block1 +
                    '>' +
                    space +
                    '</' +
                    insDel +
                    '><' +
                    block2 +
                    att2 +
                    '>'
                );
            }
        );

        // If larger inserted HTML text contains block elements, we separate the inserted text into
        // inline <ins> elements and "insert"-class-based block elements.
        // <ins>...<div>...</div>...</ins> => <ins>...</ins><div class="insert">...</div><ins>...</ins>
        diffUnnormalized = diffUnnormalized.replace(
            /<(ins|del)>([\s\S]*?)<\/\1>/gi,
            (whole: string, insDel: string): string => {
                const modificationClass = insDel.toLowerCase() === 'ins' ? 'insert' : 'delete';
                return whole.replace(
                    /(<(p|div|blockquote|li)[^>]*>)([\s\S]*?)(<\/\2>)/gi,
                    (whole2: string, opening: string, blockTag: string, content: string, closing: string): string => {
                        const modifiedTag = this.addClassToHtmlTag(opening, modificationClass);
                        return '</' + insDel + '>' + modifiedTag + content + closing + '<' + insDel + '>';
                    }
                );
            }
        );

        // <del>deleted text</P></del><ins>inserted.</P></ins> => <del>deleted tet</del><ins>inserted.</ins></P>
        diffUnnormalized = diffUnnormalized.replace(
            /<del>([^<]*)<\/(p|div|blockquote|li)><\/del><ins>([^<]*)<\/\2>(\s*)<\/ins>/gi,
            (whole: string, deleted: string, tag: string, inserted: string, white: string): string => {
                return '<del>' + deleted + '</del><ins>' + inserted + '</ins></' + tag + '>' + white;
            }
        );

        // <ins>...</p><p>...</ins> => <ins>...</ins></p><p><ins>...</ins>
        diffUnnormalized = diffUnnormalized.replace(
            /<(ins|del)>([\s\S]*?)<\/(p|div|blockquote|li)>\s*<(p|div|blockquote|li)([^>]*)>([\s\S]*?)<\/\1>/gi,
            (
                whole: string,
                insDel: string,
                content1: string,
                blockEnd: string,
                blockStart: string,
                blockAttrs: string,
                content2: string
            ): string => {
                if (this.isValidInlineHtml(content1) && this.isValidInlineHtml(content2)) {
                    return (
                        '<' +
                        insDel +
                        '>' +
                        content1 +
                        '</' +
                        insDel +
                        '></' +
                        blockEnd +
                        '>' +
                        '<' +
                        blockStart +
                        blockAttrs +
                        '><' +
                        insDel +
                        '>' +
                        content2 +
                        '</' +
                        insDel +
                        '>'
                    );
                } else {
                    return whole;
                }
            }
        );

        // Cleanup leftovers from the operation above, when <ins></ins>-tags ore <ins> </ins>-tags are left
        // around block tags. It should be safe to remove them and just leave the whitespaces.
        diffUnnormalized = diffUnnormalized.replace(
            /<(ins|del)>(\s*)<\/\1>/gi,
            (whole: string, insDel: string, space: string): string => space
        );

        // <del></p><ins> Added text</p></ins> -> <ins> Added text</ins></p>
        diffUnnormalized = diffUnnormalized.replace(
            /<del><\/(p|div|blockquote|li)><\/del><ins>([\s\S]*?)<\/\1>(\s*)<\/ins>/gi,
            (whole: string, blockTag: string, content: string, space: string): string => {
                return '<ins>' + content + '</ins></' + blockTag + '>' + space;
            }
        );

        // </p> </ins> -> </ins></p>
        diffUnnormalized = diffUnnormalized.replace(
            /(<\/(p|div|blockquote|li)>)(\s*)<\/(ins|del)>/gi,
            (whole: string, ending: string, blockTag: string, space: string, insdel: string): string => {
                return '</' + insdel + '>' + ending + space;
            }
        );

        if (diffUnnormalized.substr(0, workaroundPrepend.length) === workaroundPrepend) {
            diffUnnormalized = diffUnnormalized.substring(workaroundPrepend.length);
        }

        let diff: string;
        if (this.diffDetectBrokenDiffHtml(diffUnnormalized)) {
            diff = this.diffParagraphs(htmlOld, htmlNew, lineLength, firstLineNumber);
        } else {
            let node: Element = document.createElement('div');
            node.innerHTML = diffUnnormalized;
            diff = node.innerHTML;

            if (lineLength !== null && firstLineNumber !== null) {
                node = this.lineNumberingService.insertLineNumbersNode(diff, lineLength, null, firstLineNumber);
                diff = node.innerHTML;
            }
        }

        if (oldIsSplitAfter || newIsSplitAfter) {
            diff = this.addClassToLastNode(diff, 'os-split-after');
        }

        this.diffCache.put(cacheKey, diff);
        return diff;
    }

    /**
     * Applies all given changes to the motion and returns the (line-numbered) text
     *
     * @param {string} motionHtml
     * @param {ViewUnifiedChange[]} changes
     * @param {number} lineLength
     * @param {number} highlightLine
     */
    public getTextWithChanges(
        motionHtml: string,
        changes: ViewUnifiedChange[],
        lineLength: number,
        highlightLine: number
    ): string {
        let html = motionHtml;

        // Changes need to be applied from the bottom up, to prevent conflicts with changing line numbers.
        changes.sort((change1: ViewUnifiedChange, change2: ViewUnifiedChange) => {
            if (change1.getLineFrom() < change2.getLineFrom()) {
                return 1;
            } else if (change1.getLineFrom() > change2.getLineFrom()) {
                return -1;
            } else {
                return 0;
            }
        });

        changes.forEach((change: ViewUnifiedChange) => {
            if (!change.isTitleChange()) {
                html = this.lineNumberingService.insertLineNumbers(html, lineLength, null, null, 1);
                html = this.replaceLines(html, change.getChangeNewText(), change.getLineFrom(), change.getLineTo());
            }
        });

        html = this.lineNumberingService.insertLineNumbers(html, lineLength, highlightLine, null, 1);

        return html;
    }

    /**
     * This is used to extract affected lines of a paragraph with the possibility to show the context (lines before
     * and after) the changed lines and displaying the line numbers.
     *
     * @param {number} paragraphNo The paragraph number
     * @param {string} origText The original text - needs to be line-numbered
     * @param {string} newText The changed text
     * @param {number} lineLength the line length
     * @return {DiffLinesInParagraph|null}
     */
    public getAmendmentParagraphsLines(
        paragraphNo: number,
        origText: string,
        newText: string,
        lineLength: number,
        changeRecos?: ViewUnifiedChange[]
    ): DiffLinesInParagraph {
        const paragraph_line_range: LineNumberRange = this.lineNumberingService.getLineNumberRange(origText);
        let diff = this.diff(origText, newText);
        const affected_lines = this.detectAffectedLineRange(diff);

        /**
         * If the affect line has change recos, overwirte the diff with the change reco
         */
        if (changeRecos && changeRecos.length) {
            const recoToThisLine = changeRecos.find(reco => {
                return reco.getLineFrom() === affected_lines.from;
            });
            if (recoToThisLine) {
                diff = this.diff(origText, recoToThisLine.getChangeNewText());
            }
        }

        if (affected_lines === null) {
            return null;
        }

        let textPre = '';
        let textPost = '';
        if (affected_lines.from > paragraph_line_range.from) {
            textPre = this.formatDiffWithLineNumbers(
                this.extractRangeByLineNumbers(diff, paragraph_line_range.from, affected_lines.from),
                lineLength,
                paragraph_line_range.from
            );
        }
        if (paragraph_line_range.to > affected_lines.to) {
            textPost = this.formatDiffWithLineNumbers(
                this.extractRangeByLineNumbers(diff, affected_lines.to, paragraph_line_range.to),
                lineLength,
                affected_lines.to
            );
        }
        const text = this.formatDiffWithLineNumbers(
            this.extractRangeByLineNumbers(diff, affected_lines.from, affected_lines.to),
            lineLength,
            affected_lines.from
        );

        return {
            paragraphNo: paragraphNo,
            paragraphLineFrom: paragraph_line_range.from,
            paragraphLineTo: paragraph_line_range.to,
            diffLineFrom: affected_lines.from,
            diffLineTo: affected_lines.to,
            textPre: textPre,
            text: text,
            textPost: textPost
        } as DiffLinesInParagraph;
    }

    /**
     * Returns the HTML with the changes, optionally with a highlighted line.
     * The original motion needs to be provided.
     *
     * @param {LineNumberedString} html
     * @param {ViewUnifiedChange} change
     * @param {number} lineLength
     * @param {number} highlight
     * @returns {string}
     */
    public getChangeDiff(
        html: LineNumberedString,
        change: ViewUnifiedChange,
        lineLength: number,
        highlight?: number
    ): string {
        let data, oldText;

        try {
            data = this.extractRangeByLineNumbers(html, change.getLineFrom(), change.getLineTo());
            oldText =
                data.outerContextStart +
                data.innerContextStart +
                data.html +
                data.innerContextEnd +
                data.outerContextEnd;
        } catch (e) {
            // This only happens (as far as we know) when the motion text has been altered (shortened)
            // without modifying the change recommendations accordingly.
            // That's a pretty serious inconsistency that should not happen at all,
            // we're just doing some basic damage control here.
            const msg =
                this.translate.instant('Inconsistent data.') +
                ' ' +
                this.translate.instant(
                    'A change recommendation or amendment is probably referring to a non-existant line number.'
                ) +
                ' ' +
                this.translate.instant(
                    'If it is an amendment, you can back up its content when editing it and delete it afterwards.'
                );
            return '<em style="color: red; font-weight: bold;">' + msg + '</em>';
        }

        oldText = this.lineNumberingService.insertLineNumbers(oldText, lineLength, null, null, change.getLineFrom());
        let diff = this.diff(oldText, change.getChangeNewText());

        // If an insertion makes the line longer than the line length limit, we need two line breaking runs:
        // - First, for the official line numbers, ignoring insertions (that's been done some lines before)
        // - Second, another one to prevent the displayed including insertions to exceed the page width
        diff = this.lineNumberingService.insertLineBreaksWithoutNumbers(diff, lineLength, true);

        if (highlight > 0) {
            diff = this.lineNumberingService.highlightLine(diff, highlight);
        }

        const origBeginning = data.outerContextStart + data.innerContextStart;
        if (diff.toLowerCase().indexOf(origBeginning.toLowerCase()) === 0) {
            // Add "merge-before"-css-class if the first line begins in the middle of a paragraph. Used for PDF.
            diff = this.addCSSClassToFirstTag(origBeginning, 'merge-before') + diff.substring(origBeginning.length);
        }

        return diff;
    }

    /**
     * Returns the remainder text of the motion after the last change
     *
     * @param {LineNumberedString} motionHtml
     * @param {ViewUnifiedChange[]} changes
     * @param {number} lineLength
     * @param {number} highlight
     * @returns {string}
     */
    public getTextRemainderAfterLastChange(
        motionHtml: LineNumberedString,
        changes: ViewUnifiedChange[],
        lineLength: number,
        highlight?: number
    ): string {
        let maxLine = 1;
        changes.forEach((change: ViewUnifiedChange) => {
            if (change.getLineTo() > maxLine) {
                maxLine = change.getLineTo();
            }
        }, 0);

        if (changes.length === 0) {
            return motionHtml;
        }

        let data;

        try {
            data = this.extractRangeByLineNumbers(motionHtml, maxLine, null);
        } catch (e) {
            // This only happens (as far as we know) when the motion text has been altered (shortened)
            // without modifying the change recommendations accordingly.
            // That's a pretty serious inconsistency that should not happen at all,
            // we're just doing some basic damage control here.
            const msg =
                this.translate.instant('Inconsistent data.') +
                ' ' +
                this.translate.instant(
                    'A change recommendation or amendment is probably referring to a non-existant line number.'
                );
            return '<em style="color: red; font-weight: bold;">' + msg + '</em>';
        }

        let html;
        if (data.html !== '') {
            // Add "merge-before"-css-class if the first line begins in the middle of a paragraph. Used for PDF.
            html =
                this.addCSSClassToFirstTag(data.outerContextStart + data.innerContextStart, 'merge-before') +
                data.html +
                data.innerContextEnd +
                data.outerContextEnd;
            html = this.lineNumberingService.insertLineNumbers(html, lineLength, highlight, null, maxLine);
        } else {
            // Prevents empty lines at the end of the motion
            html = '';
        }
        return html;
    }

    /**
     * Extracts a renderable HTML string representing the given line number range of this motion text
     *
     * @param {LineNumberedString} motionText
     * @param {LineRange} lineRange
     * @param {boolean} lineNumbers - weather to add line numbers to the returned HTML string
     * @param {number} lineLength
     * @param {number|null} highlightedLine
     */
    public extractMotionLineRange(
        motionText: LineNumberedString,
        lineRange: LineRange,
        lineNumbers: boolean,
        lineLength: number,
        highlightedLine: number
    ): string {
        const extracted = this.extractRangeByLineNumbers(motionText, lineRange.from, lineRange.to);
        let html =
            extracted.outerContextStart +
            extracted.innerContextStart +
            extracted.html +
            extracted.innerContextEnd +
            extracted.outerContextEnd;
        if (lineNumbers) {
            html = this.lineNumberingService.insertLineNumbers(html, lineLength, highlightedLine, null, lineRange.from);
        }
        return html;
    }
}
