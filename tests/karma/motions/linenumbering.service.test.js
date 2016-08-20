describe('linenumbering', function () {

  beforeEach(module('OpenSlidesApp.motions.lineNumbering'));

  var lineNumberingService,
      brMarkup = function (no) {
        return '<br class="os-line-break">' +
            '<span class="os-line-number line-number-' + no + '" data-line-number="' + no + '" contenteditable="false">&nbsp;</span>';
      },
      noMarkup = function (no) {
        return '<span class="os-line-number line-number-' + no + '" data-line-number="' + no + '" contenteditable="false">&nbsp;</span>';
      },
      longstr = function (length) {
        var outstr = '';
        for (var i = 0; i < length; i++) {
          outstr += String.fromCharCode(65 + (i % 26));
        }
        return outstr;
      };

  beforeEach(inject(function (_lineNumberingService_) {
    lineNumberingService = _lineNumberingService_;
  }));

  describe('line numbering: test nodes', function () {
    it('breaks very short lines', function () {
      var textNode = document.createTextNode("0123");
      lineNumberingService._currentInlineOffset = 0;
      var out = lineNumberingService._textNodeToLines(textNode, 5);
      var outHtml = lineNumberingService._nodesToHtml(out);
      expect(outHtml).toBe('0123');
      expect(lineNumberingService._currentInlineOffset).toBe(4);
    });

    it('breaks simple lines', function () {
      var textNode = document.createTextNode("012345678901234567");
      lineNumberingService._currentInlineOffset = 0;
      lineNumberingService._currentLineNumber = 1;
      var out = lineNumberingService._textNodeToLines(textNode, 5);
      var outHtml = lineNumberingService._nodesToHtml(out);
      expect(outHtml).toBe('01234' + brMarkup(1) + '56789' + brMarkup(2) + '01234' + brMarkup(3) + '567');
      expect(lineNumberingService._currentInlineOffset).toBe(3);
    });

    it('breaks simple lines with offset', function () {
      var textNode = document.createTextNode("012345678901234567");
      lineNumberingService._currentInlineOffset = 2;
      lineNumberingService._currentLineNumber = 1;
      var out = lineNumberingService._textNodeToLines(textNode, 5);
      var outHtml = lineNumberingService._nodesToHtml(out);
      expect(outHtml).toBe('012' + brMarkup(1) + '34567' + brMarkup(2) + '89012' + brMarkup(3) + '34567');
      expect(lineNumberingService._currentInlineOffset).toBe(5);
    });

    it('breaks simple lines with offset equaling to length', function () {
      var textNode = document.createTextNode("012345678901234567");
      lineNumberingService._currentInlineOffset = 5;
      lineNumberingService._currentLineNumber = 1;
      var out = lineNumberingService._textNodeToLines(textNode, 5);
      var outHtml = lineNumberingService._nodesToHtml(out);
      expect(outHtml).toBe(brMarkup(1) + '01234' + brMarkup(2) + '56789' + brMarkup(3) + '01234' + brMarkup(4) + '567');
      expect(lineNumberingService._currentInlineOffset).toBe(3);
    });

    it('breaks simple lines with spaces (1)', function () {
      var textNode = document.createTextNode("0123 45 67 89012 34 567");
      lineNumberingService._currentInlineOffset = 0;
      lineNumberingService._currentLineNumber = 1;
      var out = lineNumberingService._textNodeToLines(textNode, 5);
      var outHtml = lineNumberingService._nodesToHtml(out);
      expect(outHtml).toBe('0123 ' + brMarkup(1) + '45 67 ' + brMarkup(2) + '89012 ' + brMarkup(3) + '34 ' + brMarkup(4) + '567');
      expect(lineNumberingService._currentInlineOffset).toBe(3);
    });

    it('breaks simple lines with spaces (2)', function () {
      var textNode = document.createTextNode("0123 45 67 89012tes 344 ");
      lineNumberingService._currentInlineOffset = 0;
      lineNumberingService._currentLineNumber = 1;
      var out = lineNumberingService._textNodeToLines(textNode, 5);
      var outHtml = lineNumberingService._nodesToHtml(out);
      expect(outHtml).toBe('0123 ' + brMarkup(1) + '45 67 ' + brMarkup(2) + '89012' + brMarkup(3) + 'tes ' + brMarkup(4) + '344 ');
      expect(lineNumberingService._currentInlineOffset).toBe(4);
    });

    it('breaks simple lines with spaces (3)', function () {
      var textNode = document.createTextNode("I'm a Demo-Text");
      lineNumberingService._currentInlineOffset = 0;
      lineNumberingService._currentLineNumber = 1;
      var out = lineNumberingService._textNodeToLines(textNode, 5);
      var outHtml = lineNumberingService._nodesToHtml(out);
      expect(outHtml).toBe('I\'m a ' + brMarkup(1) + 'Demo-' + brMarkup(2) + 'Text');
      expect(lineNumberingService._currentInlineOffset).toBe(4);
    });

    it('breaks simple lines with spaces (4)', function () {
      var textNode = document.createTextNode("I'm a LongDemo-Text");
      lineNumberingService._currentInlineOffset = 0;
      lineNumberingService._currentLineNumber = 1;
      var out = lineNumberingService._textNodeToLines(textNode, 5);
      var outHtml = lineNumberingService._nodesToHtml(out);
      expect(outHtml).toBe('I\'m a ' + brMarkup(1) + 'LongD' + brMarkup(2) + 'emo-' + brMarkup(3) + 'Text');
      expect(lineNumberingService._currentInlineOffset).toBe(4);
    });
  });


  describe('line numbering: inline nodes', function () {
    it('leaves a simple SPAN untouched', function () {
      var inHtml = "<span>Test</span>";
      var outHtml = lineNumberingService.insertLineNumbers(inHtml, 5);
      expect(outHtml).toBe(noMarkup(1) + '<span>Test</span>');
      expect(lineNumberingService.stripLineNumbers(outHtml)).toBe(inHtml);
    });

    it('breaks lines in a simple SPAN', function () {
      var inHtml = "<span>Lorem ipsum dolorsit amet</span>";
      var outHtml = lineNumberingService.insertLineNumbers(inHtml, 5);
      expect(outHtml).toBe(noMarkup(1) + '<span>Lorem ' + brMarkup(2) + 'ipsum ' + brMarkup(3) + 'dolor' + brMarkup(4) + 'sit ' + brMarkup(5) + 'amet</span>');
      expect(lineNumberingService.stripLineNumbers(outHtml)).toBe(inHtml);
    });

    it('breaks lines in nested inline elements', function () {
      var inHtml = "<span>Lorem <strong>ipsum dolorsit</strong> amet</span>";
      var outHtml = lineNumberingService.insertLineNumbers(inHtml, 5);
      expect(outHtml).toBe(noMarkup(1) + '<span>Lorem ' + brMarkup(2) + '<strong>ipsum ' + brMarkup(3) + 'dolor' + brMarkup(4) + 'sit</strong> ' + brMarkup(5) + 'amet</span>');
      expect(lineNumberingService.stripLineNumbers(outHtml)).toBe(inHtml);
    });
  });


  describe('line numbering: block nodes', function () {
    it('leaves a simple DIV untouched', function () {
      var inHtml = "<div>Test</div>";
      var outHtml = lineNumberingService.insertLineNumbers(inHtml, 5);
      expect(outHtml).toBe('<div>' + noMarkup(1) + 'Test</div>');
      expect(lineNumberingService.stripLineNumbers(outHtml)).toBe(inHtml);
    });

    it('breaks a DIV containing only inline elements', function () {
      var inHtml = "<div>Test <span>Test1234</span>5678 Test</div>";
      var outHtml = lineNumberingService.insertLineNumbers(inHtml, 5);
      expect(outHtml).toBe('<div>' + noMarkup(1) + 'Test ' + brMarkup(2) + '<span>Test1' + brMarkup(3) + '234</span>56' + brMarkup(4) + '78 ' + brMarkup(5) + 'Test</div>');
      expect(lineNumberingService.stripLineNumbers(outHtml)).toBe(inHtml);
    });

    it('handles a DIV within a DIV correctly', function () {
      var inHtml = "<div>Te<div>Te Test</div>Test</div>";
      var outHtml = lineNumberingService.insertLineNumbers(inHtml, 5);
      expect(outHtml).toBe('<div>' + noMarkup(1) + 'Te<div>' + noMarkup(2) + 'Te ' + brMarkup(3) + 'Test</div>' + noMarkup(4) + 'Test</div>');
      expect(lineNumberingService.stripLineNumbers(outHtml)).toBe(inHtml);
    });

    it('ignores white spaces between block element tags', function () {
      var inHtml = "<ul>\n<li>Test</li>\n</ul>";
      var outHtml = lineNumberingService.insertLineNumbers(inHtml, 80);
      expect(outHtml).toBe("<ul>\n<li>" + noMarkup(1) + 'Test</li>\n</ul>');
      expect(lineNumberingService.stripLineNumbers(outHtml)).toBe(inHtml);
    });
  });


  describe('indentation for block elements', function () {
    it('indents LI-elements', function () {
      var inHtml = '<div>' +longstr(100) + '<ul><li>' + longstr(100) + '</li></ul>' + longstr(100) + '</div>';
      var expected = '<div>' + noMarkup(1) +
          'ABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZAB' + brMarkup(2) + 'CDEFGHIJKLMNOPQRSTUV' +
          '<ul><li>' + noMarkup(3) +
          'ABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVW' + brMarkup(4) + 'XYZABCDEFGHIJKLMNOPQRSTUV' +
          '</li></ul>' + noMarkup(5) +
          'ABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZAB' + brMarkup(6) + 'CDEFGHIJKLMNOPQRSTUV</div>';
      var outHtml = lineNumberingService.insertLineNumbers(inHtml, 80);
      expect(outHtml).toBe(expected);
      expect(lineNumberingService.stripLineNumbers(outHtml)).toBe(inHtml);
    });

    it('indents BLOCKQUOTE-elements', function () {
      var inHtml = '<div>' +longstr(100) + '<blockquote>' + longstr(100) + '</blockquote>' + longstr(100) + '</div>';
      var expected = '<div>' + noMarkup(1) +
          'ABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZAB' + brMarkup(2) + 'CDEFGHIJKLMNOPQRSTUV' +
          '<blockquote>' + noMarkup(3) +
          'ABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGH' + brMarkup(4) + 'IJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUV' +
          '</blockquote>' + noMarkup(5) +
          'ABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZAB' + brMarkup(6) + 'CDEFGHIJKLMNOPQRSTUV</div>';
      var outHtml = lineNumberingService.insertLineNumbers(inHtml, 80);
      expect(outHtml).toBe(expected);
      expect(lineNumberingService.stripLineNumbers(outHtml)).toBe(inHtml);
    });

    it('shortens the line for H1-elements by 1/2', function () {
      var inHtml = '<h1>' + longstr(80) + '</h1>';
      var expected = '<h1>' + noMarkup(1) + 'ABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMN' +
          brMarkup(2) + 'OPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZAB</h1>';
      var outHtml = lineNumberingService.insertLineNumbers(inHtml, 80);
      expect(outHtml).toBe(expected);
      expect(lineNumberingService.stripLineNumbers(outHtml)).toBe(inHtml);
    });

    it('shortens the line for H2-elements by 2/3', function () {
      var inHtml = '<h2>' + longstr(80) + '</h2>';
      var expected = '<h2>' + noMarkup(1) + 'ABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZA' +
          brMarkup(2) + 'BCDEFGHIJKLMNOPQRSTUVWXYZAB</h2>';
      var outHtml = lineNumberingService.insertLineNumbers(inHtml, 80);
      expect(outHtml).toBe(expected);
      expect(lineNumberingService.stripLineNumbers(outHtml)).toBe(inHtml);
    });

    it('indents Ps with 30px-padding by 6 characters', function () {
      var inHtml = '<div style="padding-left: 30px;">' + longstr(80) + '</div>';
      var expected = '<div style="padding-left: 30px;">' + noMarkup(1) + 'ABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUV' +
          brMarkup(2) + 'WXYZAB</div>';
      var outHtml = lineNumberingService.insertLineNumbers(inHtml, 80);
      expect(outHtml).toBe(expected);
      expect(lineNumberingService.stripLineNumbers(outHtml)).toBe(inHtml);
    });
  });
});
