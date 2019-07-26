import { inject, TestBed } from '@angular/core/testing';

import { E2EImportsModule } from '../../../../e2e-imports.module';
import { WorkflowRepositoryService } from './workflow-repository.service';

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
