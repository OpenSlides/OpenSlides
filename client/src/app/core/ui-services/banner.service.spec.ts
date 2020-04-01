import { TestBed } from '@angular/core/testing';

import { BannerService } from './banner.service';

describe('BannerService', () => {
    beforeEach(() => TestBed.configureTestingModule({}));

    it('should be created', () => {
        const service: BannerService = TestBed.inject(BannerService);
        expect(service).toBeTruthy();
    });
});
