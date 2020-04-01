import { TestBed } from '@angular/core/testing';

import { E2EImportsModule } from '../../../../e2e-imports.module';
import { TopicRepositoryService } from './topic-repository.service';

describe('TopicRepositoryService', () => {
    beforeEach(() =>
        TestBed.configureTestingModule({
            imports: [E2EImportsModule]
        })
    );

    it('should be created', () => {
        const service: TopicRepositoryService = TestBed.inject(TopicRepositoryService);
        expect(service).toBeTruthy();
    });
});
