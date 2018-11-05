import { TestBed, inject } from '@angular/core/testing';

import { AgendaRepositoryService } from './agenda-repository.service';
import { E2EImportsModule } from 'e2e-imports.module';

describe('AgendaRepositoryService', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            providers: [AgendaRepositoryService]
        });
    });

    it('should be created', inject([AgendaRepositoryService], (service: AgendaRepositoryService) => {
        expect(service).toBeTruthy();
    }));
});
