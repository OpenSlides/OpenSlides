import { TestBed, inject } from '@angular/core/testing';

import { ProjectorRepositoryService } from './projector-repository.service';
import { E2EImportsModule } from '../../../../e2e-imports.module';

describe('ProjectorRepositoryService', () => {
    beforeEach(() =>
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            providers: [ProjectorRepositoryService]
        })
    );

    it('should be created', inject([ProjectorRepositoryService], (service: ProjectorRepositoryService) => {
        expect(service).toBeTruthy();
    }));
});
