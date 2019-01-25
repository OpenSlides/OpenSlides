import { TestBed } from '@angular/core/testing';

import { UserPdfService } from './user-pdf.service';
import { E2EImportsModule } from 'e2e-imports.module';

describe('UserPdfService', () => {
    beforeEach(() =>
        TestBed.configureTestingModule({
            imports: [E2EImportsModule]
        })
    );

    it('should be created', () => {
        const service: UserPdfService = TestBed.get(UserPdfService);
        expect(service).toBeTruthy();
    });
});
