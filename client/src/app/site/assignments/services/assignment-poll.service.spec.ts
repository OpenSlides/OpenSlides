import { TestBed } from '@angular/core/testing';

import { AssignmentPollService } from './assignment-poll.service';

describe('AssignmentPollService', () => {
    beforeEach(() => TestBed.configureTestingModule({}));

    it('should be created', () => {
        const service: AssignmentPollService = TestBed.get(AssignmentPollService);
        expect(service).toBeTruthy();
    });
});
