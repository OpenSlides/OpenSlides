import { TestBed } from '@angular/core/testing';

import { E2EImportsModule } from 'e2e-imports.module';

import { VotingBannerService } from './voting-banner.service';

describe('VotingBannerService', () => {
    beforeEach(() =>
        TestBed.configureTestingModule({
            imports: [E2EImportsModule]
        })
    );

    it('should be created', () => {
        const service: VotingBannerService = TestBed.inject(VotingBannerService);
        expect(service).toBeTruthy();
    });
});
