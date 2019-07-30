import { inject, TestBed } from '@angular/core/testing';

import { E2EImportsModule } from 'e2e-imports.module';

import { ItemRepositoryService } from './item-repository.service';

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
