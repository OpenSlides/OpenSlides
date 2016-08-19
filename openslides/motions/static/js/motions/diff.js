(function () {

"use strict";

angular.module('OpenSlidesApp.motions.diff', ['OpenSlidesApp.motions.lineNumbering'])

/**
 * TO DO
 * - Selecting the last line
 * - <ol start="number">
 *
 */

.service('diffService', function (lineNumberingService) {
    var ELEMENT_NODE = 1,
        TEXT_NODE = 3,
        DOCUMENT_FRAGMENT_NODE = 11;


    this.getLineNumberNode = function(fragment, lineNumber) {
        return fragment.querySelector('os-linebreak.os-line-number.line-number-' + lineNumber);
    };

    this._getNodeContextTrace = function(node) {
        var context = [],
            currNode = node;
        while (currNode) {
            context.unshift(currNode);
            currNode = currNode.parentNode;
        }
        return context;
    };

    this._insertInternalLineMarkers = function(fragment) {
        if (fragment.querySelectorAll('OS-LINEBREAK').length > 0) {
            // Prevent duplicate calls
            return;
        }
        var lineNumbers = fragment.querySelectorAll('span.os-line-number');
        for (var i = 0; i < lineNumbers.length; i++) {
            var insertBefore = lineNumbers[i];
            while (insertBefore.parentNode.nodeType != DOCUMENT_FRAGMENT_NODE && insertBefore.parentNode.childNodes[0] == insertBefore) {
                insertBefore = insertBefore.parentNode;
            }
            var lineMarker = document.createElement('OS-LINEBREAK');
            lineMarker.setAttribute('data-line-number', lineNumbers[i].getAttribute('data-line-number'));
            lineMarker.setAttribute('class', lineNumbers[i].getAttribute('class'));
            insertBefore.parentNode.insertBefore(lineMarker, insertBefore);
        }
    };

  /*
   * Returns an array with the following values:
   * 0: the most specific DOM-node that contains both line numbers
   * 1: the context of node1 (an array of dom-elements; 0 is the document fragment)
   * 2: the context of node2 (an array of dom-elements; 0 is the document fragment)
   * 3: the index of [0] in the two arrays
   */
    this._getCommonAncestor = function(node1, node2) {
        var trace1 = this._getNodeContextTrace(node1),
            trace2 = this._getNodeContextTrace(node2),
            commonAncestor = null,
            commonIndex = null,
            childTrace1 = [],
            childTrace2 = [];

        for (var i = 0; i < trace1.length && i < trace2.length; i++) {
            if (trace1[i] == trace2[i]) {
                commonAncestor = trace1[i];
                commonIndex = i;
            }
        }
        for (i = commonIndex + 1; i < trace1.length; i++) {
            childTrace1.push(trace1[i]);
        }
        for (i = commonIndex + 1; i < trace2.length; i++) {
            childTrace2.push(trace2[i]);
        }
        return {
            'commonAncestor': commonAncestor,
            'trace1' : childTrace1,
            'trace2' : childTrace2,
            'index': commonIndex
        };
    };

    this._serializeTag = function(node) {
        if (node.nodeType == DOCUMENT_FRAGMENT_NODE) {
            return '';
        }
        var html = '<' + node.nodeName;
        for (var i = 0; i < node.attributes.length; i++) {
          var attr = node.attributes[i];
          html += " " + attr.name + "=\"" + attr.value + "\"";
        }
        html += '>';
        return html;
    };

    this._serializeDom = function(node, stripLineNumbers) {
        if (node.nodeType == TEXT_NODE) {
            return node.nodeValue;
        }
        if (stripLineNumbers && (
            lineNumberingService._isOsLineNumberNode(node) || lineNumberingService._isOsLineBreakNode(node))) {
            return '';
        }
        if (node.nodeName == 'OS-LINEBREAK') {
            return '';
        }
        if (node.nodeName == 'BR') {
            var br = '<BR';
            for (i = 0; i < node.attributes.length; i++) {
                var attr = node.attributes[i];
                br += " " + attr.name + "=\"" + attr.value + "\"";
            }
            return br + '>';
        }

        var html = this._serializeTag(node);
        for (var i = 0; i < node.childNodes.length; i++) {
            if (node.childNodes[i].nodeType == TEXT_NODE) {
                html += node.childNodes[i].nodeValue;
            } else if (!stripLineNumbers || (!lineNumberingService._isOsLineNumberNode(node.childNodes[i]) && !lineNumberingService._isOsLineBreakNode(node.childNodes[i]))) {
                html += this._serializeDom(node.childNodes[i], stripLineNumbers);
            }
        }
        if (node.nodeType != DOCUMENT_FRAGMENT_NODE) {
            html += '</' + node.nodeName + '>';
        }

        return html;
    };

    /**
     * Implementation hint: the first element of "toChildTrace" array needs to be a child element of "node"
     */
    this._serializePartialDomToChild = function(node, toChildTrace, stripLineNumbers) {
        if (lineNumberingService._isOsLineNumberNode(node) || lineNumberingService._isOsLineBreakNode(node)) {
            return '';
        }
        if (node.nodeName == 'OS-LINEBREAK') {
            return '';
        }

        var html = this._serializeTag(node);

        for (var i = 0, found = false; i < node.childNodes.length && !found; i++) {
            if (node.childNodes[i] == toChildTrace[0]) {
                found = true;
                var remainingTrace = toChildTrace;
                remainingTrace.shift();
                if (!lineNumberingService._isOsLineNumberNode(node.childNodes[i])) {
                    html += this._serializePartialDomToChild(node.childNodes[i], remainingTrace, stripLineNumbers);
                }
            } else if (node.childNodes[i].nodeType == TEXT_NODE) {
                html += node.childNodes[i].nodeValue;
            } else {
                if (!stripLineNumbers || (!lineNumberingService._isOsLineNumberNode(node.childNodes[i]) &&
                  !lineNumberingService._isOsLineBreakNode(node.childNodes[i]))) {
                    html += this._serializeDom(node.childNodes[i], stripLineNumbers);
                }
            }
        }
        if (!found) {
            console.trace();
            throw "Inconsistency or invalid call of this function detected";
        }
        return html;
    };

    /**
     * Implementation hint: the first element of "toChildTrace" array needs to be a child element of "node"
     */
    this._serializePartialDomFromChild = function(node, fromChildTrace, stripLineNumbers) {
        if (lineNumberingService._isOsLineNumberNode(node) || lineNumberingService._isOsLineBreakNode(node)) {
            return '';
        }
        if (node.nodeName == 'OS-LINEBREAK') {
            return '';
        }

        var html = '';
        for (var i = 0, found = false; i < node.childNodes.length; i++) {
            if (node.childNodes[i] == fromChildTrace[0]) {
                found = true;
                var remainingTrace = fromChildTrace;
                remainingTrace.shift();
                if (!lineNumberingService._isOsLineNumberNode(node.childNodes[i])) {
                    html += this._serializePartialDomFromChild(node.childNodes[i], remainingTrace, stripLineNumbers);
                }
            } else if (found) {
                if (node.childNodes[i].nodeType == TEXT_NODE) {
                    html += node.childNodes[i].nodeValue;
                } else {
                    if (!stripLineNumbers || (!lineNumberingService._isOsLineNumberNode(node.childNodes[i]) &&
                      !lineNumberingService._isOsLineBreakNode(node.childNodes[i]))) {
                        html += this._serializeDom(node.childNodes[i], stripLineNumbers);
                    }
                }
            }
        }
        if (!found) {
            console.trace();
            throw "Inconsistency or invalid call of this function detected";
        }
        if (node.nodeType != DOCUMENT_FRAGMENT_NODE) {
            html += '</' + node.nodeName + '>';
        }
        return html;
    };

    this.htmlToFragment = function(html) {
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

    /**
     * Returns the HTML snippet between two given line numbers.
     *
     * Hint:
     * - The last line (toLine) is not included anymore, as the number refers to the line breaking element
     *
     * In addition to the HTML snippet, additional information is provided regarding the most specific DOM element
     * that contains the whole section specified by the line numbers (like a P-element if only one paragraph is selected
     * or the most outer DIV, if multiple sections selected).
     *
     * This additional information is meant to render the snippet correctly without producing broken HTML
     *
     * The return object has the following fields:
     * - html: The HTML between the two line numbers.
     *         Line numbers and automatically set line breaks are stripped.
     *         All HTML tags are converted to uppercase
     *         (e.g. Line 2</LI><LI>Line3</LI><LI>Line 4 <br>)
     * - ancestor: the most specific DOM element that contains the HTML snippet (e.g. a UL, if several LIs are selected)
     * - outerContextStart: An HTML string that opens all necessary tags to get the browser into the rendering mode
     *                      of the ancestor element (e.g. <DIV><UL> in the case of the multiple LIs)
     * - outerContectEnd:   An HTML string that closes all necessary tags from the ancestor element (e.g. </UL></DIV>
     * - innerContextStart: A string that opens all necessary tags between the ancestor
     *                      and the beginning of the selection (e.g. <LI>)
     * - innerContextEnd:   A string that closes all tags after the end of the selection to the ancestor (e.g. </LI>)
     * - previousHtml:      The HTML before the selected area begins (including line numbers)
     * - previousHtmlEndSnippet: A HTML snippet that closes all open tags from previousHtml
     * - followingHtml:     The HTML after the selected area
     * - followingHtmlStartSnippet: A HTML snippet that opens all HTML tags necessary to render "followingHtml"
     *
     */
    this.extractRangeByLineNumbers = function(fragment, fromLine, toLine) {
        this._insertInternalLineMarkers(fragment);

        var fromLineNode = this.getLineNumberNode(fragment, fromLine),
            toLineNode = this.getLineNumberNode(fragment, toLine),
            ancestorData = this._getCommonAncestor(fromLineNode, toLineNode);

        var fromChildTraceRel = ancestorData.trace1,
            fromChildTraceAbs = this._getNodeContextTrace(fromLineNode),
            toChildTraceRel = ancestorData.trace2,
            toChildTraceAbs = this._getNodeContextTrace(toLineNode),
            ancestor = ancestorData.commonAncestor,
            html = '',
            outerContextStart = '',
            outerContextEnd = '',
            innerContextStart = '',
            innerContextEnd = '',
            previousHtmlEndSnippet = '',
            followingHtmlStartSnippet = '';


        fromChildTraceAbs.shift();
        var previousHtml = this._serializePartialDomToChild(fragment, fromChildTraceAbs, false);
        toChildTraceAbs.shift();
        var followingHtml = this._serializePartialDomFromChild(fragment, toChildTraceAbs, false);

        var currNode = fromLineNode.parentNode;
        while (currNode.parentNode) {
            previousHtmlEndSnippet += '</' + currNode.nodeName + '>';
            currNode = currNode.parentNode;
        }
        currNode = toLineNode.parentNode;
        while (currNode.parentNode) {
            followingHtmlStartSnippet = this._serializeTag(currNode) + followingHtmlStartSnippet;
            currNode = currNode.parentNode;
        }

        var found = false;
        for (var i = 0; i < fromChildTraceRel.length && !found; i++) {
            if (fromChildTraceRel[i].nodeName == 'OS-LINEBREAK') {
                found = true;
            } else {
                innerContextStart += this._serializeTag(fromChildTraceRel[i]);
            }
        }
        found = false;
        for (i = 0; i < toChildTraceRel.length && !found; i++) {
            if (toChildTraceRel[i].nodeName == 'OS-LINEBREAK') {
                found = true;
            } else {
                innerContextEnd = '</' + toChildTraceRel[i].nodeName + '>' + innerContextEnd;
            }
        }

        found = false;
        for (i = 0; i < ancestor.childNodes.length; i++) {
            if (ancestor.childNodes[i] == fromChildTraceRel[0]) {
                found = true;
                fromChildTraceRel.shift();
                html += this._serializePartialDomFromChild(ancestor.childNodes[i], fromChildTraceRel, true);
            } else if (ancestor.childNodes[i] == toChildTraceRel[0]) {
                found = false;
                toChildTraceRel.shift();
                html += this._serializePartialDomToChild(ancestor.childNodes[i], toChildTraceRel, true);
            } else if (found === true) {
                html += this._serializeDom(ancestor.childNodes[i], true);
            }
        }
        
        currNode = ancestor;
        while (currNode.parentNode) {
            outerContextStart = this._serializeTag(currNode) + outerContextStart;
            outerContextEnd += '</' + currNode.nodeName + '>';
            currNode = currNode.parentNode;
        }

        return {
            'html': html,
            'ancestor': ancestor,
            'outerContextStart': outerContextStart,
            'outerContextEnd': outerContextEnd,
            'innerContextStart': innerContextStart,
            'innerContextEnd': innerContextEnd,
            'previousHtml': previousHtml,
            'previousHtmlEndSnippet': previousHtmlEndSnippet,
            'followingHtml': followingHtml,
            'followingHtmlStartSnippet': followingHtmlStartSnippet
        };

    };

    this._replaceLinesMergeNodeArrays = function(nodes1, nodes2) {
        if (nodes1.length === 0) {
            return nodes2;
        }
        if (nodes2.length === 0) {
            return nodes1;
        }

        var out = [];
        for (var i = 0; i < nodes1.length - 1; i++) {
            out.push(nodes1[i]);
        }

        out.push(nodes1[nodes1.length - 1]);
        out.push(nodes2[0]);

        for (i = 1; i < nodes2.length; i++) {
            out.push(nodes2[i]);
        }

        /*
        if (node1.nodeName != node2.nodeName) {
            return null;
        }
        var newNode = node1.ownerDocument.createElement(node1.nodeName);
        for (var i = 0; i < node1.attributes.length; i++) {
            var attr = node1.attributes[i];
            newNode.setAttribute(attr.name, attr.value);
        }
        return newNode;
        */
        return out;
    };

    this.replaceLines = function (fragment, newHTML, fromLine, toLine) {
        var data = this.extractRangeByLineNumbers(fragment, fromLine, toLine),
            previousHtml = data.previousHtml + data.previousHtmlEndSnippet,
            previousFragment = this.htmlToFragment(previousHtml),
            followingHtml = data.followingHtmlStartSnippet + data.followingHtml,
            followingFragment = this.htmlToFragment(followingHtml),
            newFragment = this.htmlToFragment(newHTML),
            child;

        var merged = document.createDocumentFragment();

        while (previousFragment.children.length > 0) {
            child = previousFragment.children[0];
            previousFragment.removeChild(child);
            merged.appendChild(child);
        }
        while (newFragment.children.length > 0) {
            child = newFragment.children[0];
            newFragment.removeChild(child);
            merged.appendChild(child);
        }
        while (followingFragment.children.length > 0) {
            child = followingFragment.children[0];
            followingFragment.removeChild(child);
            merged.appendChild(child);
        }
        //var merged = this._replaceLinesAttemptMerge(lastOfPrevious, firstOfReplaced);

        return this._serializeDom(merged, true);
    };
});


}());
