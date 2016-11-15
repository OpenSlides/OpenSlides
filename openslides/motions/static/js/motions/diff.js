(function () {

"use strict";

angular.module('OpenSlidesApp.motions.diff', ['OpenSlidesApp.motions.lineNumbering'])

.service('diffService', [
    'lineNumberingService',
    '$cacheFactory',
    function (lineNumberingService, $cacheFactory) {
        var ELEMENT_NODE = 1,
            TEXT_NODE = 3,
            DOCUMENT_FRAGMENT_NODE = 11;

        var diffCache = $cacheFactory('diff.service');

        this.TYPE_REPLACEMENT = 0;
        this.TYPE_INSERTION = 1;
        this.TYPE_DELETION = 2;

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

        // Adds elements like <OS-LINEBREAK class="os-line-number line-number-23" data-line-number="23"/>
        this._insertInternalLineMarkers = function(fragment) {
            if (fragment.querySelectorAll('OS-LINEBREAK').length > 0) {
                // Prevent duplicate calls
                return;
            }
            var lineNumbers = fragment.querySelectorAll('span.os-line-number'),
                lineMarker, maxLineNumber;

            for (var i = 0; i < lineNumbers.length; i++) {
                var insertBefore = lineNumbers[i];
                while (insertBefore.parentNode.nodeType != DOCUMENT_FRAGMENT_NODE && insertBefore.parentNode.childNodes[0] == insertBefore) {
                    insertBefore = insertBefore.parentNode;
                }
                lineMarker = document.createElement('OS-LINEBREAK');
                lineMarker.setAttribute('data-line-number', lineNumbers[i].getAttribute('data-line-number'));
                lineMarker.setAttribute('class', lineNumbers[i].getAttribute('class'));
                insertBefore.parentNode.insertBefore(lineMarker, insertBefore);
                maxLineNumber = lineNumbers[i].getAttribute('data-line-number');
            }

            // Add one more "fake" line number at the end and beginning, so we can select the last line as well
            lineMarker = document.createElement('OS-LINEBREAK');
            lineMarker.setAttribute('data-line-number', (parseInt(maxLineNumber) + 1));
            lineMarker.setAttribute('class', 'os-line-number line-number-' + (parseInt(maxLineNumber) + 1));
            fragment.appendChild(lineMarker);

            lineMarker = document.createElement('OS-LINEBREAK');
            lineMarker.setAttribute('data-line-number', '0');
            lineMarker.setAttribute('class', 'os-line-number line-number-0');
            fragment.insertBefore(lineMarker, fragment.firstChild);
        };

        // @TODO Check if this is actually necessary
        this._insertInternalLiNumbers = function(fragment) {
            if (fragment.querySelectorAll('LI[os-li-number]').length > 0) {
                // Prevent duplicate calls
                return;
            }
            var ols = fragment.querySelectorAll('OL');
            for (var i = 0; i < ols.length; i++) {
                var ol = ols[i],
                    liNo = 0;
                for (var j = 0; j < ol.childNodes.length; j++) {
                    if (ol.childNodes[j].nodeName == 'LI') {
                        liNo++;
                        ol.childNodes[j].setAttribute('os-li-number', liNo);
                    }
                }
            }
        };

        this._addStartToOlIfNecessary = function(node) {
            var firstLiNo = null;
            for (var i = 0; i < node.childNodes.length && firstLiNo === null; i++) {
                if (node.childNode[i].nodeName == 'LI') {
                    var lineNo = node.childNode[i].getAttribute('ol-li-number');
                    if (lineNo) {
                        firstLiNo = parseInt(lineNo);
                    }
                }
            }
            if (firstLiNo > 1) {
                node.setAttribute('start', firstLiNo);
            }
        };

        this._isWithinNthLIOfOL = function(olNode, descendantNode) {
            var nthLIOfOL = null;
            while (descendantNode.parentNode) {
                if (descendantNode.parentNode == olNode) {
                    var lisBeforeOl = 0,
                        foundMe = false;
                    for (var i = 0; i < olNode.childNodes.length && !foundMe; i++) {
                        if (olNode.childNodes[i] == descendantNode) {
                            foundMe = true;
                        } else if (olNode.childNodes[i].nodeName == 'LI') {
                            lisBeforeOl++;
                        }
                    }
                    nthLIOfOL = lisBeforeOl + 1;
                }
                descendantNode = descendantNode.parentNode;
            }
            return nthLIOfOL;
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
                // Fragments are only placeholders and do not have an HTML representation
                return '';
            }
            var html = '<' + node.nodeName;
            for (var i = 0; i < node.attributes.length; i++) {
                var attr = node.attributes[i];
                if (attr.name != 'os-li-number') {
                    html += ' ' + attr.name + '="' + attr.value + '"';
                }
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
                throw "Inconsistency or invalid call of this function detected (to)";
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
                throw "Inconsistency or invalid call of this function detected (from)";
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
         * - if toLine === null, then everything from fromLine to the end of the fragment is returned
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
        this.extractRangeByLineNumbers = function(htmlIn, fromLine, toLine, debug) {
            if (typeof(htmlIn) !== 'string') {
                throw 'Invalid call - extractRangeByLineNumbers expects a string as first argument';
            }

            var cacheKey = fromLine + "-" + toLine + "-" + lineNumberingService.djb2hash(htmlIn),
                cached = diffCache.get(cacheKey);

            if (!angular.isUndefined(cached)) {
                return cached;
            }

            var fragment = this.htmlToFragment(htmlIn);

            this._insertInternalLineMarkers(fragment);
            this._insertInternalLiNumbers(fragment);
            if (toLine === null) {
                var internalLineMarkers = fragment.querySelectorAll('OS-LINEBREAK');
                toLine = parseInt(internalLineMarkers[internalLineMarkers.length - 1].getAttribute("data-line-number"));
            }

            var fromLineNode = this.getLineNumberNode(fragment, fromLine),
                toLineNode = (toLine ? this.getLineNumberNode(fragment, toLine) : null),
                ancestorData = this._getCommonAncestor(fromLineNode, toLineNode);

            var fromChildTraceRel = ancestorData.trace1,
                fromChildTraceAbs = this._getNodeContextTrace(fromLineNode),
                toChildTraceRel = ancestorData.trace2,
                toChildTraceAbs = this._getNodeContextTrace(toLineNode),
                ancestor = ancestorData.commonAncestor,
                htmlOut = '',
                outerContextStart = '',
                outerContextEnd = '',
                innerContextStart = '',
                innerContextEnd = '',
                previousHtmlEndSnippet = '',
                followingHtmlStartSnippet = '',
                fakeOl;


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
                    if (fromChildTraceRel[i].nodeName == 'OL') {
                        fakeOl = fromChildTraceRel[i].cloneNode(false);
                        fakeOl.setAttribute('start', this._isWithinNthLIOfOL(fromChildTraceRel[i], fromLineNode));
                        innerContextStart += this._serializeTag(fakeOl);
                    } else {
                        innerContextStart += this._serializeTag(fromChildTraceRel[i]);
                    }
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
                    htmlOut += this._serializePartialDomFromChild(ancestor.childNodes[i], fromChildTraceRel, true);
                } else if (ancestor.childNodes[i] == toChildTraceRel[0]) {
                    found = false;
                    toChildTraceRel.shift();
                    htmlOut += this._serializePartialDomToChild(ancestor.childNodes[i], toChildTraceRel, true);
                } else if (found === true) {
                    htmlOut += this._serializeDom(ancestor.childNodes[i], true);
                }
            }

            currNode = ancestor;
            while (currNode.parentNode) {
                if (currNode.nodeName == 'OL') {
                    fakeOl = currNode.cloneNode(false);
                    fakeOl.setAttribute('start', this._isWithinNthLIOfOL(currNode, fromLineNode));
                    outerContextStart = this._serializeTag(fakeOl) + outerContextStart;
                } else {
                    outerContextStart = this._serializeTag(currNode) + outerContextStart;
                }
                outerContextEnd += '</' + currNode.nodeName + '>';
                currNode = currNode.parentNode;
            }

            var ret = {
                'html': htmlOut,
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

            diffCache.put(cacheKey, ret);
            return ret;
        };

        /*
         * This functions merges to arrays of nodes. The last element of nodes1 and the first element of nodes2
         * are merged, if they are of the same type.
         *
         * This is done recursively until a TEMPLATE-Tag is is found, which was inserted in this.replaceLines.
         * Using a TEMPLATE-Tag is a rather dirty hack, as it is allowed inside of any other element, including <ul>.
         *
         */
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

            var lastNode = nodes1[nodes1.length - 1],
                firstNode = nodes2[0];
            if (lastNode.nodeType == TEXT_NODE && firstNode.nodeType == TEXT_NODE) {
                var newTextNode = lastNode.ownerDocument.createTextNode(lastNode.nodeValue + firstNode.nodeValue);
                out.push(newTextNode);
            } else if (lastNode.nodeName == firstNode.nodeName) {
                var newNode = lastNode.ownerDocument.createElement(lastNode.nodeName);
                for (i = 0; i < lastNode.attributes.length; i++) {
                    var attr = lastNode.attributes[i];
                    newNode.setAttribute(attr.name, attr.value);
                }

                // Remove #text nodes inside of List elements, as they are confusing
                var lastChildren, firstChildren;
                if (lastNode.nodeName == 'OL' || lastNode.nodeName == 'UL') {
                    lastChildren = [];
                    firstChildren = [];
                    for (i = 0; i < firstNode.childNodes.length; i++) {
                        if (firstNode.childNodes[i].nodeType == ELEMENT_NODE) {
                            firstChildren.push(firstNode.childNodes[i]);
                        }
                    }
                    for (i = 0; i < lastNode.childNodes.length; i++) {
                        if (lastNode.childNodes[i].nodeType == ELEMENT_NODE) {
                            lastChildren.push(lastNode.childNodes[i]);
                        }
                    }
                } else {
                    lastChildren = lastNode.childNodes;
                    firstChildren = firstNode.childNodes;
                }

                var children = this._replaceLinesMergeNodeArrays(lastChildren, firstChildren);
                for (i = 0; i < children.length; i++) {
                    newNode.appendChild(children[i]);
                }
                out.push(newNode);
            } else {
                if (lastNode.nodeName != 'TEMPLATE') {
                    out.push(lastNode);
                }
                if (firstNode.nodeName != 'TEMPLATE') {
                    out.push(firstNode);
                }
            }

            for (i = 1; i < nodes2.length; i++) {
                out.push(nodes2[i]);
            }

            return out;
        };

        /**
         * @param {string} htmlOld
         * @param {string} htmlNew
         * @returns {number}
         */
        this.detectReplacementType = function (htmlOld, htmlNew) {
            // Convert all HTML tags to uppercase, strip trailing whitespaces
            var normalizeHtml = function(html) {
                html = html.replace(/<[^>]+>/g, function(tag) { return tag.toUpperCase(); });
                html = html.replace(/\s+<\/P>/gi, '</P>').replace(/\s+<\/DIV>/gi, '</DIV>').replace(/\s+<\/LI>/gi, '</LI>');
                html = html.replace(/\s+<LI>/gi, '<LI>').replace(/<\/LI>\s+/gi, '</LI>');
                html = html.replace(/&nbsp;/gi, ' ').replace(/\u00A0/g, ' '); // non-breaking spaces
                return html;
            };
            htmlOld = normalizeHtml(htmlOld);
            htmlNew = normalizeHtml(htmlNew);

            if (htmlOld == htmlNew) {
                return this.TYPE_REPLACEMENT;
            }

            var i, foundDiff;
            for (i = 0, foundDiff = false; i < htmlOld.length && i < htmlNew.length && foundDiff === false; i++) {
                if (htmlOld[i] != htmlNew[i]) {
                    foundDiff = true;
                }
            }

            var remainderOld = htmlOld.substr(i - 1),
                remainderNew = htmlNew.substr(i - 1),
                type = this.TYPE_REPLACEMENT;

            if (remainderOld.length > remainderNew.length) {
                if (remainderOld.substr(remainderOld.length - remainderNew.length) == remainderNew) {
                    type = this.TYPE_DELETION;
                }
            } else if (remainderOld.length < remainderNew.length) {
                if (remainderNew.substr(remainderNew.length - remainderOld.length) == remainderOld) {
                    type = this.TYPE_INSERTION;
                }
            }

            return type;
        };

        /**
         * @param {string} oldHtml
         * @param {string} newHTML
         * @param {number} fromLine
         * @param {number} toLine
         */
        this.replaceLines = function (oldHtml, newHTML, fromLine, toLine) {
            var data = this.extractRangeByLineNumbers(oldHtml, fromLine, toLine),
                previousHtml = data.previousHtml + '<TEMPLATE></TEMPLATE>' + data.previousHtmlEndSnippet,
                previousFragment = this.htmlToFragment(previousHtml),
                followingHtml = data.followingHtmlStartSnippet + '<TEMPLATE></TEMPLATE>' + data.followingHtml,
                followingFragment = this.htmlToFragment(followingHtml),
                newFragment = this.htmlToFragment(newHTML);

            var merged = this._replaceLinesMergeNodeArrays(previousFragment.childNodes, newFragment.childNodes);
            merged = this._replaceLinesMergeNodeArrays(merged, followingFragment.childNodes);

            var mergedFragment = document.createDocumentFragment();
            for (var i = 0; i < merged.length; i++) {
                mergedFragment.appendChild(merged[i]);
            }

            var forgottenTemplates = mergedFragment.querySelectorAll("TEMPLATE");
            for (i = 0; i < forgottenTemplates.length; i++) {
                var el = forgottenTemplates[i];
                el.parentNode.removeChild(el);
            }

            return this._serializeDom(mergedFragment, true);
        };

        this.addCSSClass = function (node, className) {
            if (node.nodeType != ELEMENT_NODE) {
                return;
            }
            var classes = node.getAttribute('class');
            classes = (classes ? classes.split(' ') : []);
            if (classes.indexOf(className) == -1) {
                classes.push(className);
            }
            node.setAttribute('class', classes);
        };

        this.addDiffMarkup = function (originalHTML, newHTML, fromLine, toLine, diffFormatterCb) {
            var data = this.extractRangeByLineNumbers(originalHTML, fromLine, toLine),
                previousHtml = data.previousHtml + '<TEMPLATE></TEMPLATE>' + data.previousHtmlEndSnippet,
                previousFragment = this.htmlToFragment(previousHtml),
                followingHtml = data.followingHtmlStartSnippet + '<TEMPLATE></TEMPLATE>' + data.followingHtml,
                followingFragment = this.htmlToFragment(followingHtml),
                newFragment = this.htmlToFragment(newHTML),
                oldHTML = data.outerContextStart + data.innerContextStart + data.html +
                    data.innerContextEnd + data.outerContextEnd,
                oldFragment = this.htmlToFragment(oldHTML),
                el;

            var diffFragment = diffFormatterCb(oldFragment, newFragment);

            var mergedFragment = document.createDocumentFragment();
            while (previousFragment.firstChild) {
                el = previousFragment.firstChild;
                previousFragment.removeChild(el);
                mergedFragment.appendChild(el);
            }
            while (diffFragment.firstChild) {
                el = diffFragment.firstChild;
                diffFragment.removeChild(el);
                mergedFragment.appendChild(el);
            }
            while (followingFragment.firstChild) {
                el = followingFragment.firstChild;
                followingFragment.removeChild(el);
                mergedFragment.appendChild(el);
            }

            var forgottenTemplates = mergedFragment.querySelectorAll("TEMPLATE");
            for (var i = 0; i < forgottenTemplates.length; i++) {
                el = forgottenTemplates[i];
                el.parentNode.removeChild(el);
            }

            return this._serializeDom(mergedFragment, true);
        };
    }
]);

}());
