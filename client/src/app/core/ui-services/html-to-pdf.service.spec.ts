import { TestBed, inject } from '@angular/core/testing';

import { HtmlToPdfService } from './html-to-pdf.service';
import { E2EImportsModule } from 'e2e-imports.module';

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
