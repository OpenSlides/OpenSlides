import { inject, TestBed } from '@angular/core/testing';

import { AuthService } from './auth.service';
import { E2EImportsModule } from '../../../e2e-imports.module';

describe('ConfigService', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            providers: [AuthService]
        });
    });

    it('should be created', inject([AuthService], (service: AuthService) => {
        expect(service).toBeTruthy();
    }));
});
