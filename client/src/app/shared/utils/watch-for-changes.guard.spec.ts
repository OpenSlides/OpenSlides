import { inject, TestBed } from '@angular/core/testing';

import { WatchForChangesGuard } from './watch-for-changes.guard';

describe('WatchSortingTreeGuard', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [WatchForChangesGuard]
        });
    });

    it('should ...', inject([WatchForChangesGuard], (guard: WatchForChangesGuard) => {
        expect(guard).toBeTruthy();
    }));
});
