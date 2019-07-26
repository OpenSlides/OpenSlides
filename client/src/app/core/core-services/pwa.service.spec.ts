import { TestBed, inject } from '@angular/core/testing';

import { PwaService } from './pwa.service';
import { E2EImportsModule } from 'e2e-imports.module';

describe('PwaService', () => {
    beforeEach(() =>
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            providers: [PwaService]
        })
    );

    it('should be created', inject([PwaService], (service: PwaService) => {
        expect(service).toBeTruthy();
    }));
});
