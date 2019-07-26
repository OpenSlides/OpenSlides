import { inject, TestBed } from '@angular/core/testing';

import { ChangeRecommendationRepositoryService } from './change-recommendation-repository.service';
import { E2EImportsModule } from '../../../../e2e-imports.module';

describe('ChangeRecommendationRepositoryService', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            providers: [ChangeRecommendationRepositoryService]
        });
    });

    it('should be created', inject(
        [ChangeRecommendationRepositoryService],
        (service: ChangeRecommendationRepositoryService) => {
            expect(service).toBeTruthy();
        }
    ));
});
