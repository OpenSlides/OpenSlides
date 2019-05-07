import { TestBed } from '@angular/core/testing';

import { MotionBlockSortService } from './motion-block-sort.service';
import { E2EImportsModule } from 'e2e-imports.module';

describe('MotionBlockSortService', () => {
    beforeEach(() =>
        TestBed.configureTestingModule({
            imports: [E2EImportsModule]
        })
    );

    it('should be created', () => {
        const service: MotionBlockSortService = TestBed.get(MotionBlockSortService);
        expect(service).toBeTruthy();
    });
});
