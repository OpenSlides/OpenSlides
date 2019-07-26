import { inject, TestBed } from '@angular/core/testing';

import { E2EImportsModule } from 'e2e-imports.module';

import { MediaManageService } from './media-manage.service';

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
