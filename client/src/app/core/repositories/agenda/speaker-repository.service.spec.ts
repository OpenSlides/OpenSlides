import { TestBed } from '@angular/core/testing';

import { SpeakerRepositoryService } from './speaker-repository.service';
import { E2EImportsModule } from 'e2e-imports.module';

describe('SpeakerRepositoryService', () => {
    beforeEach(() =>
        TestBed.configureTestingModule({
            imports: [E2EImportsModule]
        })
    );

    it('should be created', () => {
        const service: SpeakerRepositoryService = TestBed.get(SpeakerRepositoryService);
        expect(service).toBeTruthy();
    });
});
