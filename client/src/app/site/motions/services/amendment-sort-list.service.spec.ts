import { TestBed } from '@angular/core/testing';

import { AmendmentSortListService } from './amendment-sort-list.service';

describe('AmendmentSortListService', () => {
    beforeEach(() => TestBed.configureTestingModule({}));

    it('should be created', () => {
        const service: AmendmentSortListService = TestBed.get(AmendmentSortListService);
        expect(service).toBeTruthy();
    });
});
