import { TestBed } from '@angular/core/testing';

import { BrowserSupportService } from './browser-support.service';

describe('BrowserSupportService', () => {
    let service: BrowserSupportService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(BrowserSupportService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
