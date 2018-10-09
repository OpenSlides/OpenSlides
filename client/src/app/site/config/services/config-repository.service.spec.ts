import { TestBed, inject } from '@angular/core/testing';

import { ConfigRepositoryService } from './config-repository.service';
import { E2EImportsModule } from 'e2e-imports.module';

describe('ConfigRepositoryService', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            providers: [ConfigRepositoryService]
        });
    });

    it('should be created', inject([ConfigRepositoryService], (service: ConfigRepositoryService) => {
        expect(service).toBeTruthy();
    }));
});
