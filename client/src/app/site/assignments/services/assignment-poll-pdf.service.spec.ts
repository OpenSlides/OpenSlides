import { TestBed } from '@angular/core/testing';

import { AssignmentPollPdfService } from './assignment-poll-pdf.service';
import { E2EImportsModule } from 'e2e-imports.module';

describe('MotionPdfService', () => {
    beforeEach(() =>
        TestBed.configureTestingModule({
            imports: [E2EImportsModule]
        })
    );

    it('should be created', () => {
        const service: AssignmentPollPdfService = TestBed.get(AssignmentPollPdfService);
        expect(service).toBeTruthy();
    });
});
