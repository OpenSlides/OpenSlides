import { TestBed } from '@angular/core/testing';

import { E2EImportsModule } from 'e2e-imports.module';

import { ErrorService } from './error.service';

describe('ErrorService', () => {
    beforeEach(() =>
        TestBed.configureTestingModule({
            imports: [E2EImportsModule]
        })
    );

    it('should be created', () => {
        const service: ErrorService = TestBed.get(ErrorService);
        expect(service).toBeTruthy();
    });
});
