import { TestBed } from '@angular/core/testing';

import { XlsxExportServiceService } from './xlsx-export-service.service';

describe('XlsxExportServiceService', () => {
    beforeEach(() => TestBed.configureTestingModule({}));

    it('should be created', () => {
        const service: XlsxExportServiceService = TestBed.get(XlsxExportServiceService);
        expect(service).toBeTruthy();
    });
});
