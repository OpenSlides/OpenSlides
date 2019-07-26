import { inject, TestBed } from '@angular/core/testing';

import { E2EImportsModule } from '../../../../e2e-imports.module';
import { UserRepositoryService } from './user-repository.service';

describe('UserRepositoryService', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            providers: [UserRepositoryService]
        });
    });

    it('should be created', inject([UserRepositoryService], (service: UserRepositoryService) => {
        expect(service).toBeTruthy();
    }));
});
