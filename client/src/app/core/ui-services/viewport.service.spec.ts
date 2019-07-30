import { inject, TestBed } from '@angular/core/testing';

import { E2EImportsModule } from 'e2e-imports.module';

import { ViewportService } from './viewport.service';

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
