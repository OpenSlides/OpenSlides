import { TestBed } from '@angular/core/testing';

import { E2EImportsModule } from 'e2e-imports.module';

import { MotionVoteRepositoryService } from './motion-vote-repository.service';

describe('MotionVoteRepositoryService', () => {
    beforeEach(() => TestBed.configureTestingModule({ imports: [E2EImportsModule] }));

    it('should be created', () => {
        const service: MotionVoteRepositoryService = TestBed.inject(MotionVoteRepositoryService);
        expect(service).toBeTruthy();
    });
});
