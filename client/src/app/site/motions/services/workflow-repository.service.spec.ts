import { TestBed, inject } from '@angular/core/testing';

import { WorkflowRepositoryService } from './workflow-repository.service';
import { E2EImportsModule } from '../../../../e2e-imports.module';

describe('WorkflowRepositoryService', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            providers: [WorkflowRepositoryService]
        });
    });

    it('should be created', inject([WorkflowRepositoryService], (service: WorkflowRepositoryService) => {
        expect(service).toBeTruthy();
    }));
});
