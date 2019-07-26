import { inject, TestBed } from '@angular/core/testing';

import { E2EImportsModule } from '../../../../e2e-imports.module';
import { ProjectorRepositoryService } from './projector-repository.service';

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
