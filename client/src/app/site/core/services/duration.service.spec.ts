import { TestBed } from '@angular/core/testing';

import { DurationService } from './duration.service';
import { E2EImportsModule } from 'e2e-imports.module';

describe('DurationService', () => {
    beforeEach(() => TestBed.configureTestingModule({
        imports: [E2EImportsModule]
    }));

    it('should be created', () => {
        const service: DurationService = TestBed.get(DurationService);
        expect(service).toBeTruthy();
    });
});
