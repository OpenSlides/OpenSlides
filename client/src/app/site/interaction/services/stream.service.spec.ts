import { TestBed } from '@angular/core/testing';

import { E2EImportsModule } from 'e2e-imports.module';

import { StreamService } from './stream.service';

describe('StreamService', () => {
    let service: StreamService;

    beforeEach(() => {
        TestBed.configureTestingModule({ imports: [E2EImportsModule] });
        service = TestBed.inject(StreamService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
