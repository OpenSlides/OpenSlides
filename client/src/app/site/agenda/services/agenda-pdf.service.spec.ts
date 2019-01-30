import { TestBed } from '@angular/core/testing';

import { AgendaPdfService } from './agenda-pdf.service';
import { E2EImportsModule } from 'e2e-imports.module';

describe('AgendaPdfService', () => {
    beforeEach(() =>
        TestBed.configureTestingModule({
            imports: [E2EImportsModule]
        })
    );

    it('should be created', () => {
        const service: AgendaPdfService = TestBed.get(AgendaPdfService);
        expect(service).toBeTruthy();
    });
});
