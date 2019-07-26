import { inject, TestBed } from '@angular/core/testing';

import { E2EImportsModule } from 'e2e-imports.module';

import { StatuteParagraphRepositoryService } from './statute-paragraph-repository.service';

describe('StatuteParagraphRepositoryService', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            providers: [StatuteParagraphRepositoryService]
        });
    });

    it('should be created', inject(
        [StatuteParagraphRepositoryService],
        (service: StatuteParagraphRepositoryService) => {
            expect(service).toBeTruthy();
        }
    ));
});
