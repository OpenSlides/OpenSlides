describe('linenumbering', function () {

  beforeEach(module('OpenSlidesApp.motions'));

  var lineNumberingService;

  beforeEach(inject(function(_lineNumberingService_){
    lineNumberingService = _lineNumberingService_;
  }));

  describe('line numbering', function () {
    it('should output hello world', function () {
        var out = lineNumberingService.helloWorld();
        expect(out).toBe('Hello World');
    });
    
    it('breaks very short lines', function() {
      var textNode = document.createTextNode("0123");
      lineNumberingService._currentInlineOffset = 0;
      var out = lineNumberingService._textNodeToLines(textNode, 5);
      var outHtml = lineNumberingService._nodesToHtml(out);
      expect(outHtml).toBe('0123');
      expect(lineNumberingService._currentInlineOffset).toBe(4);
    });

    it('breaks simple lines', function() {
      var textNode = document.createTextNode("012345678901234567");
      lineNumberingService._currentInlineOffset = 0;
      var out = lineNumberingService._textNodeToLines(textNode, 5);
      var outHtml = lineNumberingService._nodesToHtml(out);
      expect(outHtml).toBe('01234<br class="os-line-break">56789<br class="os-line-break">01234<br class="os-line-break">567');
      expect(lineNumberingService._currentInlineOffset).toBe(3);
    });

    it('breaks simple lines with offset', function() {
      var textNode = document.createTextNode("012345678901234567");
      lineNumberingService._currentInlineOffset = 2;
      var out = lineNumberingService._textNodeToLines(textNode, 5);
      var outHtml = lineNumberingService._nodesToHtml(out);
      expect(outHtml).toBe('012<br class="os-line-break">34567<br class="os-line-break">89012<br class="os-line-break">34567');
      expect(lineNumberingService._currentInlineOffset).toBe(5);
    });

    it('breaks simple lines with offset equaling to length', function() {
      var textNode = document.createTextNode("012345678901234567");
      lineNumberingService._currentInlineOffset = 5;
      var out = lineNumberingService._textNodeToLines(textNode, 5);
      var outHtml = lineNumberingService._nodesToHtml(out);
      expect(outHtml).toBe('<br class="os-line-break">01234<br class="os-line-break">56789<br class="os-line-break">01234<br class="os-line-break">567');
      expect(lineNumberingService._currentInlineOffset).toBe(3);
    });

    it('breaks simple lines with spaces (1)', function() {
      var textNode = document.createTextNode("0123 45 67 89012 34 567");
      lineNumberingService._currentInlineOffset = 0;
      var out = lineNumberingService._textNodeToLines(textNode, 5);
      var outHtml = lineNumberingService._nodesToHtml(out);
      expect(outHtml).toBe('0123 <br class="os-line-break">45 67 <br class="os-line-break">89012 <br class="os-line-break">34 <br class="os-line-break">567');
      expect(lineNumberingService._currentInlineOffset).toBe(3);
    });

    it('breaks simple lines with spaces (2)', function() {
      var textNode = document.createTextNode("0123 45 67 89012tes 344 ");
      lineNumberingService._currentInlineOffset = 0;
      var out = lineNumberingService._textNodeToLines(textNode, 5);
      var outHtml = lineNumberingService._nodesToHtml(out);
      expect(outHtml).toBe('0123 <br class="os-line-break">45 67 <br class="os-line-break">89012<br class="os-line-break">tes <br class="os-line-break">344 ');
      expect(lineNumberingService._currentInlineOffset).toBe(4);
    });

    it('breaks simple lines with spaces (3)', function() {
      var textNode = document.createTextNode("I'm a Demo-Text");
      lineNumberingService._currentInlineOffset = 0;
      var out = lineNumberingService._textNodeToLines(textNode, 5);
      var outHtml = lineNumberingService._nodesToHtml(out);
      expect(outHtml).toBe('I\'m a <br class="os-line-break">Demo-<br class="os-line-break">Text');
      expect(lineNumberingService._currentInlineOffset).toBe(4);
    });

    it('breaks simple lines with spaces (4)', function() {
      var textNode = document.createTextNode("I'm a LongDemo-Text");
      lineNumberingService._currentInlineOffset = 0;
      var out = lineNumberingService._textNodeToLines(textNode, 5);
      var outHtml = lineNumberingService._nodesToHtml(out);
      expect(outHtml).toBe('I\'m a <br class="os-line-break">LongD<br class="os-line-break">emo-<br class="os-line-break">Text');
      expect(lineNumberingService._currentInlineOffset).toBe(4);
    });

    it('should leave a simple SPAN untouched', function() {
      var outHtml = lineNumberingService.insertLineNumbers("<span>Test</span>");
      expect(outHtml).toBe('<span>Test</span>');
    });
  });

});