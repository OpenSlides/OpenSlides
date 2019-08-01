import { TestBed } from '@angular/core/testing';

import { ProgressService } from './progress.service';

describe('ProgressService', () => {
    beforeEach(() => TestBed.configureTestingModule({}));

    it('should be created', () => {
        const service: ProgressService = TestBed.get(ProgressService);
        expect(service).toBeTruthy();
    });
});
