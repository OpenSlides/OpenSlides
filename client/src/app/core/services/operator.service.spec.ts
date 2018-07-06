import { TestBed, inject } from '@angular/core/testing';

import { OperatorService } from './operator.service';

describe('OperatorService', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [OperatorService]
        });
    });

    it('should be created', inject([OperatorService], (service: OperatorService) => {
        expect(service).toBeTruthy();
    }));
});
