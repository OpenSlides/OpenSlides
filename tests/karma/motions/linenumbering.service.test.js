describe('linenumbering', function () {

  beforeEach(module('OpenSlidesApp.motions'));

  var lineNumberingService;

  beforeEach(inject(function(_lineNumberingService_){
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
      var out = lineNumberingService._textNodeToLines(textNode, 5);
      var outHtml = lineNumberingService._nodesToHtml(out);
      expect(outHtml).toBe('01234<br class="os-line-break">56789<br class="os-line-break">01234<br class="os-line-break">567');
      expect(lineNumberingService._currentInlineOffset).toBe(3);
    });

    it('breaks simple lines with offset', function () {
      var textNode = document.createTextNode("012345678901234567");
      lineNumberingService._currentInlineOffset = 2;
      var out = lineNumberingService._textNodeToLines(textNode, 5);
      var outHtml = lineNumberingService._nodesToHtml(out);
      expect(outHtml).toBe('012<br class="os-line-break">34567<br class="os-line-break">89012<br class="os-line-break">34567');
      expect(lineNumberingService._currentInlineOffset).toBe(5);
    });

    it('breaks simple lines with offset equaling to length', function () {
      var textNode = document.createTextNode("012345678901234567");
      lineNumberingService._currentInlineOffset = 5;
      var out = lineNumberingService._textNodeToLines(textNode, 5);
      var outHtml = lineNumberingService._nodesToHtml(out);
      expect(outHtml).toBe('<br class="os-line-break">01234<br class="os-line-break">56789<br class="os-line-break">01234<br class="os-line-break">567');
      expect(lineNumberingService._currentInlineOffset).toBe(3);
    });

    it('breaks simple lines with spaces (1)', function () {
      var textNode = document.createTextNode("0123 45 67 89012 34 567");
      lineNumberingService._currentInlineOffset = 0;
      var out = lineNumberingService._textNodeToLines(textNode, 5);
      var outHtml = lineNumberingService._nodesToHtml(out);
      expect(outHtml).toBe('0123 <br class="os-line-break">45 67 <br class="os-line-break">89012 <br class="os-line-break">34 <br class="os-line-break">567');
      expect(lineNumberingService._currentInlineOffset).toBe(3);
    });

    it('breaks simple lines with spaces (2)', function () {
      var textNode = document.createTextNode("0123 45 67 89012tes 344 ");
      lineNumberingService._currentInlineOffset = 0;
      var out = lineNumberingService._textNodeToLines(textNode, 5);
      var outHtml = lineNumberingService._nodesToHtml(out);
      expect(outHtml).toBe('0123 <br class="os-line-break">45 67 <br class="os-line-break">89012<br class="os-line-break">tes <br class="os-line-break">344 ');
      expect(lineNumberingService._currentInlineOffset).toBe(4);
    });

    it('breaks simple lines with spaces (3)', function () {
      var textNode = document.createTextNode("I'm a Demo-Text");
      lineNumberingService._currentInlineOffset = 0;
      var out = lineNumberingService._textNodeToLines(textNode, 5);
      var outHtml = lineNumberingService._nodesToHtml(out);
      expect(outHtml).toBe('I\'m a <br class="os-line-break">Demo-<br class="os-line-break">Text');
      expect(lineNumberingService._currentInlineOffset).toBe(4);
    });

    it('breaks simple lines with spaces (4)', function () {
      var textNode = document.createTextNode("I'm a LongDemo-Text");
      lineNumberingService._currentInlineOffset = 0;
      var out = lineNumberingService._textNodeToLines(textNode, 5);
      var outHtml = lineNumberingService._nodesToHtml(out);
      expect(outHtml).toBe('I\'m a <br class="os-line-break">LongD<br class="os-line-break">emo-<br class="os-line-break">Text');
      expect(lineNumberingService._currentInlineOffset).toBe(4);
    });
  });


  describe('line numbering: inline nodes', function () {
    it('leaves a simple SPAN untouched', function() {
      lineNumberingService.setLineLength(5);
      var outHtml = lineNumberingService.insertLineNumbers("<span>Test</span>");
      expect(outHtml).toBe('<span>Test</span>');
    });

    it('breaks lines in a simple SPAN', function() {
      lineNumberingService.setLineLength(5);
      var outHtml = lineNumberingService.insertLineNumbers("<span>Lorem ipsum dolorsit amet</span>");
      expect(outHtml).toBe('<span>Lorem <br class="os-line-break">ipsum <br class="os-line-break">dolor<br class="os-line-break">sit <br class="os-line-break">amet</span>');
    });

    it('breaks lines in nested inline elements', function() {
      lineNumberingService.setLineLength(5);
      var outHtml = lineNumberingService.insertLineNumbers("<span>Lorem <strong>ipsum dolorsit</strong> amet</span>");
      expect(outHtml).toBe('<span>Lorem <br class="os-line-break"><strong>ipsum <br class="os-line-break">dolor<br class="os-line-break">sit</strong> <br class="os-line-break">amet</span>');
    });
  });


  describe('line numbering: block nodes', function () {
    it('leaves a simple DIV untouched', function() {
      lineNumberingService.setLineLength(5);
      var outHtml = lineNumberingService.insertLineNumbers("<div>Test</div>");
      expect(outHtml).toBe('<div>Test</div>');
    });

    it('breaks a DIV containing only inline elements', function() {
      lineNumberingService.setLineLength(5);
      var outHtml = lineNumberingService.insertLineNumbers("<div>Test <span>Test1234</span>5678 Test</div>");
      expect(outHtml).toBe('<div>Test <br class="os-line-break"><span>Test1<br class="os-line-break">234</span>56<br class="os-line-break">78 <br class="os-line-break">Test</div>');
    });

    it('handles a DIV within a DIV correctly', function() {
      lineNumberingService.setLineLength(5);
      var outHtml = lineNumberingService.insertLineNumbers("<div>Te<div>Te Test</div>Test");
      expect(outHtml).toBe('<div>Te<div>Te <br class="os-line-break">Test</div>Test</div>');
    });
  });
});
