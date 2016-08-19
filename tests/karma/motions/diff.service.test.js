describe('linenumbering', function () {

  beforeEach(module('OpenSlidesApp.motions.diff'));

  var diffService, baseHtmlDom1, baseHtmlDom2,
      brMarkup = function (no) {
        return '<br class="os-line-break">' +
            '<span class="os-line-number line-number-' + no + '" data-line-number="' + no + '" contenteditable="false">&nbsp;</span>';
      },
      noMarkup = function (no) {
        return '<span class="os-line-number line-number-' + no + '" data-line-number="' + no + '" contenteditable="false">&nbsp;</span>';
      };

  beforeEach(inject(function (_diffService_) {
    diffService = _diffService_;

    baseHtmlDom1 = diffService.htmlToFragment('<p>' +
          noMarkup(1) + 'Line 1 ' + brMarkup(2) + 'Line 2' +
          brMarkup(3) + 'Line <strong>3<br>' + noMarkup(4) + 'Line 4 ' + brMarkup(5) + 'Line</strong> 5</p>' +
          '<ul class="ul-class">' +
            '<li class="li-class">' + noMarkup(6) + 'Line 6 ' + brMarkup(7) + 'Line 7' + '</li>' +
            '<li class="li-class"><ul>' +
              '<li>' + noMarkup(8) + 'Level 2 LI 8</li>' +
              '<li>' + noMarkup(9) + 'Level 2 LI 9</li>' +
            '</ul></li>' +
          '</ul>' +
          '<p>' + noMarkup(10) + 'Line 10 ' + brMarkup(11) + 'Line 11</p>');
    diffService._insertInternalLineMarkers(baseHtmlDom1);

    baseHtmlDom2 = diffService.htmlToFragment('<p><span class="os-line-number line-number-1" data-line-number="1" contenteditable="false">&nbsp;</span>Single text line</p>\
<p><span class="os-line-number line-number-2" data-line-number="2" contenteditable="false">&nbsp;</span>sdfsdfsdfsdf dsfsdfsdfdsflkewjrl ksjfl ksdjf&nbsp;klnlkjBavaria ipsum dolor sit amet Biazelt Auffisteign <br class="os-line-break"><span class="os-line-number line-number-3" data-line-number="3" contenteditable="false">&nbsp;</span>Schorsch mim Radl foahn Ohrwaschl Steckerleis wann griagd ma nacha wos z’dringa glacht Mamalad, <br class="os-line-break"><span class="os-line-number line-number-4" data-line-number="4" contenteditable="false">&nbsp;</span>muass? I bin a woschechta Bayer sowos oamoi und sei und glei wirds no fui lustiga: Jo mei khkhis des <br class="os-line-break"><span class="os-line-number line-number-5" data-line-number="5" contenteditable="false">&nbsp;</span>schee middn ognudelt, Trachtnhuat Biawambn gscheid: Griasd eich midnand etza nix Gwiass woass ma ned <br class="os-line-break"><span class="os-line-number line-number-6" data-line-number="6" contenteditable="false">&nbsp;</span>owe. Dahoam gscheckate middn Spuiratz des is a gmahde Wiesn. Des is schee so Obazda san da, Haferl <br class="os-line-break"><span class="os-line-number line-number-7" data-line-number="7" contenteditable="false">&nbsp;</span>pfenningguat schoo griasd eich midnand.</p>\
<ul>\
<li><span class="os-line-number line-number-8" data-line-number="8" contenteditable="false">&nbsp;</span>Auffi Gamsbart nimma de Sepp Ledahosn Ohrwaschl um Godds wujn Wiesn Deandlgwand Mongdratzal! Jo <br class="os-line-break"><span class="os-line-number line-number-9" data-line-number="9" contenteditable="false">&nbsp;</span>leck mi Mamalad i daad mechad?</li>\
<li><span class="os-line-number line-number-10" data-line-number="10" contenteditable="false">&nbsp;</span>Do nackata Wurscht i hob di narrisch gean, Diandldrahn Deandlgwand vui huift vui woaß?</li>\
<li><span class="os-line-number line-number-11" data-line-number="11" contenteditable="false">&nbsp;</span>Ned Mamalad auffi i bin a woschechta Bayer greaßt eich nachad, umananda gwiss nia need <br class="os-line-break"><span class="os-line-number line-number-12" data-line-number="12" contenteditable="false">&nbsp;</span>Weiznglasl.</li>\
<li><span class="os-line-number line-number-13" data-line-number="13" contenteditable="false">&nbsp;</span>Woibbadinga noch da Giasinga Heiwog Biazelt mechad mim Spuiratz, soi zwoa.</li>\
</ul>\
<p><span class="os-line-number line-number-14" data-line-number="14" contenteditable="false">&nbsp;</span>I waar soweid Blosmusi es nomoi. Broadwurschtbudn des is a gmahde Wiesn Kirwa mogsd a Bussal <br class="os-line-break"><span class="os-line-number line-number-15" data-line-number="15" contenteditable="false">&nbsp;</span>Guglhupf schüds nei. Luja i moan oiwei Baamwach Watschnbaam, wiavui baddscher! Biakriagal a fescha <br class="os-line-break"><span class="os-line-number line-number-16" data-line-number="16" contenteditable="false">&nbsp;</span>1Bua Semmlkneedl iabaroi oba um Godds wujn Ledahosn wui Greichats. Geh um Godds wujn luja heid <br class="os-line-break"><span class="os-line-number line-number-17" data-line-number="17" contenteditable="false">&nbsp;</span>greaßt eich nachad woaß Breihaus eam! De om auf’n Gipfe auf gehds beim Schichtl mehra Baamwach a <br class="os-line-break"><span class="os-line-number line-number-18" data-line-number="18" contenteditable="false">&nbsp;</span>bissal wos gehd ollaweil gscheid:</p>\
<blockquote>\
<p><span class="os-line-number line-number-19" data-line-number="19" contenteditable="false">&nbsp;</span>Scheans Schdarmbeaga See i hob di narrisch gean i jo mei is des schee! Nia eam <br class="os-line-break"><span class="os-line-number line-number-20" data-line-number="20" contenteditable="false">&nbsp;</span>hod vasteh i sog ja nix, i red ja bloß sammawiedaguad, umma eana obandeln! Zwoa <br class="os-line-break"><span class="os-line-number line-number-21" data-line-number="21" contenteditable="false">&nbsp;</span>jo mei scheans amoi, san und hoggd Milli barfuaßat gscheit. Foidweg vui huift <br class="os-line-break"><span class="os-line-number line-number-22" data-line-number="22" contenteditable="false">&nbsp;</span>vui singan, mehra Biakriagal om auf’n Gipfe! Ozapfa sodala Charivari greaßt eich <br class="os-line-break"><span class="os-line-number line-number-23" data-line-number="23" contenteditable="false">&nbsp;</span>nachad Broadwurschtbudn do middn liberalitas Bavariae sowos Leonhardifahrt:</p>\
</blockquote>\
<p><span class="os-line-number line-number-24" data-line-number="24" contenteditable="false">&nbsp;</span>Wui helfgod Wiesn, ognudelt schaugn: Dahoam gelbe Rüam Schneid singan wo hi sauba i moan scho aa no <br class="os-line-break"><span class="os-line-number line-number-25" data-line-number="25" contenteditable="false">&nbsp;</span>a Maß a Maß und no a Maß nimma. Is umananda a ganze Hoiwe zwoa, Schneid. Vui huift vui Brodzeid kumm <br class="os-line-break"><span class="os-line-number line-number-26" data-line-number="26" contenteditable="false">&nbsp;</span>geh naa i daad vo de allerweil, gor. Woaß wia Gams, damischa. A ganze Hoiwe Ohrwaschl Greichats <br class="os-line-break"><span class="os-line-number line-number-27" data-line-number="27" contenteditable="false">&nbsp;</span>iabaroi Prosd Engelgwand nix Reiwadatschi.Weibaleid ognudelt Ledahosn noch da Giasinga Heiwog i daad <br class="os-line-break"><span class="os-line-number line-number-28" data-line-number="28" contenteditable="false">&nbsp;</span>Almrausch, Ewig und drei Dog nackata wea ko, dea ko. Meidromml Graudwiggal nois dei, nackata. No <br class="os-line-break"><span class="os-line-number line-number-29" data-line-number="29" contenteditable="false">&nbsp;</span>Diandldrahn nix Gwiass woass ma ned hod boarischer: Samma sammawiedaguad wos, i hoam Brodzeid. Jo <br class="os-line-break"><span class="os-line-number line-number-30" data-line-number="30" contenteditable="false">&nbsp;</span>mei Sepp Gaudi, is ma Wuascht do Hendl Xaver Prosd eana an a bravs. Sauwedda an Brezn, abfieseln.</p>');
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
      var diff = diffService.extractRangeByLineNumbers(baseHtmlDom1, 1, 2);
      expect(diff.html).toBe('<P>Line 1 ');
      expect(diff.outerContextStart).toBe('');
      expect(diff.outerContextEnd).toBe('');
    });

    it('extracts lines from nested UL/LI-structures', function () {
      var diff = diffService.extractRangeByLineNumbers(baseHtmlDom1, 7, 9);
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
      var diff = diffService.extractRangeByLineNumbers(baseHtmlDom2, 6, 11, true);

      expect(diff.html).toBe('owe. Dahoam gscheckate middn Spuiratz des is a gmahde Wiesn. Des is schee so Obazda san da, Haferl pfenningguat schoo griasd eich midnand.</P><UL><LI>Auffi Gamsbart nimma de Sepp Ledahosn Ohrwaschl um Godds wujn Wiesn Deandlgwand Mongdratzal! Jo leck mi Mamalad i daad mechad?</LI><LI>Do nackata Wurscht i hob di narrisch gean, Diandldrahn Deandlgwand vui huift vui woaß?</LI>');
      expect(diff.ancestor.nodeName).toBe('#document-fragment');
      expect(diff.outerContextStart).toBe('');
      expect(diff.outerContextEnd).toBe('');
      expect(diff.innerContextStart).toBe('<P>');
      expect(diff.innerContextEnd).toBe('</UL>');
      expect(diff.previousHtmlEndSnippet).toBe('</P>');
      expect(diff.followingHtmlStartSnippet).toBe('<UL>');
    });

  });

  describe('merging lines into the original motion', function () {

    it('replaces LIs by a P', function () {
      var merged = diffService.replaceLines(baseHtmlDom1, '<p>Replaced a UL by a P</p>', 6, 9);
      expect(merged).toBe('<P>Line 1 Line 2Line <STRONG>3<BR>Line 4 Line</STRONG> 5</P><P>Replaced a UL by a P</P><UL class="ul-class"><LI class="li-class"><UL><LI>Level 2 LI 9</LI></UL></LI></UL><P>Line 10 Line 11</P>');
    });
    /*
    it('replaces LIs by another LI', function () {
      var merged = diffService.replaceLines(baseHtmlDom1, '<UL class="ul-class"><LI>A new LI</LI></UL>', 6, 9);
      expect(merged).toBe('');
    });
    */

  });
});
