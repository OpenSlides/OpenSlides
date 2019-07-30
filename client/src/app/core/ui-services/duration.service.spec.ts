import { inject, TestBed } from '@angular/core/testing';

import { E2EImportsModule } from 'e2e-imports.module';

import { DurationService } from './duration.service';

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
