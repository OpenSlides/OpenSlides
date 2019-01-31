import { TestBed, inject } from '@angular/core/testing';

import { LoginDataService } from './login-data.service';

describe('LoginDataService', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [LoginDataService]
        });
    });

    it('should be created', inject([LoginDataService], (service: LoginDataService) => {
        expect(service).toBeTruthy();
    }));
});
