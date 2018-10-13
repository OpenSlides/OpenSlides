import { TestBed, inject } from '@angular/core/testing';

import { AgendaRepositoryService } from './agenda-repository.service';

describe('AgendaRepositoryService', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [AgendaRepositoryService]
        });
    });

    it('should be created', inject([AgendaRepositoryService], (service: AgendaRepositoryService) => {
        expect(service).toBeTruthy();
    }));
});
