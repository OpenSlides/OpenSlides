import { TestBed, inject } from '@angular/core/testing';

import { OpenSlidesService } from './openslides.service';
import { E2EImportsModule } from '../../../e2e-imports.module';

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
