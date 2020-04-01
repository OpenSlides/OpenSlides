import { TestBed } from '@angular/core/testing';

import { E2EImportsModule } from 'e2e-imports.module';

import { MotionPdfService } from './motion-pdf.service';

describe('MotionPdfService', () => {
    beforeEach(() =>
        TestBed.configureTestingModule({
            imports: [E2EImportsModule]
        })
    );

    it('should be created', () => {
        const service: MotionPdfService = TestBed.inject(MotionPdfService);
        expect(service).toBeTruthy();
    });
});
