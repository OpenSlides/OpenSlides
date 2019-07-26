import { TestBed, inject } from '@angular/core/testing';

import { DurationService } from './duration.service';
import { E2EImportsModule } from 'e2e-imports.module';

describe('DurationService', () => {
    beforeEach(() =>
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            providers: [DurationService]
        })
    );

    it('should be created', inject([DurationService], (service: DurationService) => {
        expect(service).toBeTruthy();
    }));
});
