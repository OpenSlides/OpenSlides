import { TestBed } from '@angular/core/testing';

import { E2EImportsModule } from 'e2e-imports.module';

import { MediafileRepositoryService } from './mediafile-repository.service';

describe('FileRepositoryService', () => {
    beforeEach(() => TestBed.configureTestingModule({ imports: [E2EImportsModule] }));

    it('should be created', () => {
        const service: MediafileRepositoryService = TestBed.inject(MediafileRepositoryService);
        expect(service).toBeTruthy();
    });
});
