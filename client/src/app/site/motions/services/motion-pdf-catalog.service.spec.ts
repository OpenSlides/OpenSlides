import { TestBed } from '@angular/core/testing';

import { MotionPdfCatalogService } from './motion-pdf-catalog.service';
import { E2EImportsModule } from 'e2e-imports.module';

describe('MotionPdfCatalogService', () => {
    beforeEach(() =>
        TestBed.configureTestingModule({
            imports: [E2EImportsModule]
        })
    );

    it('should be created', () => {
        const service: MotionPdfCatalogService = TestBed.get(MotionPdfCatalogService);
        expect(service).toBeTruthy();
    });
});
