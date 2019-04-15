import { TestBed, inject } from '@angular/core/testing';

import { E2EImportsModule } from '../../../e2e-imports.module';
import { DataStoreUpgradeService } from './data-store-upgrade.service';

describe('DataStoreUpgradeService', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            providers: [DataStoreUpgradeService]
        });
    });

    it('should be created', inject([DataStoreUpgradeService], (service: DataStoreUpgradeService) => {
        expect(service).toBeTruthy();
    }));
});
