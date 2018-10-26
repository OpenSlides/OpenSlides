import { TestBed, inject } from '@angular/core/testing';

import { OfflineService } from './offline.service';
import { E2EImportsModule } from 'e2e-imports.module';

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
