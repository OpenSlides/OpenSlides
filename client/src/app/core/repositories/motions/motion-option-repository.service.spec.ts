import { TestBed } from '@angular/core/testing';

import { E2EImportsModule } from 'e2e-imports.module';

import { MotionOptionRepositoryService } from './motion-option-repository.service';

describe('MotionOptionRepositoryService', () => {
    beforeEach(() => TestBed.configureTestingModule({ imports: [E2EImportsModule] }));

    it('should be created', () => {
        const service: MotionOptionRepositoryService = TestBed.inject(MotionOptionRepositoryService);
        expect(service).toBeTruthy();
    });
});
