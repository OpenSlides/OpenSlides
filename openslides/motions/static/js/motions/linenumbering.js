(function () {

"use strict";

angular.module('OpenSlidesApp.motions', [])

.controller('CalculatorController', function CalculatorController($scope) {
  $scope.sum = function() {
    if ($scope.x === undefined || $scope.y === undefined) {
      $scope.z = 0;
    } else {
      $scope.z = $scope.x + $scope.y;
    }
  };
})


.service('lineNumberingService', function lineNumberingService() {
    var ELEMENT_NODE = 1,
        TEXT_NODE = 3;


    this.helloWorld = function() {
        return 'Hello World';
    };

    this.lineLength = 80;

    this.setLineLength = function(length) {
        this.lineLength = length;
    };

    this._textNodeToLines = function(node, length, offset) {
        var out = [],
            currLineStart = 0,
            currLineOffset = offset,
            i = 0,
            firstTextNode = true,
            lastBreakableIndex = null;

        var addLine = function(text) {
                var newNode = document.createTextNode(text);
                if (firstTextNode) {
                    firstTextNode = false;
                } else {
                    var br = document.createElement('br');
                    out.push(br);
                }
                out.push(newNode)
            };

        // This happens if a previous inline element exactly stretches to the end of the line
        if (currLineOffset >= length) {
            var br = document.createElement('br');
            out.push(br);
            currLineOffset = 0;
        }

        while (i < node.nodeValue.length) {
            var lineBreakAt = null;
            if (currLineOffset >= length) {
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
                currLineOffset = i - lineBreakAt - 1;
                lastBreakableIndex = null;
            }

            if (node.nodeValue[i] == ' ' || node.nodeValue[i] == '-') {
                lastBreakableIndex = i;
            }

            currLineOffset++;
            i++;

        }
        addLine(node.nodeValue.substring(currLineStart));

        return { "nodes": out, "newOffset": currLineOffset };
    };

    this._insertLineNumbersToNode = function(node, length) {
        var out = [],
            i, j, lines;
        if (node.nodeType == TEXT_NODE) {
            var ret = this._textNodeToLines(node, length, 0);
            for (i in ret.nodes) {
                out.push(ret.nodes[i]);
            }
        } else if (node.nodeType == ELEMENT_NODE) {
            for (i in node.childNodes) {
                lines = this._insertLineNumbersToNode(node.childNodes[i]);
                for (j in lines) {
                    out.push(lines[j]);
                }
            }
        } else {
            throw "Unknown nodeType: " + node.nodeType;
        }
        return out;
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

        var out = this._insertLineNumbersToNode(root, this.lineLength);

        return this._nodesToHtml(out);
    }
});


}());
