import { TestBed } from '@angular/core/testing';

import { E2EImportsModule } from '../../../../e2e-imports.module';
import { LocalPermissionsService } from './local-permissions.service';

describe('LocalPermissionsService', () => {
    beforeEach(() => TestBed.configureTestingModule({ imports: [E2EImportsModule] }));

    it('should be created', () => {
        const service: LocalPermissionsService = TestBed.inject(LocalPermissionsService);
        expect(service).toBeTruthy();
    });
});
