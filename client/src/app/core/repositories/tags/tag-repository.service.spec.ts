import { TestBed } from '@angular/core/testing';
import { TagRepositoryService } from './tag-repository.service';
import { E2EImportsModule } from '../../../../e2e-imports.module';

describe('TagRepositoryService', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            providers: [TagRepositoryService]
        });
    });

    it('should be created', () => {
        const service = TestBed.get(TagRepositoryService);
        expect(service).toBeTruthy();
    });
});
