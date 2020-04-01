import { TestBed } from '@angular/core/testing';

import { E2EImportsModule } from 'e2e-imports.module';

import { AssignmentRepositoryService } from './assignment-repository.service';

describe('AssignmentRepositoryService', () => {
    beforeEach(() => TestBed.configureTestingModule({ imports: [E2EImportsModule] }));

    it('should be created', () => {
        const service: AssignmentRepositoryService = TestBed.inject(AssignmentRepositoryService);
        expect(service).toBeTruthy();
    });
});
