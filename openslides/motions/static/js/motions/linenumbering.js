(function () {

"use strict";

angular.module('OpenSlidesApp.motions.lineNumbering', [])

/**
 * Current limitations of this implementation:
 *
 * Only the following inline elements are supported:
 * - 'SPAN', 'A', 'EM', 'S', 'B', 'I', 'STRONG', 'U', 'BIG', 'SMALL', 'SUB', 'SUP', 'TT'
 * - 'INS' and 'DEL' are supported, but line numbering does not affect the content of 'INS'-elements
 *
 * Only other inline elements are allowed within inline elements.
 * No constructs like <a...><div></div></a> are allowed. CSS-attributes like 'display: block' are ignored.
 */

.service('lineNumberingService', [
    '$cacheFactory',
    function ($cacheFactory) {
        var ELEMENT_NODE = 1,
            TEXT_NODE = 3;

        // Counts the number of characters in the current line, beyond singe nodes.
        // Needs to be resetted after each line break and after entering a new block node.
        this._currentInlineOffset = null;

        // The last position of a point suitable for breaking the line. null or an object with the following values:
        // - node: the node that contains the position. Guaranteed to be a TextNode
        // - offset: the offset of the breaking characters (like the space)
        // Needs to be resetted after each line break and after entering a new block node.
        this._lastInlineBreakablePoint = null;

        // The line number counter
        this._currentLineNumber = null;

        // Indicates that we just entered a block element and we want to add a line number without line break at the beginning.
        this._prependLineNumberToFirstText = false;

        // A workaround to prevent double line numbers
        this._ignoreNextRegularLineNumber = false;

        // Decides if the content of inserted nodes should count as well. This is used so we can use the algorithm on a
        // text with inline diff annotations and get the same line numbering as with the original text (when set to false)
        this._ignoreInsertedText = false;

        var lineNumberCache = $cacheFactory('linenumbering.service');

        this.djb2hash = function(str) {
            var hash = 5381, char;
            for (var i = 0; i < str.length; i++) {
                char = str.charCodeAt(i);
                hash = ((hash << 5) + hash) + char;
            }
            return hash.toString();
        };

        this._isInlineElement = function (node) {
            var inlineElements = [
                'SPAN', 'A', 'EM', 'S', 'B', 'I', 'STRONG', 'U', 'BIG', 'SMALL', 'SUB', 'SUP', 'TT', 'INS', 'DEL',
                'STRIKE'
            ];
            return (inlineElements.indexOf(node.nodeName) > -1);
        };

        this._isIgnoredByLineNumbering = function (node) {
            if (node.nodeName === 'INS') {
                return this._ignoreInsertedText;
            } else if (this._isOsLineNumberNode(node)) {
                return true;
            } else {
                return false;
            }
        };

        this._isOsLineBreakNode = function (node) {
            var isLineBreak = false;
            if (node && node.nodeType === ELEMENT_NODE && node.nodeName == 'BR' && node.hasAttribute('class')) {
                var classes = node.getAttribute('class').split(' ');
                if (classes.indexOf('os-line-break') > -1) {
                    isLineBreak = true;
                }
            }
            return isLineBreak;
        };

        this._isOsLineNumberNode = function (node) {
            var isLineNumber = false;
            if (node && node.nodeType === ELEMENT_NODE && node.nodeName == 'SPAN' && node.hasAttribute('class')) {
                var classes = node.getAttribute('class').split(' ');
                if (classes.indexOf('os-line-number') > -1) {
                    isLineNumber = true;
                }
            }
            return isLineNumber;
        };

        this._getLineNumberNode = function(fragment, lineNumber) {
            return fragment.querySelector('.os-line-number.line-number-' + lineNumber);
        };

        this._htmlToFragment = function(html) {
            var fragment = document.createDocumentFragment(),
                div = document.createElement('DIV');
            div.innerHTML = html;
            while (div.childElementCount) {
                var child = div.childNodes[0];
                div.removeChild(child);
                fragment.appendChild(child);
            }
            return fragment;
        };

        this._fragmentToHtml = function(fragment) {
            var div = document.createElement('DIV');
            while (fragment.firstChild) {
                var child = fragment.firstChild;
                fragment.removeChild(child);
                div.appendChild(child);
            }
            return div.innerHTML;
        };

        this._createLineBreak = function () {
            var br = document.createElement('br');
            br.setAttribute('class', 'os-line-break');
            return br;
        };

        this._createLineNumber = function () {
            if (this._ignoreNextRegularLineNumber) {
                this._ignoreNextRegularLineNumber = false;
                return;
            }
            var node = document.createElement('span');
            var lineNumber = this._currentLineNumber;
            this._currentLineNumber++;
            node.setAttribute('class', 'os-line-number line-number-' + lineNumber);
            node.setAttribute('data-line-number', lineNumber + '');
            node.setAttribute('contenteditable', 'false');
            node.innerHTML = '&nbsp;'; // Prevent ckeditor from stripping out empty span's
            return node;
        };

        /**
         * Splits a TEXT_NODE into an array of TEXT_NODEs and BR-Elements separating them into lines.
         * Each line has a maximum length of 'length', with one exception: spaces are accepted to exceed the length.
         * Otherwise the string is split by the last space or dash in the line.
         *
         * @param node
         * @param length
         * @param highlight
         * @returns Array
         * @private
         */
        this._textNodeToLines = function (node, length, highlight) {
            var out = [],
                currLineStart = 0,
                i = 0,
                firstTextNode = true,
                service = this;
            var addLine = function (text, highlight) {
                var node;
                if (typeof highlight === 'undefined') {
                    highlight = -1;
                }
                if (firstTextNode) {
                    if (highlight === service._currentLineNumber - 1) {
                        node = document.createElement('span');
                        node.setAttribute('class', 'highlight');
                        node.innerHTML = text;
                    } else {
                        node = document.createTextNode(text);
                    }
                    firstTextNode = false;
                } else {
                    if (service._currentLineNumber === highlight && highlight !== null) {
                        node = document.createElement('span');
                        node.setAttribute('class', 'highlight');
                        node.innerHTML = text;
                    } else {
                        node = document.createTextNode(text);
                    }
                    out.push(service._createLineBreak());
                    if (service._currentLineNumber !== null) {
                        out.push(service._createLineNumber());
                    }
                }
                out.push(node);
                return node;
            };
            var addLinebreakToPreviousNode = function (node, offset, highlight) {
                var firstText = node.nodeValue.substr(0, offset + 1),
                    secondText = node.nodeValue.substr(offset + 1);
                var lineBreak = service._createLineBreak();
                var firstNode = document.createTextNode(firstText);
                node.parentNode.insertBefore(firstNode, node);
                node.parentNode.insertBefore(lineBreak, node);
                node.nodeValue = secondText;
            };

            if (node.nodeValue === "\n") {
                out.push(node);
            } else {

                // This happens if a previous inline element exactly stretches to the end of the line
                if (this._currentInlineOffset >= length) {
                    out.push(service._createLineBreak());
                    if (this._currentLineNumber !== null) {
                        out.push(service._createLineNumber());
                    }
                    this._currentInlineOffset = 0;
                    this._lastInlineBreakablePoint = null;
                } else if (this._prependLineNumberToFirstText) {
                    if (this._ignoreNextRegularLineNumber) {
                        this._ignoreNextRegularLineNumber = false;
                    } else if (service._currentLineNumber !== null) {
                        out.push(service._createLineNumber());
                    }
                }
                this._prependLineNumberToFirstText = false;

                while (i < node.nodeValue.length) {
                    var lineBreakAt = null;
                    if (this._currentInlineOffset >= length) {
                        if (this._lastInlineBreakablePoint !== null) {
                            lineBreakAt = this._lastInlineBreakablePoint;
                        } else {
                            lineBreakAt = {
                                'node': node,
                                'offset': i - 1
                            };
                        }
                    }
                    if (lineBreakAt !== null && (node.nodeValue[i] !== ' ' && node.nodeValue[i] !== "\n")) {
                        if (lineBreakAt.node === node) {
                            // The last possible breaking point is in this text node
                            var currLine = node.nodeValue.substring(currLineStart, lineBreakAt.offset + 1);
                            addLine(currLine, highlight);

                            currLineStart = lineBreakAt.offset + 1;
                            this._currentInlineOffset = i - lineBreakAt.offset - 1;
                            this._lastInlineBreakablePoint = null;
                        } else {
                            // The last possible breaking point was not in this text not, but one we have already passed
                            var remainderOfPrev = lineBreakAt.node.nodeValue.length - lineBreakAt.offset - 1;
                            addLinebreakToPreviousNode(lineBreakAt.node, lineBreakAt.offset, highlight);

                            this._currentInlineOffset = i + remainderOfPrev;
                            this._lastInlineBreakablePoint = null;
                        }

                    }

                    if (node.nodeValue[i] === ' ' || node.nodeValue[i] === '-' || node.nodeValue[i] === "\n") {
                        this._lastInlineBreakablePoint = {
                            'node': node,
                            'offset': i
                        };
                    }

                    this._currentInlineOffset++;
                    i++;

                }
                var lastLine = addLine(node.nodeValue.substring(currLineStart), highlight);
                if (this._lastInlineBreakablePoint !== null) {
                    this._lastInlineBreakablePoint.node = lastLine;
                }
            }
            return out;
        };


        /**
         * Moves line breaking and line numbering markup before inline elements
         *
         * @param innerNode
         * @param outerNode
         * @private
         */
        this._moveLeadingLineBreaksToOuterNode = function (innerNode, outerNode) {
            if (this._isInlineElement(innerNode)) {
                if (this._isOsLineBreakNode(innerNode.firstChild)) {
                    var br = innerNode.firstChild;
                    innerNode.removeChild(br);
                    outerNode.appendChild(br);
                }
                if (this._isOsLineNumberNode(innerNode.firstChild)) {
                    var span = innerNode.firstChild;
                    innerNode.removeChild(span);
                    outerNode.appendChild(span);
                }
            }
        };

        this._lengthOfFirstInlineWord = function (node) {
            if (!node.firstChild) {
                return 0;
            }
            if (node.firstChild.nodeType == TEXT_NODE) {
                var parts = node.firstChild.nodeValue.split(' ');
                return parts[0].length;
            } else {
                return this._lengthOfFirstInlineWord(node.firstChild);
            }
        };

        this._insertLineNumbersToInlineNode = function (node, length, highlight) {
            var oldChildren = [], i;
            for (i = 0; i < node.childNodes.length; i++) {
                oldChildren.push(node.childNodes[i]);
            }

            while (node.firstChild) {
                node.removeChild(node.firstChild);
            }

            for (i = 0; i < oldChildren.length; i++) {
                if (oldChildren[i].nodeType == TEXT_NODE) {
                    var ret = this._textNodeToLines(oldChildren[i], length, highlight);
                    for (var j = 0; j < ret.length; j++) {
                        node.appendChild(ret[j]);
                    }
                } else if (oldChildren[i].nodeType == ELEMENT_NODE) {
                    var firstword = this._lengthOfFirstInlineWord(oldChildren[i]),
                        overlength = ((this._currentInlineOffset + firstword) > length && this._currentInlineOffset > 0);
                    if (overlength && this._isInlineElement(oldChildren[i])) {
                        this._currentInlineOffset = 0;
                        this._lastInlineBreakablePoint = null;
                        node.appendChild(this._createLineBreak());
                        if (this._currentLineNumber !== null) {
                            node.appendChild(this._createLineNumber());
                        }
                    }
                    var changedNode = this._insertLineNumbersToNode(oldChildren[i], length, highlight);
                    this._moveLeadingLineBreaksToOuterNode(changedNode, node);
                    node.appendChild(changedNode);
                } else {
                    throw 'Unknown nodeType: ' + i + ': ' + oldChildren[i];
                }
            }

            return node;
        };

        this._calcBlockNodeLength = function (node, oldLength) {
            var newLength = oldLength;
            switch (node.nodeName) {
                case 'LI':
                    newLength -= 5;
                    break;
                case 'BLOCKQUOTE':
                    newLength -= 20;
                    break;
                case 'DIV':
                case 'P':
                    var styles = node.getAttribute("style"),
                        padding = 0;
                    if (styles) {
                        var leftpad = styles.split("padding-left:");
                        if (leftpad.length > 1) {
                            leftpad = parseInt(leftpad[1]);
                            padding += leftpad;
                        }
                        var rightpad = styles.split("padding-right:");
                        if (rightpad.length > 1) {
                            rightpad = parseInt(rightpad[1]);
                            padding += rightpad;
                        }
                        newLength -= (padding / 5);
                    }
                    break;
                case 'H1':
                    newLength *= 0.66;
                    break;
                case 'H2':
                    newLength *= 0.75;
                    break;
                case 'H3':
                    newLength *= 0.85;
                    break;
            }
            return Math.ceil(newLength);
        };

        this._insertLineNumbersToBlockNode = function (node, length, highlight) {
            this._currentInlineOffset = 0;
            this._lastInlineBreakablePoint = null;
            this._prependLineNumberToFirstText = true;

            var oldChildren = [], i;
            for (i = 0; i < node.childNodes.length; i++) {
                oldChildren.push(node.childNodes[i]);
            }

            while (node.firstChild) {
                node.removeChild(node.firstChild);
            }

            for (i = 0; i < oldChildren.length; i++) {
                if (oldChildren[i].nodeType == TEXT_NODE) {
                    if (!oldChildren[i].nodeValue.match(/\S/)) {
                        // White space nodes between block elements should be ignored
                        var prevIsBlock = (i > 0 && !this._isInlineElement(oldChildren[i - 1]));
                        var nextIsBlock = (i < oldChildren.length - 1 && !this._isInlineElement(oldChildren[i + 1]));
                        if ((prevIsBlock && nextIsBlock) || (i === 0 && nextIsBlock) || (i === oldChildren.length - 1 && prevIsBlock)) {
                            node.appendChild(oldChildren[i]);
                            continue;
                        }
                    }
                    var ret = this._textNodeToLines(oldChildren[i], length, highlight);
                    for (var j = 0; j < ret.length; j++) {
                        node.appendChild(ret[j]);
                    }
                } else if (oldChildren[i].nodeType == ELEMENT_NODE) {
                    var firstword = this._lengthOfFirstInlineWord(oldChildren[i]),
                        overlength = ((this._currentInlineOffset + firstword) > length && this._currentInlineOffset > 0);
                    if (overlength && this._isInlineElement(oldChildren[i]) && !this._isIgnoredByLineNumbering(oldChildren[i])) {
                        this._currentInlineOffset = 0;
                        this._lastInlineBreakablePoint = null;
                        node.appendChild(this._createLineBreak());
                        if (this._currentLineNumber !== null) {
                            node.appendChild(this._createLineNumber());
                        }
                    }
                    var changedNode = this._insertLineNumbersToNode(oldChildren[i], length, highlight);
                    this._moveLeadingLineBreaksToOuterNode(changedNode, node);
                    node.appendChild(changedNode);
                } else {
                    throw 'Unknown nodeType: ' + i + ': ' + oldChildren[i];
                }
            }

            this._currentInlineOffset = 0;
            this._lastInlineBreakablePoint = null;
            this._prependLineNumberToFirstText = true;
            this._ignoreNextRegularLineNumber = false;

            return node;
        };

        this._insertLineNumbersToNode = function (node, length, highlight) {
            if (node.nodeType !== ELEMENT_NODE) {
                throw 'This method may only be called for ELEMENT-nodes: ' + node.nodeValue;
            }
            if (this._isIgnoredByLineNumbering(node)) {
                if (this._currentInlineOffset === 0 && this._currentLineNumber !== null) {
                    var lineNumberNode = this._createLineNumber();
                    if (lineNumberNode) {
                        node.insertBefore(lineNumberNode, node.firstChild);
                        this._ignoreNextRegularLineNumber = true;
                    }
                }
                return node;
            } else if (this._isInlineElement(node)) {
                return this._insertLineNumbersToInlineNode(node, length, highlight);
            } else {
                var newLength = this._calcBlockNodeLength(node, length);
                return this._insertLineNumbersToBlockNode(node, newLength, highlight);
            }
        };

        this._stripLineNumbers = function (node) {
            for (var i = 0; i < node.childNodes.length; i++) {
                if (this._isOsLineBreakNode(node.childNodes[i]) || this._isOsLineNumberNode(node.childNodes[i])) {
                    // If a newline character follows a line break, it's been very likely inserted by the WYSIWYG-editor
                    if (node.childNodes.length > (i + 1) && node.childNodes[i + 1].nodeType === TEXT_NODE) {
                        if (node.childNodes[i + 1].nodeValue[0] === "\n") {
                            node.childNodes[i + 1].nodeValue = " " + node.childNodes[i + 1].nodeValue.substring(1);
                        }
                    }
                    node.removeChild(node.childNodes[i]);
                    i--;
                } else {
                    this._stripLineNumbers(node.childNodes[i]);
                }
            }
        };

        this._nodesToHtml = function (nodes) {
            var root = document.createElement('div');
            for (var i in nodes) {
                if (nodes.hasOwnProperty(i)) {
                    root.appendChild(nodes[i]);
                }
            }
            return root.innerHTML;
        };

        /**
         *
         * @param {string} html
         * @param {number} lineLength
         * @param {number|null} highlight - optional
         * @param {number|null} firstLine
         */
        this.insertLineNumbersNode = function (html, lineLength, highlight, firstLine) {
            // Removing newlines after BRs, as they lead to problems like #3410
            if (html) {
                html = html.replace(/(<br[^>]*>)[\n\r]+/gi, '$1');
            }

            var root = document.createElement('div');
            root.innerHTML = html;

            this._currentInlineOffset = 0;
            this._lastInlineBreakablePoint = null;
            if (firstLine) {
                this._currentLineNumber = parseInt(firstLine);
            } else {
                this._currentLineNumber = 1;
            }
            if (highlight !== null) {
                highlight = parseInt(highlight);
            }
            this._prependLineNumberToFirstText = true;
            this._ignoreNextRegularLineNumber = false;
            this._ignoreInsertedText = true;

            return this._insertLineNumbersToNode(root, lineLength, highlight);
        };

        /**
         *
         * @param {string} html
         * @param {number} lineLength
         * @param {number|null} highlight - optional
         * @param {function} callback
         * @param {number} firstLine
         * @returns {string}
         */
        this.insertLineNumbers = function (html, lineLength, highlight, callback, firstLine) {
            var newHtml, newRoot;

            if (highlight > 0) {
                // Caching versions with highlighted line numbers is probably not worth it
                newRoot = this.insertLineNumbersNode(html, lineLength, highlight, firstLine);
                newHtml = newRoot.innerHTML;
            } else {
                var firstLineStr = (firstLine === undefined || firstLine === null ? '' : firstLine.toString());
                var cacheKey = this.djb2hash(firstLineStr + "-" + lineLength.toString() + html);
                newHtml = lineNumberCache.get(cacheKey);

                if (angular.isUndefined(newHtml)) {
                    newRoot = this.insertLineNumbersNode(html, lineLength, null, firstLine);
                    newHtml = newRoot.innerHTML;
                    lineNumberCache.put(cacheKey, newHtml);
                }
            }

            if (callback) {
                callback();
            }

            return newHtml;
        };

        /**
         * @param {string} html
         * @param {number} lineLength
         * @param {boolean} countInserted
         */
        this.insertLineBreaksWithoutNumbers = function (html, lineLength, countInserted) {
            var root = document.createElement('div');
            root.innerHTML = html;

            this._currentInlineOffset = 0;
            this._lastInlineBreakablePoint = null;
            this._currentLineNumber = null;
            this._prependLineNumberToFirstText = true;
            this._ignoreNextRegularLineNumber = false;
            this._ignoreInsertedText = !countInserted;

            var newRoot = this._insertLineNumbersToNode(root, lineLength, null);

            return newRoot.innerHTML;
        };

        /**
         * @param {string} html
         * @returns {string}
         */
        this.stripLineNumbers = function (html) {
            var root = document.createElement('div');
            root.innerHTML = html;
            this._stripLineNumbers(root);
            return root.innerHTML;
        };

        /**
         * Traverses up the DOM tree until it finds a node with a nextSibling, then returns that sibling
         *
         * @param node
         * @private
         */
        this._findNextAuntNode = function(node) {
            if (node.nextSibling) {
                return node.nextSibling;
            } else if (node.parentNode) {
                return this._findNextAuntNode(node.parentNode);
            } else {
                return null;
            }
        };

        this._highlightUntilNextLine = function(lineNumberNode) {
            var currentNode = lineNumberNode,
                foundNextLineNumber = false;

            do {
                var wasHighlighted = false;
                if (currentNode.nodeType === TEXT_NODE) {
                    var node = document.createElement('span');
                    node.setAttribute('class', 'highlight');
                    node.innerHTML = currentNode.nodeValue;
                    currentNode.parentNode.insertBefore(node, currentNode);
                    currentNode.parentNode.removeChild(currentNode);
                    currentNode = node;
                    wasHighlighted = true;
                } else {
                    wasHighlighted = false;
                }

                if (currentNode.childNodes.length > 0 && !this._isOsLineNumberNode(currentNode) && !wasHighlighted) {
                    currentNode = currentNode.childNodes[0];
                } else if (currentNode.nextSibling) {
                    currentNode = currentNode.nextSibling;
                } else {
                    currentNode = this._findNextAuntNode(currentNode);
                }

                if (this._isOsLineNumberNode(currentNode)) {
                    foundNextLineNumber = true;
                }
            } while (!foundNextLineNumber && currentNode !== null);
        };

        /**
         * @param {string} html
         * @param {number} lineNumber
         * @return {string}
         */
        this.highlightLine = function (html, lineNumber) {
            lineNumber = parseInt(lineNumber);
            var fragment = this._htmlToFragment(html),
                lineNumberNode = this._getLineNumberNode(fragment, lineNumber);

            if (lineNumberNode) {
                this._highlightUntilNextLine(lineNumberNode);
                html = this._fragmentToHtml(fragment);
            }

            return html;
        };
    }
]);


}());
