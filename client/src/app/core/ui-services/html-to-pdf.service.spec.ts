import { inject, TestBed } from '@angular/core/testing';

import { E2EImportsModule } from 'e2e-imports.module';

import { HtmlToPdfService } from './html-to-pdf.service';

describe('HtmlToPdfService', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            providers: [HtmlToPdfService]
        });
    });

    it('should be created', inject([HtmlToPdfService], (service: HtmlToPdfService) => {
        expect(service).toBeTruthy();
    }));
});
