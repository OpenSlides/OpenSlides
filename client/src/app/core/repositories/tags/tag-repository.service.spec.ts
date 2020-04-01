import { TestBed } from '@angular/core/testing';

import { E2EImportsModule } from '../../../../e2e-imports.module';
import { TagRepositoryService } from './tag-repository.service';

describe('TagRepositoryService', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            providers: [TagRepositoryService]
        });
    });

    it('should be created', () => {
        const service = TestBed.inject(TagRepositoryService);
        expect(service).toBeTruthy();
    });
});
