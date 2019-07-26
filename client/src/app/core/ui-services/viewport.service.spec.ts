import { TestBed, inject } from '@angular/core/testing';

import { ViewportService } from './viewport.service';
import { E2EImportsModule } from 'e2e-imports.module';

describe('ViewportService', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            providers: [ViewportService]
        });
    });

    it('should be created', inject([ViewportService], (service: ViewportService) => {
        expect(service).toBeTruthy();
    }));
});
