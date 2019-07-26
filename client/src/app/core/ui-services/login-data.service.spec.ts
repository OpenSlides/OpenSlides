import { TestBed, inject } from '@angular/core/testing';

import { LoginDataService } from './login-data.service';
import { E2EImportsModule } from 'e2e-imports.module';

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
