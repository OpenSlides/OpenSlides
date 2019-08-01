import { inject, TestBed } from '@angular/core/testing';

import { E2EImportsModule } from 'e2e-imports.module';

import { PdfDocumentService } from './pdf-document.service';

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
