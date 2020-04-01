import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { E2EImportsModule } from 'e2e-imports.module';

import { MotionPollService } from './motion-poll.service';

describe('MotionPollService', () => {
    beforeEach(() => TestBed.configureTestingModule({ imports: [E2EImportsModule, RouterTestingModule] }));

    it('should be created', () => {
        const service: MotionPollService = TestBed.inject(MotionPollService);
        expect(service).toBeTruthy();
    });
});
