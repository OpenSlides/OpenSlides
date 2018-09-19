import { TestBed, inject } from '@angular/core/testing';

import { CategoryRepositoryService } from './category-repository.service';

describe('CategoryRepositoryService', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [CategoryRepositoryService]
        });
    });

    it('should be created', inject([CategoryRepositoryService], (service: CategoryRepositoryService) => {
        expect(service).toBeTruthy();
    }));
});
