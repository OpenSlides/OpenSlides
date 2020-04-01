import { TestBed } from '@angular/core/testing';

import { E2EImportsModule } from 'e2e-imports.module';

import { VotingService } from './voting.service';

describe('VotingService', () => {
    beforeEach(() =>
        TestBed.configureTestingModule({
            imports: [E2EImportsModule]
        })
    );

    it('should be created', () => {
        const service: VotingService = TestBed.inject(VotingService);
        expect(service).toBeTruthy();
    });
});
