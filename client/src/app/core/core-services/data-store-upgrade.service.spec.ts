import { inject, TestBed } from '@angular/core/testing';

import { DataStoreUpgradeService } from './data-store-upgrade.service';
import { E2EImportsModule } from '../../../e2e-imports.module';

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
