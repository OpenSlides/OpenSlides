import { TestBed } from '@angular/core/testing';

import { E2EImportsModule } from 'e2e-imports.module';

import { PollListObservableService } from './poll-list-observable.service';

describe('PollListObservableService', () => {
    beforeEach(() =>
        TestBed.configureTestingModule({
            imports: [E2EImportsModule]
        })
    );

    it('should be created', () => {
        const service: PollListObservableService = TestBed.inject(PollListObservableService);
        expect(service).toBeTruthy();
    });
});
