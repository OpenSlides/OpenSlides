import { inject, TestBed } from '@angular/core/testing';

import { E2EImportsModule } from '../../../../e2e-imports.module';
import { GroupRepositoryService } from './group-repository.service';

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
