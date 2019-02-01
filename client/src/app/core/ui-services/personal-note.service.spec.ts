import { TestBed, inject } from '@angular/core/testing';

import { PersonalNoteService } from './personal-note.service';
import { E2EImportsModule } from 'e2e-imports.module';

describe('PersonalNoteService', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            providers: [PersonalNoteService]
        });
    });

    it('should be created', inject([PersonalNoteService], (service: PersonalNoteService) => {
        expect(service).toBeTruthy();
    }));
});
