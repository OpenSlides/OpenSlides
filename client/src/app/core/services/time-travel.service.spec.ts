import { TestBed } from '@angular/core/testing';

import { TimeTravelService } from './time-travel.service';
import { E2EImportsModule } from 'e2e-imports.module';

describe('TimeTravelService', () => {
    beforeEach(() =>
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            providers: [TimeTravelService]
        })
    );

    it('should be created', () => {
        const service: TimeTravelService = TestBed.get(TimeTravelService);
        expect(service).toBeTruthy();
    });
});
