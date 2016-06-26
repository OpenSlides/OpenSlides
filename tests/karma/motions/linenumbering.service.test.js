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
      var out = lineNumberingService._textNodeToLines(textNode, 5, 0);
      var outHtml = lineNumberingService._nodesToHtml(out.nodes);
      expect(outHtml).toBe('0123');
      expect(out.newOffset).toBe(4);
    });

    it('breaks simple lines', function() {
      var textNode = document.createTextNode("012345678901234567");
      var out = lineNumberingService._textNodeToLines(textNode, 5, 0);
      var outHtml = lineNumberingService._nodesToHtml(out.nodes);
      expect(outHtml).toBe('01234<br>56789<br>01234<br>567');
      expect(out.newOffset).toBe(3);
    });

    it('breaks simple lines with offset', function() {
      var textNode = document.createTextNode("012345678901234567");
      var out = lineNumberingService._textNodeToLines(textNode, 5, 2);
      var outHtml = lineNumberingService._nodesToHtml(out.nodes);
      expect(outHtml).toBe('012<br>34567<br>89012<br>34567');
      expect(out.newOffset).toBe(5);
    });

    it('breaks simple lines with offset equaling to length', function() {
      var textNode = document.createTextNode("012345678901234567");
      var out = lineNumberingService._textNodeToLines(textNode, 5, 5);
      var outHtml = lineNumberingService._nodesToHtml(out.nodes);
      expect(outHtml).toBe('<br>01234<br>56789<br>01234<br>567');
      expect(out.newOffset).toBe(3);
    });

    it('breaks simple lines with spaces (1)', function() {
      var textNode = document.createTextNode("0123 45 67 89012 34 567");
      var out = lineNumberingService._textNodeToLines(textNode, 5, 0);
      var outHtml = lineNumberingService._nodesToHtml(out.nodes);
      expect(outHtml).toBe('0123 <br>45 67 <br>89012 <br>34 <br>567');
      expect(out.newOffset).toBe(3);
    });

    it('breaks simple lines with spaces (2)', function() {
      var textNode = document.createTextNode("0123 45 67 89012tes 344 ");
      var out = lineNumberingService._textNodeToLines(textNode, 5, 0);
      var outHtml = lineNumberingService._nodesToHtml(out.nodes);
      expect(outHtml).toBe('0123 <br>45 67 <br>89012<br>tes <br>344 ');
      expect(out.newOffset).toBe(4);
    });
  });

});