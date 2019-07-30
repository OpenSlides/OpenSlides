import { inject, TestBed } from '@angular/core/testing';

import { E2EImportsModule } from '../../../e2e-imports.module';
import { OpenSlidesService } from './openslides.service';

describe('OpenSlidesService', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            providers: [OpenSlidesService]
        });
    });

    it('should be created', inject([OpenSlidesService], (service: OpenSlidesService) => {
        expect(service).toBeTruthy();
    }));
});
