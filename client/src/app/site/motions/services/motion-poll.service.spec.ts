import { TestBed } from '@angular/core/testing';

import { MotionPollService } from './motion-poll.service';

describe('PollService', () => {
    beforeEach(() => TestBed.configureTestingModule({}));

    it('should be created', () => {
        const service: MotionPollService = TestBed.get(MotionPollService);
        expect(service).toBeTruthy();
    });
});
