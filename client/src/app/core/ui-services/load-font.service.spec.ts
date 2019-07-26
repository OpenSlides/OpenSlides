import { TestBed, inject } from '@angular/core/testing';

import { LoadFontService } from './load-font.service';
import { E2EImportsModule } from 'e2e-imports.module';

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
