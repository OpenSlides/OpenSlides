import { inject, TestBed } from '@angular/core/testing';

import { E2EImportsModule } from 'e2e-imports.module';

import { AgendaCsvExportService } from './agenda-csv-export.service';

describe('AgendaCsvExportService', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            providers: [AgendaCsvExportService]
        });
    });

    it('should be created', inject([AgendaCsvExportService], (service: AgendaCsvExportService) => {
        expect(service).toBeTruthy();
    }));
});
