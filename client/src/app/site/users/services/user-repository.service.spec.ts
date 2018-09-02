import { TestBed, inject } from '@angular/core/testing';

import { UserRepositoryService } from './user-repository.service';
import { E2EImportsModule } from '../../../../e2e-imports.module';

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
