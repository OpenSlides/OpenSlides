import { inject, TestBed } from '@angular/core/testing';

import { E2EImportsModule } from 'e2e-imports.module';

import { LoadFontService } from './load-font.service';

describe('LoadFontService', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            providers: [LoadFontService]
        });
    });

    it('should be created', inject([LoadFontService], (service: LoadFontService) => {
        expect(service).toBeTruthy();
    }));
});
