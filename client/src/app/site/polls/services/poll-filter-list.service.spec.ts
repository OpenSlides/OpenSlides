import { TestBed } from '@angular/core/testing';

import { E2EImportsModule } from 'e2e-imports.module';

import { PollFilterListService } from './poll-filter-list.service';

describe('PollFilterListService', () => {
    beforeEach(() =>
        TestBed.configureTestingModule({
            imports: [E2EImportsModule]
        })
    );

    it('should be created', () => {
        const service: PollFilterListService = TestBed.inject(PollFilterListService);
        expect(service).toBeTruthy();
    });
});
