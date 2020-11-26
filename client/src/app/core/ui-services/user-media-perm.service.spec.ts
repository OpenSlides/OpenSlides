import { TestBed } from '@angular/core/testing';

import { E2EImportsModule } from 'e2e-imports.module';

import { UserMediaPermService } from './user-media-perm.service';

describe('UserMediaPermService', () => {
    let service: UserMediaPermService;

    beforeEach(() => {
        TestBed.configureTestingModule({ imports: [E2EImportsModule] });
        service = TestBed.inject(UserMediaPermService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
