import { TestBed, inject } from '@angular/core/testing';

import { OpenslidesService } from './openslides.service';

describe('OpenslidesService', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [OpenslidesService]
        });
    });

    it('should be created', inject([OpenslidesService], (service: OpenslidesService) => {
        expect(service).toBeTruthy();
    }));
});
