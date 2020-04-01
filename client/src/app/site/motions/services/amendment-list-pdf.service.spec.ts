import { TestBed } from '@angular/core/testing';

import { E2EImportsModule } from 'e2e-imports.module';

import { AmendmentListPdfService } from './amendment-list-pdf.service';

describe('AmendmentListPdfService', () => {
    beforeEach(() =>
        TestBed.configureTestingModule({
            imports: [E2EImportsModule]
        })
    );

    it('should be created', () => {
        const service: AmendmentListPdfService = TestBed.inject(AmendmentListPdfService);
        expect(service).toBeTruthy();
    });
});
