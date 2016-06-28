(function () {

"use strict";

angular.module('OpenSlidesApp.motions', [])

.service('lineNumberingService', function lineNumberingService() {
    var ELEMENT_NODE = 1,
        TEXT_NODE = 3;

    this.lineLength = 80;
    this._currentInlineOffset = null;

    this.setLineLength = function(length) {
        this.lineLength = length;
    };

    this._isInlineElement = function(node) {
        var inlineElements = [
            'SPAN', 'A', 'EM', 'S', 'B', 'I', 'STRONG', 'U', 'BIG', 'SMALL', 'SUB', 'SUP', 'TT'
        ];
        return (inlineElements.indexOf(node.nodeName) > -1);
    };

    /**
     * Splits a TEXT_NODE into an array of TEXT_NODEs and BR-Elements separating them into lines.
     * Each line has a maximum length of "length", with one exception: spaces are accepted to exceed the length.
     * Otherwise the string is split by the last space or dash in the line.
     *
     * @param node
     * @param length
     * @returns Array
     * @private
     */
    this._textNodeToLines = function(node, length) {
        var out = [],
            currLineStart = 0,
            i = 0,
            firstTextNode = true,
            lastBreakableIndex = null;

        var addLine = function(text) {
                var newNode = document.createTextNode(text);
                if (firstTextNode) {
                    firstTextNode = false;
                } else {
                    var br = document.createElement('br');
                    br.setAttribute("class", "os-line-break");
                    out.push(br);
                }
                out.push(newNode)
            };

        // This happens if a previous inline element exactly stretches to the end of the line
        if (this._currentInlineOffset >= length) {
            var br = document.createElement('br');
            br.setAttribute("class", "os-line-break");
            out.push(br);
            this._currentInlineOffset = 0;
        }

        while (i < node.nodeValue.length) {
            var lineBreakAt = null;
            if (this._currentInlineOffset >= length) {
                if (lastBreakableIndex) {
                    lineBreakAt = lastBreakableIndex;
                } else {
                    lineBreakAt = i - 1;
                }
            }
            if (lineBreakAt && node.nodeValue[i] != ' ') {
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


    this._insertLineNumbersToInlineNode = function(node, length) {
        var oldChildren = [];
        for (var i = 0; i < node.childNodes.length; i++) {
            oldChildren.push(node.childNodes[i]);
        }

        while (node.firstChild) {
            node.removeChild(node.firstChild);
        }

        for (var i = 0; i < oldChildren.length; i++) {
            if (oldChildren[i].nodeType == TEXT_NODE) {
                var ret = this._textNodeToLines(oldChildren[i], length);
                for (var j in ret) {
                    node.appendChild(ret[j]);
                }
            } else if (oldChildren[i].nodeType == ELEMENT_NODE) {
                node.appendChild(
                    this._insertLineNumbersToNode(oldChildren[i], length)
                );
            } else {
                throw "Unknown nodeType: " + i + ": " + oldChildren[i];
            }
        }

        return node;
    };

    this._insertLineNumbersToNode = function(node, length) {
        if (node.nodeType !== ELEMENT_NODE) {
            throw "This method may only be called for ELEMENT-nodes: " + node.nodeValue;
        }
        if (this._isInlineElement(node)) {
            return this._insertLineNumbersToInlineNode(node, length);
        } else {
            // @TODO
            this._currentInlineOffset = 0;
            return this._insertLineNumbersToInlineNode(node, length);
        }
    };

    this._nodesToHtml = function (nodes) {
        var root = document.createElement('div');
        for (var i in nodes) {
            root.appendChild(nodes[i]);
        }
        return root.innerHTML;
    };

    this.insertLineNumbers = function(html) {
        var root = document.createElement('div');
        root.innerHTML = html;

        this._currentInlineOffset = 0;
        var newRoot = this._insertLineNumbersToNode(root, this.lineLength);

        return newRoot.innerHTML;
    }
});


}());
