import { TestBed } from '@angular/core/testing';

import { E2EImportsModule } from 'e2e-imports.module';

import { MotionPollPdfService } from './motion-poll-pdf.service';

describe('MotionPdfService', () => {
    beforeEach(() =>
        TestBed.configureTestingModule({
            imports: [E2EImportsModule]
        })
    );

    it('should be created', () => {
        const service: MotionPollPdfService = TestBed.inject(MotionPollPdfService);
        expect(service).toBeTruthy();
    });
});
