import { inject, TestBed } from '@angular/core/testing';

import { E2EImportsModule } from 'e2e-imports.module';

import { OpenSlidesStatusService } from './openslides-status.service';

describe('OpenSlidesStatusService', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            providers: [OpenSlidesStatusService]
        });
    });

    it('should be created', inject([OpenSlidesStatusService], (service: OpenSlidesStatusService) => {
        expect(service).toBeTruthy();
    }));
});
