import { TestBed, inject } from '@angular/core/testing';

import { MediafileRepositoryService } from './mediafile-repository.service';
import { E2EImportsModule } from 'e2e-imports.module';

describe('MediafileRepositoryService', () => {
    beforeEach(() =>
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            providers: [MediafileRepositoryService]
        }));

    it('should be created', inject([MediafileRepositoryService], (service: MediafileRepositoryService) => {
        expect(service).toBeTruthy();
    }));
});
