import { TestBed } from '@angular/core/testing';

import { E2EImportsModule } from 'e2e-imports.module';

import { UserImportService } from './user-import.service';

describe('UserImportService', () => {
    beforeEach(() =>
        TestBed.configureTestingModule({
            imports: [E2EImportsModule]
        })
    );

    it('should be created', () => {
        const service: UserImportService = TestBed.get(UserImportService);
        expect(service).toBeTruthy();
    });
});
