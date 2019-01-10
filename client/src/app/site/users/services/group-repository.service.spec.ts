import { TestBed, inject } from '@angular/core/testing';

import { GroupRepositoryService } from './group-repository.service';
import { E2EImportsModule } from '../../../../e2e-imports.module';

describe('GroupRepositoryService', () => {
    beforeEach(() =>
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            providers: [GroupRepositoryService]
        })
    );

    it('should be created', inject([GroupRepositoryService], (service: GroupRepositoryService) => {
        expect(service).toBeTruthy();
    }));
});
