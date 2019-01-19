import { TestBed, inject } from '@angular/core/testing';

import { E2EImportsModule } from '../../../e2e-imports.module';
import { CountUsersService } from './count-users.service';

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
