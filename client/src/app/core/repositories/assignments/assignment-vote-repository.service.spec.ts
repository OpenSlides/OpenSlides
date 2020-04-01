import { TestBed } from '@angular/core/testing';

import { E2EImportsModule } from 'e2e-imports.module';

import { AssignmentVoteRepositoryService } from './assignment-vote-repository.service';

describe('AssignmentVoteRepositoryService', () => {
    beforeEach(() => TestBed.configureTestingModule({ imports: [E2EImportsModule] }));

    it('should be created', () => {
        const service: AssignmentVoteRepositoryService = TestBed.inject(AssignmentVoteRepositoryService);
        expect(service).toBeTruthy();
    });
});
