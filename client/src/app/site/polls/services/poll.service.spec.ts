import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { E2EImportsModule } from 'e2e-imports.module';

import { PollService } from './poll.service';

describe('PollService', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({ imports: [RouterTestingModule, E2EImportsModule] });
    });

    it('should be created', () => {
        const service: PollService = TestBed.inject(PollService);
        expect(service).toBeTruthy();
    });
});
