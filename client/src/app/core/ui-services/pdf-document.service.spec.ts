import { TestBed, inject } from '@angular/core/testing';

import { PdfDocumentService } from '../ui-services/pdf-document.service';
import { E2EImportsModule } from 'e2e-imports.module';

describe('PdfDocumentService', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            providers: [PdfDocumentService]
        });
    });

    it('should be created', inject([PdfDocumentService], (service: PdfDocumentService) => {
        expect(service).toBeTruthy();
    }));
});
