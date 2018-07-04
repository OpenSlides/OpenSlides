import { TestBed, inject } from '@angular/core/testing';

import { DataStoreService } from './DS.service';

describe('DS', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [DataStoreService]
        });
    });

    /*it('should be created', inject([DSService], (DS: DSService) => {
        expect(DS).toBeTruthy();
    }));*/
    // just a static use
});
