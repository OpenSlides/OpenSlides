describe('linenumbering', function () {

  beforeEach(module('OpenSlidesApp.motions.diff'));

  var diffService, baseHtml1, baseHtmlDom1, baseHtml2, baseHtmlDom2, baseHtml3, baseHtmlDom3,
      brMarkup = function (no) {
        return '<br class="os-line-break">' +
            '<span class="line-number-' + no + ' os-line-number" contenteditable="false" data-line-number="' + no + '">&nbsp;</span>';
      },
      noMarkup = function (no) {
        return '<span class="line-number-' + no + ' os-line-number" contenteditable="false" data-line-number="' + no + '">&nbsp;</span>';
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
      expect(diff.html).toBe('<P class="os-split-after">Line 1 ');
      expect(diff.outerContextStart).toBe('');
      expect(diff.outerContextEnd).toBe('');
    });

    it('extracts lines from nested UL/LI-structures', function () {
      var diff = diffService.extractRangeByLineNumbers(baseHtml1, 7, 9);
      expect(diff.html).toBe('Line 7</LI><LI class="li-class os-split-after"><UL class="os-split-after"><LI>Level 2 LI 8</LI>');
      expect(diff.ancestor.nodeName).toBe('UL');
      expect(diff.outerContextStart).toBe('<UL class="ul-class os-split-before os-split-after">');
      expect(diff.outerContextEnd).toBe('</UL>');
      expect(diff.innerContextStart).toBe('<LI class="li-class os-split-before">');
      expect(diff.innerContextEnd).toBe('</UL></LI>');
      expect(diff.previousHtmlEndSnippet).toBe('</LI></UL>');
      expect(diff.followingHtmlStartSnippet).toBe('<UL class="ul-class os-split-before os-split-after"><LI class="li-class os-split-after"><UL class="os-split-after">');
    });

    it('extracts lines from double-nested UL/LI-structures (1)', function () {
      var html = '<p>' + noMarkup(1) + 'Line 1</p>' +
              '<ul><li><p>' + noMarkup(2) + 'Line 2' + brMarkup(3) + 'Line 3' + brMarkup(4) + 'Line 5</p></li></ul>';
      var diff = diffService.extractRangeByLineNumbers(html, 3, 4);
      expect(diff.html).toBe('Line 3');
      expect(diff.ancestor.nodeName).toBe('P');
      expect(diff.outerContextStart).toBe('<UL class="os-split-before os-split-after"><LI class="os-split-before os-split-after"><P class="os-split-before os-split-after">');
      expect(diff.outerContextEnd).toBe('</P></LI></UL>');
      expect(diff.innerContextStart).toBe('');
      expect(diff.innerContextEnd).toBe('');
      expect(diff.previousHtmlEndSnippet).toBe('</P></LI></UL>');
      expect(diff.followingHtmlStartSnippet).toBe('<UL class="os-split-before os-split-after"><LI class="os-split-before os-split-after"><P class="os-split-before os-split-after">');
    });

    it('extracts lines from double-nested UL/LI-structures (2)', function () {
      var html = '<p>' + noMarkup(1) + 'Line 1</p>' +
              '<ul><li><p>' + noMarkup(2) + 'Line 2' + brMarkup(3) + 'Line 3' + brMarkup(4) + '</p></li></ul>';
      var diff = diffService.extractRangeByLineNumbers(html, 2, 3);
      expect(diff.html).toBe('<UL class="os-split-after"><LI class="os-split-after"><P class="os-split-after">Line 2');
      expect(diff.outerContextStart).toBe('');
      expect(diff.outerContextEnd).toBe('');
      expect(diff.innerContextStart).toBe('');
      expect(diff.innerContextEnd).toBe('</P></LI></UL>');
      expect(diff.previousHtmlEndSnippet).toBe('');

      // @TODO in followingHtmlStartSnippet, os-split-li is not set yet in this case.
      // This is not entirely correct, but as this field is never actually used, it's not bothering (yet)
      // This comment remains to document a potential pitfall in the future
      // expect(diff.followingHtmlStartSnippet).toBe('<UL><LI class="os-split-li"><P>');
    });

    it('extracts a single line right before a UL/LI', function () {
      // Test case for https://github.com/OpenSlides/OpenSlides/issues/3226
      var html = "<p>A line</p><p>Another line</p>\n<ul>\t<li>A list item</li>\t<li>Yet another item</li></ul>";
      html = lineNumberingService.insertLineNumbers(html, 80);
      var diff = diffService.extractRangeByLineNumbers(html, 2, 3, true);
      expect(diff.html).toBe("<P>Another line</P>\n");
    });

    it('extracts lines from a more complex example', function () {
      var diff = diffService.extractRangeByLineNumbers(baseHtml2, 6, 11);

      expect(diff.html).toBe('owe. Dahoam gscheckate middn Spuiratz des is a gmahde Wiesn. Des is schee so Obazda san da, Haferl pfenningguat schoo griasd eich midnand.</P><UL class="os-split-after"><LI>Auffi Gamsbart nimma de Sepp Ledahosn Ohrwaschl um Godds wujn Wiesn Deandlgwand Mongdratzal! Jo leck mi Mamalad i daad mechad?</LI><LI>Do nackata Wurscht i hob di narrisch gean, Diandldrahn Deandlgwand vui huift vui woaß?</LI>');
      expect(diff.ancestor.nodeName).toBe('#document-fragment');
      expect(diff.outerContextStart).toBe('');
      expect(diff.outerContextEnd).toBe('');
      expect(diff.innerContextStart).toBe('<P class="os-split-before">');
      expect(diff.innerContextEnd).toBe('</UL>');
      expect(diff.previousHtmlEndSnippet).toBe('</P>');
      expect(diff.followingHtmlStartSnippet).toBe('<UL class="os-split-after">');
    });

    it('extracts the end of a section', function () {
      var diff = diffService.extractRangeByLineNumbers(baseHtml2, 29, null);

      expect(diff.html).toBe('Diandldrahn nix Gwiass woass ma ned hod boarischer: Samma sammawiedaguad wos, i hoam Brodzeid. Jo mei Sepp Gaudi, is ma Wuascht do Hendl Xaver Prosd eana an a bravs. Sauwedda an Brezn, abfieseln.</P>');
      expect(diff.ancestor.nodeName).toBe('#document-fragment');
      expect(diff.outerContextStart).toBe('');
      expect(diff.outerContextEnd).toBe('');
      expect(diff.innerContextStart).toBe('<P class="os-split-before">');
      expect(diff.innerContextEnd).toBe('');
      expect(diff.previousHtmlEndSnippet).toBe('</P>');
      expect(diff.followingHtml).toBe('');
      expect(diff.followingHtmlStartSnippet).toBe('');
    });

    it('preserves the numbering of OLs (1)', function () {
      var diff = diffService.extractRangeByLineNumbers(baseHtml3, 5, 7);

      expect(diff.html).toBe('<LI>Line 3.3</LI></OL></LI><LI> Line 4</LI></OL>');
      expect(diff.ancestor.nodeName).toBe('#document-fragment');
      expect(diff.innerContextStart).toBe('<OL class="os-split-before" start="3"><LI class="os-split-before"><OL class="os-split-before" start="3">');
      expect(diff.innerContextEnd).toBe('');
      expect(diff.previousHtmlEndSnippet).toBe('</OL></LI></OL>');
    });

    it('preserves the numbering of OLs (2)', function () {
      var diff = diffService.extractRangeByLineNumbers(baseHtml3, 3, 5);

      expect(diff.html).toBe('<LI class="os-split-after"><OL class="os-split-after"><LI>Line 3.1</LI><LI>Line 3.2</LI>');
      expect(diff.ancestor.nodeName).toBe('OL');
      expect(diff.outerContextStart).toBe('<OL class="os-split-before os-split-after" start="3">');
      expect(diff.outerContextEnd).toBe('</OL>');
    });

    it('escapes text resembling HTML-Tags', function () {
        var inHtml = '<h2>' + noMarkup(1) + 'Looks like a &lt;p&gt; tag &lt;/p&gt;</h2><p>' + noMarkup(2) + 'Another line</p>';
        var diff = diffService.extractRangeByLineNumbers(inHtml, 1, 2);
        expect(diff.html).toBe('<H2>Looks like a &lt;p&gt; tag &lt;/p&gt;</H2>');
    });

    it('marks split list items', function () {
        var html = '<ol><li>' + noMarkup(1) + 'Line 1' + brMarkup(2) + 'Line 2' + brMarkup(3) + 'Line 3</li></ol>'
        var diff = diffService.extractRangeByLineNumbers(html, 2, 3);
        expect(diff.outerContextStart.toLowerCase()).toBe('<ol class="os-split-before os-split-after" start="1"><li class="os-split-before os-split-after">');

        diff = diffService.extractRangeByLineNumbers(html, 3, null);
        expect(diff.innerContextStart.toLowerCase()).toBe('<ol class="os-split-before" start="1"><li class="os-split-before">');
    });

    it('does not mark the second list item as being split', function () {
        var html = '<ol><li>' + noMarkup(1) + 'Line 1</li><li>' + noMarkup(2) + 'Line 2' + brMarkup(3) + 'Line 3</li></ol>';
        var diff = diffService.extractRangeByLineNumbers(html, 2, 3);
        expect(diff.outerContextStart.toLowerCase()).toBe('<ol class="os-split-before os-split-after" start="2">');
        expect(diff.innerContextStart.toLowerCase()).toBe('');
        expect(diff.html.toLowerCase()).toBe('<li class="os-split-after">line 2');
    });

    it('sets the start in a more complex list', function () {
        var html = '<ol start="10"><li>' + noMarkup(1) + 'Line 1</li><li>' + noMarkup(2) + 'Line 2' + brMarkup(3) + 'Line 3</li>' +
            '<li>' + noMarkup(4) + 'Line 4</li></ol>';
        var diff = diffService.extractRangeByLineNumbers(html, 3, 4);
        expect(diff.previousHtml.toLowerCase()).toContain('start="10"');
        expect(diff.outerContextStart.toLowerCase()).toContain('start="11"');
        expect(diff.followingHtmlStartSnippet.toLowerCase()).toContain('start="12"');
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

    it('keeps ampersands escaped', function() {
        var pre = '<p>' + noMarkup(1) + 'foo &amp; bar</p>',
            after = '<p>' + noMarkup(1) + 'foo &amp; bar ins</p>';
        var merged = diffService.replaceLines(pre, after, 1, 2, true);
      expect(merged).toBe('<P>foo &amp; bar ins</P>');
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

  describe('diff normalization', function () {
    it('uppercases normal HTML tags', function () {
      var unnormalized = 'The <strong>brown</strong> fox',
          normalized = diffService._normalizeHtmlForDiff(unnormalized);
      expect(normalized).toBe('The <STRONG>brown</STRONG> fox')
    });

    it('uppercases the names of html attributes, but not the values, and sort the attributes', function () {
      var unnormalized = 'This is our cool <a href="https://www.openslides.de/">home page</a> - have a look! ' +
          '<input type="checkbox" checked title=\'A title with "s\'>',
          normalized = diffService._normalizeHtmlForDiff(unnormalized);
      expect(normalized).toBe('This is our cool <A HREF="https://www.openslides.de/">home page</A> - have a look! ' +
          '<INPUT CHECKED TITLE=\'A title with "s\' TYPE="checkbox">')
    });

    it('strips unnecessary spaces', function () {
      var unnormalized = "<ul> <li>Test</li>\n</ul>",
          normalized = diffService._normalizeHtmlForDiff(unnormalized);
      expect(normalized).toBe('<UL><LI>Test</LI></UL>');
    });

    it('normalizes html entities', function () {
      var unnormalized = "German characters like &szlig; or &ouml;",
          normalized = diffService._normalizeHtmlForDiff(unnormalized);
      expect(normalized).toBe('German characters like ß or ö');
    });

    it('sorts css classes', function () {
      var unnormalized = "<P class='os-split-before os-split-after'>Test</P>",
          normalized = diffService._normalizeHtmlForDiff(unnormalized);
      expect(normalized).toBe("<P CLASS='os-split-after os-split-before'>Test</P>");
    });

    it('treats newlines like spaces', function () {
      var unnormalized = "<P>Test line\n\t 2</P>",
          normalized = diffService._normalizeHtmlForDiff(unnormalized);
      expect(normalized).toBe("<P>Test line 2</P>");
    });
  });

  describe('the core diff algorithm', function () {
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

    it('does not insert spaces after a unchanged BR tag', function() {
      var before = "<p>" + noMarkup(1) + "Hendl Kirwa hod Maßkruag<br>" + noMarkup(2) + "gmahde Wiesn</p>",
          after = "<p>Hendl Kirwa hod Maßkruag<br>\ngmahde Wiesn</p>";
      var diff = diffService.diff(before, after);

      expect(diff).toBe(before);
    });

    it('does not mark the last line of a paragraph as change if a long new one is appended', function () {
      var before = "<p><span class=\"os-line-number line-number-5\" data-line-number=\"5\" contenteditable=\"false\">&nbsp;</span>Lorem ipsum dolor sit amet, consectetuer adipiscing elit.</p>",
            after = "<p>Lorem ipsum dolor sit amet, consectetuer adipiscing elit.</p>\n" +
                "\n" +
                "<p>Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis, ultricies nec, pellentesque eu, pretium quis, sem. Nulla consequat massa quis enim. Donec pede justo, fringilla vel, aliquet nec, vulputate eget, arcu. Nulla consequat massa quis enim. Donec pede justo, fringilla vel, aliquet nec, vulputate eget, arcu.</p>";
        var diff = diffService.diff(before, after);
        expect(diff).toBe("<p><span class=\"line-number-5 os-line-number\" contenteditable=\"false\" data-line-number=\"5\">&nbsp;</span>Lorem ipsum dolor sit amet, consectetuer adipiscing elit.</p>\n" +
            "<p><ins>Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis, ultricies nec, pellentesque eu, pretium quis, sem. Nulla consequat massa quis enim. Donec pede justo, fringilla vel, aliquet nec, vulputate eget, arcu. Nulla consequat massa quis enim. Donec pede justo, fringilla vel, aliquet nec, vulputate eget, arcu.</ins></p>");
    });

    it('does not result in separate paragraphs when only the first word has changed', function () {
      var before = '<p class="os-split-after"><span class="os-line-number line-number-1" data-line-number="1" contenteditable="false">&nbsp;</span>Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor </p>',
          after = '<p class="os-split-after">Bla ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor</p>';
      var diff = diffService.diff(before, after);

      expect(diff).toBe('<p class="os-split-after"><span class="line-number-1 os-line-number" contenteditable="false" data-line-number="1">&nbsp;</span><del>Lorem</del><ins>Bla</ins> ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor</p>');
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

    it('recognizes commas as a word separator', function () {
      var before = "Lorem ipsum dolor sit amet, consetetur sadipscing elitr sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat",
          after = "Lorem ipsum dolor sit amet, consetetur sadipscing elitr, diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat";
      var diff = diffService.diff(before, after);

      expect(diff).toBe('Lorem ipsum dolor sit amet, consetetur sadipscing elitr<del> sed</del><ins>,</ins> diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat');
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
          expected = "<p>rief sie alle sieben herbei und sprach 'liebe Kinder, ich will hinaus in den Wald, seid<ins> Noch</ins></p>" +
              "<p><ins>Test 123</ins></p>";

      var diff = diffService.diff(before, after);
      expect(diff).toBe(expected);
    });

    it('handles insterted paragraphs (3)', function () {
      // Hint: os-split-after should be moved from the first paragraph to the second one
      var before = "<p class=\"os-split-after\"><span class=\"os-line-number line-number-1\" data-line-number=\"1\" contenteditable=\"false\">&nbsp;</span>Lorem ipsum dolor sit amet, consetetur sadipscing elitr, </p>",
          after = "<p>Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum.</p>\n" +
              "\n" +
              "<p>Stet clita kasd gubergren, no sea takimata sanctus est.</p>",
          expected = "<p><span class=\"line-number-1 os-line-number\" contenteditable=\"false\" data-line-number=\"1\">&nbsp;</span>Lorem ipsum dolor sit amet, consetetur sadipscing elitr,<ins> sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum.</ins></p>\n" +
              "<p class=\"os-split-after\"><ins>Stet clita kasd gubergren, no sea takimata sanctus est.</ins></p>";

      var diff = diffService.diff(before, after);
      expect(diff).toBe(expected);
    });

    it('handles inserted paragraphs (4)', function () {
      var before = "<p>This is a random first line that remains unchanged.</p>",
          after = "<p>This is a random first line that remains unchanged.</p>" +
              '<p style="text-align: justify;"><span style="color: #000000;">Inserting this line should not make any troubles, especially not affect the first line</span></p>' +
              '<p style="text-align: justify;"><span style="color: #000000;">Neither should this line</span></p>',
          expected = "<p>This is a random first line that remains unchanged.</p>" +
              '<p style="text-align: justify;"><ins><span style="color: #000000;">Inserting this line should not make any troubles, especially not affect the first line</span></ins></p>' +
              '<p style="text-align: justify;"><ins><span style="color: #000000;">Neither should this line</span></ins></p>';

      var diff = diffService.diff(before, after);
      expect(diff).toBe(expected);
    });

    it('handles completely deleted paragraphs', function () {
        var before = "<P>Ihr könnt ohne Sorge fortgehen.'Da meckerte die Alte und machte sich getrost auf den Weg.</P>",
            after = "";
        var diff = diffService.diff(before, after);
        expect(diff).toBe("<p class=\"delete\">Ihr könnt ohne Sorge fortgehen.'Da meckerte die Alte und machte sich getrost auf den Weg.</p>");
    });

    it('does not repeat the last word (1)', function () {
      var before = "<P>sem. Nulla consequat massa quis enim. </P>",
          after = "<p>sem. Nulla consequat massa quis enim. TEST<br>\nTEST</p>";
      var diff = diffService.diff(before, after);

      expect(diff).toBe('<p>sem. Nulla consequat massa quis enim.<ins> TEST<br>TEST</ins></p>');
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
          expected = '<p>' +
              noMarkup(13) + '<del>diam voluptua. at vero eos et accusam et justo duo dolores et ea rebum. stet clita kasd </del>' +
              brMarkup(14) + '<del>gubergren, no sea takimata sanctus est lorem ipsum dolor sit amet.</del>' +
              '<ins>test</ins></p>';

      expect(diff).toBe(expected.toLowerCase());
    });

    it('removed inline colors in inserted/deleted parts (1)', function () {
      var before = "<P>...so frißt er Euch alle mit Haut und Haar.</P>",
          after = "<P>...so frißt er <span style='color: #000000;'>Euch alle</span> mit Haut und Haar.</P>";
      var diff = diffService.diff(before, after);

      expect(diff).toBe('<P class="delete">...so frißt er Euch alle mit Haut und Haar.</P><P class="insert">...so frißt er <SPAN>Euch alle</SPAN> mit Haut und Haar.</P>');
    });

    it('removed inline colors in inserted/deleted parts (2)', function () {
      var before = "<P>...so frißt er Euch alle mit Haut und Haar.</P>",
          after = "<P>...so frißt er <span style='font-size: 2em; color: #000000; opacity: 0.5'>Euch alle</span> mit Haut und Haar.</P>";
      var diff = diffService.diff(before, after);

      expect(diff).toBe('<P class="delete">...so frißt er Euch alle mit Haut und Haar.</P><P class="insert">...so frißt er <SPAN style="font-size: 2em; opacity: 0.5">Euch alle</SPAN> mit Haut und Haar.</P>');
    });

    it('marks a single moved word as deleted and inserted again', function () {
      var before = '<p>tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren bla, no sea takimata sanctus est Lorem ipsum dolor sit amet.</p>',
          after = '<p>tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd bla, no sea takimata sanctus est Lorem ipsum dolor gubergren sit amet.</p>';
      var diff = diffService.diff(before, after);

      expect(diff).toBe('<p>tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd <del>gubergren </del>bla, no sea takimata sanctus est Lorem ipsum dolor <ins>gubergren </ins>sit amet.</p>');
    });

    it('works with style-tags in spans', function () {
        var before = '<p class="os-split-before os-split-after"><span class="os-line-number line-number-4" data-line-number="4" contenteditable="false">&nbsp;</span><span style="color: #0000ff;" class="os-split-before os-split-after">sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing </span></p>',
          after = '<p class="os-split-after os-split-before"><span class="os-split-after os-split-before" style="color: #0000ff;">sanctus est Lorem ipsum dolor sit amet. Test Lorem ipsum dolor sit amet, consetetur sadipscing </span></p>';
      var diff = diffService.diff(before, after);

      expect(diff).toBe('<p class="os-split-after os-split-before"><span class="line-number-4 os-line-number" contenteditable="false" data-line-number="4">&nbsp;</span><span class="os-split-after os-split-before" style="color: #0000ff;">sanctus est Lorem ipsum dolor sit amet. <ins>Test </ins>Lorem ipsum dolor sit amet, consetetur sadipscing </span></p>');
    });

    it('does not lose words when changes are moved X-wise', function () {
      var before = 'elitr. einsetzt. VERSCHLUCKT noch die sog. Gleichbleibend (Wird gelöscht).',
          after = 'elitr, Einfügung durch Änderung der Gleichbleibend, einsetzt.';

      var diff = diffService.diff(before, after);
      expect(diff).toBe('elitr<del>. einsetzt. VERSCHLUCKT noch die sog.</del><ins>, Einfügung durch Änderung der</ins> Gleichbleibend<del> (Wird gelöscht).</del><ins>, einsetzt.</ins>');
    });

    it('does not fall back to block level replacement when BRs are inserted/deleted', function() {
      var before = '<p>Lorem ipsum dolor sit amet, consetetur <br>sadipscing elitr.<br>Bavaria ipsum dolor sit amet o’ha wea nia ausgähd<br>kummt nia hoam i hob di narrisch gean</p>',
          after = '<p>Lorem ipsum dolor sit amet, consetetur sadipscing elitr. Sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua..<br>\n' +
              'Bavaria ipsum dolor sit amet o’ha wea nia ausgähd<br>\n' +
              'Autonomie erfährt ihre Grenzen</p>';
      var diff = diffService.diff(before, after);
      expect(diff).toBe('<p>Lorem ipsum dolor sit amet, consetetur <del><br></del>sadipscing elitr.<ins> Sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua..</ins><br>Bavaria ipsum dolor sit amet o’ha wea nia ausgähd<br><del>kummt nia hoam i hob di narrisch gean</del><ins>Autonomie erfährt ihre Grenzen</ins></p>');
    });

    it('does not a change in a very specific case', function() {
      // See diff._fixWrongChangeDetection
      var inHtml = '<p>Test 123<br>wir strikt ab. lehnen wir ' + brMarkup(1486) + 'ab.<br>' + noMarkup(1487) + 'Gegenüber</p>',
          outHtml = '<p>Test 123<br>\n' +
              'wir strikt ab. lehnen wir ab.<br>\n' +
              'Gegenüber</p>';
      var diff = diffService.diff(inHtml, outHtml);
      expect(diff).toBe('<p>Test 123<br>wir strikt ab. lehnen wir ' + brMarkup(1486) + 'ab.<br>' + noMarkup(1487) + 'Gegenüber</p>')
    });

    it('does not delete a paragraph before an inserted one', function () {
      var inHtml = '<ul class="os-split-before"><li>Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua.</li>\n' +
          '</ul>',
          outHtml = '<ul class="os-split-before">\n' +
              '<li>Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua.</li>\n' +
              '<li class="testclass">At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet.</li>\n' +
              '</ul>';
      var diff = diffService.diff(inHtml, outHtml);
      expect(diff).toBe('<ul class="os-split-before">' +
          '<li>Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua.</li>' +
          '<li class="testclass insert">At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet.</li>' +
          '</ul>');
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

    it('works with a replaced list item', function () {
      var before = "<ul><li>Lorem ipsum <strong>dolor sit amet</strong>, consetetur sadipscing elitr, sed diam nonumy eirmod tempor.</li></ul>",
          after = "<ul>\n<li>\n<p>At vero eos et accusam et justo duo dolores et ea rebum.</p>\n</li>\n</ul>\n",
          expected = '<UL class="delete"><LI>' + noMarkup(1) + 'Lorem ipsum <STRONG>dolor sit amet</STRONG>, consetetur sadipscing elitr, sed diam nonumy ' + brMarkup(2) + 'eirmod tempor.</LI></UL>' +
          "<UL class=\"insert\">\n<LI>\n<P>At vero eos et accusam et justo duo dolores et ea rebum.</P>\n</LI>\n</UL>";

      var diff = diffService.diff(before, after, 80);

      diff = diffService._normalizeHtmlForDiff(diff);
      expected = diffService._normalizeHtmlForDiff(expected);

      expect(diff.toLowerCase()).toBe(expected.toLowerCase());
    });

    it('detects broken HTML and lowercases class names', function () {
        var before = "<p><span class=\"line-number-3 os-line-number\" data-line-number=\"3\" contenteditable=\"false\">&nbsp;</span>holen, da rief sie alle sieben herbei und sprach:</p>\n\n<p><span class=\"line-number-4 os-line-number\" data-line-number=\"4\" contenteditable=\"false\">&nbsp;</span><span style=\"color: #000000;\">\"Liebe Kinder, ich will hinaus in den Wald, seid auf der Hut vor dem Wolf! Wenn er <br class=\"os-line-break\"><span class=\"line-number-5 os-line-number\" data-line-number=\"5\" contenteditable=\"false\">&nbsp;</span>hereinkommt, frisst er euch alle mit Haut und Haar. Der Bösewicht verstellt sich oft, aber <br class=\"os-line-break\"><span class=\"line-number-6 os-line-number\" data-line-number=\"6\" contenteditable=\"false\">&nbsp;</span>an der rauen Stimme und an seinen schwarzen Füßen werdet ihr ihn schon erkennen.\"</span></p>\n\n<p><span class=\"line-number-7 os-line-number\" data-line-number=\"7\" contenteditable=\"false\">&nbsp;</span>Die Geißlein sagten: \" Liebe Mutter, wir wollen uns schon in acht nehmen, du kannst ohne </p>",
            after = "<p>holen, da rief sie alle sieben herbei und sprach:</p>\n\n<p><span style=\"color: #000000;\">Hello</span></p>\n\n<p><span style=\"color: #000000;\">World</span></p>\n\n<p><span style=\"color: #000000;\">Ya</span></p>\n\n<p>Die Geißlein sagten: \" Liebe Mutter, wir wollen uns schon in acht nehmen, du kannst ohne</p>";
        var diff = diffService.diff(before, after);
        expect(diff).toBe("<P class=\"delete\"><SPAN class=\"line-number-3 os-line-number\" data-line-number=\"3\" contenteditable=\"false\"> </SPAN>holen, da rief sie alle sieben herbei und sprach:</P><DEL>\n\n</DEL>" +
            "<P class=\"delete\"><SPAN class=\"line-number-4 os-line-number\" data-line-number=\"4\" contenteditable=\"false\"> </SPAN><SPAN>\"Liebe Kinder, ich will hinaus in den Wald, seid auf der Hut vor dem Wolf! Wenn er <BR class=\"os-line-break\"><SPAN class=\"line-number-5 os-line-number\" data-line-number=\"5\" contenteditable=\"false\"> </SPAN>hereinkommt, frisst er euch alle mit Haut und Haar. Der Bösewicht verstellt sich oft, aber <BR class=\"os-line-break\"><SPAN class=\"line-number-6 os-line-number\" data-line-number=\"6\" contenteditable=\"false\"> </SPAN>an der rauen Stimme und an seinen schwarzen Füßen werdet ihr ihn schon erkennen.\"</SPAN></P><DEL>\n\n</DEL><P class=\"delete\"><SPAN class=\"line-number-7 os-line-number\" data-line-number=\"7\" contenteditable=\"false\"> </SPAN>Die Geißlein sagten: \" Liebe Mutter, wir wollen uns schon in acht nehmen, du kannst ohne </P>" +
            "<P class=\"insert\">holen, da rief sie alle sieben herbei und sprach:</P><INS>\n\n</INS>" +
            "<P class=\"insert\"><SPAN>Hello</SPAN></P><INS>\n\n</INS>" +
            "<P class=\"insert\"><SPAN>World</SPAN></P><INS>\n\n</INS>" +
            "<P class=\"insert\"><SPAN>Ya</SPAN></P><INS>\n\n</INS>" +
            "<P class=\"insert\">Die Geißlein sagten: \" Liebe Mutter, wir wollen uns schon in acht nehmen, du kannst ohne</P>");
    });

    it('line breaks at dashes does not delete/insert the last/first word of the split lines', function () {
      var before = "<ul><li>Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy ei rmodtem-Porinv idunt ut labore et dolore magna aliquyam erat, sed diam voluptua.</li></ul>",
          after = "<ul><li>Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy ei rmodtem-Porinv idunt ut labore et dolore magna aliquyam erat, sed diam voluptua.</li></ul>";

      before = lineNumberingService.insertLineNumbers(before, 90);
      var diff = diffService.diff(before, after);
      expect(diff).toBe("<ul><li>" + noMarkup(1) + "Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy ei rmodtem-" + brMarkup(2) + "Porinv idunt ut labore et dolore magna aliquyam erat, sed diam voluptua.</li></ul>");
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
  });

  describe('removeDuplicateClassesInsertedByCkeditor', function () {
    it('removes additional classes', function () {
       var strIn = '<ul class="os-split-before os-split-after"><li class="os-split-before"><ul class="os-split-before os-split-after"><li class="os-split-before">...here it goes on</li><li class="os-split-before">This has been added</li></ul></li></ul>',
           cleaned = diffService.removeDuplicateClassesInsertedByCkeditor(strIn);
       expect(cleaned).toBe('<UL class="os-split-before os-split-after"><LI class="os-split-before"><UL class="os-split-before os-split-after"><LI class="os-split-before">...here it goes on</LI><LI>This has been added</LI></UL></LI></UL>');
    });
  });

  describe('detecting changed line number range', function () {
    it('detects changed line numbers in the middle', function () {
      var before = '<p>' + noMarkup(1) + 'foo &amp; bar' + brMarkup(2) + 'Another line' +
          brMarkup(3) + 'This will be changed' + brMarkup(4) + 'This, too' + brMarkup(5) + 'End</p>',
          after = '<p>' + noMarkup(1) + 'foo &amp; bar' + brMarkup(2) + 'Another line' +
              brMarkup(3) + 'This has been changed' + brMarkup(4) + 'End</p>';

      var diff = diffService.diff(before, after);
      var affected = diffService.detectAffectedLineRange(diff);
      expect(affected).toEqual({"from": 3, "to": 5});
    });
    it('detects changed line numbers at the beginning', function () {
        var before = '<p>Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat</p>',
          after = '<p>sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat</p>';

      before = lineNumberingService.insertLineNumbers(before, 20);
        var diff = diffService.diff(before, after);

      var affected = diffService.detectAffectedLineRange(diff);
      expect(affected).toEqual({"from": 1, "to": 2});
    });
  });

  describe('stripping ins/del-styles/tags', function () {
    it('deletes to be deleted nodes', function () {
        var inHtml = '<p>Test <span class="delete">Test 2</span> Another test <del>Test 3</del></p><p class="delete">Test 4</p>';
        var stripped = diffService.diffHtmlToFinalText(inHtml);
        expect(stripped).toBe('<P>Test  Another test </P>');
    });

    it('produces empty paragraphs, if necessary', function () {
        var inHtml = '<p class="delete">Test <span class="delete">Test 2</span> Another test <del>Test 3</del></p><p class="delete">Test 4</p>';
        var stripped = diffService.diffHtmlToFinalText(inHtml);
        expect(stripped).toBe('');
    });

    it('Removes INS-tags', function () {
        var inHtml = '<p>Test <ins>Test <strong>2</strong></ins> Another test</p>';
        var stripped = diffService.diffHtmlToFinalText(inHtml);
        expect(stripped).toBe('<P>Test Test <STRONG>2</STRONG> Another test</P>');
    });

    it('Removes .insert-classes', function () {
        var inHtml = '<p class="insert">Test <strong>1</strong></p><p class="insert anotherclass">Test <strong>2</strong></p>';
        var stripped = diffService.diffHtmlToFinalText(inHtml);
        expect(stripped).toBe('<P>Test <STRONG>1</STRONG></P><P class="anotherclass">Test <STRONG>2</STRONG></P>');
    });
  });
});
