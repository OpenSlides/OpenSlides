import { TestBed } from '@angular/core/testing';

import { E2EImportsModule } from 'e2e-imports.module';

import { MotionPollRepositoryService } from './motion-poll-repository.service';

describe('MotionPollRepositoryService', () => {
    beforeEach(() => TestBed.configureTestingModule({ imports: [E2EImportsModule] }));

    it('should be created', () => {
        const service: MotionPollRepositoryService = TestBed.inject(MotionPollRepositoryService);
        expect(service).toBeTruthy();
    });
});
