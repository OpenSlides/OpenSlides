import { TestBed, inject } from '@angular/core/testing';

import { ItemRepositoryService } from './item-repository.service';
import { E2EImportsModule } from 'e2e-imports.module';

describe('ItemRepositoryService', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            providers: [ItemRepositoryService]
        });
    });

    it('should be created', inject([ItemRepositoryService], (service: ItemRepositoryService) => {
        expect(service).toBeTruthy();
    }));
});
