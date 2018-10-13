import { TestBed, inject } from '@angular/core/testing';

import { MotionRepositoryService } from './motion-repository.service';
import { E2EImportsModule } from '../../../../e2e-imports.module';

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
