import { TestBed } from '@angular/core/testing';

import { E2EImportsModule } from 'e2e-imports.module';

import { MotionPollDialogService } from './motion-poll-dialog.service';

describe('MotionPollDialogService', () => {
    beforeEach(() =>
        TestBed.configureTestingModule({
            imports: [E2EImportsModule]
        })
    );

    it('should be created', () => {
        const service: MotionPollDialogService = TestBed.inject(MotionPollDialogService);
        expect(service).toBeTruthy();
    });
});
