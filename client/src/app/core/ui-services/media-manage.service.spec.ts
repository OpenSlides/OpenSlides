import { TestBed, inject } from '@angular/core/testing';

import { MediaManageService } from './media-manage.service';
import { E2EImportsModule } from 'e2e-imports.module';

describe('MediaManageService', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            providers: [MediaManageService]
        });
    });

    it('should be created', inject([MediaManageService], (service: MediaManageService) => {
        expect(service).toBeTruthy();
    }));
});
