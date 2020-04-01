import { TestBed } from '@angular/core/testing';

import { E2EImportsModule } from 'e2e-imports.module';

import { UserPdfExportService } from './user-pdf-export.service';

describe('UserPdfExportService', () => {
    beforeEach(() =>
        TestBed.configureTestingModule({
            imports: [E2EImportsModule]
        })
    );

    it('should be created', () => {
        const service: UserPdfExportService = TestBed.inject(UserPdfExportService);
        expect(service).toBeTruthy();
    });
});
