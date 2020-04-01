import { TestBed } from '@angular/core/testing';

import { E2EImportsModule } from 'e2e-imports.module';

import { UserPdfService } from './user-pdf.service';

describe('UserPdfService', () => {
    beforeEach(() =>
        TestBed.configureTestingModule({
            imports: [E2EImportsModule]
        })
    );

    it('should be created', () => {
        const service: UserPdfService = TestBed.inject(UserPdfService);
        expect(service).toBeTruthy();
    });
});
