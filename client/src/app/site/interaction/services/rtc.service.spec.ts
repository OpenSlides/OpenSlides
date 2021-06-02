import { TestBed } from '@angular/core/testing';

import { E2EImportsModule } from 'e2e-imports.module';

import { RtcService } from './rtc.service';

describe('RtcService', () => {
    let service: RtcService;

    beforeEach(() => {
        TestBed.configureTestingModule({ imports: [E2EImportsModule] });
        service = TestBed.inject(RtcService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
