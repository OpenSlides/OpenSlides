import { TestBed } from '@angular/core/testing';

import { E2EImportsModule } from 'e2e-imports.module';

import { PosterRepositoryService } from './poster-repository.service';

describe('PosterRepositoryService', () => {
    let service: PosterRepositoryService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule]
        });
        service = TestBed.inject(PosterRepositoryService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
