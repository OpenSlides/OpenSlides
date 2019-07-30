import { inject, TestBed } from '@angular/core/testing';

import { E2EImportsModule } from '../../../e2e-imports.module';
import { ViewModelStoreService } from './view-model-store.service';

describe('ViewModelStoreService', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            providers: [ViewModelStoreService]
        });
    });
    it('should be created', inject([ViewModelStoreService], (service: ViewModelStoreService) => {
        expect(service).toBeTruthy();
    }));
});
