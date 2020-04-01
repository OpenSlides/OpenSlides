import { TestBed } from '@angular/core/testing';

import { E2EImportsModule } from 'e2e-imports.module';

import { MotionExportService } from './motion-export.service';

describe('MotionExportService', () => {
    beforeEach(() =>
        TestBed.configureTestingModule({
            imports: [E2EImportsModule]
        })
    );

    it('should be created', () => {
        const service: MotionExportService = TestBed.inject(MotionExportService);
        expect(service).toBeTruthy();
    });
});
