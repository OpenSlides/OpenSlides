import { inject, TestBed } from '@angular/core/testing';

import { E2EImportsModule } from 'e2e-imports.module';

import { ConfigRepositoryService } from './config-repository.service';

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
