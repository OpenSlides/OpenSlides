import { TestBed } from '@angular/core/testing';

import { MotionPdfService } from './motion-pdf.service';
import { E2EImportsModule } from 'e2e-imports.module';

describe('MotionPdfService', () => {
    beforeEach(() =>
        TestBed.configureTestingModule({
            imports: [E2EImportsModule]
        })
    );

    it('should be created', () => {
        const service: MotionPdfService = TestBed.get(MotionPdfService);
        expect(service).toBeTruthy();
    });
});
