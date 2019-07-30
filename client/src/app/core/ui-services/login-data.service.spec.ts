import { inject, TestBed } from '@angular/core/testing';

import { E2EImportsModule } from 'e2e-imports.module';

import { LoginDataService } from './login-data.service';

describe('LoginDataService', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            providers: [LoginDataService]
        });
    });

    it('should be created', inject([LoginDataService], (service: LoginDataService) => {
        expect(service).toBeTruthy();
    }));
});
