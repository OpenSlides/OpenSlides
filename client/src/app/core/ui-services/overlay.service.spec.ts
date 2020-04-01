import { TestBed } from '@angular/core/testing';

import { E2EImportsModule } from 'e2e-imports.module';

import { OverlayService } from './overlay.service';

describe('OverlayService', () => {
    beforeEach(() =>
        TestBed.configureTestingModule({
            imports: [E2EImportsModule]
        })
    );

    it('should be created', () => {
        const service: OverlayService = TestBed.inject(OverlayService);
        expect(service).toBeTruthy();
    });
});
