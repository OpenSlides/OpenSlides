import { TestBed } from '@angular/core/testing';

import { E2EImportsModule } from 'e2e-imports.module';

import { AmendmentSortListService } from './amendment-sort-list.service';

describe('AmendmentSortListService', () => {
    beforeEach(() =>
        TestBed.configureTestingModule({
            imports: [E2EImportsModule]
        })
    );

    it('should be created', () => {
        const service: AmendmentSortListService = TestBed.inject(AmendmentSortListService);
        expect(service).toBeTruthy();
    });
});
