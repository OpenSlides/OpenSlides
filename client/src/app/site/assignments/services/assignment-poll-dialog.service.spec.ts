import { TestBed } from '@angular/core/testing';

import { AssignmentPollDialogService } from './assignment-poll-dialog.service';

describe('AssignmentPollDialogService', () => {
    beforeEach(() => TestBed.configureTestingModule({}));

    it('should be created', () => {
        const service: AssignmentPollDialogService = TestBed.get(AssignmentPollDialogService);
        expect(service).toBeTruthy();
    });
});
