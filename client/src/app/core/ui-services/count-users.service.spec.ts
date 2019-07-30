import { inject, TestBed } from '@angular/core/testing';

import { CountUsersService } from './count-users.service';
import { E2EImportsModule } from '../../../e2e-imports.module';

describe('CountUsersService', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            providers: [CountUsersService]
        });
    });

    it('should be created', inject([CountUsersService], (service: CountUsersService) => {
        expect(service).toBeTruthy();
    }));
});
