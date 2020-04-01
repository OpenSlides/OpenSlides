import { TestBed } from '@angular/core/testing';

import { E2EImportsModule } from 'e2e-imports.module';

import { TimeTravelService } from './time-travel.service';

describe('TimeTravelService', () => {
    beforeEach(() =>
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            providers: [TimeTravelService]
        })
    );

    it('should be created', () => {
        const service: TimeTravelService = TestBed.inject(TimeTravelService);
        expect(service).toBeTruthy();
    });
});
