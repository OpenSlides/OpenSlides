import { inject, TestBed } from '@angular/core/testing';

import { E2EImportsModule } from '../../../../e2e-imports.module';
import { PersonalNoteRepositoryService } from './personal-note-repository.service';

describe('PersonalNoteRepositoryService', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            providers: [PersonalNoteRepositoryService]
        });
    });

    it('should be created', inject([PersonalNoteRepositoryService], (service: PersonalNoteRepositoryService) => {
        expect(service).toBeTruthy();
    }));
});
