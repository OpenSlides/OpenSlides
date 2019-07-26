import { TestBed, inject } from '@angular/core/testing';

import { ThemeService } from './theme.service';
import { E2EImportsModule } from 'e2e-imports.module';

describe('ThemeService', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            providers: [ThemeService]
        });
    });

    it('should be created', inject([ThemeService], (service: ThemeService) => {
        expect(service).toBeTruthy();
    }));
});
