import { inject, TestBed } from '@angular/core/testing';

import { E2EImportsModule } from 'e2e-imports.module';

import { XlsxExportServiceService } from './xlsx-export-service.service';

describe('XlsxExportServiceService', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            providers: [XlsxExportServiceService]
        });
    });

    it('should be created', inject([XlsxExportServiceService], (service: XlsxExportServiceService) => {
        expect(service).toBeTruthy();
    }));
});
