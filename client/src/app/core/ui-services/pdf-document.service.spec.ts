import { TestBed } from '@angular/core/testing';

import { PdfDocumentService } from '../ui-services/pdf-document.service';
import { E2EImportsModule } from 'e2e-imports.module';

describe('PdfDocumentService', () => {
    beforeEach(() =>
        TestBed.configureTestingModule({
            imports: [E2EImportsModule]
        })
    );

    it('should be created', () => {
        const service: PdfDocumentService = TestBed.get(PdfDocumentService);
        expect(service).toBeTruthy();
    });
});
