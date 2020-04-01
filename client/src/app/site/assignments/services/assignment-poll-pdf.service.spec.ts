import { TestBed } from '@angular/core/testing';

import { E2EImportsModule } from 'e2e-imports.module';

import { AssignmentPollPdfService } from './assignment-poll-pdf.service';

describe('MotionPdfService', () => {
    beforeEach(() =>
        TestBed.configureTestingModule({
            imports: [E2EImportsModule]
        })
    );

    it('should be created', () => {
        const service: AssignmentPollPdfService = TestBed.inject(AssignmentPollPdfService);
        expect(service).toBeTruthy();
    });
});
