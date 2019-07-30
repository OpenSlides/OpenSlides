import { inject, TestBed } from '@angular/core/testing';

import { E2EImportsModule } from 'e2e-imports.module';

import { CountdownRepositoryService } from './countdown-repository.service';

describe('CountdownRepositoryService', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            providers: [CountdownRepositoryService]
        });
    });

    it('should be created', inject([CountdownRepositoryService], (service: CountdownRepositoryService) => {
        expect(service).toBeTruthy();
    }));
});
