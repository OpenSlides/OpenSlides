import { TestBed } from '@angular/core/testing';

import { E2EImportsModule } from 'e2e-imports.module';

import { BlockDetailFilterListService } from './block-detail-filter-list.service';

describe('BlockDetailFilterListService', () => {
    beforeEach(() =>
        TestBed.configureTestingModule({
            imports: [E2EImportsModule]
        })
    );

    it('should be created', () => {
        const service: BlockDetailFilterListService = TestBed.inject(BlockDetailFilterListService);
        expect(service).toBeTruthy();
    });
});
