import { TestBed } from '@angular/core/testing';

import { MediaManageService } from './media-manage.service';
import { E2EImportsModule } from 'e2e-imports.module';

describe('MediaManageService', () => {
    beforeEach(() => TestBed.configureTestingModule({ imports: [E2EImportsModule] }));

    it('should be created', () => {
        const service: MediaManageService = TestBed.get(MediaManageService);
        expect(service).toBeTruthy();
    });
});
