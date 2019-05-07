import { TestBed, inject } from '@angular/core/testing';

import { E2EImportsModule } from '../../../e2e-imports.module';
import { DataStoreUpdateManagerService } from './data-store-update-manager.service';

describe('DataStoreUpdateManagerService', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            providers: [DataStoreUpdateManagerService]
        });
    });

    it('should be created', inject([DataStoreUpdateManagerService], (service: DataStoreUpdateManagerService) => {
        expect(service).toBeTruthy();
    }));
});
