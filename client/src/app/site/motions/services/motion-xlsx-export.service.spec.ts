import { TestBed } from '@angular/core/testing';

import { E2EImportsModule } from 'e2e-imports.module';

import { MotionXlsxExportService } from './motion-xlsx-export.service';

describe('MotionXlsxExportService', () => {
    beforeEach(() =>
        TestBed.configureTestingModule({
            imports: [E2EImportsModule]
        })
    );

    it('should be created', () => {
        const service: MotionXlsxExportService = TestBed.inject(MotionXlsxExportService);
        expect(service).toBeTruthy();
    });
});
