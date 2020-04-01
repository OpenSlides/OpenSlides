import { TestBed } from '@angular/core/testing';

import { E2EImportsModule } from 'e2e-imports.module';

import { MotionPdfCatalogService } from './motion-pdf-catalog.service';

describe('MotionPdfCatalogService', () => {
    beforeEach(() =>
        TestBed.configureTestingModule({
            imports: [E2EImportsModule]
        })
    );

    it('should be created', () => {
        const service: MotionPdfCatalogService = TestBed.inject(MotionPdfCatalogService);
        expect(service).toBeTruthy();
    });
});
