import { inject, TestBed } from '@angular/core/testing';

import { E2EImportsModule } from '../../../../e2e-imports.module';
import { MotionRepositoryService } from './motion-repository.service';

describe('MotionRepositoryService', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            providers: [MotionRepositoryService]
        });
    });

    it('should be created', inject([MotionRepositoryService], (service: MotionRepositoryService) => {
        expect(service).toBeTruthy();
    }));
});
