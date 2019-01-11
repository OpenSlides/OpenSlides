import { TestBed } from '@angular/core/testing';

import { UserImportService } from './user-import.service';

describe('UserImportService', () => {
    beforeEach(() => TestBed.configureTestingModule({}));

    it('should be created', () => {
        const service: UserImportService = TestBed.get(UserImportService);
        expect(service).toBeTruthy();
    });
});
