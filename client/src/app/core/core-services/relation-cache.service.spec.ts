import { inject, TestBed } from '@angular/core/testing';

import { E2EImportsModule } from '../../../e2e-imports.module';
import { RelationCacheService } from './relation-cache.service';

describe('RelationCacheService', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            providers: [RelationCacheService]
        });
    });
    it('should be created', inject([RelationCacheService], (service: RelationCacheService) => {
        expect(service).toBeTruthy();
    }));
});
