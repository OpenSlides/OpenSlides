import { TestBed, inject } from '@angular/core/testing';

import { SpinnerService } from './spinner.service';
import { E2EImportsModule } from 'e2e-imports.module';

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
