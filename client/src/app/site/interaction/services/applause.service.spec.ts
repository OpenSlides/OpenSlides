import { TestBed } from '@angular/core/testing';

import { E2EImportsModule } from 'e2e-imports.module';

import { ApplauseService } from './applause.service';

describe('ApplauseService', () => {
    let service: ApplauseService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule]
        });
        service = TestBed.inject(ApplauseService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
