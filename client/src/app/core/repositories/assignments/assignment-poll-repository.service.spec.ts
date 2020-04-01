import { TestBed } from '@angular/core/testing';

import { E2EImportsModule } from 'e2e-imports.module';

import { AssignmentPollRepositoryService } from './assignment-poll-repository.service';

describe('AssignmentPollRepositoryService', () => {
    beforeEach(() => TestBed.configureTestingModule({ imports: [E2EImportsModule] }));

    it('should be created', () => {
        const service: AssignmentPollRepositoryService = TestBed.inject(AssignmentPollRepositoryService);
        expect(service).toBeTruthy();
    });
});
