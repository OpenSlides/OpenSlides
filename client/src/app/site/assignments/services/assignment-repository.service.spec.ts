import { TestBed } from '@angular/core/testing';

import { AssignmentRepositoryService } from './assignment-repository.service';
import { E2EImportsModule } from 'e2e-imports.module';

describe('AssignmentRepositoryService', () => {
    beforeEach(() => TestBed.configureTestingModule({ imports: [E2EImportsModule] }));

    it('should be created', () => {
        const service: AssignmentRepositoryService = TestBed.get(AssignmentRepositoryService);
        expect(service).toBeTruthy();
    });
});
