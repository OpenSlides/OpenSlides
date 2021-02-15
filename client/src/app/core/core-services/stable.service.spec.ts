import { TestBed } from '@angular/core/testing';

import { StableService } from './stable.service';

describe('StableService', () => {
    let service: StableService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(StableService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
