import { TestBed, inject } from '@angular/core/testing';

import { OpenSlidesService } from './openslides.service';

describe('OpenSlidesService', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [OpenSlidesService]
        });
    });

    it('should be created', inject([OpenSlidesService], (service: OpenSlidesService) => {
        expect(service).toBeTruthy();
    }));
});
