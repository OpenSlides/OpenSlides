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

  });

});