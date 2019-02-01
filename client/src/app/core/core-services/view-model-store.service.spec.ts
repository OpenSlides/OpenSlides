import { TestBed, inject } from '@angular/core/testing';
import { ViewModelStoreService } from './view-model-store.service';
import { E2EImportsModule } from '../../../e2e-imports.module';

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
