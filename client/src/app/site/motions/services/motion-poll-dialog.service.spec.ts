import { TestBed } from '@angular/core/testing';

import { MotionPollDialogService } from './motion-poll-dialog.service';

describe('MotionPollDialogService', () => {
    beforeEach(() => TestBed.configureTestingModule({}));

    it('should be created', () => {
        const service: MotionPollDialogService = TestBed.get(MotionPollDialogService);
        expect(service).toBeTruthy();
    });
});
