import { TestBed, inject } from '@angular/core/testing';

import { E2EImportsModule } from '../../../e2e-imports.module';
import { CollectionStringMapperService } from './collection-string-mapper.service';

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
