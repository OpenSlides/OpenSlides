import { TestBed } from '@angular/core/testing';

import { E2EImportsModule } from 'e2e-imports.module';

import { MotionBlockRepositoryService } from './motion-block-repository.service';

describe('MotionBlockRepositoryService', () => {
    beforeEach(() =>
        TestBed.configureTestingModule({
            imports: [E2EImportsModule]
        })
    );

    it('should be created', () => {
        const service: MotionBlockRepositoryService = TestBed.inject(MotionBlockRepositoryService);
        expect(service).toBeTruthy();
    });
});
