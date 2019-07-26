import { inject, TestBed } from '@angular/core/testing';

import { E2EImportsModule } from 'e2e-imports.module';

import { PollService } from './poll.service';

describe('PollService', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            providers: [PollService]
        });
    });

    it('should be created', inject([PollService], (service: PollService) => {
        expect(service).toBeTruthy();
    }));
});
