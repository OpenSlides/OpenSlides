import { TestBed, inject } from '@angular/core/testing';

import { MotionRepositoryService } from './motion-repository.service';

describe('MotionRepositoryService', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [MotionRepositoryService]
        });
    });

    it('should be created', inject([MotionRepositoryService], (service: MotionRepositoryService) => {
        expect(service).toBeTruthy();
    }));
});
