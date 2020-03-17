import { TestBed } from '@angular/core/testing';

import { E2EImportsModule } from 'e2e-imports.module';

import { AssignmentPollService } from './assignment-poll.service';

describe('AssignmentPollService', () => {
    beforeEach(() =>
        TestBed.configureTestingModule({
            imports: [E2EImportsModule]
        })
    );

    it('should be created', () => {
        const service: AssignmentPollService = TestBed.get(AssignmentPollService);
        expect(service).toBeTruthy();
    });
});
