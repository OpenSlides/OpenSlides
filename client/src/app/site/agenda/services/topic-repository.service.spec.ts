import { TestBed } from '@angular/core/testing';

import { TopicRepositoryService } from './topic-repository.service';
import { E2EImportsModule } from '../../../../e2e-imports.module';

describe('TopicRepositoryService', () => {
    beforeEach(() =>
        TestBed.configureTestingModule({
            imports: [E2EImportsModule]
        }));

    it('should be created', () => {
        const service: TopicRepositoryService = TestBed.get(TopicRepositoryService);
        expect(service).toBeTruthy();
    });
});
