import { TestBed, inject } from '@angular/core/testing';

import { PollService } from './poll.service';
import { E2EImportsModule } from 'e2e-imports.module';

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
