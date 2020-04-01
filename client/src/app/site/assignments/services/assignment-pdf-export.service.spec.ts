import { TestBed } from '@angular/core/testing';

import { E2EImportsModule } from 'e2e-imports.module';

import { AssignmentPdfExportService } from './assignment-pdf-export.service';

describe('AssignmentPdfExportService', () => {
    beforeEach(() =>
        TestBed.configureTestingModule({
            imports: [E2EImportsModule]
        })
    );

    it('should be created', () => {
        const service: AssignmentPdfExportService = TestBed.inject(AssignmentPdfExportService);
        expect(service).toBeTruthy();
    });
});
