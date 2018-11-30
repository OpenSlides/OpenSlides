import { TestBed } from '@angular/core/testing';

import { HistoryRepositoryService } from './history-repository.service';
import { E2EImportsModule } from 'e2e-imports.module';

describe('HistoryRepositoryService', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            providers: [HistoryRepositoryService]
        });
    });

    it('should be created', () => {
        const service = TestBed.get(HistoryRepositoryService);
        expect(service).toBeTruthy();
    });
});
