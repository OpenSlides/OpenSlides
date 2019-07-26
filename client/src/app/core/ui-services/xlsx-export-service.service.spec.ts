import { TestBed, inject } from '@angular/core/testing';

import { XlsxExportServiceService } from './xlsx-export-service.service';
import { E2EImportsModule } from 'e2e-imports.module';

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
