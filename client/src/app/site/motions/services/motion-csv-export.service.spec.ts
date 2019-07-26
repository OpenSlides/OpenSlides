import { inject, TestBed } from '@angular/core/testing';

import { E2EImportsModule } from 'e2e-imports.module';

import { MotionCsvExportService } from './motion-csv-export.service';

describe('MotionCsvExportService', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            providers: [MotionCsvExportService]
        });
    });

    it('should be created', inject([MotionCsvExportService], (service: MotionCsvExportService) => {
        expect(service).toBeTruthy();
    }));
});
