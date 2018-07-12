import { TestBed, inject } from '@angular/core/testing';

import { DataStoreService } from './dataStore.service';

describe('DS', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [DataStoreService]
        });
    });
});
