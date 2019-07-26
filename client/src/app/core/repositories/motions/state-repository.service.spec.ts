import { inject, TestBed } from '@angular/core/testing';

import { E2EImportsModule } from '../../../../e2e-imports.module';
import { StateRepositoryService } from './state-repository.service';

describe('StateRepositoryService', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            providers: [StateRepositoryService]
        });
    });

    it('should be created', inject([StateRepositoryService], (service: StateRepositoryService) => {
        expect(service).toBeTruthy();
    }));
});
