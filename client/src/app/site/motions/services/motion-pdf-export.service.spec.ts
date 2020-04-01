import { TestBed } from '@angular/core/testing';

import { E2EImportsModule } from 'e2e-imports.module';

import { MotionPdfExportService } from './motion-pdf-export.service';

describe('MotionPdfExportService', () => {
    beforeEach(() =>
        TestBed.configureTestingModule({
            imports: [E2EImportsModule]
        })
    );

    it('should be created', () => {
        const service: MotionPdfExportService = TestBed.inject(MotionPdfExportService);
        expect(service).toBeTruthy();
    });
});
