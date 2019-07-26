import { inject, TestBed } from '@angular/core/testing';

import { CollectionStringMapperService } from './collection-string-mapper.service';
import { E2EImportsModule } from '../../../e2e-imports.module';

describe('CollectionStringMapperService', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            providers: [CollectionStringMapperService]
        });
    });

    it('should be created', inject([CollectionStringMapperService], (service: CollectionStringMapperService) => {
        expect(service).toBeTruthy();
    }));
});
