import { TestBed } from '@angular/core/testing';

import { MediafileRepositoryService } from './mediafile-repository.service';

describe('FileRepositoryService', () => {
    beforeEach(() => TestBed.configureTestingModule({}));

    it('should be created', () => {
        const service: MediafileRepositoryService = TestBed.get(MediafileRepositoryService);
        expect(service).toBeTruthy();
    });
});
