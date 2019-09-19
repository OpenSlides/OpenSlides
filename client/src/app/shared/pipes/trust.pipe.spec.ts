import { inject } from '@angular/core/testing';
import { DomSanitizer } from '@angular/platform-browser';

import { TrustPipe } from './trust.pipe';

describe('TrustHtmlPipe', () => {
    it('create an instance', inject([DomSanitizer], (domSanitizer: DomSanitizer) => {
        const pipe = new TrustPipe(domSanitizer);
        expect(pipe).toBeTruthy();
    }));
});
