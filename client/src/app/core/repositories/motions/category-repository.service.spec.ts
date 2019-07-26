import { inject, TestBed } from '@angular/core/testing';

import { CategoryRepositoryService } from './category-repository.service';
import { E2EImportsModule } from '../../../../e2e-imports.module';

describe('CategoryRepositoryService', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            providers: [CategoryRepositoryService]
        });
    });

    it('should be created', inject([CategoryRepositoryService], (service: CategoryRepositoryService) => {
        expect(service).toBeTruthy();
    }));
});
