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
        this.TYPE_OTHER = 3;

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

        this._isFirstNonemptyChild = function(node, child) {
            for (var i = 0; i < node.childNodes.length; i++) {
                if (node.childNodes[i] === child) {
                    return true;
                }
                if (node.childNodes[i].nodeType !== TEXT_NODE || node.childNodes[i].nodeValue.match(/\S/)) {
                    return false;
                }
            }
            return false;
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
                while (insertBefore.parentNode.nodeType !== DOCUMENT_FRAGMENT_NODE &&
                       this._isFirstNonemptyChild(insertBefore.parentNode, insertBefore)) {
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
                return node.nodeValue.replace(/</g, "&lt;").replace(/>/g, "&gt;");
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
                    html += node.childNodes[i].nodeValue.replace(/</g, "&lt;").replace(/>/g, "&gt;");
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
         * When a <li> with a os-split-before-class (set by extractRangeByLineNumbers) is edited when creating a
         * change recommendation and is split again in CKEditor, the second list items also gets that class.
         * This is not correct however, as the second one actually is a new list item. So we need to remove it again.
         *
         * @param {string} html
         * @returns {string}
         */
        this.removeDuplicateClassesInsertedByCkeditor = function(html) {
            var fragment = this.htmlToFragment(html);
            var items = fragment.querySelectorAll('li.os-split-before');
            for (var i = 0; i < items.length; i++) {
                if (!this._isFirstNonemptyChild(items[i].parentNode, items[i])) {
                    this.removeCSSClass(items[i], 'os-split-before');
                }
            }
            return this._serializeDom(fragment, false);
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
         *
         * In some cases, the returned HTML tags receive additional CSS classes, providing information both for
         * rendering it and for merging it again correctly.
         * - os-split-*:        These classes are set for all HTML Tags that have been split into two by this process,
         *                      e.g. if the fromLine- or toLine-line-break was somewhere in the middle of this tag.
         *                      If a tag is split, the first one receives "os-split-after", and the second one "os-split-before".
         * For example, for the following string <p>Line 1<br>Line 2<br>Line 3</p>:
         * - extracting line 1 to 2 results in <p class="os-split-after">Line 1</p>
         * - extracting line 2 to 3 results in <p class="os-split-after os-split-before">Line 2</p>
         * - extracting line 3 to null/4 results in <p class="os-split-before">Line 3</p>
         */
        this.extractRangeByLineNumbers = function(htmlIn, fromLine, toLine) {
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

            var currNode = fromLineNode,
                isSplit = false;
            while (currNode.parentNode) {
                if (!this._isFirstNonemptyChild(currNode.parentNode, currNode)) {
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
                if (!this._isFirstNonemptyChild(currNode.parentNode, currNode)) {
                    isSplit = true;
                }
                if (isSplit) {
                    this.addCSSClass(currNode.parentNode, 'os-split-after');
                }
                followingHtmlStartSnippet = this._serializeTag(currNode.parentNode) + followingHtmlStartSnippet;
                currNode = currNode.parentNode;
            }

            var found = false;
            isSplit = false;
            for (var i = 0; i < fromChildTraceRel.length && !found; i++) {
                if (fromChildTraceRel[i].nodeName === 'OS-LINEBREAK') {
                    found = true;
                } else {
                    if (!this._isFirstNonemptyChild(fromChildTraceRel[i], fromChildTraceRel[i + 1])) {
                        isSplit = true;
                    }
                    if (fromChildTraceRel[i].nodeName === 'OL') {
                        fakeOl = fromChildTraceRel[i].cloneNode(false);
                        fakeOl.setAttribute('start', this._isWithinNthLIOfOL(fromChildTraceRel[i], fromLineNode));
                        innerContextStart += this._serializeTag(fakeOl);
                    } else {
                        if (i < (fromChildTraceRel.length - 1) && isSplit) {
                            this.addCSSClass(fromChildTraceRel[i], 'os-split-before');
                        }
                        innerContextStart += this._serializeTag(fromChildTraceRel[i]);
                    }
                }
            }
            found = false;
            for (i = 0; i < toChildTraceRel.length && !found; i++) {
                if (toChildTraceRel[i].nodeName === 'OS-LINEBREAK') {
                    found = true;
                } else {
                    innerContextEnd = '</' + toChildTraceRel[i].nodeName + '>' + innerContextEnd;
                }
            }

            found = false;
            for (i = 0; i < ancestor.childNodes.length; i++) {
                if (ancestor.childNodes[i] === fromChildTraceRel[0]) {
                    found = true;
                    fromChildTraceRel.shift();
                    htmlOut += this._serializePartialDomFromChild(ancestor.childNodes[i], fromChildTraceRel, true);
                } else if (ancestor.childNodes[i] === toChildTraceRel[0]) {
                    found = false;
                    toChildTraceRel.shift();
                    htmlOut += this._serializePartialDomToChild(ancestor.childNodes[i], toChildTraceRel, true);
                } else if (found === true) {
                    htmlOut += this._serializeDom(ancestor.childNodes[i], true);
                }
            }

            currNode = ancestor;
            while (currNode.parentNode) {
                if (currNode.nodeName === 'OL') {
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
         * This is a workardoun to prevent the last word of the inserted text from accidently being merged with the
         * first word of the following line.
         *
         * This happens as trailing spaces in the change recommendation's text are frequently stripped,
         * which is pretty nasty if the original text goes on after the affected line. So we insert a space
         * if the original line ends with one.
         */
        this._insertDanglingSpace = function(element) {
            if (element.childNodes.length > 0) {
                var lastChild = element.childNodes[element.childNodes.length - 1];
                if (lastChild.nodeType == TEXT_NODE && !lastChild.nodeValue.match(/[\S]/) && element.childNodes.length > 1) {
                    // If the text node only contains whitespaces, chances are high it's just space between block elmeents,
                    // like a line break between </LI> and </UL>
                    lastChild = element.childNodes[element.childNodes.length - 2];
                }
                if (lastChild.nodeType == TEXT_NODE) {
                    if (lastChild.nodeValue === '' || lastChild.nodeValue.substr(-1) != ' ') {
                        lastChild.nodeValue += ' ';
                    }
                } else {
                    this._insertDanglingSpace(lastChild);
                }
            }
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
            if (lastNode.nodeType === TEXT_NODE && firstNode.nodeType === TEXT_NODE) {
                var newTextNode = lastNode.ownerDocument.createTextNode(lastNode.nodeValue + firstNode.nodeValue);
                out.push(newTextNode);
            } else if (lastNode.nodeName === firstNode.nodeName) {
                var newNode = lastNode.ownerDocument.createElement(lastNode.nodeName);
                for (i = 0; i < lastNode.attributes.length; i++) {
                    var attr = lastNode.attributes[i];
                    newNode.setAttribute(attr.name, attr.value);
                }

                // Remove #text nodes inside of List elements (OL/UL), as they are confusing
                var lastChildren, firstChildren;
                if (lastNode.nodeName === 'OL' || lastNode.nodeName === 'UL') {
                    lastChildren = [];
                    firstChildren = [];
                    for (i = 0; i < firstNode.childNodes.length; i++) {
                        if (firstNode.childNodes[i].nodeType === ELEMENT_NODE) {
                            firstChildren.push(firstNode.childNodes[i]);
                        }
                    }
                    for (i = 0; i < lastNode.childNodes.length; i++) {
                        if (lastNode.childNodes[i].nodeType === ELEMENT_NODE) {
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
                if (lastNode.nodeName !== 'TEMPLATE') {
                    out.push(lastNode);
                }
                if (firstNode.nodeName !== 'TEMPLATE') {
                    out.push(firstNode);
                }
            }

            for (i = 1; i < nodes2.length; i++) {
                out.push(nodes2[i]);
            }

            return out;
        };

        /**
         *
         * @param {string} html
         * @returns {string}
         * @private
         */
        this._normalizeHtmlForDiff = function (html) {
            // Convert all HTML tags to uppercase, but leave the values of attributes unchanged
            // All attributes and CSS class names  are sorted alphabetically
            // If an attribute is empty, it is removed
            html = html.replace(/<(\/?[a-z]*)( [^>]*)?>/ig, function (html, tag, attributes) {
                var tagNormalized = tag.toUpperCase();
                if (attributes === undefined) {
                    attributes = "";
                }
                var attributesList = [],
                    attributesMatcher = /( [^"'=]*)(= *((["'])(.*?)\4))?/gi,
                    match;
                do {
                    match = attributesMatcher.exec(attributes);
                    if (match) {
                        var attrNormalized = match[1].toUpperCase(),
                            attrValue = match[5];
                        if (match[2] !== undefined) {
                            if (attrNormalized === ' CLASS') {
                                attrValue = attrValue.split(' ').sort().join(' ').replace(/^\s+/, '').replace(/\s+$/, '');
                            }
                            attrNormalized += "=" + match[4] + attrValue + match[4];
                        }
                        if (attrValue !== '') {
                            attributesList.push(attrNormalized);
                        }
                    }
                } while (match);
                attributes = attributesList.sort().join('');
                return "<" + tagNormalized + attributes + ">";
            });

            var entities = {
                '&nbsp;': ' ',
                '&ndash;': '-',
                '&auml;': 'ä',
                '&ouml;': 'ö',
                '&uuml;': 'ü',
                '&Auml;': 'Ä',
                '&Ouml;': 'Ö',
                '&Uuml;': 'Ü',
                '&szlig;': 'ß'
            };

            html = html.replace(/\s+<\/P>/gi, '</P>').replace(/\s+<\/DIV>/gi, '</DIV>').replace(/\s+<\/LI>/gi, '</LI>');
            html = html.replace(/\s+<LI>/gi, '<LI>').replace(/<\/LI>\s+/gi, '</LI>');
            html = html.replace(/\u00A0/g, ' ');
            html = html.replace(/\u2013/g, '-');
            for (var ent in entities) {
                html = html.replace(new RegExp(ent, 'g'), entities[ent]);
            }
            html = html.replace(/[ \n\t]+/gi, ' ');
            html = html.replace(/(<\/(div|p|ul|li|blockquote>)>) /gi, "$1\n");

            return html;
        };

        /**
         * @param {string} htmlOld
         * @param {string} htmlNew
         * @returns {number}
         */
        this.detectReplacementType = function (htmlOld, htmlNew) {
            htmlOld = this._normalizeHtmlForDiff(htmlOld);
            htmlNew = this._normalizeHtmlForDiff(htmlNew);

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

            if (data.html.length > 0 && data.html.substr(-1) === ' ') {
                this._insertDanglingSpace(newFragment);
            }

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

            var forgottenSplitClasses = mergedFragment.querySelectorAll(".os-split-before, .os-split-after");
            for (i = 0; i < forgottenSplitClasses.length; i++) {
                this.removeCSSClass(forgottenSplitClasses[i], 'os-split-before');
                this.removeCSSClass(forgottenSplitClasses[i], 'os-split-after');
            }

            return this._serializeDom(mergedFragment, true);
        };

        this.addCSSClass = function (node, className) {
            if (node.nodeType !== ELEMENT_NODE) {
                return;
            }
            var classes = node.getAttribute('class');
            classes = (classes ? classes.split(' ') : []);
            if (classes.indexOf(className) === -1) {
                classes.push(className);
            }
            node.setAttribute('class', classes.join(' '));
        };

        this.removeCSSClass = function (node, className) {
            if (node.nodeType !== ELEMENT_NODE) {
                return;
            }
            var classes = node.getAttribute('class'),
                newClasses = [];
            classes = (classes ? classes.split(' ') : []);
            for (var i = 0; i < classes.length; i++) {
                if (classes[i] !== className) {
                    newClasses.push(classes[i]);
                }
            }
            if (newClasses.length === 0) {
                node.removeAttribute('class');
            } else {
                node.setAttribute('class', newClasses.join(' '));
            }
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

        /**
         * Adapted from http://ejohn.org/projects/javascript-diff-algorithm/
         * by John Resig, MIT License
         * @param {array} oldArr
         * @param {array} newArr
         * @returns {object}
         */
        this._diff = function (oldArr, newArr) {
            var ns = {},
                os = {},
                i;

            for (i = 0; i < newArr.length; i++) {
                if (ns[newArr[i]] === undefined)
                    ns[newArr[i]] = {rows: [], o: null};
                ns[newArr[i]].rows.push(i);
            }

            for (i = 0; i < oldArr.length; i++) {
                if (os[oldArr[i]] === undefined)
                    os[oldArr[i]] = {rows: [], n: null};
                os[oldArr[i]].rows.push(i);
            }

            for (i in ns) {
                if (ns[i].rows.length == 1 && typeof(os[i]) != "undefined" && os[i].rows.length == 1) {
                    newArr[ns[i].rows[0]] = {text: newArr[ns[i].rows[0]], row: os[i].rows[0]};
                    oldArr[os[i].rows[0]] = {text: oldArr[os[i].rows[0]], row: ns[i].rows[0]};
                }
            }

            for (i = 0; i < newArr.length - 1; i++) {
                if (newArr[i].text !== null && newArr[i + 1].text === undefined && newArr[i].row + 1 < oldArr.length &&
                    oldArr[newArr[i].row + 1].text === undefined && newArr[i + 1] == oldArr[newArr[i].row + 1]) {
                    newArr[i + 1] = {text: newArr[i + 1], row: newArr[i].row + 1};
                    oldArr[newArr[i].row + 1] = {text: oldArr[newArr[i].row + 1], row: i + 1};
                }
            }

            for (i = newArr.length - 1; i > 0; i--) {
                if (newArr[i].text !== null && newArr[i - 1].text === undefined && newArr[i].row > 0 &&
                    oldArr[newArr[i].row - 1].text === undefined && newArr[i - 1] == oldArr[newArr[i].row - 1]) {
                    newArr[i - 1] = {text: newArr[i - 1], row: newArr[i].row - 1};
                    oldArr[newArr[i].row - 1] = {text: oldArr[newArr[i].row - 1], row: i - 1};
                }
            }

            return {o: oldArr, n: newArr};
        };

        this._tokenizeHtml = function (str) {
            var splitArrayEntriesEmbedSeparator = function (arr, by, prepend) {
                var newArr = [];
                for (var i = 0; i < arr.length; i++) {
                    if (arr[i][0] === '<' && (by === " " || by === "\n")) {
                        // Don't split HTML tags
                        newArr.push(arr[i]);
                        continue;
                    }

                    var parts = arr[i].split(by);
                    if (parts.length === 1) {
                        newArr.push(arr[i]);
                    } else {
                        var j;
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
            var splitArrayEntriesSplitSeparator = function (arr, by) {
                var newArr = [];
                for (var i = 0; i < arr.length; i++) {
                    if (arr[i][0] === '<') {
                        newArr.push(arr[i]);
                        continue;
                    }
                    var parts = arr[i].split(by);
                    for (var j = 0; j < parts.length; j++) {
                        if (j > 0) {
                            newArr.push(by);
                        }
                        newArr.push(parts[j]);
                    }
                }
                return newArr;
            };
            var arr = splitArrayEntriesEmbedSeparator([str], '<', true);
            arr = splitArrayEntriesEmbedSeparator(arr, '>', false);
            arr = splitArrayEntriesSplitSeparator(arr, " ");
            arr = splitArrayEntriesSplitSeparator(arr, ".");
            arr = splitArrayEntriesSplitSeparator(arr, ",");
            arr = splitArrayEntriesSplitSeparator(arr, "!");
            arr = splitArrayEntriesEmbedSeparator(arr, "\n", false);

            var arrWithoutEmptes = [];
            for (var i = 0; i < arr.length; i++) {
                if (arr[i] !== '') {
                    arrWithoutEmptes.push(arr[i]);
                }
            }

            return arrWithoutEmptes;
        };

        /**
         * @param {string} oldStr
         * @param {string} newStr
         * @returns {string}
         */
        this._diffString = function (oldStr, newStr) {
            oldStr = this._normalizeHtmlForDiff(oldStr.replace(/\s+$/, '').replace(/^\s+/, ''));
            newStr = this._normalizeHtmlForDiff(newStr.replace(/\s+$/, '').replace(/^\s+/, ''));

            var out = this._diff(this._tokenizeHtml(oldStr), this._tokenizeHtml(newStr));
            var str = "";
            var i;

            if (out.n.length === 0) {
                for (i = 0; i < out.o.length; i++) {
                    str += '<del>' + out.o[i] + "</del>";
                }
            } else {
                if (out.n[0].text === undefined) {
                    for (var k = 0; k < out.o.length && out.o[k].text === undefined; k++) {
                        str += '<del>' + out.o[k] + "</del>";
                    }
                }

                var currOldRow = 0;
                for (i = 0; i < out.n.length; i++) {
                    if (out.n[i].text === undefined) {
                        if (out.n[i] !== "") {
                            str += '<ins>' + out.n[i] + "</ins>";
                        }
                    } else if (out.n[i].row < currOldRow) {
                        str += '<ins>' + out.n[i].text + "</ins>";
                    } else {
                        var pre = "";

                        if ((i + 1) < out.n.length && out.n[i + 1].row !== undefined && out.n[i + 1].row > out.n[i].row + 1) {
                            for (var n = out.n[i].row + 1; n < out.n[i + 1].row; n++) {
                                if (out.o[n].text === undefined) {
                                    pre += '<del>' + out.o[n] + "</del>";
                                } else {
                                    pre += '<del>' + out.o[n].text + "</del>";
                                }
                            }
                        } else {
                            for (var j = out.n[i].row + 1; j < out.o.length && out.o[j].text === undefined; j++) {
                                pre += '<del>' + out.o[j] + "</del>";
                            }
                        }
                        str += out.n[i].text + pre;

                        currOldRow = out.n[i].row;
                    }
                }
            }

            return str.replace(/^\s+/g, '').replace(/\s+$/g, '').replace(/ {2,}/g, ' ');
        };

        /**
         *
         * @param {string} html
         * @returns {boolean}
         * @private
         */
        this._diffDetectBrokenDiffHtml = function(html) {
            // If a regular HTML tag is enclosed by INS/DEL, the HTML is broken
            var match = html.match(/<(ins|del)><[^>]*><\/(ins|del)>/gi);
            if (match !== null && match.length > 0) {
                return true;
            }

            // Opening tags, followed by </del> or </ins>, indicate broken HTML (if it's not a <ins> / <del>)
            var brokenRegexp = /<(\w+)[^>]*><\/(ins|del)>/gi,
                result;
            while ((result = brokenRegexp.exec(html)) !== null) {
                if (result[1].toLowerCase() !== 'ins' && result[1].toLowerCase() !== 'del') {
                    return true;
                }
            }


            // If other HTML tags are contained within INS/DEL (e.g. "<ins>Test</p></ins>"), let's better be cautious
            // The "!!(found=...)"-construction is only used to make jshint happy :)
            var findDel = /<del>(.*?)<\/del>/gi,
                findIns = /<ins>(.*?)<\/ins>/gi,
                found, inner;
            while (!!(found = findDel.exec(html))) {
                inner = found[1].replace(/<br[^>]*>/gi, '');
                if (inner.match(/<[^>]*>/)) {
                    return true;
                }
            }
            while (!!(found = findIns.exec(html))) {
                inner = found[1].replace(/<br[^>]*>/gi, '');
                if (inner.match(/<[^>]*>/)) {
                    return true;
                }
            }

            // If non of the conditions up to now is met, we consider the diff as being sane
            return false;
        };

        this._diffParagraphs = function(oldText, newText, lineLength, firstLineNumber) {
            var oldTextWithBreaks, newTextWithBreaks, currChild;

            if (lineLength !== undefined) {
                oldTextWithBreaks = lineNumberingService.insertLineNumbersNode(oldText, lineLength, null, firstLineNumber);
                newTextWithBreaks = lineNumberingService.insertLineNumbersNode(newText, lineLength, null, firstLineNumber);
            } else {
                oldTextWithBreaks = document.createElement('div');
                oldTextWithBreaks.innerHTML = oldText;
                newTextWithBreaks = document.createElement('div');
                newTextWithBreaks.innerHTML = newText;
            }

            for (var i = 0; i < oldTextWithBreaks.childNodes.length; i++) {
                currChild = oldTextWithBreaks.childNodes[i];
                if (currChild.nodeType === TEXT_NODE) {
                    var wrapDel = document.createElement('del');
                    oldTextWithBreaks.insertBefore(wrapDel, currChild);
                    oldTextWithBreaks.removeChild(currChild);
                    wrapDel.appendChild(currChild);
                } else {
                    this.addCSSClass(currChild, 'delete');
                    this._removeColorStyles(currChild);
                }
            }
            for (i = 0; i < newTextWithBreaks.childNodes.length; i++) {
                currChild = newTextWithBreaks.childNodes[i];
                if (currChild.nodeType === TEXT_NODE) {
                    var wrapIns = document.createElement('ins');
                    newTextWithBreaks.insertBefore(wrapIns, currChild);
                    newTextWithBreaks.removeChild(currChild);
                    wrapIns.appendChild(currChild);
                } else {
                    this.addCSSClass(currChild, 'insert');
                    this._removeColorStyles(currChild);
                }
            }

            var mergedFragment = document.createDocumentFragment(),
                el;
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

            return this._serializeDom(mergedFragment);
        };

        this.addCSSClassToFirstTag = function (html, className) {
            return html.replace(/<[a-z][^>]*>/i, function (match) {
                if (match.match(/class=["'][a-z0-9 _-]*["']/i)) {
                    return match.replace(/class=["']([a-z0-9 _-]*)["']/i, function (match2, previousClasses) {
                        return "class=\"" + previousClasses + " " + className + "\"";
                    });
                } else {
                    return match.substring(0, match.length - 1) + " class=\"" + className + "\">";
                }
            });
        };

        this._addClassToLastNode = function (html, className) {
            var node = document.createElement('div');
            node.innerHTML = html;
            var foundLast = false;
            for (var i = node.childNodes.length - 1; i >= 0 && !foundLast; i--) {
                if (node.childNodes[i].nodeType === ELEMENT_NODE) {
                    var classes = [];
                    if (node.childNodes[i].getAttribute("class")) {
                        classes = node.childNodes[i].getAttribute("class").split(" ");
                    }
                    classes.push(className);
                    node.childNodes[i].setAttribute("class", classes.sort().join(' ').replace(/^\s+/, '').replace(/\s+$/, ''));
                    foundLast = true;
                }
            }
            return node.innerHTML;
        };

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
        this._removeColorStyles = function (node) {
            var styles = node.getAttribute('style');
            if (styles && styles.indexOf('color') > -1) {
                var stylesNew = [];
                styles.split(';').forEach(function(style) {
                    if (!style.match(/^\s*color\s*:/i)) {
                        stylesNew.push(style);
                    }
                });
                if (stylesNew.join(";") === '') {
                    node.removeAttribute('style');
                } else {
                    node.setAttribute('style', stylesNew.join(";"));
                }
            }
            for (var i = 0; i < node.childNodes.length; i++) {
                if (node.childNodes[i].nodeType === ELEMENT_NODE) {
                    this._removeColorStyles(node.childNodes[i]);
                }
            }
        };

        /**
         * This function calculates the diff between two strings and tries to fix problems with the resulting HTML.
         * If lineLength and firstLineNumber is given, line numbers will be returned es well
         *
         * @param {number} lineLength
         * @param {number} firstLineNumber
         * @param {string} htmlOld
         * @param {string} htmlNew
         * @returns {string}
         */
        this.diff = function (htmlOld, htmlNew, lineLength, firstLineNumber) {
            var cacheKey = lineLength + ' ' + firstLineNumber + ' ' +
                    lineNumberingService.djb2hash(htmlOld) + lineNumberingService.djb2hash(htmlNew),
                cached = diffCache.get(cacheKey);
            if (!angular.isUndefined(cached)) {
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
            var workaroundPrepend = "<DUMMY><PREPEND>";

            // os-split-after should not be considered for detecting changes in paragraphs, so we strip it here
            // and add it afterwards.
            // We only do this for P for now, as for more complex types like UL/LI that tend to be nestend,
            // information would get lost by this that we will need to recursively merge it again later on.
            var oldIsSplitAfter = false,
                newIsSplitAfter = false;
            htmlOld = htmlOld.replace(/(\s*<p[^>]+class\s*=\s*["'][^"']*)os-split-after/gi, function(match, beginning) {
                oldIsSplitAfter = true;
                return beginning;
            });
            htmlNew = htmlNew.replace(/(\s*<p[^>]+class\s*=\s*["'][^"']*)os-split-after/gi, function(match, beginning) {
                newIsSplitAfter = true;
                return beginning;
            });

            // Performing the actual diff
            var str = this._diffString(workaroundPrepend + htmlOld, workaroundPrepend + htmlNew),
                diffUnnormalized = str.replace(/^\s+/g, '').replace(/\s+$/g, '').replace(/ {2,}/g, ' ');

            // Remove <del> tags that only delete line numbers
            // We need to do this before removing </del><del> as done in one of the next statements
            diffUnnormalized = diffUnnormalized.replace(
                /<del>((<BR CLASS="os-line-break"><\/del><del>)?(<span[^>]+os-line-number[^>]+?>)(\s|<\/?del>)*<\/span>)<\/del>/gi,
                function(found,tag,br,span) {
                    return (br !== undefined ? br : '') + span + ' </span>';
                }
            );

            diffUnnormalized = diffUnnormalized.replace(/<\/ins><ins>/gi, '').replace(/<\/del><del>/gi, '');

            // Move whitespaces around inserted P's out of the INS-tag
            diffUnnormalized = diffUnnormalized.replace(
                /<ins>(\s*)(<p( [^>]*)?>[\s\S]*?<\/p>)(\s*)<\/ins>/gim,
                function(match, whiteBefore, inner, tagInner, whiteAfter) {
                    return whiteBefore +
                        inner
                        .replace(/<p( [^>]*)?>/gi, function(match) {
                            return match + "<ins>";
                        })
                        .replace(/<\/p>/gi, "</ins></p>") +
                        whiteAfter;
                }
            );

            // Fixes HTML produced by the diff like this:
            // from: <del></P></del><ins> Inserted Text</P>\n<P>More inserted text</P></ins>
            // into: <ins> Inserted Text</ins></P>\n<P>More inserted text</ins></P>
            diffUnnormalized = diffUnnormalized.replace(
                /<del><\/p><\/del><ins>([\s\S]*?)<\/p><\/ins>/gim,
                "<ins>$1</ins></p>"
            );
            diffUnnormalized = diffUnnormalized.replace(
                /<ins>[\s\S]*?<\/ins>/gim,
                function(match) {
                    return match.replace(/(<\/p>\s*<p>)/gi, "</ins>$1<ins>");
                }
            );

            // If only a few characters of a word have changed, don't display this as a replacement of the whole word,
            // but only of these specific characters
            diffUnnormalized = diffUnnormalized.replace(/<del>([a-z0-9,_-]* ?)<\/del><ins>([a-z0-9,_-]* ?)<\/ins>/gi, function (found, oldText, newText) {
                var foundDiff = false, commonStart = '', commonEnd = '',
                    remainderOld = oldText, remainderNew = newText;

                while (remainderOld.length > 0 && remainderNew.length > 0 && !foundDiff) {
                    if (remainderOld[0] == remainderNew[0]) {
                        commonStart += remainderOld[0];
                        remainderOld = remainderOld.substr(1);
                        remainderNew = remainderNew.substr(1);
                    } else {
                        foundDiff = true;
                    }
                }

                foundDiff = false;
                while (remainderOld.length > 0 && remainderNew.length > 0 && !foundDiff) {
                    if (remainderOld[remainderOld.length - 1] == remainderNew[remainderNew.length - 1]) {
                        commonEnd = remainderOld[remainderOld.length - 1] + commonEnd;
                        remainderNew = remainderNew.substr(0, remainderNew.length - 1);
                        remainderOld = remainderOld.substr(0, remainderOld.length - 1);
                    } else {
                        foundDiff = true;
                    }
                }

                var out = commonStart;
                if (remainderOld !== '') {
                    out += '<del>' + remainderOld + '</del>';
                }
                if (remainderNew !== '') {
                    out += '<ins>' + remainderNew + '</ins>';
                }
                out += commonEnd;

                return out;
            });

            // Replace spaces in line numbers by &nbsp;
            diffUnnormalized = diffUnnormalized.replace(
                /<span[^>]+os-line-number[^>]+?>\s*<\/span>/gi,
                function(found) {
                    return found.toLowerCase().replace(/> <\/span/gi, ">&nbsp;</span");
                }
            );


            if (diffUnnormalized.substr(0, workaroundPrepend.length) === workaroundPrepend) {
                diffUnnormalized = diffUnnormalized.substring(workaroundPrepend.length);
            }

            var diff;
            if (this._diffDetectBrokenDiffHtml(diffUnnormalized)) {
                diff = this._diffParagraphs(htmlOld, htmlNew, lineLength, firstLineNumber);
            } else {
                diffUnnormalized = diffUnnormalized.replace(/<ins>.*?(\n.*?)*<\/ins>/gi, function (found) {
                    found = found.replace(/<(div|p|li)[^>]*>/gi, function(match) { return match + '<ins>'; });
                    found = found.replace(/<\/(div|p|li)[^>]*>/gi, function(match) { return '</ins>' + match; });
                    return found;
                });
                diffUnnormalized = diffUnnormalized.replace(/<del>.*?(\n.*?)*<\/del>/gi, function (found) {
                    found = found.replace(/<(div|p|li)[^>]*>/gi, function(match) { return match + '<del>'; });
                    found = found.replace(/<\/(div|p|li)[^>]*>/gi, function(match) { return '</del>' + match; });
                    return found;
                });
                diffUnnormalized = diffUnnormalized.replace(/^<del><p>(.*)<\/p><\/del>$/gi, function(match, inner) { return "<p>" + inner + "</p>"; });

                var node = document.createElement('div');
                node.innerHTML = diffUnnormalized;
                diff = node.innerHTML;

                if (lineLength !== undefined && firstLineNumber !== undefined) {
                    node = lineNumberingService.insertLineNumbersNode(diff, lineLength, null, firstLineNumber);
                    diff = node.innerHTML;
                }
            }

            if (oldIsSplitAfter || newIsSplitAfter) {
                diff = this._addClassToLastNode(diff, "os-split-after");
            }

            diffCache.put(cacheKey, diff);
            return diff;
        };
    }
]);

}());
