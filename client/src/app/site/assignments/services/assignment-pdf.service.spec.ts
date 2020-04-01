import { TestBed } from '@angular/core/testing';

import { E2EImportsModule } from 'e2e-imports.module';

import { AssignmentPdfService } from './assignment-pdf.service';

describe('AssignmentPdfService', () => {
    beforeEach(() =>
        TestBed.configureTestingModule({
            imports: [E2EImportsModule]
        })
    );

    it('should be created', () => {
        const service: AssignmentPdfService = TestBed.inject(AssignmentPdfService);
        expect(service).toBeTruthy();
    });
});
