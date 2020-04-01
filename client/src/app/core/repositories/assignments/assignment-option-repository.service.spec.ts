import { TestBed } from '@angular/core/testing';

import { E2EImportsModule } from 'e2e-imports.module';

import { AssignmentOptionRepositoryService } from './assignment-option-repository.service';

describe('AssignmentOptionRepositoryService', () => {
    beforeEach(() => TestBed.configureTestingModule({ imports: [E2EImportsModule] }));

    it('should be created', () => {
        const service: AssignmentOptionRepositoryService = TestBed.inject(AssignmentOptionRepositoryService);
        expect(service).toBeTruthy();
    });
});
