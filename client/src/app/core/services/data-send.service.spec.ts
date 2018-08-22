import { TestBed, inject } from '@angular/core/testing';

import { DataSendService } from './data-send.service';

describe('DataSendService', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [DataSendService]
        });
    });

    it('should be created', inject([DataSendService], (service: DataSendService) => {
        expect(service).toBeTruthy();
    }));
});
