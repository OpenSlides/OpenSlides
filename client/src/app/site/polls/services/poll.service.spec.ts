import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { PollService } from './poll.service';

describe('PollService', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({ imports: [RouterTestingModule] });
    });

    it('should be created', () => {
        const service: PollService = TestBed.get(PollService);
        expect(service).toBeTruthy();
    });
});
