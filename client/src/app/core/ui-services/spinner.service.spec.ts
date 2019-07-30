import { inject, TestBed } from '@angular/core/testing';

import { E2EImportsModule } from 'e2e-imports.module';

import { SpinnerService } from './spinner.service';

describe('SpinnerService', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            providers: [SpinnerService]
        });
    });

    it('should be created', inject([SpinnerService], (service: SpinnerService) => {
        expect(service).toBeTruthy();
    }));
});
