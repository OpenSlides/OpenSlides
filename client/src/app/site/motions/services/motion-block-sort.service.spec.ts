import { TestBed } from '@angular/core/testing';

import { E2EImportsModule } from 'e2e-imports.module';

import { MotionBlockSortService } from './motion-block-sort.service';

describe('MotionBlockSortService', () => {
    beforeEach(() =>
        TestBed.configureTestingModule({
            imports: [E2EImportsModule]
        })
    );

    it('should be created', () => {
        const service: MotionBlockSortService = TestBed.inject(MotionBlockSortService);
        expect(service).toBeTruthy();
    });
});
