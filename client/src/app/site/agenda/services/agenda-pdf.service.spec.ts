import { TestBed } from '@angular/core/testing';

import { E2EImportsModule } from 'e2e-imports.module';

import { AgendaPdfService } from './agenda-pdf.service';

describe('AgendaPdfService', () => {
    beforeEach(() =>
        TestBed.configureTestingModule({
            imports: [E2EImportsModule]
        })
    );

    it('should be created', () => {
        const service: AgendaPdfService = TestBed.inject(AgendaPdfService);
        expect(service).toBeTruthy();
    });
});
