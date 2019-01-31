import { TestBed, inject } from '@angular/core/testing';

import { ViewportService } from './viewport.service';

describe('ViewportService', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [ViewportService]
        });
    });

    it('should be created', inject([ViewportService], (service: ViewportService) => {
        expect(service).toBeTruthy();
    }));
});
