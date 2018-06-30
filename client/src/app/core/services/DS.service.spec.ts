import { TestBed, inject } from '@angular/core/testing';

import { DS } from './DS.service';

describe('DS', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [DS]
        });
    });

    /*it('should be created', inject([DSService], (DS: DSService) => {
        expect(DS).toBeTruthy();
    }));*/
    // just a static use
});
