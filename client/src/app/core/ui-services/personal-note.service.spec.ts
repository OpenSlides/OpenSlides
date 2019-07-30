import { inject, TestBed } from '@angular/core/testing';

import { E2EImportsModule } from 'e2e-imports.module';

import { PersonalNoteService } from './personal-note.service';

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
