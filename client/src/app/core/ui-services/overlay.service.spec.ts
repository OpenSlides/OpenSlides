import { TestBed } from '@angular/core/testing';

import { OverlayService } from './overlay.service';

describe('OverlayService', () => {
    beforeEach(() => TestBed.configureTestingModule({}));

    it('should be created', () => {
        const service: OverlayService = TestBed.get(OverlayService);
        expect(service).toBeTruthy();
    });
});
