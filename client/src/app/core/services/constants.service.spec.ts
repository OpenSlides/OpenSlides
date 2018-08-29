import { TestBed, inject } from '@angular/core/testing';

import { ConstantsService } from './constants.service';

describe('ConstantsService', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [ConstantsService]
        });
    });

    it('should be created', inject([ConstantsService], (service: ConstantsService) => {
        expect(service).toBeTruthy();
    }));
});
