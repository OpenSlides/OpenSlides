import { inject, TestBed } from '@angular/core/testing';

import { E2EImportsModule } from 'e2e-imports.module';

import { MotionCommentSectionRepositoryService } from './motion-comment-section-repository.service';

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
