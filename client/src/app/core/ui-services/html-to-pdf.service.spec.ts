import { TestBed } from '@angular/core/testing';

import { HtmlToPdfService } from './html-to-pdf.service';

describe('HtmlToPdfService', () => {
    beforeEach(() => TestBed.configureTestingModule({}));

    it('should be created', () => {
        const service: HtmlToPdfService = TestBed.get(HtmlToPdfService);
        expect(service).toBeTruthy();
    });
});
