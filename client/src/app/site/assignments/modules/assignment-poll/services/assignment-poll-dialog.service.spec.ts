import { TestBed } from '@angular/core/testing';

import { E2EImportsModule } from 'e2e-imports.module';

import { AssignmentPollDialogService } from './assignment-poll-dialog.service';

describe('AssignmentPollDialogService', () => {
    beforeEach(() =>
        TestBed.configureTestingModule({
            imports: [E2EImportsModule]
        })
    );

    it('should be created', () => {
        const service: AssignmentPollDialogService = TestBed.inject(AssignmentPollDialogService);
        expect(service).toBeTruthy();
    });
});
