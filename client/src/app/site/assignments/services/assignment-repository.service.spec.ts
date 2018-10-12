import { TestBed, inject } from '@angular/core/testing';

import { AssignmentRepositoryService } from './assignment-repository.service';
import { E2EImportsModule } from 'e2e-imports.module';

describe('AssignmentRepositoryService', () => {
    beforeEach(() =>
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            providers: [AssignmentRepositoryService]
        }));

    it('should be created', inject([AssignmentRepositoryService], (service: AssignmentRepositoryService) => {
        expect(service).toBeTruthy();
    }));
});
