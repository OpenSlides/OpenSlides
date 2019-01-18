import { TestBed } from '@angular/core/testing';

import { MotionPdfExportService } from './motion-pdf-export.service';
import { E2EImportsModule } from 'e2e-imports.module';

describe('MotionPdfExportService', () => {
    beforeEach(() =>
        TestBed.configureTestingModule({
            imports: [E2EImportsModule]
        })
    );

    it('should be created', () => {
        const service: MotionPdfExportService = TestBed.get(MotionPdfExportService);
        expect(service).toBeTruthy();
    });
});
