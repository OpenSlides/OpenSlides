import { TestBed, inject } from '@angular/core/testing';

import { UserRepositoryService } from './user-repository.service';

describe('UserRepositoryService', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [UserRepositoryService]
        });
    });

    it('should be created', inject([UserRepositoryService], (service: UserRepositoryService) => {
        expect(service).toBeTruthy();
    }));
});
