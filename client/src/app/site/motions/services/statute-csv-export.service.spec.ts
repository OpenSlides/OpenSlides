import { inject, TestBed } from '@angular/core/testing';

import { E2EImportsModule } from 'e2e-imports.module';

import { StatuteCsvExportService } from './statute-csv-export.service';

describe('StatuteCsvExportService', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            providers: [StatuteCsvExportService]
        });
    });

    it('should be created', inject([StatuteCsvExportService], (service: StatuteCsvExportService) => {
        expect(service).toBeTruthy();
    }));
});
