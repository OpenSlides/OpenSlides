import { TestBed } from '@angular/core/testing';

import { AgendaImportService } from './agenda-import.service';
import { E2EImportsModule } from 'e2e-imports.module';

describe('AgendaImportService', () => {
    beforeEach(() =>
        TestBed.configureTestingModule({
            imports: [E2EImportsModule]
        })
    );

    it('should be created', () => {
        const service: AgendaImportService = TestBed.get(AgendaImportService);
        expect(service).toBeTruthy();
    });
});
