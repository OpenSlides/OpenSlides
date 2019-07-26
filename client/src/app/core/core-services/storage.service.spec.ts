import { TestBed, inject } from '@angular/core/testing';

import { StorageService } from './storage.service';
import { E2EImportsModule } from 'e2e-imports.module';

describe('StorageService', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            providers: [StorageService]
        });
    });

    it('should be created', inject([StorageService], (service: StorageService) => {
        expect(service).toBeTruthy();
    }));
});
