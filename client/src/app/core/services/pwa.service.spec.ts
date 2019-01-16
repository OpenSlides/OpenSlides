import { TestBed } from '@angular/core/testing';

import { PwaService } from './pwa.service';
import { E2EImportsModule } from 'e2e-imports.module';

describe('PwaService', () => {
    beforeEach(() =>
        TestBed.configureTestingModule({
            imports: [E2EImportsModule]
        })
    );

    it('should be created', () => {
        const service: PwaService = TestBed.get(PwaService);
        expect(service).toBeTruthy();
    });
});
