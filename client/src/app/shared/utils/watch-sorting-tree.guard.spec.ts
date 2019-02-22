import { TestBed, inject } from '@angular/core/testing';

import { WatchSortingTreeGuard } from './watch-sorting-tree.guard';

describe('WatchSortingTreeGuard', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [WatchSortingTreeGuard]
        });
    });

    it('should ...', inject([WatchSortingTreeGuard], (guard: WatchSortingTreeGuard) => {
        expect(guard).toBeTruthy();
    }));
});
