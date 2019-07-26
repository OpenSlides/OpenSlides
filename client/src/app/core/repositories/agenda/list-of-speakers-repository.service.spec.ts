import { inject, TestBed } from '@angular/core/testing';

import { E2EImportsModule } from 'e2e-imports.module';

import { ListOfSpeakersRepositoryService } from './list-of-speakers-repository.service';

describe('ListOfSpeakersRepositoryService', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            providers: [ListOfSpeakersRepositoryService]
        });
    });

    it('should be created', inject([ListOfSpeakersRepositoryService], (service: ListOfSpeakersRepositoryService) => {
        expect(service).toBeTruthy();
    }));
});
