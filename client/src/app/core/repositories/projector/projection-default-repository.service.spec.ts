import { inject, TestBed } from '@angular/core/testing';

import { E2EImportsModule } from '../../../../e2e-imports.module';
import { ProjectionDefaultRepositoryService } from './projection-default-repository.service';

describe('ProjectionDefaultRepositoryService', () => {
    beforeEach(() =>
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            providers: [ProjectionDefaultRepositoryService]
        })
    );

    it('should be created', inject(
        [ProjectionDefaultRepositoryService],
        (service: ProjectionDefaultRepositoryService) => {
            expect(service).toBeTruthy();
        }
    ));
});
