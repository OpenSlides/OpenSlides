describe('linenumbering', function () {

  beforeEach(module('OpenSlidesApp.motions.diff'));

  var diffService, baseHtml1, baseHtmlDom1, baseHtml2, baseHtmlDom2, baseHtml3, baseHtmlDom3,
      brMarkup = function (no) {
        return '<br class="os-line-break">' +
            '<span class="os-line-number line-number-' + no + '" data-line-number="' + no + '" contenteditable="false">&nbsp;</span>';
      },
      noMarkup = function (no) {
        return '<span class="os-line-number line-number-' + no + '" data-line-number="' + no + '" contenteditable="false">&nbsp;</span>';
      };

  beforeEach(inject(function (_diffService_, _lineNumberingService_) {
    diffService = _diffService_;
    lineNumberingService = _lineNumberingService_;

    baseHtml1 = '<p>' +
          noMarkup(1) + 'Line 1 ' + brMarkup(2) + 'Line 2 ' +
          brMarkup(3) + 'Line <strong>3<br>' + noMarkup(4) + 'Line 4 ' + brMarkup(5) + 'Line</strong> 5</p>' +
          '<ul class="ul-class">' +
            '<li class="li-class">' + noMarkup(6) + 'Line 6 ' + brMarkup(7) + 'Line 7' + '</li>' +
            '<li class="li-class"><ul>' +
              '<li>' + noMarkup(8) + 'Level 2 LI 8</li>' +
              '<li>' + noMarkup(9) + 'Level 2 LI 9</li>' +
            '</ul></li>' +
          '</ul>' +
          '<p>' + noMarkup(10) + 'Line 10 ' + brMarkup(11) + 'Line 11</p>';
    baseHtmlDom1 = diffService.htmlToFragment(baseHtml1);

    baseHtml2 = '<p>' + noMarkup(1) + 'Single text line</p>\
<p>' + noMarkup(2) + 'sdfsdfsdfsdf dsfsdfsdfdsflkewjrl ksjfl ksdjf&nbsp;klnlkjBavaria ipsum dolor sit amet Biazelt Auffisteign ' + brMarkup(3) + 'Schorsch mim Radl foahn Ohrwaschl Steckerleis wann griagd ma nacha wos z’dringa glacht Mamalad, ' +
        brMarkup(4) + 'muass? I bin a woschechta Bayer sowos oamoi und sei und glei wirds no fui lustiga: Jo mei khkhis des ' + brMarkup(5) + 'schee middn ognudelt, Trachtnhuat Biawambn gscheid: Griasd eich midnand etza nix Gwiass woass ma ned ' +
        brMarkup(6) + 'owe. Dahoam gscheckate middn Spuiratz des is a gmahde Wiesn. Des is schee so Obazda san da, Haferl ' + brMarkup(7) + 'pfenningguat schoo griasd eich midnand.</p>\
<ul>\
<li>' + noMarkup(8) + 'Auffi Gamsbart nimma de Sepp Ledahosn Ohrwaschl um Godds wujn Wiesn Deandlgwand Mongdratzal! Jo ' + brMarkup(9) + 'leck mi Mamalad i daad mechad?</li>\
<li>' + noMarkup(10) + 'Do nackata Wurscht i hob di narrisch gean, Diandldrahn Deandlgwand vui huift vui woaß?</li>\
<li>' + noMarkup(11) + 'Ned Mamalad auffi i bin a woschechta Bayer greaßt eich nachad, umananda gwiss nia need ' + brMarkup(12) + 'Weiznglasl.</li>\
<li>' + noMarkup(13) + 'Woibbadinga noch da Giasinga Heiwog Biazelt mechad mim Spuiratz, soi zwoa.</li>\
</ul>\
<p>' + noMarkup(14) + 'I waar soweid Blosmusi es nomoi. Broadwurschtbudn des is a gmahde Wiesn Kirwa mogsd a Bussal ' + brMarkup(15) + 'Guglhupf schüds nei. Luja i moan oiwei Baamwach Watschnbaam, wiavui baddscher! Biakriagal a fescha ' +
        brMarkup(16) + '1Bua Semmlkneedl iabaroi oba um Godds wujn Ledahosn wui Greichats. Geh um Godds wujn luja heid ' + brMarkup(17) + 'greaßt eich nachad woaß Breihaus eam! De om auf’n Gipfe auf gehds beim Schichtl mehra Baamwach a ' + brMarkup(18) + 'bissal wos gehd ollaweil gscheid:</p>\
<blockquote>\
<p>' + noMarkup(19) + 'Scheans Schdarmbeaga See i hob di narrisch gean i jo mei is des schee! Nia eam ' + brMarkup(20) + 'hod vasteh i sog ja nix, i red ja bloß sammawiedaguad, umma eana obandeln! Zwoa ' + brMarkup(21) + 'jo mei scheans amoi, san und hoggd Milli barfuaßat gscheit. Foidweg vui huift ' +
    brMarkup(22) + 'vui singan, mehra Biakriagal om auf’n Gipfe! Ozapfa sodala Charivari greaßt eich ' + brMarkup(23) + 'nachad Broadwurschtbudn do middn liberalitas Bavariae sowos Leonhardifahrt:</p>\
</blockquote>\
<p>' + noMarkup(24) + 'Wui helfgod Wiesn, ognudelt schaugn: Dahoam gelbe Rüam Schneid singan wo hi sauba i moan scho aa no ' + brMarkup(25) + 'a Maß a Maß und no a Maß nimma. Is umananda a ganze Hoiwe zwoa, Schneid. Vui huift vui Brodzeid kumm ' +
        brMarkup(26) + 'geh naa i daad vo de allerweil, gor. Woaß wia Gams, damischa. A ganze Hoiwe Ohrwaschl Greichats ' + brMarkup(27) + 'iabaroi Prosd Engelgwand nix Reiwadatschi.Weibaleid ognudelt Ledahosn noch da Giasinga Heiwog i daad ' +
        brMarkup(28) + 'Almrausch, Ewig und drei Dog nackata wea ko, dea ko. Meidromml Graudwiggal nois dei, nackata. No ' + brMarkup(29) + 'Diandldrahn nix Gwiass woass ma ned hod boarischer: Samma sammawiedaguad wos, i hoam Brodzeid. Jo ' +
        brMarkup(30) + 'mei Sepp Gaudi, is ma Wuascht do Hendl Xaver Prosd eana an a bravs. Sauwedda an Brezn, abfieseln.</p>';
    baseHtmlDom2 = diffService.htmlToFragment(baseHtml2);

    baseHtml3 = '<ol>' +
        '<li>' + noMarkup(1) + 'Line 1</li>' +
        '<li>' + noMarkup(2) + 'Line 2</li>' +
        '<li><ol>' +
            '<li>' + noMarkup(3) + 'Line 3.1</li>' +
            '<li>' + noMarkup(4) + 'Line 3.2</li>' +
            '<li>' + noMarkup(5) + 'Line 3.3</li>' +
        '</ol></li>' +
        '<li>' + noMarkup(6) + ' Line 4</li></ol>';
    baseHtmlDom3 = diffService.htmlToFragment(baseHtml3);

    diffService._insertInternalLineMarkers(baseHtmlDom1);
    diffService._insertInternalLineMarkers(baseHtmlDom2);
  }));


  describe('extraction of lines', function () {
    it('locates line number nodes', function() {
      var lineNumberNode = diffService.getLineNumberNode(baseHtmlDom1, 4);
      expect(lineNumberNode.parentNode.nodeName).toBe('STRONG');

      lineNumberNode = diffService.getLineNumberNode(baseHtmlDom1, 9);
      expect(lineNumberNode.parentNode.nodeName).toBe('UL');

      lineNumberNode = diffService.getLineNumberNode(baseHtmlDom1, 15);
      expect(lineNumberNode).toBe(null);
    });

    it('finds the common ancestor', function() {
      var fromLineNode, toLineNode, commonAncestor;

      fromLineNode = diffService.getLineNumberNode(baseHtmlDom1, 6);
      toLineNode = diffService.getLineNumberNode(baseHtmlDom1, 7);
      commonAncestor = diffService._getCommonAncestor(fromLineNode, toLineNode);
      expect(commonAncestor.commonAncestor.nodeName).toBe("#document-fragment");

      fromLineNode = diffService.getLineNumberNode(baseHtmlDom1, 6);
      toLineNode = diffService.getLineNumberNode(baseHtmlDom1, 8);
      commonAncestor = diffService._getCommonAncestor(fromLineNode, toLineNode);
      expect(commonAncestor.commonAncestor.nodeName).toBe("#document-fragment");

      fromLineNode = diffService.getLineNumberNode(baseHtmlDom1, 6);
      toLineNode = diffService.getLineNumberNode(baseHtmlDom1, 10);
      commonAncestor = diffService._getCommonAncestor(fromLineNode, toLineNode);
      expect(commonAncestor.commonAncestor.nodeName).toBe("#document-fragment");

    });

    it('renders DOMs correctly (1)', function() {
      var lineNo = diffService.getLineNumberNode(baseHtmlDom1, 7),
          greatParent = lineNo.parentNode.parentNode,
          lineTrace = [lineNo.parentNode, lineNo];

      var pre = diffService._serializePartialDomToChild(greatParent, lineTrace, true);
      expect(pre).toBe('<UL class="ul-class"><LI class="li-class">Line 6 ');

      lineTrace = [lineNo.parentNode, lineNo];
      var post = diffService._serializePartialDomFromChild(greatParent, lineTrace, true);
      expect(post).toBe('Line 7' + '</LI>' +
            '<LI class="li-class"><UL>' +
              '<LI>Level 2 LI 8</LI>' +
              '<LI>Level 2 LI 9</LI>' +
            '</UL></LI>' +
          '</UL>');
    });

    it('renders DOMs correctly (2)', function() {
      var lineNo = diffService.getLineNumberNode(baseHtmlDom1, 9),
          greatParent = lineNo.parentNode.parentNode,
          lineTrace = [lineNo.parentNode, lineNo];

      var pre = diffService._serializePartialDomToChild(greatParent, lineTrace, true);
      expect(pre).toBe('<LI class="li-class"><UL><LI>Level 2 LI 8</LI>');
    });

    it('extracts a single line', function () {
      var diff = diffService.extractRangeByLineNumbers(baseHtml1, 1, 2);
      expect(diff.html).toBe('<P>Line 1 ');
      expect(diff.outerContextStart).toBe('');
      expect(diff.outerContextEnd).toBe('');
    });

    it('extracts lines from nested UL/LI-structures', function () {
      var diff = diffService.extractRangeByLineNumbers(baseHtml1, 7, 9);
      expect(diff.html).toBe('Line 7</LI><LI class="li-class"><UL><LI>Level 2 LI 8</LI>');
      expect(diff.ancestor.nodeName).toBe('UL');
      expect(diff.outerContextStart).toBe('<UL class="ul-class">');
      expect(diff.outerContextEnd).toBe('</UL>');
      expect(diff.innerContextStart).toBe('<LI class="li-class">');
      expect(diff.innerContextEnd).toBe('</UL></LI>');
      expect(diff.previousHtmlEndSnippet).toBe('</LI></UL>');
      expect(diff.followingHtmlStartSnippet).toBe('<UL class="ul-class"><LI class="li-class"><UL>');
    });

    it('extracts lines from a more complex example', function () {
      var diff = diffService.extractRangeByLineNumbers(baseHtml2, 6, 11);

      expect(diff.html).toBe('owe. Dahoam gscheckate middn Spuiratz des is a gmahde Wiesn. Des is schee so Obazda san da, Haferl pfenningguat schoo griasd eich midnand.</P><UL><LI>Auffi Gamsbart nimma de Sepp Ledahosn Ohrwaschl um Godds wujn Wiesn Deandlgwand Mongdratzal! Jo leck mi Mamalad i daad mechad?</LI><LI>Do nackata Wurscht i hob di narrisch gean, Diandldrahn Deandlgwand vui huift vui woaß?</LI>');
      expect(diff.ancestor.nodeName).toBe('#document-fragment');
      expect(diff.outerContextStart).toBe('');
      expect(diff.outerContextEnd).toBe('');
      expect(diff.innerContextStart).toBe('<P>');
      expect(diff.innerContextEnd).toBe('</UL>');
      expect(diff.previousHtmlEndSnippet).toBe('</P>');
      expect(diff.followingHtmlStartSnippet).toBe('<UL>');
    });

    it('extracts the end of a section', function () {
      var diff = diffService.extractRangeByLineNumbers(baseHtml2, 29, null);

      expect(diff.html).toBe('Diandldrahn nix Gwiass woass ma ned hod boarischer: Samma sammawiedaguad wos, i hoam Brodzeid. Jo mei Sepp Gaudi, is ma Wuascht do Hendl Xaver Prosd eana an a bravs. Sauwedda an Brezn, abfieseln.</P>');
      expect(diff.ancestor.nodeName).toBe('#document-fragment');
      expect(diff.outerContextStart).toBe('');
      expect(diff.outerContextEnd).toBe('');
      expect(diff.innerContextStart).toBe('<P>');
      expect(diff.innerContextEnd).toBe('');
      expect(diff.previousHtmlEndSnippet).toBe('</P>');
      expect(diff.followingHtml).toBe('');
      expect(diff.followingHtmlStartSnippet).toBe('');
    });

    it('preserves the numbering of OLs (1)', function () {
      var diff = diffService.extractRangeByLineNumbers(baseHtml3, 5, 7, true);

      expect(diff.html).toBe('<LI>Line 3.3</LI></OL></LI><LI> Line 4</LI></OL>');
      expect(diff.ancestor.nodeName).toBe('#document-fragment');
      expect(diff.innerContextStart).toBe('<OL start="3"><LI><OL start="3">');
      expect(diff.innerContextEnd).toBe('');
      expect(diff.previousHtmlEndSnippet).toBe('</OL></LI></OL>');
    });

    it('preserves the numbering of OLs (2)', function () {
      var diff = diffService.extractRangeByLineNumbers(baseHtml3, 3, 5, true);

      expect(diff.html).toBe('<LI><OL><LI>Line 3.1</LI><LI>Line 3.2</LI>');
      expect(diff.ancestor.nodeName).toBe('OL');
      expect(diff.outerContextStart).toBe('<OL start="3">');
      expect(diff.outerContextEnd).toBe('</OL>');
    });

    it('escapes text resembling HTML-Tags', function () {
        var inHtml = '<h2>' + noMarkup(1) + 'Looks like a &lt;p&gt; tag &lt;/p&gt;</h2><p>' + noMarkup(2) + 'Another line</p>';
        var diff = diffService.extractRangeByLineNumbers(inHtml, 1, 2, true);
        expect(diff.html).toBe('<H2>Looks like a &lt;p&gt; tag &lt;/p&gt;</H2>');
    });
  });

  describe('merging two sections', function () {
      it('merges OLs recursively, ignoring whitespaces between OL and LI', function () {
          var node1 = document.createElement('DIV');
          node1.innerHTML = '<OL><LI><OL><LI>Punkt 4.1</LI><TEMPLATE></TEMPLATE></OL></LI> </OL>';
          var node2 = document.createElement('DIV');
          node2.innerHTML = '<OL> <LI>\
<OL start="2">\
 <LI>Punkt 4.2</LI>\
<LI>Punkt 4.3</LI>\
</OL></LI></OL>';
          var out = diffService._replaceLinesMergeNodeArrays([node1.childNodes[0]], [node2.childNodes[0]]);
          expect(out[0], '<ol><li><ol><li>Punkt 4.1</li><template></template><li>Punkt 4.2</li><li>Punkt 4.3</li></ol></li></ol>');
      });
  });

  describe('replacing lines in the original motion', function () {
    it('replaces LIs by a P', function () {
      var merged = diffService.replaceLines(baseHtml1, '<p>Replaced a UL by a P</p>', 6, 9);
      expect(merged).toBe('<P>Line 1 Line 2 Line <STRONG>3<BR>Line 4 Line</STRONG> 5</P><P>Replaced a UL by a P</P><UL class="ul-class"><LI class="li-class"><UL><LI>Level 2 LI 9</LI></UL></LI></UL><P>Line 10 Line 11</P>');
    });

    it('replaces LIs by another LI', function () {
      var merged = diffService.replaceLines(baseHtml1, '<UL class="ul-class"><LI>A new LI</LI></UL>', 6, 9);
      expect(merged).toBe('<P>Line 1 Line 2 Line <STRONG>3<BR>Line 4 Line</STRONG> 5</P><UL class="ul-class"><LI>A new LI<UL><LI>Level 2 LI 9</LI></UL></LI></UL><P>Line 10 Line 11</P>');
    });

    it('breaks up a paragraph into two', function() {
      var merged = diffService.replaceLines(baseHtml1, '<P>Replaced Line 10</P><P>Inserted Line 11 </P>', 10, 11);
      expect(merged).toBe('<P>Line 1 Line 2 Line <STRONG>3<BR>Line 4 Line</STRONG> 5</P><UL class="ul-class"><LI class="li-class">Line 6 Line 7</LI><LI class="li-class"><UL><LI>Level 2 LI 8</LI><LI>Level 2 LI 9</LI></UL></LI></UL><P>Replaced Line 10</P><P>Inserted Line 11 Line 11</P>');
    });

    it('does not accidently merge two separate words', function() {
      var merged = diffService.replaceLines(baseHtml1, '<p>Line 1INSERTION</p>', 1, 2),
          containsError = merged.indexOf("Line 1INSERTIONLine 2"),
          containsCorrectVersion = merged.indexOf("Line 1INSERTION Line 2");
      expect(containsError).toBe(-1);
      expect(containsCorrectVersion).toBe(3);
    });

    it('does not accidently merge two separate words, even in lists', function() {
      // The newlines between UL and LI are the problem here
      var merged = diffService.replaceLines(baseHtml1, '<ul class="ul-class">' + "\n" + '<li class="li-class">Line 6Inserted</li>' + "\n" + '</ul>', 6, 7),
          containsError = merged.indexOf("Line 6InsertedLine 7"),
          containsCorrectVersion = merged.indexOf("Line 6Inserted Line 7");
      expect(containsError).toBe(-1);
      expect(containsCorrectVersion > 0).toBe(true);
    });
  });

  describe('detecting the type of change', function() {
    it('detects a simple insertion', function () {
      var htmlBefore = '<p>Test 1</p>',
          htmlAfter = '<p>Test 1 Test 2</p>' + "\n" + '<p>Test 3</p>';
      var calculatedType = diffService.detectReplacementType(htmlBefore, htmlAfter);
      expect(calculatedType).toBe(diffService.TYPE_INSERTION);
    });

    it('detects a simple insertion, ignoring case of tags', function () {
      var htmlBefore = '<p>Test 1</p>',
          htmlAfter = '<P>Test 1 Test 2</P>' + "\n" + '<P>Test 3</P>';
      var calculatedType = diffService.detectReplacementType(htmlBefore, htmlAfter);
      expect(calculatedType).toBe(diffService.TYPE_INSERTION);
    });

    it('detects a simple insertion, ignoring trailing whitespaces', function () {
      var htmlBefore = '<P>Lorem ipsum dolor sit amet, sed diam voluptua. At </P>',
          htmlAfter = '<P>Lorem ipsum dolor sit amet, sed diam voluptua. At2</P>';
      var calculatedType = diffService.detectReplacementType(htmlBefore, htmlAfter);
      expect(calculatedType).toBe(diffService.TYPE_INSERTION);
    });

    it('detects a simple insertion, ignoring spaces between UL and LI', function () {
      var htmlBefore = '<UL><LI>accusam et justo duo dolores et ea rebum.</LI></UL>',
          htmlAfter = '<UL>' + "\n" + '<LI>accusam et justo duo dolores et ea rebum 123.</LI>' + "\n" + '</UL>';
      var calculatedType = diffService.detectReplacementType(htmlBefore, htmlAfter);
      expect(calculatedType).toBe(diffService.TYPE_INSERTION);
    });

    it('detects a simple insertion, despite &nbsp; tags', function() {
      var htmlBefore = '<P>dsds dsfsdfsdf sdf sdfs dds sdf dsds dsfsdfsdf</P>',
          htmlAfter = '<P>dsds&nbsp;dsfsdfsdf sdf sdfs dds sd345 3453 45f dsds&nbsp;dsfsdfsdf</P>';
      var calculatedType = diffService.detectReplacementType(htmlBefore, htmlAfter);
      expect(calculatedType).toBe(diffService.TYPE_INSERTION);
    });

    it('detects a simple deletion', function () {
      var htmlBefore = '<p>Test 1 Test 2</p>' + "\n" + '<p>Test 3</p>',
          htmlAfter = '<p>Test 1</p>';
      var calculatedType = diffService.detectReplacementType(htmlBefore, htmlAfter);
      expect(calculatedType).toBe(diffService.TYPE_DELETION);
    });

    it('detects a simple deletion, ignoring case of tags', function () {
      var htmlBefore = '<p>Test 1 Test 2</p>' + "\n" + '<p>Test 3</p>',
          htmlAfter = '<P>Test 1</P>';
      var calculatedType = diffService.detectReplacementType(htmlBefore, htmlAfter);
      expect(calculatedType).toBe(diffService.TYPE_DELETION);
    });

    it('detects a simple deletion, ignoring trailing whitespaces', function () {
      var htmlBefore = '<P>Lorem ipsum dolor sit amet, sed diam voluptua. At2</P>',
          htmlAfter = '<P>Lorem ipsum dolor sit amet, sed diam voluptua. At </P>';
      var calculatedType = diffService.detectReplacementType(htmlBefore, htmlAfter);
      expect(calculatedType).toBe(diffService.TYPE_DELETION);
    });

    it('detects a simple replacement', function () {
      var htmlBefore = '<p>Test 1 Test 2</p>' + "\n" + '<p>Test 3</p>',
          htmlAfter = '<p>Test 1</p>' + "\n" + '<p>Test 2</p>' + "\n" + '<p>Test 3</p>';
      var calculatedType = diffService.detectReplacementType(htmlBefore, htmlAfter);
      expect(calculatedType).toBe(diffService.TYPE_REPLACEMENT);
    });
  });

  describe('the core diff algorithm', function() {
    it('acts as documented by the official documentation', function () {
      var before = "The red brown fox jumped over the rolling log.",
          after = "The brown spotted fox leaped over the rolling log.";
      var diff = diffService.diff(before, after);
      expect(diff).toBe('The <del>red </del>brown <ins>spotted </ins>fox <del>jum</del><ins>lea</ins>ped over the rolling log.');
    });

    it('ignores changing cases in HTML tags', function () {
      var before = "The <strong>brown</strong> spotted fox jumped over the rolling log.",
          after = "The <STRONG>brown</STRONG> spotted fox leaped over the rolling log.";
      var diff = diffService.diff(before, after);

      expect(diff).toBe('The <strong>brown</strong> spotted fox <del>jum</del><ins>lea</ins>ped over the rolling log.');
    });

    it('too many changes result in separate paragraphs', function () {
      var before = "<p>Test1 Test2 Test3 Test4 Test5 Test9</p>",
          after = "<p>Test1 Test6 Test7 Test8 Test9</p>";
      var diff = diffService.diff(before, after);

      expect(diff).toBe('<P class="delete">Test1 Test2 Test3 Test4 Test5 Test9</P><P class="insert">Test1 Test6 Test7 Test8 Test9</P>');
    });

    it('too many changes result in separate paragraphs - special case with un-wrapped text', function () {
      var before = "Test1 Test2 Test3 Test4 Test5 Test9",
          after = "Test1 Test6 Test7 Test8 Test9";
      var diff = diffService.diff(before, after);

      expect(diff).toBe('<DEL>Test1 Test2 Test3 Test4 Test5 Test9</DEL><INS>Test1 Test6 Test7 Test8 Test9</INS>');
    });

    it('merges multiple inserts and deletes', function () {
      var before = "Some additional text to circumvent the threshold Test1 Test2 Test3 Test4 Test5 Test9",
          after = "Some additional text to circumvent the threshold Test1 Test6 Test7 Test8 Test9";
      var diff = diffService.diff(before, after);

      expect(diff).toBe('Some additional text to circumvent the threshold Test1 <del>Test2 Test3 Test4 Test5</del><ins>Test6 Test7 Test8</ins> Test9');
    });

    it('detects insertions and deletions in a word (1)', function () {
      var before = "Test1 Test2 Test3 Test4 Test5 Test6 Test7",
          after = "Test1 Test Test3 Test4addon Test5 Test6 Test7";
      var diff = diffService.diff(before, after);

      expect(diff).toBe('Test1 Test<del>2</del> Test3 Test4<ins>addon</ins> Test5 Test6 Test7');
    });

    it('detects insertions and deletions in a word (2)', function () {
      var before = "Test Test",
          after = "Test Testappend";
      var diff = diffService.diff(before, after);

      expect(diff).toBe('Test Test<ins>append</ins>');
    });

    it('cannot handle changing CSS-classes', function () {
      var before = "<p class='p1'>Test1 Test2</p>",
          after = "<p class='p2'>Test1 Test2</p>";
      var diff = diffService.diff(before, after);

      expect(diff).toBe("<P class=\"p1 delete\">Test1 Test2</P><P class=\"p2 insert\">Test1 Test2</P>");
    });

    it('handles inserted paragraphs', function () {
      var before = "<P>liebliche Stimme, aber deine Stimme ist rauh; du bist der Wolf.' Da gieng der </P>",
          after = "<p>liebliche Stimme, aber deine Stimme ist rauh; du bist der Wolf.'</p>\
\
<p>Der Wolf hatte danach richtig schlechte laune, trank eine Flasche Rum,</p>\
\
<p>machte eine Weltreise und kam danach wieder um die Ziegen zu fressen. Da ging der</p>",
      expected = "<P class=\"delete\">liebliche Stimme, aber deine Stimme ist rauh; du bist der Wolf.' Da gieng der </P>" +
          "<P class=\"insert\">liebliche Stimme, aber deine Stimme ist rauh; du bist der Wolf.'</P>" +
          "<P class=\"insert\">Der Wolf hatte danach richtig schlechte laune, trank eine Flasche Rum,</P>" +
          "<P class=\"insert\">machte eine Weltreise und kam danach wieder um die Ziegen zu fressen. Da ging der</P>";

      var diff = diffService.diff(before, after);
      expect(diff).toBe(expected);
    });

    it('handles inserted paragraphs (2)', function () {
      // Specifically, Noch</p> should not be enclosed by <ins>...</ins>, as <ins>Noch </p></ins> would be seriously broken
      var before = "<P>rief sie alle sieben herbei und sprach 'liebe Kinder, ich will hinaus in den Wald, seid </P>",
          after = "<p>rief sie alle sieben herbei und sprach 'liebe Kinder, ich will hinaus in den Wald, seid Noch</p>" +
              "<p>Test 123</p>",
          expected = "<P class=\"delete\">rief sie alle sieben herbei und sprach 'liebe Kinder, ich will hinaus in den Wald, seid </P>" +
              "<P class=\"insert\">rief sie alle sieben herbei und sprach 'liebe Kinder, ich will hinaus in den Wald, seid Noch</P>" +
              "<P class=\"insert\">Test 123</P>";

      var diff = diffService.diff(before, after);
      expect(diff).toBe(expected);
    });

    it('handles completely deleted paragraphs', function () {
        var before = "<P>Ihr könnt ohne Sorge fortgehen.'Da meckerte die Alte und machte sich getrost auf den Weg.</P>",
            after = "";
        var diff = diffService.diff(before, after);
        expect(diff).toBe("<P class=\"delete\">Ihr könnt ohne Sorge fortgehen.'Da meckerte die Alte und machte sich getrost auf den Weg.</P>");
    });

    it('does not perform inline diff if there are too many changes', function () {
        var before = "<P>Dann kam er zurück, klopfte an die Hausthür und rief 'macht auf, ihr lieben Kinder, eure Mutter ist da und hat jedem von Euch etwas mitgebarcht.' Aber der Wolf hatte seine schwarze Pfote in das Fenster gelegt, das sahen die Kinder und riefen</P>",
            after = "<p>(hier: Missbrauch von bewusstseinsverändernde Mittel - daher Zensiert)</p>";
        var diff = diffService.diff(before, after);
        expect(diff).toBe('<P class="delete">Dann kam er zurück, klopfte an die Hausthür und rief \'macht auf, ihr lieben Kinder, eure Mutter ist da und hat jedem von Euch etwas mitgebarcht.\' Aber der Wolf hatte seine schwarze Pfote in das Fenster gelegt, das sahen die Kinder und riefen</P><P class="insert">(hier: Missbrauch von bewusstseinsverändernde Mittel - daher Zensiert)</P>');
    });

    it('does not repeat the last word (1)', function () {
      var before = "<P>sem. Nulla consequat massa quis enim. </P>",
          after = "<p>sem. Nulla consequat massa quis enim. TEST<br>\nTEST</p>";
      var diff = diffService.diff(before, after);

      expect(diff).toBe('<p>sem. Nulla consequat massa quis enim.<ins> TEST<br>' + "\n" + "TEST</ins></p>");
    });

    it('does not repeat the last word (2)', function () {
      var before = "<P>...so frißt er Euch alle mit Haut und Haar.</P>",
          after = "<p>...so frißt er Euch alle mit Haut und Haar und Augen und Därme und alles.</p>";
      var diff = diffService.diff(before, after);

      expect(diff).toBe("<p>...so frißt er Euch alle mit Haut und Haar<ins> und Augen und Därme und alles</ins>.</p>");
    });

    it('does not break when an insertion followes a beginning tag occuring twice', function () {
      var before = "<P>...so frißt er Euch alle mit Haut und Haar.</P>\n<p>Test</p>",
          after = "<p>Einfügung 1 ...so frißt er Euch alle mit Haut und Haar und Augen und Därme und alles.</p>\n<p>Test</p>";
      var diff = diffService.diff(before, after);

      expect(diff).toBe("<p><ins>Einfügung 1 </ins>...so frißt er Euch alle mit Haut und Haar<ins> und Augen und Därme und alles</ins>.</p>\n<p>Test</p>");
    });

    it('does not lose formattings when multiple lines are deleted', function () {
      var before = '<p>' +
              noMarkup(13) + 'diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd ' +
              brMarkup(14) + 'gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet.</p>',
          after= '<p>Test</p>';
      var diff = diffService.diff(before, after).toLowerCase(),
          expected = '<p class="delete">' +
          noMarkup(13).replace(/&nbsp;/, "\u00A0") + 'diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd ' +
          brMarkup(14).replace(/&nbsp;/, "\u00A0") + 'gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet.</p>' +
          '<p class="insert">Test</p>';

      expect(diff).toBe(expected.toLowerCase());
    });
  });

  describe('ignoring line numbers', function () {
    it('works despite line numbers, part 1', function () {
      var before = "<P>...so frißt er Euch alle mit Haut und Haar.</P>",
          after = "<p>...so frißt er Euch alle mit Haut und Haar und Augen und Därme und alles.</p>";
      before = lineNumberingService.insertLineNumbers(before, 15, null, null, 2);
      var diff = diffService.diff(before, after);

      expect(diff).toBe("<p>" + noMarkup(2) + "...so frißt er " + brMarkup(3) + "Euch alle mit " + brMarkup(4) + "Haut und Haar<ins> und Augen und Därme und alles</ins>.</p>");
    });

    it('works with an inserted paragraph', function () {
      var before = "<P>their grammar, their pronunciation and their most common words. Everyone realizes why a </P>",
          after = "<P>their grammar, their pronunciation and their most common words. Everyone realizes why a</P>\n" +
              "<P>NEW PARAGRAPH 2.</P>";

      before = lineNumberingService.insertLineNumbers(before, 80, null, null, 2);
      var diff = diffService.diff(before, after);
      expect(diff).toBe("<p>" + noMarkup(2) + "their grammar, their pronunciation and their most common words. Everyone " + brMarkup(3) + "realizes why a</p>\n" +
          "<p><ins>NEW PARAGRAPH 2.</ins></p>");
    });

    it('works with two inserted paragraphs', function () {
      // Hint: If the last paragraph is a P again, the Diff still fails and falls back to paragraph-based diff
      // This leaves room for future improvements
      var before = "<P>their grammar, their pronunciation and their most common words. Everyone realizes why a </P>\n<div>Go on</div>",
          after = "<P>their grammar, their pronunciation and their most common words. Everyone realizes why a</P>\n" +
              "<P>NEW PARAGRAPH 1.</P>\n" +
              "<P>NEW PARAGRAPH 2.</P>\n" +
              "<div>Go on</div>";

      before = lineNumberingService.insertLineNumbers(before, 80, null, null, 2);
      var diff = diffService.diff(before, after);
      expect(diff).toBe("<p>" + noMarkup(2) + "their grammar, their pronunciation and their most common words. Everyone " + brMarkup(3) + "realizes why a</p>\n" +
          "<p><ins>NEW PARAGRAPH 1.</ins></p>\n" +
          "<p><ins>NEW PARAGRAPH 2.</ins></p>\n" +
          "<div>" + noMarkup(4) + "Go on</div>"
      );
    });
  });

  describe('addCSSClassToFirstTag function', function () {
    it('works with plain tags', function () {
        var strIn = "<ol start='2'><li>",
            inserted = diffService.addCSSClassToFirstTag(strIn, "newClass");
        expect(inserted).toBe("<ol start='2' class=\"newClass\"><li>")
    });

    it('works with tags already having classes', function () {
        var strIn = "<ol start='2' class='my-old-class'><li>",
            inserted = diffService.addCSSClassToFirstTag(strIn, "newClass");
        expect(inserted).toBe("<ol start='2' class=\"my-old-class newClass\"><li>")
    });
  })
});
