import { TestBed, inject } from '@angular/core/testing';

import { MotionCommentSectionRepositoryService } from './motion-comment-section-repository.service';
import { E2EImportsModule } from 'e2e-imports.module';

describe('MotionCommentSectionRepositoryService', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            providers: [MotionCommentSectionRepositoryService]
        });
    });

    it('should be created', inject(
        [MotionCommentSectionRepositoryService],
        (service: MotionCommentSectionRepositoryService) => {
            expect(service).toBeTruthy();
        }
    ));
});
