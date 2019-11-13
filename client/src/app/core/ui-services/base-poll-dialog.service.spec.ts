import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { BasePollDialogService } from './poll-dialog.service';

describe('PollDialogService', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({ imports: [RouterTestingModule] });
    });

    it('should be created', () => {
        const service: BasePollDialogService = TestBed.get(BasePollDialogService);
        expect(service).toBeTruthy();
    });
});
