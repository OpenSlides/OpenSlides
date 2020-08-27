import { inject, TestBed } from '@angular/core/testing';

import { LinenumberingService } from './linenumbering.service';

describe('LinenumberingService', () => {
    const brMarkup = (no: number): string => {
            return (
                '<br class="os-line-break">' +
                '<span contenteditable="false" class="os-line-number line-number-' +
                no +
                '" data-line-number="' +
                no +
                '">&nbsp;</span>'
            );
        },
        noMarkup = (no: number): string => {
            return (
                '<span contenteditable="false" class="os-line-number line-number-' +
                no +
                '" data-line-number="' +
                no +
                '">&nbsp;</span>'
            );
        },
        longstr = (length: number): string => {
            let outstr = '';
            for (let i = 0; i < length; i++) {
                outstr += String.fromCharCode(65 + (i % 26));
            }
            return outstr;
        };

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [LinenumberingService]
        });
    });

    it('should be created', inject([LinenumberingService], (service: LinenumberingService) => {
        expect(service).toBeTruthy();
    }));

    describe('paragraph splitting', () => {
        it('breaks simple DIVs', inject([LinenumberingService], (service: LinenumberingService) => {
            const htmlIn = '<DIV class="testclass">Test <strong>1</strong></DIV>' + '\n' + '<p>Test <em>2</em> 3</p>';
            const out = service.splitToParagraphs(htmlIn);
            expect(out.length).toBe(2);
            expect(out[0]).toBe('<div class="testclass">Test <strong>1</strong></div>');
            expect(out[1]).toBe('<p>Test <em>2</em> 3</p>');
        }));
        it('ignores root-level text-nodes', inject([LinenumberingService], (service: LinenumberingService) => {
            const htmlIn = '<DIV class="testclass">Test <strong>3</strong></DIV>' + '\n New line';
            const out = service.splitToParagraphs(htmlIn);
            expect(out.length).toBe(1);
            expect(out[0]).toBe('<div class="testclass">Test <strong>3</strong></div>');
        }));
        it('splits UL-Lists', inject([LinenumberingService], (service: LinenumberingService) => {
            const htmlIn =
                "<UL class='testclass'>\n<li>Node 1</li>\n  <li class='second'>Node <strong>2</strong></li><li><p>Node 3</p></li></UL>";
            const out = service.splitToParagraphs(htmlIn);
            expect(out.length).toBe(3);
            expect(out[0]).toBe('<ul class="testclass"><li>Node 1</li></ul>');
            expect(out[1]).toBe('<ul class="testclass"><li class="second">Node <strong>2</strong></li></ul>');
            expect(out[2]).toBe('<ul class="testclass"><li><p>Node 3</p></li></ul>');
        }));
        it('splits OL-Lists', inject([LinenumberingService], (service: LinenumberingService) => {
            const htmlIn =
                "<OL start='2' class='testclass'>\n<li>Node 1</li>\n  <li class='second'>Node <strong>2</strong></li><li><p>Node 3</p></li></OL>";
            const out = service.splitToParagraphs(htmlIn);
            expect(out.length).toBe(3);
            expect(out[0]).toBe('<ol start="2" class="testclass"><li>Node 1</li></ol>');
            expect(out[1]).toBe('<ol start="3" class="testclass"><li class="second">Node <strong>2</strong></li></ol>');
            expect(out[2]).toBe('<ol start="4" class="testclass"><li><p>Node 3</p></li></ol>');
        }));
    });

    describe('getting line number range', () => {
        it('extracts the line number range, example 1', inject(
            [LinenumberingService],
            (service: LinenumberingService) => {
                const html =
                    '<p>' +
                    noMarkup(2) +
                    'et accusam et justo duo dolores et ea <span style="color: #ff0000;"><strike>rebum </strike></span><span style="color: #006400;">Inserted Text</span>. Stet clita kasd ' +
                    brMarkup(3) +
                    'gubergren,</p>';
                const range = service.getLineNumberRange(html);
                expect(range).toEqual({ from: 2, to: 4 });
            }
        ));
    });

    describe('line numbering: test nodes', () => {
        it('breaks very short lines', inject([LinenumberingService], (service: LinenumberingService) => {
            const textNode = document.createTextNode('0123');
            service.setInlineOffsetLineNumberForTests(0, 1);
            const out = service.textNodeToLines(textNode, 5);
            const outHtml = service.nodesToHtml(out);
            expect(outHtml).toBe('0123');
            expect(service.getInlineOffsetForTests()).toBe(4);
        }));

        it('breaks simple lines', inject([LinenumberingService], (service: LinenumberingService) => {
            const textNode = document.createTextNode('012345678901234567');
            service.setInlineOffsetLineNumberForTests(0, 1);
            const out = service.textNodeToLines(textNode, 5);
            const outHtml = service.nodesToHtml(out);
            expect(outHtml).toBe('01234' + brMarkup(1) + '56789' + brMarkup(2) + '01234' + brMarkup(3) + '567');
            expect(service.getInlineOffsetForTests()).toBe(3);
        }));

        it('breaks simple lines with offset', inject([LinenumberingService], (service: LinenumberingService) => {
            const textNode = document.createTextNode('012345678901234567');
            service.setInlineOffsetLineNumberForTests(2, 1);
            const out = service.textNodeToLines(textNode, 5);
            const outHtml = service.nodesToHtml(out);
            expect(outHtml).toBe('012' + brMarkup(1) + '34567' + brMarkup(2) + '89012' + brMarkup(3) + '34567');
            expect(service.getInlineOffsetForTests()).toBe(5);
        }));

        it('breaks simple lines with offset equaling to length', inject(
            [LinenumberingService],
            (service: LinenumberingService) => {
                const textNode = document.createTextNode('012345678901234567');
                service.setInlineOffsetLineNumberForTests(5, 1);
                const out = service.textNodeToLines(textNode, 5);
                const outHtml = service.nodesToHtml(out);
                expect(outHtml).toBe(
                    brMarkup(1) + '01234' + brMarkup(2) + '56789' + brMarkup(3) + '01234' + brMarkup(4) + '567'
                );
                expect(service.getInlineOffsetForTests()).toBe(3);
            }
        ));

        it('breaks simple lines with spaces (1)', inject([LinenumberingService], (service: LinenumberingService) => {
            const textNode = document.createTextNode('0123 45 67 89012 34 567');
            service.setInlineOffsetLineNumberForTests(0, 1);
            const out = service.textNodeToLines(textNode, 5);
            const outHtml = service.nodesToHtml(out);
            expect(outHtml).toBe(
                '0123 ' + brMarkup(1) + '45 67 ' + brMarkup(2) + '89012 ' + brMarkup(3) + '34 ' + brMarkup(4) + '567'
            );
            expect(service.getInlineOffsetForTests()).toBe(3);
        }));

        it('breaks simple lines with spaces (2)', inject([LinenumberingService], (service: LinenumberingService) => {
            const textNode = document.createTextNode('0123 45 67 89012tes 344 ');
            service.setInlineOffsetLineNumberForTests(0, 1);
            const out = service.textNodeToLines(textNode, 5);
            const outHtml = service.nodesToHtml(out);
            expect(outHtml).toBe(
                '0123 ' + brMarkup(1) + '45 67 ' + brMarkup(2) + '89012' + brMarkup(3) + 'tes ' + brMarkup(4) + '344 '
            );
            expect(service.getInlineOffsetForTests()).toBe(4);
        }));

        it('breaks simple lines with spaces (3)', inject([LinenumberingService], (service: LinenumberingService) => {
            const textNode = document.createTextNode("I'm a Demo-Text");
            service.setInlineOffsetLineNumberForTests(0, 1);
            const out = service.textNodeToLines(textNode, 5);
            const outHtml = service.nodesToHtml(out);
            expect(outHtml).toBe("I'm a " + brMarkup(1) + 'Demo-' + brMarkup(2) + 'Text');
            expect(service.getInlineOffsetForTests()).toBe(4);
        }));

        it('breaks simple lines with spaces (4)', inject([LinenumberingService], (service: LinenumberingService) => {
            const textNode = document.createTextNode("I'm a LongDemo-Text");
            service.setInlineOffsetLineNumberForTests(0, 1);
            const out = service.textNodeToLines(textNode, 5);
            const outHtml = service.nodesToHtml(out);
            expect(outHtml).toBe("I'm a " + brMarkup(1) + 'LongD' + brMarkup(2) + 'emo-' + brMarkup(3) + 'Text');
            expect(service.getInlineOffsetForTests()).toBe(4);
        }));
    });

    describe('line numbering: inline nodes', () => {
        it('leaves a simple SPAN untouched', inject([LinenumberingService], (service: LinenumberingService) => {
            const inHtml = '<span>Test</span>';
            const outHtml = service.insertLineNumbers(inHtml, 5);
            expect(outHtml).toBe(noMarkup(1) + '<span>Test</span>');
            expect(service.stripLineNumbers(outHtml)).toBe(inHtml);
            expect(service.insertLineBreaksWithoutNumbers(outHtml, 80)).toBe(outHtml);
        }));

        it('breaks lines in a simple SPAN', inject([LinenumberingService], (service: LinenumberingService) => {
            const inHtml = '<span>Lorem ipsum dolorsit amet</span>';
            const outHtml = service.insertLineNumbers(inHtml, 5);
            expect(outHtml).toBe(
                noMarkup(1) +
                    '<span>Lorem ' +
                    brMarkup(2) +
                    'ipsum ' +
                    brMarkup(3) +
                    'dolor' +
                    brMarkup(4) +
                    'sit ' +
                    brMarkup(5) +
                    'amet</span>'
            );
            expect(service.stripLineNumbers(outHtml)).toBe(inHtml);
            expect(service.insertLineBreaksWithoutNumbers(outHtml, 80)).toBe(outHtml);
        }));

        it('breaks lines in nested inline elements', inject([LinenumberingService], (service: LinenumberingService) => {
            const inHtml = '<span>Lorem <strong>ipsum dolorsit</strong> amet</span>';
            const outHtml = service.insertLineNumbers(inHtml, 5);
            expect(outHtml).toBe(
                noMarkup(1) +
                    '<span>Lorem ' +
                    brMarkup(2) +
                    '<strong>ipsum ' +
                    brMarkup(3) +
                    'dolor' +
                    brMarkup(4) +
                    'sit</strong> ' +
                    brMarkup(5) +
                    'amet</span>'
            );
            expect(service.stripLineNumbers(outHtml)).toBe(inHtml);
            expect(service.insertLineBreaksWithoutNumbers(outHtml, 80)).toBe(outHtml);
        }));

        it('counts within DEL nodes', inject([LinenumberingService], (service: LinenumberingService) => {
            const inHtml = '1234 <del>1234</del> 1234 1234';
            const outHtml = service.insertLineNumbers(inHtml, 10);
            expect(outHtml).toBe(noMarkup(1) + '1234 <del>1234</del> ' + brMarkup(2) + '1234 1234');
            expect(service.stripLineNumbers(outHtml)).toBe(inHtml);
            expect(service.insertLineBreaksWithoutNumbers(outHtml, 80)).toBe(outHtml);
        }));

        it('counts after DEL/INS-nodes', inject([LinenumberingService], (service: LinenumberingService) => {
            const inHtml =
                '<P>leo Testelefantgeweih Buchstabenwut als Achzehnzahlunginer. Hierbei <DEL>darf</DEL><INS>setzen</INS> bist der Deifi <DEL>das </DEL><INS>Dor Reh Wachtel da </INS>Subjunktivier <DEL>als Derftige Aal</DEL><INS>san</INS> Orthopädische<DEL>, der Arbeitsnachweisdiskus Bass der Tastatur </DEL><DEL>Weiter schreiben wie Tasse Wasser als</DEL><INS> dienen</INS>.</P>';
            const outHtml = service.insertLineNumbers(inHtml, 95);
            expect(outHtml).toBe(
                '<p>' +
                    noMarkup(1) +
                    'leo Testelefantgeweih Buchstabenwut als Achzehnzahlunginer. Hierbei <del>darf</del><ins>setzen</ins> bist der Deifi <del>das ' +
                    brMarkup(2) +
                    '</del><ins>Dor Reh Wachtel da </ins>Subjunktivier <del>als Derftige Aal</del><ins>san</ins> Orthopädische<del>, der Arbeitsnachweisdiskus Bass der Tastatur </del>' +
                    brMarkup(3) +
                    '<del>Weiter schreiben wie Tasse Wasser als</del><ins> dienen</ins>.</p>'
            );
        }));

        it('handles STRIKE-tags', inject([LinenumberingService], (service: LinenumberingService) => {
            const inHtml =
                '<p>et accusam et justo duo dolores et ea <span style="color: #ff0000;"><strike>rebum </strike></span><span style="color: #006400;">Inserted Text</span>. Stet clita kasd gubergren,</p>';
            const outHtml = service.insertLineNumbers(inHtml, 80);
            expect(outHtml).toBe(
                '<p>' +
                    noMarkup(1) +
                    'et accusam et justo duo dolores et ea <span style="color: #ff0000;"><strike>rebum </strike></span><span style="color: #006400;">Inserted Text</span>. Stet clita kasd ' +
                    brMarkup(2) +
                    'gubergren,</p>'
            );
            expect(service.stripLineNumbers(outHtml)).toBe(inHtml);
            expect(service.insertLineBreaksWithoutNumbers(outHtml, 80)).toBe(outHtml);
        }));

        it('treats ascii newline characters like spaces', inject(
            [LinenumberingService],
            (service: LinenumberingService) => {
                const inHtml = '<p>Test 123\nTest1</p>';
                const outHtml = service.insertLineNumbers(inHtml, 5);
                expect(outHtml).toBe('<p>' + noMarkup(1) + 'Test ' + brMarkup(2) + '123\n' + brMarkup(3) + 'Test1</p>');
            }
        ));
    });

    describe('line numbering: block nodes', () => {
        it('leaves a simple DIV untouched', inject([LinenumberingService], (service: LinenumberingService) => {
            const inHtml = '<div>Test</div>';
            const outHtml = service.insertLineNumbers(inHtml, 5);
            expect(outHtml).toBe('<div>' + noMarkup(1) + 'Test</div>');
            expect(service.stripLineNumbers(outHtml)).toBe(inHtml);
            expect(service.insertLineBreaksWithoutNumbers(outHtml, 80)).toBe(outHtml);
        }));

        it('breaks a DIV containing only inline elements', inject(
            [LinenumberingService],
            (service: LinenumberingService) => {
                const inHtml = '<div>Test <span>Test1234</span>5678 Test</div>';
                const outHtml = service.insertLineNumbers(inHtml, 5);
                expect(outHtml).toBe(
                    '<div>' +
                        noMarkup(1) +
                        'Test ' +
                        brMarkup(2) +
                        '<span>Test1' +
                        brMarkup(3) +
                        '234</span>56' +
                        brMarkup(4) +
                        '78 ' +
                        brMarkup(5) +
                        'Test</div>'
                );
                expect(service.stripLineNumbers(outHtml)).toBe(inHtml);
                expect(service.insertLineBreaksWithoutNumbers(outHtml, 80)).toBe(outHtml);
            }
        ));

        it('handles a DIV within a DIV correctly', inject([LinenumberingService], (service: LinenumberingService) => {
            const inHtml = '<div>Te<div>Te Test</div>Test</div>';
            const outHtml = service.insertLineNumbers(inHtml, 5);
            expect(outHtml).toBe(
                '<div>' +
                    noMarkup(1) +
                    'Te<div>' +
                    noMarkup(2) +
                    'Te ' +
                    brMarkup(3) +
                    'Test</div>' +
                    noMarkup(4) +
                    'Test</div>'
            );
            expect(service.stripLineNumbers(outHtml)).toBe(inHtml);
            expect(service.insertLineBreaksWithoutNumbers(outHtml, 80)).toBe(outHtml);
        }));

        it('ignores white spaces between block element tags', inject(
            [LinenumberingService],
            (service: LinenumberingService) => {
                const inHtml = '<ul>\n<li>Test</li>\n</ul>';
                const outHtml = service.insertLineNumbers(inHtml, 80);
                expect(outHtml).toBe('<ul>\n<li>' + noMarkup(1) + 'Test</li>\n</ul>');
                expect(service.stripLineNumbers(outHtml)).toBe(inHtml);
                expect(service.insertLineBreaksWithoutNumbers(outHtml, 80)).toBe(outHtml);
            }
        ));
    });

    describe('indentation for block elements', () => {
        it('indents LI-elements', inject([LinenumberingService], (service: LinenumberingService) => {
            const inHtml = '<div>' + longstr(100) + '<ul><li>' + longstr(100) + '</li></ul>' + longstr(100) + '</div>';
            const expected =
                '<div>' +
                noMarkup(1) +
                'ABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZAB' +
                brMarkup(2) +
                'CDEFGHIJKLMNOPQRSTUV' +
                '<ul><li>' +
                noMarkup(3) +
                'ABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVW' +
                brMarkup(4) +
                'XYZABCDEFGHIJKLMNOPQRSTUV' +
                '</li></ul>' +
                noMarkup(5) +
                'ABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZAB' +
                brMarkup(6) +
                'CDEFGHIJKLMNOPQRSTUV</div>';
            const outHtml = service.insertLineNumbers(inHtml, 80);
            expect(outHtml).toBe(expected);
            expect(service.stripLineNumbers(outHtml)).toBe(inHtml);
            expect(service.insertLineBreaksWithoutNumbers(outHtml, 80)).toBe(outHtml);
        }));

        it('indents BLOCKQUOTE-elements', inject([LinenumberingService], (service: LinenumberingService) => {
            const inHtml =
                '<div>' + longstr(100) + '<blockquote>' + longstr(100) + '</blockquote>' + longstr(100) + '</div>';
            const expected =
                '<div>' +
                noMarkup(1) +
                'ABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZAB' +
                brMarkup(2) +
                'CDEFGHIJKLMNOPQRSTUV' +
                '<blockquote>' +
                noMarkup(3) +
                'ABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGH' +
                brMarkup(4) +
                'IJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUV' +
                '</blockquote>' +
                noMarkup(5) +
                'ABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZAB' +
                brMarkup(6) +
                'CDEFGHIJKLMNOPQRSTUV</div>';
            const outHtml = service.insertLineNumbers(inHtml, 80);
            expect(outHtml).toBe(expected);
            expect(service.stripLineNumbers(outHtml)).toBe(inHtml);
            expect(service.insertLineBreaksWithoutNumbers(outHtml, 80)).toBe(outHtml);
        }));

        it('shortens the line for H1-elements by 2/3', inject(
            [LinenumberingService],
            (service: LinenumberingService) => {
                const inHtml = '<h1>' + longstr(80) + '</h1>';
                const expected =
                    '<h1>' +
                    noMarkup(1) +
                    'ABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZA' +
                    brMarkup(2) +
                    'BCDEFGHIJKLMNOPQRSTUVWXYZAB</h1>';
                const outHtml = service.insertLineNumbers(inHtml, 80);
                expect(outHtml).toBe(expected);
                expect(service.stripLineNumbers(outHtml)).toBe(inHtml);
                expect(service.insertLineBreaksWithoutNumbers(outHtml, 80)).toBe(outHtml);
            }
        ));

        it('shortens the line for H2-elements by 0.75', inject(
            [LinenumberingService],
            (service: LinenumberingService) => {
                const inHtml = '<h2>' + longstr(80) + '</h2>';
                const expected =
                    '<h2>' +
                    noMarkup(1) +
                    'ABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGH' +
                    brMarkup(2) +
                    'IJKLMNOPQRSTUVWXYZAB</h2>';
                const outHtml = service.insertLineNumbers(inHtml, 80);
                expect(outHtml).toBe(expected);
                expect(service.stripLineNumbers(outHtml)).toBe(inHtml);
                expect(service.insertLineBreaksWithoutNumbers(outHtml, 80)).toBe(outHtml);
            }
        ));

        it('indents Ps with 30px-padding by 6 characters', inject(
            [LinenumberingService],
            (service: LinenumberingService) => {
                const inHtml = '<div style="padding-left: 30px;">' + longstr(80) + '</div>';
                const expected =
                    '<div style="padding-left: 30px;">' +
                    noMarkup(1) +
                    'ABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUV' +
                    brMarkup(2) +
                    'WXYZAB</div>';
                const outHtml = service.insertLineNumbers(inHtml, 80);
                expect(outHtml).toBe(expected);
                expect(service.stripLineNumbers(outHtml)).toBe(inHtml);
                expect(service.insertLineBreaksWithoutNumbers(outHtml, 80)).toBe(outHtml);
            }
        ));

        it('breaks before an inline element, if the first word of the new inline element is longer than the remaining line (1)', inject(
            [LinenumberingService],
            (service: LinenumberingService) => {
                const inHtml =
                    '<p>Duis autem vel eum iriure dolor in hendrerit in vulputate velit esse molestie <strong>consequat, vel illum dolore eu feugiat nulla facilisis at vero eros et accumsan et iusto odio</strong>.</p>';
                const outHtml = service.insertLineNumbers(inHtml, 80);
                expect(outHtml).toBe(
                    '<p>' +
                        noMarkup(1) +
                        'Duis autem vel eum iriure dolor in hendrerit in vulputate velit esse molestie ' +
                        brMarkup(2) +
                        '<strong>consequat, vel illum dolore eu feugiat nulla facilisis at vero eros et accumsan ' +
                        brMarkup(3) +
                        'et iusto odio</strong>.</p>'
                );
                expect(service.stripLineNumbers(outHtml)).toBe(inHtml);
                expect(service.insertLineBreaksWithoutNumbers(outHtml, 80)).toBe(outHtml);
            }
        ));

        it('breaks before an inline element, if the first word of the new inline element is longer than the remaining line (2)', inject(
            [LinenumberingService],
            (service: LinenumberingService) => {
                const inHtml =
                    '<p><span>Duis autem vel eum iriure dolor in hendrerit in vulputate velit esse molestie <strong>consequat, vel illum dolore eu feugiat nulla facilisis at vero eros et accumsan et iusto odio</strong>.</span></p>';
                const outHtml = service.insertLineNumbers(inHtml, 80);
                expect(outHtml).toBe(
                    '<p>' +
                        noMarkup(1) +
                        '<span>Duis autem vel eum iriure dolor in hendrerit in vulputate velit esse molestie ' +
                        brMarkup(2) +
                        '<strong>consequat, vel illum dolore eu feugiat nulla facilisis at vero eros et accumsan ' +
                        brMarkup(3) +
                        'et iusto odio</strong>.</span></p>'
                );
                expect(service.stripLineNumbers(outHtml)).toBe(inHtml);
                expect(service.insertLineBreaksWithoutNumbers(outHtml, 80)).toBe(outHtml);
            }
        ));

        it('does not fail in a weird case', inject([LinenumberingService], (service: LinenumberingService) => {
            const inHtml = '<ins>seid Noch</ins><p></p><p><ins>Test 123</ins></p>';
            const outHtml = service.insertLineNumbers(inHtml, 80);
            expect(outHtml).toBe(
                noMarkup(1) + '<ins>seid Noch</ins><p></p><p>' + noMarkup(2) + '<ins>Test 123</ins></p>'
            );
            expect(service.stripLineNumbers(outHtml)).toBe(inHtml);
            expect(service.insertLineBreaksWithoutNumbers(outHtml, 80)).toBe(outHtml);
        }));
    });

    describe('line numbering in regard to the inline diff', () => {
        it('does not count within INS nodes', inject([LinenumberingService], (service: LinenumberingService) => {
            const inHtml = '1234 <ins>1234</ins> 1234 1234';
            const outHtml = service.insertLineNumbers(inHtml, 10);
            expect(outHtml).toBe(noMarkup(1) + '1234 <ins>1234</ins> 1234 ' + brMarkup(2) + '1234');
            expect(service.stripLineNumbers(outHtml)).toBe(inHtml);
            expect(service.insertLineBreaksWithoutNumbers(outHtml, 80)).toBe(outHtml);
        }));

        it('does not count within .insert nodes', inject([LinenumberingService], (service: LinenumberingService) => {
            const inHtml = '<p>1234</p><ul class="insert"><li>1234</li></ul><p>1234 1234</p>';
            const outHtml = service.insertLineNumbers(inHtml, 10);
            expect(outHtml).toBe(
                '<p>' + noMarkup(1) + '1234</p><ul class="insert"><li>1234</li></ul><p>' + noMarkup(2) + '1234 1234</p>'
            );
            expect(service.stripLineNumbers(outHtml)).toBe(inHtml);
            expect(service.insertLineBreaksWithoutNumbers(outHtml, 80)).toBe(outHtml);
        }));

        it('does not create a new line for a trailing INS', inject(
            [LinenumberingService],
            (service: LinenumberingService) => {
                const inHtml =
                    '<p>et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur<ins>dsfsdf23</ins></p>';
                const outHtml = service.insertLineNumbers(inHtml, 80);
                expect(outHtml).toBe(
                    '<p>' +
                        noMarkup(1) +
                        'et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata ' +
                        brMarkup(2) +
                        'sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur<ins>dsfsdf23</ins></p>'
                );
                expect(service.stripLineNumbers(outHtml)).toBe(inHtml);
                expect(service.insertLineBreaksWithoutNumbers(outHtml, 80)).toBe(outHtml);
            }
        ));

        it('inserts the line number before the INS, if INS is the first element of the paragraph', inject(
            [LinenumberingService],
            (service: LinenumberingService) => {
                const inHtml =
                    "<p><ins>lauthals </ins>'liebe Kinder, ich will hinaus in den Wald, seid auf der Hut vor dem Wolf!' Und noch etwas mehr Text bis zur nächsten Zeile</p>";
                const outHtml = service.insertLineNumbers(inHtml, 80);
                expect(outHtml).toBe(
                    '<p>' +
                        noMarkup(1) +
                        "<ins>lauthals </ins>'liebe Kinder, ich will hinaus in den Wald, seid auf der Hut vor dem Wolf!' Und " +
                        brMarkup(2) +
                        'noch etwas mehr Text bis zur nächsten Zeile</p>'
                );
                expect(service.stripLineNumbers(outHtml)).toBe(inHtml);
                expect(service.insertLineBreaksWithoutNumbers(outHtml, 80)).toBe(outHtml);
            }
        ));

        it('cancels newlines after br-elements', inject([LinenumberingService], (service: LinenumberingService) => {
            const inHtml = '<p>Test 123<br>\nTest 456</p>';
            const outHtml = service.insertLineNumbers(inHtml, 80);
            expect(outHtml).toBe('<p>' + noMarkup(1) + 'Test 123<br>' + noMarkup(2) + 'Test 456</p>');
        }));

        it('does not force-break words right after an INS', inject(
            [LinenumberingService],
            (service: LinenumberingService) => {
                const inHtml = '<p>' + noMarkup(1) + '012345 <ins>78 01 34567</ins>8901234567890123456789</p>';
                const outHtml = service.insertLineBreaksWithoutNumbers(inHtml, 20, true);
                expect(outHtml).toBe(
                    '<p>' +
                        noMarkup(1) +
                        '012345 <ins>78 01 <br class="os-line-break">34567</ins>890123456789012<br class="os-line-break">3456789</p>'
                );
            }
        ));
    });

    describe('line breaking without adding line numbers', () => {
        const plainBr = '<br class="os-line-break">';

        it('breaks a DIV containing only inline elements', inject(
            [LinenumberingService],
            (service: LinenumberingService) => {
                const inHtml = '<div>Test <span>Test1234</span>5678 Test</div>';
                const outHtml = service.insertLineBreaksWithoutNumbers(inHtml, 5);
                expect(outHtml).toBe(
                    '<div>Test ' +
                        plainBr +
                        '<span>Test1' +
                        plainBr +
                        '234</span>56' +
                        plainBr +
                        '78 ' +
                        plainBr +
                        'Test</div>'
                );
                expect(service.stripLineNumbers(outHtml)).toBe(inHtml);
                expect(service.insertLineBreaksWithoutNumbers(outHtml, 80)).toBe(outHtml);
            }
        ));

        it('indents BLOCKQUOTE-elements', inject([LinenumberingService], (service: LinenumberingService) => {
            const inHtml =
                '<div>' + longstr(100) + '<blockquote>' + longstr(100) + '</blockquote>' + longstr(100) + '</div>';
            const expected =
                '<div>' +
                'ABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZAB' +
                plainBr +
                'CDEFGHIJKLMNOPQRSTUV' +
                '<blockquote>' +
                'ABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGH' +
                plainBr +
                'IJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUV' +
                '</blockquote>' +
                'ABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZAB' +
                plainBr +
                'CDEFGHIJKLMNOPQRSTUV</div>';
            const outHtml = service.insertLineBreaksWithoutNumbers(inHtml, 80);
            expect(outHtml).toBe(expected);
            expect(service.insertLineBreaksWithoutNumbers(outHtml, 80)).toBe(outHtml);
        }));

        it('DOES count within INS nodes', inject([LinenumberingService], (service: LinenumberingService) => {
            const inHtml = '1234 <ins>1234</ins> 1234 1234';
            const outHtml = service.insertLineBreaksWithoutNumbers(inHtml, 10, true);
            expect(outHtml).toBe('1234 <ins>1234</ins> ' + plainBr + '1234 1234');
            expect(service.insertLineBreaksWithoutNumbers(outHtml, 80)).toBe(outHtml);
        }));

        it('does not create a new line for a trailing INS', inject(
            [LinenumberingService],
            (service: LinenumberingService) => {
                const inHtml =
                    '<p>et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur<ins>dsfsdf23</ins></p>';
                const outHtml = service.insertLineBreaksWithoutNumbers(inHtml, 80, true);
                expect(outHtml).toBe(
                    '<p>et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata ' +
                        plainBr +
                        'sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur' +
                        plainBr +
                        '<ins>dsfsdf23</ins></p>'
                );
                expect(service.insertLineBreaksWithoutNumbers(outHtml, 80)).toBe(outHtml);
            }
        ));

        it('ignores witespaces by previously added line numbers', inject(
            [LinenumberingService],
            (service: LinenumberingService) => {
                const inHtml = '<p>' + noMarkup(1) + longstr(10) + '</p>';
                const outHtml = service.insertLineBreaksWithoutNumbers(inHtml, 10, true);
                expect(outHtml).toBe('<p>' + noMarkup(1) + longstr(10) + '</p>');
                expect(service.insertLineBreaksWithoutNumbers(outHtml, 80)).toBe(outHtml);
            }
        ));
    });

    describe('behavior regarding ckeditor', () => {
        it('does not count empty lines, case 1', inject([LinenumberingService], (service: LinenumberingService) => {
            const inHtml = '<p>Line 1</p>\n\n<p>Line 2</p>';
            const outHtml = service.insertLineNumbers(inHtml, 80);
            expect(outHtml).toBe('<p>' + noMarkup(1) + 'Line 1</p>' + '\n\n' + '<p>' + noMarkup(2) + 'Line 2</p>');
        }));

        it('does not count empty lines, case 2', inject([LinenumberingService], (service: LinenumberingService) => {
            const inHtml = '<ul>\n\n<li>Point 1</li>\n\n</ul>';
            const outHtml = service.insertLineNumbers(inHtml, 80);
            expect(outHtml).toBe('<ul>\n\n<li>' + noMarkup(1) + 'Point 1</li>\n\n</ul>');
        }));
    });

    describe('line highlighting', () => {
        it('highlights a simple line', inject([LinenumberingService], (service: LinenumberingService) => {
            const inHtml = service.insertLineNumbers('<span>Lorem ipsum dolorsit amet</span>', 5);
            const highlighted = service.highlightLine(inHtml, 2);
            expect(highlighted).toBe(
                noMarkup(1) +
                    '<span>Lorem ' +
                    brMarkup(2) +
                    '<span class="highlight">ipsum </span>' +
                    brMarkup(3) +
                    'dolor' +
                    brMarkup(4) +
                    'sit ' +
                    brMarkup(5) +
                    'amet</span>'
            );
        }));

        it('highlights a simple line with formattings', inject(
            [LinenumberingService],
            (service: LinenumberingService) => {
                const inHtml = service.insertLineNumbers(
                    '<span>Lorem ipsum <strong>dolorsit amet Lorem</strong><em> ipsum dolorsit amet</em> Lorem ipsum dolorsit amet</span>',
                    20
                );
                expect(inHtml).toBe(
                    noMarkup(1) +
                        '<span>Lorem ipsum <strong>dolorsit ' +
                        brMarkup(2) +
                        'amet Lorem</strong><em> ipsum ' +
                        brMarkup(3) +
                        'dolorsit amet</em> Lorem ' +
                        brMarkup(4) +
                        'ipsum dolorsit amet</span>'
                );

                const highlighted = service.highlightLine(inHtml, 2);
                expect(highlighted).toBe(
                    noMarkup(1) +
                        '<span>Lorem ipsum <strong>dolorsit ' +
                        brMarkup(2) +
                        '<span class="highlight">amet Lorem</span></strong><em><span class="highlight"> ipsum </span>' +
                        brMarkup(3) +
                        'dolorsit amet</em> Lorem ' +
                        brMarkup(4) +
                        'ipsum dolorsit amet</span>'
                );
            }
        ));

        it('highlights the last line', inject([LinenumberingService], (service: LinenumberingService) => {
            const inHtml = service.insertLineNumbers('<span>Lorem ipsum dolorsit amet</span>', 5);
            const highlighted = service.highlightLine(inHtml, 5);
            expect(highlighted).toBe(
                noMarkup(1) +
                    '<span>Lorem ' +
                    brMarkup(2) +
                    'ipsum ' +
                    brMarkup(3) +
                    'dolor' +
                    brMarkup(4) +
                    'sit ' +
                    brMarkup(5) +
                    '<span class="highlight">amet</span></span>'
            );
        }));

        it('highlights the first line', inject([LinenumberingService], (service: LinenumberingService) => {
            const inHtml = service.insertLineNumbers('<span>Lorem ipsum dolorsit amet</span>', 5);
            const highlighted = service.highlightLine(inHtml, 1);
            expect(highlighted).toBe(
                noMarkup(1) +
                    '<span><span class="highlight">Lorem </span>' +
                    brMarkup(2) +
                    'ipsum ' +
                    brMarkup(3) +
                    'dolor' +
                    brMarkup(4) +
                    'sit ' +
                    brMarkup(5) +
                    'amet</span>'
            );
        }));

        it('does not change the string if the line number is not found', inject(
            [LinenumberingService],
            (service: LinenumberingService) => {
                const inHtml = service.insertLineNumbers('<span>Lorem ipsum dolorsit amet</span>', 5);
                const highlighted = service.highlightLine(inHtml, 8);
                expect(highlighted).toBe(
                    noMarkup(1) +
                        '<span>Lorem ' +
                        brMarkup(2) +
                        'ipsum ' +
                        brMarkup(3) +
                        'dolor' +
                        brMarkup(4) +
                        'sit ' +
                        brMarkup(5) +
                        'amet</span>'
                );
            }
        ));
    });

    describe('document structure parsing', () => {
        it('detects the line numbers of headings', inject([LinenumberingService], (service: LinenumberingService) => {
            let inHtml =
                '<p>Line 1</p>' +
                '<h1>Heading 1</h1><p>Line 2</p><h2>Heading 1.1</h2><p>Line 3</p><h2>Heading 1.2</h2><p>Line 4</p>' +
                '<h1>Heading 2</h1><h2>Heading 2.1</h2><p>Line 5</p>';
            inHtml = service.insertLineNumbers(inHtml, 80);
            const structure = service.getHeadingsWithLineNumbers(inHtml);
            expect(structure).toEqual([
                { lineNumber: 2, level: 1, text: 'Heading 1' },
                { lineNumber: 4, level: 2, text: 'Heading 1.1' },
                { lineNumber: 6, level: 2, text: 'Heading 1.2' },
                { lineNumber: 8, level: 1, text: 'Heading 2' },
                { lineNumber: 9, level: 2, text: 'Heading 2.1' }
            ]);
        }));
    });

    describe('adapting html for pdf generation', () => {
        it('splits inline tags', inject([LinenumberingService], (service: LinenumberingService) => {
            const inHtml =
                '<ul><li><p><span class="test"><strong>' +
                noMarkup(1) +
                'Line 1' +
                brMarkup(2) +
                '<em>Line 2' +
                brMarkup(3) +
                'Line 3</em>' +
                '</strong></span></p></li></ul>';
            const stripped = service.splitInlineElementsAtLineBreaks(inHtml);
            expect(stripped).toBe(
                '<ul><li><p>' +
                    noMarkup(1) +
                    '<span class="test"><strong>Line 1</strong></span>' +
                    brMarkup(2) +
                    '<span class="test"><strong><em>Line 2</em></strong></span>' +
                    brMarkup(3) +
                    '<span class="test"><strong><em>Line 3</em></strong></span>' +
                    '</p></li></ul>'
            );
        }));
    });

    describe('caching', () => {
        it('caches based on line length', inject([LinenumberingService], (service: LinenumberingService) => {
            const inHtml = '<p>' + longstr(100) + '</p>';
            const outHtml80 = service.insertLineNumbers(inHtml, 80);
            const outHtml70 = service.insertLineNumbers(inHtml, 70);
            expect(outHtml70).not.toBe(outHtml80);
        }));
    });
});
