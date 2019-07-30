import { inject, TestBed } from '@angular/core/testing';

import { E2EImportsModule } from 'e2e-imports.module';

import { OfflineService } from './offline.service';

describe('OfflineService', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            providers: [OfflineService]
        });
    });

    it('should be created', inject([OfflineService], (service: OfflineService) => {
        expect(service).toBeTruthy();
    }));
});
