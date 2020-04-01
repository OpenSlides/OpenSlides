import { TestBed } from '@angular/core/testing';

import { E2EImportsModule } from 'e2e-imports.module';

import { AmendmentFilterListService } from './amendment-filter-list.service';

describe('AmendmentFilterService', () => {
    beforeEach(() =>
        TestBed.configureTestingModule({
            imports: [E2EImportsModule]
        })
    );

    it('should be created', () => {
        const service: AmendmentFilterListService = TestBed.inject(AmendmentFilterListService);
        expect(service).toBeTruthy();
    });
});
