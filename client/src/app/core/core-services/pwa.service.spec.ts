import { inject, TestBed } from '@angular/core/testing';

import { E2EImportsModule } from 'e2e-imports.module';

import { PwaService } from './pwa.service';

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
