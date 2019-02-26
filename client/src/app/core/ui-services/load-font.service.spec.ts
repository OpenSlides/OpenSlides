import { TestBed } from '@angular/core/testing';

import { LoadFontService } from './load-font.service';

describe('LoadFontService', () => {
    beforeEach(() => TestBed.configureTestingModule({}));

    it('should be created', () => {
        const service: LoadFontService = TestBed.get(LoadFontService);
        expect(service).toBeTruthy();
    });
});
