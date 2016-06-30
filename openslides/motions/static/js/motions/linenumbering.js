(function () {

"use strict";

angular.module('OpenSlidesApp.motions.lineNumbering', [])

/**
 * Current limitations of this implementation:
 *
 * Only the following inline elements are supported:
 * - 'SPAN', 'A', 'EM', 'S', 'B', 'I', 'STRONG', 'U', 'BIG', 'SMALL', 'SUB', 'SUP', 'TT'
 *
 * Only other inline elements are allowed within inline elements.
 * No constructs like <a...><div></div></a> are allowed. CSS-attributes like 'display: block' are ignored.
 */

.service('lineNumberingService', function () {
    var ELEMENT_NODE = 1,
        TEXT_NODE = 3;

    this.lineLength = 80;
    this._currentInlineOffset = null;
    this._currentLineNumber = null;

    this.setLineLength = function (length) {
        this.lineLength = length;
    };

    this._isInlineElement = function (node) {
        var inlineElements = [
            'SPAN', 'A', 'EM', 'S', 'B', 'I', 'STRONG', 'U', 'BIG', 'SMALL', 'SUB', 'SUP', 'TT'
        ];
        return (inlineElements.indexOf(node.nodeName) > -1);
    };

    this._isOsLineBreakNode = function (node) {
        if (!node) {
            return false;
        }
        if (node.nodeType !== ELEMENT_NODE || node.nodeName != 'BR') {
            return false;
        }
        if (!node.hasAttribute('class')) {
            return false;
        }
        var classes = node.getAttribute('class').split(' ');
        return (classes.indexOf('os-line-break') > -1);
    };
    this._isOsLineNumberNode = function (node) {
        if (!node) {
            return false;
        }
        if (node.nodeType !== ELEMENT_NODE || node.nodeName != 'SPAN') {
            return false;
        }
        if (!node.hasAttribute('class')) {
            return false;
        }
        var classes = node.getAttribute('class').split(' ');
        return (classes.indexOf('os-line-number') > -1);
    };

    /**
     * Splits a TEXT_NODE into an array of TEXT_NODEs and BR-Elements separating them into lines.
     * Each line has a maximum length of 'length', with one exception: spaces are accepted to exceed the length.
     * Otherwise the string is split by the last space or dash in the line.
     *
     * @param node
     * @param length
     * @returns Array
     * @private
     */
    this._textNodeToLines = function (node, length) {
        var out = [],
            currLineStart = 0,
            i = 0,
            firstTextNode = true,
            lastBreakableIndex = null,
            service = this;

        var createLineBreak = function() {
            var br = document.createElement('br');
                br.setAttribute('class', 'os-line-break');
                return br;
            };
        var createLineNumber = function() {
            var node = document.createElement('span');
            var lineNumber = service._currentLineNumber;
            service._currentLineNumber++;
            node.setAttribute('class', 'os-line-number line-number-' + lineNumber);
            node.setAttribute('data-line-number', lineNumber + '');
            return node;
        };
        var addLine = function (text) {
            var newNode = document.createTextNode(text);
            if (firstTextNode) {
                firstTextNode = false;
            } else {
                out.push(createLineBreak());
                out.push(createLineNumber());
            }
            out.push(newNode)
        };

        // This happens if a previous inline element exactly stretches to the end of the line
        if (this._currentInlineOffset >= length) {
            out.push(createLineBreak());
            out.push(createLineNumber());
            this._currentInlineOffset = 0;
        }

        while (i < node.nodeValue.length) {
            var lineBreakAt = null;
            if (this._currentInlineOffset >= length) {
                if (lastBreakableIndex !== null) {
                    lineBreakAt = lastBreakableIndex;
                } else {
                    lineBreakAt = i - 1;
                }
            }
            if (lineBreakAt !== null && node.nodeValue[i] != ' ') {
                var currLine = node.nodeValue.substring(currLineStart, lineBreakAt + 1);
                addLine(currLine);

                currLineStart = lineBreakAt + 1;
                this._currentInlineOffset = i - lineBreakAt - 1;
                lastBreakableIndex = null;
            }

            if (node.nodeValue[i] == ' ' || node.nodeValue[i] == '-') {
                lastBreakableIndex = i;
            }

            this._currentInlineOffset++;
            i++;

        }
        addLine(node.nodeValue.substring(currLineStart));

        return out;
    };


    this._moveLeadingLineBreaksToOuterNode = function (innerNode, outerNode) {
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
    };


    this._insertLineNumbersToInlineNode = function (node, length) {
        var oldChildren = [], i;
        for (i = 0; i < node.childNodes.length; i++) {
            oldChildren.push(node.childNodes[i]);
        }

        while (node.firstChild) {
            node.removeChild(node.firstChild);
        }

        for (i = 0; i < oldChildren.length; i++) {
            if (oldChildren[i].nodeType == TEXT_NODE) {
                var ret = this._textNodeToLines(oldChildren[i], length);
                for (var j = 0; j < ret.length; j++) {
                    node.appendChild(ret[j]);
                }
            } else if (oldChildren[i].nodeType == ELEMENT_NODE) {
                var changedNode = this._insertLineNumbersToNode(oldChildren[i], length);
                this._moveLeadingLineBreaksToOuterNode(changedNode, node);
                node.appendChild(changedNode);
            } else {
                throw 'Unknown nodeType: ' + i + ': ' + oldChildren[i];
            }
        }

        return node;
    };

    this._calcBlockNodeIndendation = function (node) {
        return 0; // @TODO
    };

    this._insertLineNumbersToBlockNode = function (node, length) {
        this._currentInlineOffset = 0;

        var oldChildren = [], i;
        for (i = 0; i < node.childNodes.length; i++) {
            oldChildren.push(node.childNodes[i]);
        }

        while (node.firstChild) {
            node.removeChild(node.firstChild);
        }

        for (i = 0; i < oldChildren.length; i++) {
            if (oldChildren[i].nodeType == TEXT_NODE) {
                var ret = this._textNodeToLines(oldChildren[i], length);
                for (var j = 0; j < ret.length; j++) {
                    node.appendChild(ret[j]);
                }
            } else if (oldChildren[i].nodeType == ELEMENT_NODE) {
                var changedNode = this._insertLineNumbersToNode(oldChildren[i], length);
                this._moveLeadingLineBreaksToOuterNode(changedNode, node);
                node.appendChild(changedNode);
            } else {
                throw 'Unknown nodeType: ' + i + ': ' + oldChildren[i];
            }
        }

        this._currentInlineOffset = 0;

        return node;
    };

    this._insertLineNumbersToNode = function (node, length) {
        if (node.nodeType !== ELEMENT_NODE) {
            throw 'This method may only be called for ELEMENT-nodes: ' + node.nodeValue;
        }
        if (this._isInlineElement(node)) {
            return this._insertLineNumbersToInlineNode(node, length);
        } else {
            var newLength = length - this._calcBlockNodeIndendation(node);
            return this._insertLineNumbersToBlockNode(node, newLength);
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

    this.insertLineNumbers = function (html) {
        var root = document.createElement('div');
        root.innerHTML = html;

        this._currentInlineOffset = 0;
        this._currentLineNumber = 1;
        var newRoot = this._insertLineNumbersToNode(root, this.lineLength);

        return newRoot.innerHTML;
    }
});


}());
